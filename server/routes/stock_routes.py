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
