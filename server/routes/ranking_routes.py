from flask import Blueprint, jsonify, request
from services.ranking_service import RankingService
from routes.auth_routes import jwt_required

ranking_bp = Blueprint('ranking', __name__, url_prefix='/api/ranking')

@ranking_bp.route('/all', methods=['GET'])
def get_investment_ranking():
    """
    투자 수익금 기준 랭킹 조회
    total_asset을 기준으로 상위 사용자들을 반환 (최대 30위)
    """
    try:
        # 쿼리 파라미터에서 limit 가져오기 (기본값: 30, 최대 30)
        limit = request.args.get('limit', 30, type=int)
        
        # 랭킹 서비스를 통해 데이터 조회
        result = RankingService.get_investment_ranking(limit)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'랭킹 조회 중 오류가 발생했습니다: {str(e)}'
        }), 500

@ranking_bp.route('/my-rank', methods=['GET'])
@jwt_required
# def get_my_investment_rank():
def get_my_investment_rank(current_user):
    """
    특정 사용자의 투자 랭킹 조회
    """
    try:
        # 테스트 용
        # user_id = request.args.get('user_id', type=int)
        # if not user_id:
        #     return jsonify({
        #         'success': False,
        #         'message': 'user_id가 필요합니다.'
        #     }), 400

        # JWT 토큰에서 가져온 사용자 ID 사용
        user_id = current_user.id
        
        # 랭킹 서비스를 통해 데이터 조회
        result = RankingService.get_user_rank(user_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            status_code = 404 if '찾을 수 없습니다' in result['message'] else 500
            return jsonify(result), status_code
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'내 랭킹 조회 중 오류가 발생했습니다: {str(e)}'
        }), 500

# 수동 ranking 계산 테스트 용 -> 실제는 scheduler에서 하루 한번 자동 계산
@ranking_bp.route('/calculate', methods=['POST'])
def calculate_rankings(): 
    """
    랭킹 수동 계산 (개발/테스트용)
    관리자만 접근 가능하도록 제한하는 것을 권장
    """
    try:
        result = RankingService.calculate_and_update_rankings()
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'랭킹 계산 중 오류가 발생했습니다: {str(e)}'
        }), 500
