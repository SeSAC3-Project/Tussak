from flask import Blueprint, jsonify, current_app, request
from services.keyword_sevice import KeywordService
from services.news_service import NewsService

insight_bp = Blueprint('insight', __name__, url_prefix='/api/insight')

# 키워드 관련 ===================================================
@insight_bp.route('/keywords')
def get_keywords():
    try:
        keywords = KeywordService.get_keywords()
        
        return jsonify({
            'success': True,
            'data': keywords,
            'count': len(keywords),
            'message': '키워드 조회 성공'
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"키워드 조회 API 오류: {e}")
        return jsonify({
            'success': False,
            'message': f'키워드 조회 중 오류 발생: {str(e)}',
            'data': []
        }), 500

@insight_bp.route('/keywords/refresh')
def refresh_keywords():
    try:
        keywords = KeywordService.refresh_keywords()
        
        return jsonify({
            'success': True,
            'data': keywords,
            'count': len(keywords),
            'message': '키워드 갱신 성공'
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"키워드 갱신 API 오류: {e}")
        return jsonify({
            'success': False,
            'message': f'키워드 갱신 중 오류 발생: {str(e)}',
            'data': []
        }), 500


# 뉴스 관련 ===================================================
@insight_bp.route('/news')
def get_news():
    try:
        keyword = request.args.get('keyword', '').strip()
        display = min(int(request.args.get('display', 5)), 10)
        
        if keyword:
            news_data = NewsService.get_keyword_news(keyword, display)
            message = f'"{keyword}" 키워드 뉴스 조회 성공'
        else:
            news_data = NewsService.get_default_news()
            message = '기본 뉴스 조회 성공'
        
        return jsonify({
            'success': True,
            'data': news_data,
            'count': len(news_data),
            'keyword': keyword or None,
            'message': message
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"뉴스 조회 API 오류: {e}")
        return jsonify({
            'success': False,
            'message': f'뉴스 조회 중 오류 발생: {str(e)}',
            'data': []
        }), 500

@insight_bp.route('/news/refresh')
def refresh_news():
    try:
        keyword = request.args.get('keyword', '').strip()
        display = min(int(request.args.get('display', 5)), 10)
        
        if keyword:
            news_data = NewsService.refresh_keyword_news(keyword, display)
            message = f'"{keyword}" 키워드 뉴스 갱신 성공'
        else:
            # 기본 뉴스 갱신
            from services.cache_service import CacheService
            CacheService.delete("default_news")
            news_data = NewsService.get_default_news()
            message = '기본 뉴스 갱신 성공'
        
        return jsonify({
            'success': True,
            'data': news_data,
            'count': len(news_data),
            'keyword': keyword or None,
            'message': message
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"뉴스 갱신 API 오류: {e}")
        return jsonify({
            'success': False,
            'message': f'뉴스 갱신 중 오류 발생: {str(e)}',
            'data': []
        }), 500

# 키워드(섹터)에 해당하는 주식 목록 조회
# @insight_bp.route('/keyword-stocks/<keyword>')
# def get_keyword_stocks(keyword):
#     try:
#         from models.stock import Stock
        
#         stocks = Stock.query.filter(
#             Stock.sector.like(f'%{keyword}%')
#         ).limit(10).all()
        
#         stock_data = []
#         for stock in stocks:
#             stock_data.append({
#                 'id': stock.id,
#                 'stock_code': stock.stock_code,
#                 'stock_name': stock.stock_name,
#                 'market': stock.market,
#                 'sector': stock.sector
#             })
        
#         return jsonify({
#             'success': True,
#             'data': stock_data,
#             'count': len(stock_data),
#             'keyword': keyword,
#             'message': f'"{keyword}" 관련 주식 조회 성공'
#         }), 200
        
#     except Exception as e:
#         current_app.logger.error(f"키워드 주식 조회 API 오류: {e}")
#         return jsonify({
#             'success': False,
#             'message': f'주식 조회 중 오류 발생: {str(e)}',
#             'data': []
#         }), 500