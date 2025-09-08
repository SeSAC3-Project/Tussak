from flask import Blueprint, request, jsonify, current_app
from services.auth_service import AuthService
from models.user import User
from functools import wraps

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# JWT 토큰 인증이 필요한 엔드포인트를 위한 데코레이터
def jwt_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(' ')[1]  # Bearer <token>
            except IndexError:
                return jsonify({'error': '토큰 형식이 잘못되었습니다'}), 401
        
        if not token:
            return jsonify({'error': '토큰이 없습니다'}), 401
        
        # 토큰 검증
        user_id = AuthService.verify_jwt_token(token)
        if user_id is None:
            return jsonify({'error': '유효하지 않은 토큰입니다'}), 401
        
        # 사용자 존재여부 확인
        current_user = User.query.get(user_id)
        if not current_user:
            return jsonify({'error': '사용자를 찾을 수 없습니다'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

@auth_bp.route('/kakao/login', methods=['POST'])
def kakao_login():
    try:
        data = request.get_json()
        if not data or 'access_token' not in data:
            return jsonify({
                'success': False,
                'error': '카카오 액세스 토큰이 필요합니다'
            }), 400
        
        access_token = data['access_token']
        
        jwt_token, error = AuthService.authenticate_with_kakao(access_token)
        
        if error:
            return jsonify({
                'success': False,
                'error': error
            }), 400
        
        if not jwt_token:
            return jsonify({
                'success': False,
                'error': '로그인 처리 실패'
            }), 500
        
        return jsonify({
            'success': True,
            'token': jwt_token,
            'message': '로그인 성공'
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"카카오 로그인 처리 중 오류: {e}")
        return jsonify({
            'success': False,
            'error': '서버 오류 발생'
        }), 500

# JWT 토큰 검증 및 사용자 정보 반환
@auth_bp.route('/verify', methods=['GET'])
@jwt_required
def verify_token(current_user):
    try:
        return jsonify({
            'success': True,
            'user': {
                'id': current_user.id,
                'kakao_id': current_user.kakao_id,
                'nickname': current_user.nickname,
                'profile_image_url': current_user.profile_image_url,
                'current_balance': float(current_user.current_balance),
                'total_asset': float(current_user.total_asset)
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"토큰 검증 처리 중 오류: {e}")
        return jsonify({
            'success': False,
            'error': '토큰 검증 실패'
        }), 500

# 로그아웃(클라이언트에서 토큰 삭제)
@auth_bp.route('/logout', methods=['POST'])
@jwt_required
def logout(current_user):
    try:
        current_app.logger.info(f"사용자 로그아웃: {current_user.nickname}")
        return jsonify({
            'success': True,
            'message': '로그아웃 성공'
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"로그아웃 처리 중 오류: {e}")
        return jsonify({
            'success': False,
            'error': '로그아웃 실패'
        }), 500

# 사용자 정보 조회
@auth_bp.route('/user/profile', methods=['GET'])
@jwt_required
def get_user_profile(current_user):
    try:
        return jsonify({
            'success': True,
            'user': {
                'id': current_user.id,
                'kakao_id': current_user.kakao_id,
                'nickname': current_user.nickname,
                'profile_image_url': current_user.profile_image_url,
                'current_balance': float(current_user.current_balance),
                'total_asset': float(current_user.total_asset),
                'initial_balance': float(current_user.initial_balance),
                'created_at': current_user.created_at,
                'updated_at': current_user.updated_at
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"사용자 프로필 조회 중 오류: {e}")
        return jsonify({
            'success': False,
            'error': '프로필 조회 실패'
        }), 500