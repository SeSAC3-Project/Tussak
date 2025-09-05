from flask import Blueprint, request, jsonify, current_app
from services.stock_service import StockService
from services.websocket_service import get_websocket_service

stock_bp = Blueprint('stock', __name__, url_prefix='/api/stock')

@stock_bp.route('/all')
def get_all_stocks():
    """모든 종목 조회"""
    try:
        stocks = StockService.get_all_stocks()
        return jsonify({
            'success': True,
            'data': stocks,
            'count': len(stocks)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"종목 조회 API 오류: {e}")
        return jsonify({
            'success': False,
            'message': f'오류가 발생했습니다: {str(e)}'
        }), 500

@stock_bp.route('/search')
def search_stocks():
    """종목명으로 검색"""
    try:
        keyword = request.args.get('q', '').strip()
        
        if not keyword:
            return jsonify({
                'success': False,
                'message': '검색어를 입력해주세요.'
            }), 400
        
        stocks = StockService.search_stocks(keyword)
        return jsonify({
            'success': True,
            'data': stocks,
            'count': len(stocks),
            'keyword': keyword
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"종목 검색 API 오류: {e}")
        return jsonify({
            'success': False,
            'message': f'오류가 발생했습니다: {str(e)}'
        }), 500

@stock_bp.route('/<int:id>')
def get_stock_by_id(id):
    """종목 ID로 조회"""
    try:
        stock = StockService.get_stock_by_id(id)
        
        if not stock:
            return jsonify({
                'success': False,
                'message': f'ID {id}에 해당하는 종목을 찾을 수 없습니다.'
            }), 404
        
        return jsonify({
            'success': True,
            'data': stock
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"종목 ID 조회 API 오류: {e}")
        return jsonify({
            'success': False,
            'message': f'오류가 발생했습니다: {str(e)}'
        }), 500

@stock_bp.route('/ranking')
def get_stocks_ranking_top28():
    """거래대금 순위 28개 조회"""
    try:
        limit = request.args.get('limit', 28, type=int)
        stocks = StockService.get_volume_ranking(limit)  # 🆕 조회 전용 함수 사용
        
        return jsonify({
            'success': True,
            'data': stocks,
            'count': len(stocks)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"거래대금 순위 조회 API 오류: {e}")
        return jsonify({
            'success': False,
            'message': f'오류가 발생했습니다: {str(e)}'
        }), 500

# 실시간 거래대금 순위 (실시간 가격 포함)
@stock_bp.route('/realtime')
def get_realtime_top28():
    try:
        
        websocket_service = get_websocket_service(current_app._get_current_object())
        stocks = websocket_service.get_realtime_ranking(28)
        
        return jsonify({
            'success': True,
            'data': stocks,
            'count': len(stocks)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"실시간 순위 조회 API 오류: {e}")
        return jsonify({
            'success': False,
            'message': f'오류가 발생했습니다: {str(e)}'
        }), 500

# 실시간 가격 조회
@stock_bp.route('/realtime/<stock_code>')
def get_realtime_by_stock_code(stock_code):
    try:
        
        websocket_service = get_websocket_service(current_app._get_current_object())

        # 디버깅: Redis 키 확인
        if websocket_service.redis_client:
            keys = websocket_service.redis_client.keys('realtime_price:*')
            current_app.logger.info(f"Redis에 저장된 종목들: {keys}")

        realtime_data = websocket_service.get_realtime_price(stock_code)
        
        if not realtime_data:
            return jsonify({
                'success': False,
                'message': '실시간 데이터를 찾을 수 없습니다.',
                'debug': {
                    'redis_keys': keys if websocket_service.redis_client else 'Redis 연결 없음',
                    'websocket_connected': websocket_service.is_connected,
                    'stock_codes_count': len(websocket_service.stock_codes)
                }
            }), 404
        
        return jsonify({
            'success': True,
            'data': realtime_data
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"실시간 가격 조회 API 오류: {e}")
        return jsonify({
            'success': False,
            'message': f'오류가 발생했습니다: {str(e)}'
        }), 500

@stock_bp.route('/realtime/add', methods=['POST'])
def add_subscriptions():
    """검색 결과 종목들을 추가 구독"""
    try:
        data = request.get_json()
        stock_codes = data.get('stock_codes', [])
        
        if not stock_codes:
            return jsonify({
                'success': False,
                'message': '추가할 종목 코드가 없습니다.'
            }), 400
        
        websocket_service = get_websocket_service(current_app._get_current_object())
        
        if websocket_service.add_additional_subscriptions(stock_codes):
            subscription_info = websocket_service.get_subscription_status()
            
            return jsonify({
                'success': True,
                'message': f'추가 구독 완료',
                'subscription_info': subscription_info
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': '추가 구독 실패'
            }), 500
        
    except Exception as e:
        current_app.logger.error(f"추가 구독 API 오류: {e}")
        return jsonify({
            'success': False,
            'message': f'오류가 발생했습니다: {str(e)}'
        }), 500

@stock_bp.route('/realtime/remove', methods=['POST'])
def remove_subscriptions():
    """특정 추가 구독 종목 해제"""
    try:
        data = request.get_json()
        stock_codes = data.get('stock_codes', [])
        
        websocket_service = get_websocket_service(current_app._get_current_object())
        
        if websocket_service.remove_additional_subscriptions(stock_codes):
            return jsonify({
                'success': True,
                'message': f'{len(stock_codes)}개 종목 구독 해제 완료'
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': '구독 해제 실패'
            }), 500
        
    except Exception as e:
        current_app.logger.error(f"구독 해제 API 오류: {e}")
        return jsonify({
            'success': False,
            'message': f'오류가 발생했습니다: {str(e)}'
        }), 500

@stock_bp.route('/realtime/clear', methods=['POST'])
def clear_additional_subscriptions():
    """모든 추가 구독 해제 (기본 top28은 유지)"""
    try:
        websocket_service = get_websocket_service(current_app._get_current_object())
        
        if websocket_service.clear_all_additional_subscriptions():
            return jsonify({
                'success': True,
                'message': '모든 추가 구독 해제 완료 (기본 랭킹은 유지)'
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': '구독 해제 실패'
            }), 500
        
    except Exception as e:
        current_app.logger.error(f"전체 구독 해제 API 오류: {e}")
        return jsonify({
            'success': False,
            'message': f'오류가 발생했습니다: {str(e)}'
        }), 500

# 실시간 서비스 상태 조회
@stock_bp.route('/realtime/status')
def get_realtime_status():
    try:
        
        websocket_service = get_websocket_service(current_app._get_current_object())

        status = {
            'websocket': {
                'connected': websocket_service.is_connected,
                'reconnect_attempts': websocket_service.reconnect_attempts,
                'stock_codes_count': len(websocket_service.stock_codes)
            }
        }
        
        return jsonify({
            'success': True,
            'data': status
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"실시간 상태 조회 API 오류: {e}")
        return jsonify({
            'success': False,
            'message': f'오류가 발생했습니다: {str(e)}'
        }), 500

@stock_bp.route('/chart/<stock_code>')
def get_stock_chart_data(stock_code):
    """주식 차트 데이터 조회 (통합 API)"""
    try:
        # 요청 파라미터 처리
        timeframe = request.args.get('timeframe', '1d')
        period = request.args.get('period', 30, type=int)
        
        # 지원하는 차트 타입 검증
        supported_timeframes = {
            '5m': '1일 5분봉',
            '1h': '1주 1시간봉',
            '1d': '1개월 일봉'
        }
        
        if timeframe not in supported_timeframes:
            return jsonify({
                'success': False,
                'message': f'지원하지 않는 차트 타입입니다.',
                'supported_timeframes': supported_timeframes
            }), 400
        
        # 비즈니스 로직 호출
        chart_data = StockService.get_chart_data(stock_code, timeframe, period)
        
        # 응답 처리
        if chart_data is None:
            return jsonify({
                'success': False,
                'message': '차트 데이터 조회에 실패했습니다.'
            }), 500
        
        if not chart_data:
            return jsonify({
                'success': False,
                'message': '조회된 차트 데이터가 없습니다.'
            }), 404
        
        # 성공 응답
        return jsonify({
            'success': True,
            'chart_info': {
                'stock_code': stock_code,
                'timeframe': timeframe,
                'timeframe_name': supported_timeframes[timeframe],
                'period_days': period if timeframe == '1d' else None,
                'data_count': len(chart_data)
            },
            'data': chart_data
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"차트 데이터 조회 API 오류: {e}")
        return jsonify({
            'success': False,
            'message': f'서버 오류가 발생했습니다: {str(e)}'
        }), 500

@stock_bp.route('/chart/<stock_code>/5m')
def get_5min_chart(stock_code):
    """1일 5분봉 차트 전용 API"""
    try:
        # 비즈니스 로직 호출
        chart_data = StockService.get_chart_data(stock_code, '5m')
        
        # 응답 처리
        if not chart_data:
            return jsonify({
                'success': False,
                'message': '5분봉 데이터가 없습니다.'
            }), 404
        
        return jsonify({
            'success': True,
            'chart_info': {
                'stock_code': stock_code,
                'timeframe': '5m',
                'name': '1일 5분봉',
                'data_count': len(chart_data)
            },
            'data': chart_data
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"5분봉 차트 API 오류: {e}")
        return jsonify({
            'success': False,
            'message': f'서버 오류가 발생했습니다: {str(e)}'
        }), 500

@stock_bp.route('/chart/<stock_code>/1h')
def get_1hour_chart(stock_code):
    """1주 1시간봉 차트 전용 API"""
    try:
        # 비즈니스 로직 호출
        chart_data = StockService.get_chart_data(stock_code, '1h')
        
        # 응답 처리
        if not chart_data:
            return jsonify({
                'success': False,
                'message': '1시간봉 데이터가 없습니다.'
            }), 404
        
        return jsonify({
            'success': True,
            'chart_info': {
                'stock_code': stock_code,
                'timeframe': '1h',
                'name': '1주 1시간봉',
                'data_count': len(chart_data)
            },
            'data': chart_data
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"1시간봉 차트 API 오류: {e}")
        return jsonify({
            'success': False,
            'message': f'서버 오류가 발생했습니다: {str(e)}'
        }), 500

@stock_bp.route('/chart/<stock_code>/1d')
def get_daily_chart(stock_code):
    """1개월 일봉 차트 전용 API"""
    try:
        # 요청 파라미터 처리
        period = request.args.get('period', 30, type=int)
        
        # 파라미터 검증
        if period < 1 or period > 365:
            return jsonify({
                'success': False,
                'message': '기간은 1일에서 365일 사이여야 합니다.'
            }), 400
        
        # 비즈니스 로직 호출
        chart_data = StockService.get_chart_data(stock_code, '1d', period)
        
        # 응답 처리
        if not chart_data:
            return jsonify({
                'success': False,
                'message': '일봉 데이터가 없습니다.'
            }), 404
        
        return jsonify({
            'success': True,
            'chart_info': {
                'stock_code': stock_code,
                'timeframe': '1d',
                'name': f'{period}일 일봉',
                'period_days': period,
                'data_count': len(chart_data)
            },
            'data': chart_data
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"일봉 차트 API 오류: {e}")
        return jsonify({
            'success': False,
            'message': f'서버 오류가 발생했습니다: {str(e)}'
        }), 500
