import jwt
import os
import requests
from datetime import datetime, timedelta
from flask import current_app
from models.user import User
from models import db

class AuthService:
    # JWT 토큰 생성
    @staticmethod
    def generate_jwt_token(user_id):
        try:
            jwt_secret = os.getenv('JWT_SECRET_KEY')
            if not jwt_secret:
                current_app.logger.error("JWT_SECRET_KEY 환경 변수 설정 필요")
                return None
                
            payload = {
                'user_id': user_id,
                'exp': datetime.now(datetime.timezone.utc) + timedelta(days=7),  # 7일 후 만료 (UTC)
                'iat': datetime.now(datetime.timezone.utc)                      # 발급 시간 (UTC)
            }
            token = jwt.encode(
                payload, 
                jwt_secret, 
                algorithm='HS256'
            )
            return token
        except Exception as e:
            current_app.logger.error(f"JWT 토큰 생성 실패: {e}")
            return None
    
    # JWT 토큰 검증
    @staticmethod
    def verify_jwt_token(token):
        try:
            jwt_secret = os.getenv('JWT_SECRET_KEY')
            if not jwt_secret:
                current_app.logger.error("JWT_SECRET_KEY 환경 변수 설정 필요")
                return None
                
            payload = jwt.decode(
                token, 
                jwt_secret, 
                algorithms=['HS256']
            )
            return payload['user_id']
        except jwt.ExpiredSignatureError:
            current_app.logger.error("JWT 토큰이 만료되었습니다")
            return None
        except jwt.InvalidTokenError:
            current_app.logger.error("유효하지 않은 JWT 토큰입니다")
            return None
    
    # 카카오 사용자 정보 조회
    @staticmethod
    def get_kakao_user_info(access_token):
        try:
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
            }
            
            response = requests.get(
                'https://kapi.kakao.com/v2/user/me',
                headers=headers
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                current_app.logger.error(f"카카오 사용자 정보 조회 실패: {response.status_code}, 응답: {response.text}")
                return None
                
        except Exception as e:
            current_app.logger.error(f"카카오 사용자 정보 조회 중 오류: {e}")
            return None
    
    # DB에 사용자 정보 생성 또는 업데이트
    @staticmethod
    def create_or_update_user(kakao_user_info):
        try:
            kakao_id = str(kakao_user_info['id'])
            kakao_account = kakao_user_info.get('kakao_account', {})
            profile = kakao_account.get('profile', {})
            
            user = User.query.filter_by(kakao_id=kakao_id).first()
            
            if user:
                # 기존 사용자 정보 업데이트
                user.nickname = profile.get('nickname', user.nickname)
                user.profile_image_url = profile.get('profile_image_url', user.profile_image_url)
                datetime.now(datetime.timezone.utc) 
            else:
                # 새 사용자 생성
                user = User(
                    kakao_id=kakao_id,
                    email=kakao_account.get('email', ''),
                    nickname=profile.get('nickname', f'사용자{kakao_id}'),
                    profile_image_url=profile.get('profile_image_url', '')
                )
                db.session.add(user)
            
            db.session.commit()
            current_app.logger.info(f"사용자 정보 저장 완료: {user.nickname}")
            return user
            
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"사용자 정보 저장 실패: {e}")
            return None
    
    # 카카오 액세스 토큰으로 인증 및 JWT 토큰 반환
    @staticmethod
    def authenticate_with_kakao(access_token):
        try:
            # 카카오 사용자 조회
            kakao_user_info = AuthService.get_kakao_user_info(access_token)
            if not kakao_user_info:
                return None, "카카오 사용자 정보를 가져올 수 없습니다"
            
            # 사용자 정보 DB에 저장/업데이트
            user = AuthService.create_or_update_user(kakao_user_info)
            if not user:
                return None, "사용자 정보 저장 실패"
            
            # JWT 토큰 생성
            jwt_token = AuthService.generate_jwt_token(user.id)
            if not jwt_token:
                return None, "JWT 토큰 생성 실패"
            
            return jwt_token, None
            
        except Exception as e:
            current_app.logger.error(f"카카오 인증 처리 중 오류: {e}")
            return None, "인증 처리 중 오류 발생"