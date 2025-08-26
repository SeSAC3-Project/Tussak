from dotenv import load_dotenv
import requests
import os
import json

from config.redis import get_redis

load_dotenv()

KIS_CLIENT_ID=os.getenv("KIS_API_KEY")
KIS_CLIENT_SECRET=os.getenv("KIS_SECRET_KEY")

def kis_access_token():

    redis_client = get_redis()

    if redis_client:
        access_token = redis_client.get('kis_access_token')
        if access_token:
            return access_token

    # KIS 인증 토큰 요청
    url = 'https://openapi.koreainvestment.com:9443/oauth2/tokenP'
    headers = {'Content-Type' : 'application/json; charset=UTF-8'}
    body = {
        'grant_type' : 'client_credentials', 
        'appkey' : KIS_CLIENT_ID, 
        'appsecret' : KIS_CLIENT_SECRET
    }

    res = requests.post(url, headers=headers, data=json.dumps(body)).json()
    access_token = res.get('access_token')

    if redis_client and access_token:
        redis_client.setex('kis_access_token', 82800, access_token)

    return access_token

def get_kis_token():
    redis_client = get_redis()

    if redis_client:
        access_token = redis_client.get('kis_access_token')
        if access_token:
            return access_token

    # 토큰이 없으면 자동으로 발급
    kis_access_token = kis_access_token()

    # 다시 조회
    redis_client = get_redis()
    if redis_client:
        return redis_client.get('kis_access_token')

    # redis 연결 실패 시 kis_access_token 전달
    return kis_access_token
