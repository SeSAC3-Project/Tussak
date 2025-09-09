from flask import Blueprint, request, jsonify
from flask import current_app
from services.bookmark_service import BookmarkService
from routes.auth_routes import jwt_required

bookmark_bp = Blueprint('bookmark', __name__, url_prefix='/api/bookmarks')

@bookmark_bp.route('/', methods=['POST'])
@jwt_required
# def add_bookmark():
def add_bookmark(current_user):
    """
    즐겨찾기 추가
    POST /api/bookmarks
    Body: {
        "stock_code": "005930"
    }
    """
    try:
        # 테스트 용
        # user_id = request.args.get('user_id', type=int)
        # if not user_id:
        #     return jsonify({
        #         'success': False,
        #         'message': 'user_id가 필요합니다.'
        #     }), 400

        # JWT에서 사용자 ID 가져오기
        user_id = current_user.id
        
        # 요청 데이터 검증
        data = request.get_json()
        if not data or 'stock_code' not in data:
            return jsonify({
                'success': False,
                'message': '주식 코드가 필요합니다.',
                'code': 'MISSING_STOCK_CODE'
            }), 400
        
        stock_code = data['stock_code'].strip()
        if not stock_code:
            return jsonify({
                'success': False,
                'message': '주식 코드는 비어있을 수 없습니다.',
                'code': 'EMPTY_STOCK_CODE'
            }), 400
        
        # 즐겨찾기 추가
        result = BookmarkService.add_bookmark(user_id, stock_code)
        
        if result['success']:
            return jsonify(result), 201
        else:
            status_code = 400
            if result['code'] == 'USER_NOT_FOUND':
                status_code = 404
            elif result['code'] == 'STOCK_NOT_FOUND':
                status_code = 404
            elif result['code'] == 'ALREADY_BOOKMARKED':
                status_code = 409
            elif result['code'] == 'BOOKMARK_LIMIT_EXCEEDED':
                status_code = 400  # 클라이언트 오류 (제한 초과)
            elif result['code'] == 'INTERNAL_ERROR':
                status_code = 500
            
            return jsonify(result), status_code
            
    except Exception as e:
        current_app.logger.error(f"즐겨찾기 추가 API 오류: {e}")
        return jsonify({
            'success': False,
            'message': '서버 오류가 발생했습니다.',
            'code': 'SERVER_ERROR'
        }), 500

@bookmark_bp.route('/<stock_code>', methods=['DELETE'])
@jwt_required
# def remove_bookmark(stock_code):
def remove_bookmark(current_user, stock_code):
    """
    즐겨찾기 삭제
    DELETE /api/bookmarks/{stock_code}
    """
    try:
        # 테스트 용
        # user_id = request.args.get('user_id', type=int)
        # if not user_id:
        #     return jsonify({
        #         'success': False,
        #         'message': 'user_id가 필요합니다.'
        #     }), 400

        # JWT에서 사용자 ID 가져오기
        user_id = current_user.id
        
        # 주식 코드 검증
        if not stock_code or not stock_code.strip():
            return jsonify({
                'success': False,
                'message': '유효하지 않은 주식 코드입니다.',
                'code': 'INVALID_STOCK_CODE'
            }), 400
        
        stock_code = stock_code.strip()
        
        # 즐겨찾기 삭제
        result = BookmarkService.remove_bookmark(user_id, stock_code)
        
        if result['success']:
            return jsonify(result), 200
        else:
            status_code = 400
            if result['code'] == 'BOOKMARK_NOT_FOUND':
                status_code = 404
            elif result['code'] == 'INTERNAL_ERROR':
                status_code = 500
            
            return jsonify(result), status_code
            
    except Exception as e:
        current_app.logger.error(f"즐겨찾기 삭제 API 오류: {e}")
        return jsonify({
            'success': False,
            'message': '서버 오류가 발생했습니다.',
            'code': 'SERVER_ERROR'
        }), 500

@bookmark_bp.route('/', methods=['GET'])
@jwt_required
# def get_user_bookmarks():
def get_user_bookmarks(current_user):
    """
    사용자 즐겨찾기 목록 조회 (생성일자 순으로 정렬)
    GET /api/bookmarks
    """
    try:
        # 테스트 용
        # user_id = request.args.get('user_id', type=int)
        # if not user_id:
        #     return jsonify({
        #         'success': False,
        #         'message': 'user_id가 필요합니다.'
        #     }), 400

        # JWT에서 사용자 ID 가져오기
        user_id = current_user.id
        
        # 즐겨찾기 목록 조회
        result = BookmarkService.get_user_bookmarks(user_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            status_code = 400
            if result['code'] == 'USER_NOT_FOUND':
                status_code = 404
            elif result['code'] == 'INTERNAL_ERROR':
                status_code = 500
            
            return jsonify(result), status_code
            
    except Exception as e:
        current_app.logger.error(f"즐겨찾기 목록 조회 API 오류: {e}")
        return jsonify({
            'success': False,
            'message': '서버 오류가 발생했습니다.',
            'code': 'SERVER_ERROR'
        }), 500

@bookmark_bp.route('/<stock_code>/status', methods=['GET'])
@jwt_required
# def check_bookmark_status(stock_code):
def check_bookmark_status(current_user, stock_code):
    """
    특정 주식의 즐겨찾기 상태 확인
    GET /api/bookmarks/{stock_code}/status
    """
    try:
        # 테스트 용
        # user_id = request.args.get('user_id', type=int)
        # if not user_id:
        #     return jsonify({
        #         'success': False,
        #         'message': 'user_id가 필요합니다.'
        #     }), 400

        # JWT에서 사용자 ID 가져오기
        user_id = current_user.id
        
        # 주식 코드 검증
        if not stock_code or not stock_code.strip():
            return jsonify({
                'success': False,
                'message': '유효하지 않은 주식 코드입니다.',
                'code': 'INVALID_STOCK_CODE'
            }), 400
        
        stock_code = stock_code.strip()
        
        # 즐겨찾기 상태 확인
        result = BookmarkService.is_bookmarked(user_id, stock_code)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 500
            
    except Exception as e:
        current_app.logger.error(f"즐겨찾기 상태 확인 API 오류: {e}")
        return jsonify({
            'success': False,
            'message': '서버 오류가 발생했습니다.',
            'code': 'SERVER_ERROR'
        }), 500

@bookmark_bp.route('/details', methods=['GET'])
@jwt_required
def get_user_bookmarks_with_details(current_user):
    """
    사용자 즐겨찾기 목록과 각 종목의 상세 정보 조회
    GET /api/bookmarks/details
    """
    try:
        from services.stock_service import StockService
        
        # JWT에서 사용자 ID 가져오기
        user_id = current_user.id
        
        # 즐겨찾기 목록 조회
        bookmark_result = BookmarkService.get_user_bookmarks(user_id)
        
        if not bookmark_result['success']:
            return jsonify(bookmark_result), 500
        
        # 즐겨찾기가 없는 경우
        if not bookmark_result['data'] or not bookmark_result['data']['bookmarks']:
            return jsonify({
                'success': True,
                'data': [],
                'count': 0
            }), 200
        
        # 각 북마크된 종목의 상세 정보 조회
        detailed_stocks = []
        bookmarks = bookmark_result['data']['bookmarks']
        for bookmark in bookmarks:
            stock_code = bookmark['stock_code']
            
            # 종목 상세 정보 조회 (stock_code로)
            stock_details = StockService.get_stock_by_code(stock_code)
            
            if stock_details:
                # 북마크 정보와 종목 정보 결합
                stock_info = {
                    **stock_details,
                    'bookmarked_at': bookmark.get('created_at'),
                    'bookmark_id': bookmark.get('id')
                }
                detailed_stocks.append(stock_info)
        
        return jsonify({
            'success': True,
            'data': detailed_stocks,
            'count': len(detailed_stocks)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"즐겨찾기 상세 정보 조회 API 오류: {e}")
        return jsonify({
            'success': False,
            'message': '서버 오류가 발생했습니다.',
            'code': 'SERVER_ERROR'
        }), 500
