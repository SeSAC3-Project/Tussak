from dotenv import load_dotenv
import requests
import os
import json
from flask import current_app

from config.redis import get_redis

load_dotenv()

KIS_CLIENT_ID=os.getenv("KIS_API_KEY")
KIS_CLIENT_SECRET=os.getenv("KIS_SECRET_KEY")

def kis_access_token():

    redis_client = get_redis()

    # Redis에서 기존 토큰 확인
    if redis_client:
        try:
            access_token = redis_client.get('kis_access_token')
            if access_token:
                current_app.logger.debug("Redis에서 기존 KIS Access Token을 찾았습니다")
                return access_token
        except Exception as e:
            current_app.logger.warning(f"Redis에서 토큰 조회 중 오류: {e}")

    # KIS 인증 토큰 요청
    url = 'https://openapi.koreainvestment.com:9443/oauth2/tokenP'
    headers = {'Content-Type' : 'application/json; charset=UTF-8'}
    body = {
        'grant_type' : 'client_credentials', 
        'appkey' : KIS_CLIENT_ID, 
        'appsecret' : KIS_CLIENT_SECRET
    }

    try:
        # API 요청
        response = requests.post(url, headers=headers, data=json.dumps(body), timeout=30)
        response.raise_for_status()  # HTTP 오류 시 예외 발생
        
        res = response.json()
        access_token = res.get('access_token')
        
        if not access_token:
            raise Exception(f"KIS API 응답에 access_token이 없습니다: {res}")
        
        # Redis에 토큰 저장
        if redis_client:
            try:
                redis_client.setex('kis_access_token', 82800, access_token) # 82800 : 23시간
                current_app.logger.info("KIS Access Token이 Redis에 성공적으로 저장되었습니다")
            except Exception as e:
                current_app.logger.warning(f"Redis에 토큰 저장 중 오류: {e}")
        
        current_app.logger.info("KIS Access Token 발급 성공")
        return access_token
        
    except requests.exceptions.Timeout:
        raise Exception("KIS API 요청 타임아웃")
    except requests.exceptions.ConnectionError:
        raise Exception("KIS API 연결 실패")
    except requests.exceptions.HTTPError as e:
        raise Exception(f"KIS API HTTP 오류: {e}")
    except requests.exceptions.RequestException as e:
        raise Exception(f"KIS API 요청 오류: {e}")
    except json.JSONDecodeError:
        raise Exception("KIS API 응답 JSON 파싱 실패")
    except Exception as e:
        raise Exception(f"KIS 토큰 발급 중 예상치 못한 오류: {e}")

def get_kis_token():
    redis_client = get_redis()

    if redis_client:
        try:
            access_token = redis_client.get('kis_access_token')
            if access_token:
                return access_token
        except Exception as e:
            current_app.logger.warning(f"Redis에서 토큰 조회 중 오류: {e}")

    # 토큰이 없으면 자동으로 발급
    try:
        token = kis_access_token()

        # 다시 조회
        redis_client = get_redis()
        if redis_client:
            return redis_client.get('kis_access_token')
        # redis 연결 실패 시 kis_access_token 전달
        return token
    except Exception as e:
        current_app.logger.error(f"토큰 발급 실패: {e}")
        raise e
