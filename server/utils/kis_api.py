from dotenv import load_dotenv
import requests
import os
import json
import time
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

    def fetch_stock_basic_info(self, stock_code):
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

                return {
                    # 기존 Stock 모델용
                    'shares_outstanding': int(output.get('lstg_stqt', 0)),  # 상장주식수
                    'sector': output.get('std_idst_clsf_cd_name') or None,      # 표준산업분류코드명
                    'sector_detail': output.get('idx_bztp_scls_cd_name') or None, # 지수업종소분류코드명
                }
            
            return None
            
        except Exception as e:
            current_app.logger.warning(f"KIS API 호출 실패 {stock_code}: {e}")
            return None

    def fetch_stock_price_info(self, stock_code):
        try:
            # KIS API 호출
            url = "https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/quotations/inquire-price"
            headers = {
                "Content-Type": "application/json",
                "authorization": f"Bearer {self.kis_token}",
                "appkey": KIS_CLIENT_ID,
                "appsecret": KIS_CLIENT_SECRET,
                "tr_id": "FHKST01010100"
            }
            params = {
                "fid_cond_mrkt_div_code": "J", # 조건 시장 분류 코드 -> J:KRX, NX:NXT, UN:통합
                "fid_input_iscd": stock_code # 종목코드
            }
            
            response = requests.get(url, headers=headers, params=params)
            data = response.json()
            
            if data.get('rt_cd') == '0':  # 성공
                output = data.get('output', {})
                # current_app.logger.debug(f"전체 KIS API 응답: {data}")
                # current_app.logger.debug(f"output 내용: {output}")

                # 실제 존재하는 필드들 확인
                # current_app.logger.debug(f"output의 모든 키: {list(output.keys())}")

                # 현재가와 전일대비금액으로 전일종가 계산
                current_price = float(output.get('stck_prpr', 0)) if output.get('stck_prpr') else None
                change_amount = float(output.get('prdy_vrss', 0)) if output.get('prdy_vrss') else None
                
                # 전일종가 = 현재가 - 전일대비금액
                previous_close = None
                if current_price is not None and change_amount is not None:
                    previous_close = current_price - change_amount

                return {
                    # StockHistory 모델용
                    'current_price': current_price,
                    'previous_close': previous_close,
                    'change_rate': float(output.get('prdy_ctrt', 0)) if output.get('prdy_ctrt') else None,
                    'change_amount': change_amount,
                    'day_open': float(output.get('stck_oprc', 0)) if output.get('stck_oprc') else None,
                    'day_high': float(output.get('stck_hgpr', 0)) if output.get('stck_hgpr') else None,
                    'day_low': float(output.get('stck_lwpr', 0)) if output.get('stck_lwpr') else None,
                    'daily_volume': int(output.get('acml_vol', 0)) if output.get('acml_vol') else None,
                    'market_cap': int(output.get('hts_avls', 0)) if output.get('hts_avls') else None,
                    'week52_high': float(output.get('w52_hgpr', 0)) if output.get('w52_hgpr') else None,
                    'week52_low': float(output.get('w52_lwpr', 0)) if output.get('w52_lwpr') else None,
                    'per': float(output.get('per', 0)) if output.get('per') else None,
                    'pbr': float(output.get('pbr', 0)) if output.get('pbr') else None,
                }
            
            return None
            
        except Exception as e:
            current_app.logger.warning(f"KIS API 호출 실패 {stock_code}: {e}")
            return None

    def fetch_stock_basic_info_and_history_from_kis(self, stock_code):
        try:
            # 1. Stock 기본 정보
            basic_info = self.fetch_stock_basic_info(stock_code)
            
            # 2. StockHistory 실시간 정보
            price_info = self.fetch_stock_price_info(stock_code)
            
            # 3. 병합
            result = {}
            if basic_info:
                result.update(basic_info)
            if price_info:
                result.update(price_info)
                
            return result if result else None
            
        except Exception as e:
            current_app.logger.warning(f"KIS API 호출 실패 {stock_code}: {e}")
            return None

    # 거래대금 순위 조회
    def fetch_volume_ranking(self, limit=30):
        try:
            current_app.logger.info("🔍 거래대금 순위 조회 시작")

            # 거래대금 순위 API URL
            url = "https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/quotations/inquire-price"
            
            headers = {
                "Content-Type": "application/json",
                "authorization": f"Bearer {self.kis_token}",
                "appkey": KIS_CLIENT_ID,
                "appsecret": KIS_CLIENT_SECRET,
                "tr_id": "FHPST01710000",  # 🆕 거래대금 순위 전용 tr_id
                "custtype": "P"
            }
            
            # 거래대금 순위에 맞는 파라미터
            params = {
                "FID_COND_MRKT_DIV_CODE": "J",  # J: KRX 전체
                "FID_COND_SCR_DIV_CODE": "20171",  # 🆕 거래대금 순위
                "FID_INPUT_PRICE_1": "0",  # 🆕 시작 가격
                "FID_INPUT_PRICE_2": "999999999",  # �� 끝 가격
                "FID_VOL_CNT": str(limit)  # 🆕 조회 개수
            }

            current_app.logger.info(f"📡 API 호출: {url}")
            current_app.logger.info(f"🔑 Headers: {headers}")
            current_app.logger.info(f"📋 Params: {params}")
            
            response = requests.get(url, headers=headers, params=params)

            current_app.logger.info(f"📊 응답 상태: {response.status_code}")
            current_app.logger.info(f"📄 응답 헤더: {dict(response.headers)}")
            
            # 응답 상태 확인
            if response.status_code != 200:
                current_app.logger.error(f"API 응답 오류: {response.status_code} - {response.text}")
                return []
            
            # 응답 내용 로깅
            current_app.logger.debug(f"API 전체 응답: {response.text}")
            
            data = response.json()
            current_app.logger.debug(f"파싱된 API 데이터: {data}")
            
            if data.get('rt_cd') == '0':
                output = data.get('output', [])
                current_app.logger.info(f"✅ 성공: output 개수 {len(output)}")
                results = []
                
                for item in output:
                    results.append({
                        'stock_code': item.get('hts_kor_isnm', '').strip(),
                        'stock_name': item.get('hts_kor_isnm', '').strip(),
                        'current_price': float(item.get('stck_prpr', 0)) if item.get('stck_prpr') else None,
                        'change_rate': float(item.get('prdy_ctrt', 0)) if item.get('prdy_ctrt') else None,
                        'change_amount': float(item.get('prdy_vrss', 0)) if item.get('prdy_vrss') else None,
                        'daily_volume': int(item.get('acml_vol', 0)) if item.get('acml_vol') else None,
                        'trade_amount': int(item.get('acml_tr_pbmn', 0)) if item.get('acml_tr_pbmn') else None,
                        'market': item.get('rprs_mrkt_kor_name', '')
                    })
                
                current_app.logger.info(f"�� 결과: {len(results)}개 종목")
                return results[:limit]
            
            current_app.logger.error(f"❌ KIS API 오류:")
            current_app.logger.error(f"   - rt_cd: '{data.get('rt_cd')}'")
            current_app.logger.error(f"   - msg_cd: '{data.get('msg_cd')}'")
            current_app.logger.error(f"   - msg1: '{data.get('msg1')}'")
            current_app.logger.error(f"   - 전체 응답: {data}")
            return []
            
        except Exception as e:
            current_app.logger.error(f"💥 거래대금 순위 조회 실패: {e}")
            import traceback
            current_app.logger.error(f"📚 상세 오류: {traceback.format_exc()}")
            return []
