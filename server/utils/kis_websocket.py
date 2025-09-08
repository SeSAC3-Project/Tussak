import json
from datetime import datetime, timedelta
from flask import current_app
from config.redis import get_redis
import os
import requests

KIS_CLIENT_ID=os.getenv("KIS_API_KEY")
KIS_CLIENT_SECRET=os.getenv("KIS_SECRET_KEY")

def kis_websocket_access_token():

    redis_client = get_redis()

    # Redis에서 토큰 정보 조회 (해시 형태로 메타데이터 포함)
    if redis_client:
        try:
            token_info = redis_client.hgetall('websocket_token_info')
            if token_info:
                token = token_info.get('token')
                created_at = token_info.get('created_at')
                
                if token and created_at:
                    # 토큰이 22시간 이내에 생성되었고 형식이 올바른지 확인
                    try:
                        created_time = datetime.fromisoformat(created_at)
                        token_age = datetime.now() - created_time
                        
                        if token_age < timedelta(hours=22) and _is_token_format_valid(token):
                            current_app.logger.debug(f"Redis에서 유효한 WebSocket 토큰 발견 (생성: {token_age})")
                            return token
                        else:
                            current_app.logger.info(f"토큰 만료 또는 형식 오류 - 새로 발급 (생성: {token_age})")
                    except (ValueError, TypeError) as e:
                        current_app.logger.warning(f"토큰 메타데이터 파싱 오류: {e}")
        except Exception as e:
            current_app.logger.warning(f"Redis에서 토큰 조회 중 오류: {e}")

    # 새로운 토큰 발급
    url = 'https://openapi.koreainvestment.com:9443/oauth2/Approval'
    headers = {'content-type' : 'application/json; utf-8'}
    body = {
        'grant_type' : 'client_credentials', 
        'appkey' : KIS_CLIENT_ID, 
        'secretkey' : KIS_CLIENT_SECRET
    }

    try:
        current_app.logger.info("새로운 WebSocket 토큰 발급 요청")

        # API 요청
        response = requests.post(url, headers=headers, data=json.dumps(body), timeout=30)
        current_app.logger.info(f"응답 상태코드: {response.status_code}")
        if response.status_code != 200: # HTTP 오류 시 예외 발생
            raise Exception(f"HTTP {response.status_code}: {response.text}")  
        
        res = response.json()
        websocket_access_token = res.get('approval_key')
        
        if not websocket_access_token:
            raise Exception(f"KIS API 응답에 websocket_access_token이 없습니다: {res}")

        # 토큰 형식 검증
        if not _is_token_format_valid(websocket_access_token):
            current_app.logger.warning(f"발급받은 토큰 형식이 이상함: {websocket_access_token}")
        
        # Redis에 토큰 정보 저장 (메타데이터 포함)
        if redis_client:
            try:
                token_info = {
                    'token': websocket_access_token,
                    'created_at': datetime.now().isoformat(),
                    'issued_by': 'auto_refresh',
                    'version': '1.0'
                }
                
                # 해시로 저장하고 23시간 만료 설정
                redis_client.hset('websocket_token_info', mapping=token_info)
                redis_client.expire('websocket_token_info', 82800)  # 23시간
                
                # 기존 단순 키도 호환성을 위해 유지
                redis_client.setex('websocket_access_token', 82800, websocket_access_token)
                
                current_app.logger.info(f"새 WebSocket 토큰이 Redis에 저장됨: {websocket_access_token}")
            except Exception as e:
                current_app.logger.warning(f"Redis에 토큰 저장 중 오류: {e}")
        
        current_app.logger.info("WebSocket 토큰 발급 성공")
        return websocket_access_token
        
    except Exception as e:
        current_app.logger.error(f"WebSocket 토큰 발급 실패: {e}")
        raise e

def _is_token_format_valid(token):
    """토큰 형식 유효성 검증"""
    if not token:
        return False
    
    # UUID 형식 검증 (36자리, 4개의 하이픈)
    if len(token) != 36 or token.count('-') != 4:
        return False
    
    # 각 부분의 길이 검증 (8-4-4-4-12)
    parts = token.split('-')
    expected_lengths = [8, 4, 4, 4, 12]
    
    if len(parts) != 5:
        return False
    
    for i, part in enumerate(parts):
        if len(part) != expected_lengths[i] or not all(c.isalnum() for c in part):
            return False
    
    return True

def invalidate_websocket_token():
    """토큰 무효화 - 스케줄러에서도 사용 가능"""
    redis_client = get_redis()
    if redis_client:
        try:
            # 모든 토큰 관련 키 삭제
            redis_client.delete('websocket_token_info')
            redis_client.delete('websocket_access_token')
            current_app.logger.info("WebSocket 토큰 캐시 무효화 완료")
        except Exception as e:
            current_app.logger.warning(f"토큰 무효화 실패: {e}")

def get_websocket_token():
    try:
        token = kis_websocket_access_token()
        current_app.logger.info(f"사용할 WebSocket 토큰: {token}")
        return token
    except Exception as e:
        current_app.logger.error(f"토큰 발급 실패: {e}")
        raise e

# 스케줄러에서 사용할 함수들
def scheduled_refresh_websocket_token():
    """스케줄러용 토큰 갱신 함수"""
    try:
        # 기존 토큰 무효화
        invalidate_websocket_token()
        
        # 새 토큰 발급
        new_token = kis_websocket_access_token()
        
        # 현재 실행 중인 웹소켓 서비스의 토큰도 업데이트
        global websocket_service
        if websocket_service and websocket_service.is_connected:
            websocket_service.access_token = new_token
            websocket_service.app.logger.info(f"스케줄러에 의한 토큰 갱신 완료: {new_token}")
        
        return new_token
        
    except Exception as e:
        current_app.logger.error(f"스케줄러 토큰 갱신 실패: {e}")
        return None
