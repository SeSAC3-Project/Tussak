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

class KisAPI:

    def __init__(self):
        self.kis_token = get_kis_token()

    def fetch_stock_basic_info_and_history_from_kis(self, stock_code):
        try:
            # KIS API 호출
            url = "https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/quotations/search-stock-info"
            headers = {
                "Content-Type": "application/json",
                "authorization": f"Bearer {self.kis_token}",
                "appkey": KIS_CLIENT_ID,
                "appsecret": KIS_CLIENT_SECRET,
                "tr_id": "CTPF1002R"
            }
            params = {
                "PDNO": stock_code,  # 종목코드
                "PRDT_TYPE_CD": "300"  # 주식
            }
            
            response = requests.get(url, headers=headers, params=params)
            data = response.json()
            
            if data.get('rt_cd') == '0':  # 성공
                output = data.get('output', {})
                # current_app.logger.debug(f"전체 KIS API 응답: {data}")
                # current_app.logger.debug(f"output 내용: {output}")

                # 실제 존재하는 필드들 확인
                # current_app.logger.debug(f"output의 모든 키: {list(output.keys())}")

                # 당일종가와 전일종가를 이용한 계산
                current_price = float(output.get('thdt_clpr', 0)) if output.get('thdt_clpr') else None
                previous_close = float(output.get('bfdy_clpr', 0)) if output.get('bfdy_clpr') else None
                
                # 등락금액과 등락률 계산
                change_amount = None
                change_rate = None
                if current_price and previous_close:
                    change_amount = current_price - previous_close
                    change_rate = (change_amount / previous_close) * 100

                return {
                    # 기존 Stock 모델용
                    'shares_outstanding': int(output.get('lstg_stqt', 0)),  # 상장주식수
                    'sector': output.get('std_idst_clsf_cd_name', ''),      # 표준산업분류코드명
                    'sector_detail': output.get('idx_bztp_scls_cd_name', ''), # 지수업종소분류코드명
                    
                    # StockHistory 모델용
                    'current_price': current_price,
                    'previous_close': previous_close,
                    'change_rate': change_rate,
                    'change_amount': change_amount,
                    
                    # 계산 가능한 시가총액 (현재가 × 상장주수)
                    'market_cap': int(current_price * int(output.get('lstg_stqt', 0))) if current_price else None,
                    
                    # 현재 API에서 제공되지 않는 필드들
                    'day_open': None,
                    'day_high': None,
                    'day_low': None,
                    'daily_volume': None,
                    'week52_high': None,
                    'week52_low': None,
                    'per': None,
                    'pbr': None,
                }
            
            return None
            
        except Exception as e:
            current_app.logger.warning(f"KIS API 호출 실패 {stock_code}: {e}")
            return None
