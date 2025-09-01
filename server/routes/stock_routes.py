from flask import Blueprint, request, jsonify, current_app
from services.stock_service import StockService

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

@stock_bp.route('/ranking/top28')
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
