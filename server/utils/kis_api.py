from dotenv import load_dotenv
import requests
import os
import json
import time
from datetime import datetime, timedelta
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
        if not self.kis_token:
            current_app.logger.error("KIS API 토큰이 없습니다")
            raise Exception("KIS API 토큰이 발급되지 않았습니다")

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

    # def fetch_minute_data_raw(self, stock_code, target_date=None):
        """
        주식당일분봉조회 API - 순수 API 호출만
        target_date: datetime 객체 (None이면 오늘)
        """
        try:
            if target_date is None:
                target_date = datetime.now()
            
            time_str = target_date.strftime("%H%M%S")
            
            url = "https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/quotations/inquire-time-itemchartprice"
            
            headers = {
                "Content-Type": "application/json",
                "authorization": f"Bearer {self.kis_token}",
                "appkey": KIS_CLIENT_ID,
                "appsecret": KIS_CLIENT_SECRET,
                "tr_id": "FHKST03010200"
            }
            
            params = {
                "fid_etc_cls_code": "",
                "fid_cond_mrkt_div_code": "J",
                "fid_input_iscd": stock_code,
                "fid_input_hour_1": time_str,
                "fid_pw_data_incu_yn": "Y"
            }
            
            response = requests.get(url, headers=headers, params=params)
            data = response.json()

            current_app.logger.info(f"당일분봉 API 호출: {stock_code}, rt_cd={data.get('rt_cd')}")
            
            return {
                'success': data.get('rt_cd') == '0',
                'data': data.get('output2', []) if data.get('rt_cd') == '0' else [],
                'message': data.get('msg1', ''),
                'raw_response': data
            }
                
        except Exception as e:
            current_app.logger.error(f"주식당일분봉조회 API 호출 실패: {e}")
            return {
                'success': False,
                'data': [],
                'message': str(e),
                'raw_response': {}
            }

    # def fetch_weekly_minute_data_raw(self, stock_code, start_date, end_date):
        """
        주식일별분봉조회 API - 순수 API 호출만
        start_date, end_date: datetime 객체
        """
        try:
            url = "https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/quotations/inquire-time-dailychartprice"
            
            headers = {
                "Content-Type": "application/json",
                "authorization": f"Bearer {self.kis_token}",
                "appkey": KIS_CLIENT_ID,
                "appsecret": KIS_CLIENT_SECRET,
                "tr_id": "FHKST03010100"
            }
            
            params = {
                "fid_cond_mrkt_div_code": "J",
                "fid_input_iscd": stock_code,
                "fid_input_date_1": start_date.strftime("%Y%m%d"),
                "fid_input_date_2": end_date.strftime("%Y%m%d"),
                "fid_period_div_code": "M",  # M:분봉
                "fid_org_adj_prc": "1"
            }
            
            response = requests.get(url, headers=headers, params=params)
            data = response.json()
            
            current_app.logger.info(f"주식일별분봉조회 API 호출: {stock_code}, rt_cd={data.get('rt_cd')}, msg={data.get('msg1')}")
            
            if data.get('rt_cd') == '0':
                return {
                    'success': True,
                    'data': data.get('output2', []),
                    'message': 'API 호출 성공',
                    'raw_response': data
                }
            else:
                # 방법 2: 분봉이 지원되지 않으면 일봉으로 시도
                current_app.logger.warning(f"분봉 조회 실패, 일봉으로 대체 시도: {data.get('msg1')}")
                
                params['fid_period_div_code'] = "D"  # D:일봉
                
                response = requests.get(url, headers=headers, params=params)
                data = response.json()
                
                current_app.logger.info(f"일봉 대체 API: {stock_code}, rt_cd={data.get('rt_cd')}")
                
                return {
                    'success': data.get('rt_cd') == '0',
                    'data': data.get('output2', []) if data.get('rt_cd') == '0' else [],
                    'message': data.get('msg1', ''),
                    'fallback_to_daily': True,
                    'raw_response': data
                }
                
        except Exception as e:
            current_app.logger.error(f"주식일별분봉조회 API 호출 실패: {e}")
            return {
                'success': False,
                'data': [],
                'message': str(e),
                'raw_response': {}
            }

    def fetch_daily_chart_data(self, stock_code, period='D'):
        """
        국내주식기간별시세 API - 차트용 데이터 조회
        period: D(일), W(주), M(월), Y(년)
        """
        try:
            url = "https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/quotations/inquire-daily-price"

            headers = {
                "Content-Type": "application/json",
                "authorization": f"Bearer {self.kis_token}",
                "appkey": KIS_CLIENT_ID,
                "appsecret": KIS_CLIENT_SECRET,
                "tr_id": "FHKST01010400",  # 국내주식기간별시세(일/주/월/년)
                "custtype": "P"
            }

            params = {
                "FID_COND_MRKT_DIV_CODE": "J",
                "FID_INPUT_ISCD": stock_code,
                "FID_PERIOD_DIV_CODE": period,
                "FID_ORG_ADJ_PRC": "1",
                "FID_INPUT_DATE_1": "",  # 조회시작일자
                "FID_INPUT_DATE_2": "",  # 조회종료일자
                "FID_DAY_COUNT": "100"   # 기간 조회 시 카운트
            }

            response = requests.get(url, headers=headers, params=params)
            data = response.json()

            current_app.logger.info(f"차트 데이터 API 호출: {stock_code}, period={period}")
            current_app.logger.debug(f"KIS API 응답: {data}")

            if not data:
                raise Exception("KIS API 응답이 비어있습니다")

            if data.get('rt_cd') != '0':
                error_msg = f"KIS API 에러: {data.get('msg1', '알 수 없는 오류')}"
                current_app.logger.error(error_msg)
                raise Exception(error_msg)

            if not data.get('output') or not isinstance(data.get('output'), list):
                raise Exception("KIS API 응답에 유효한 output 데이터가 없습니다")

            if data.get('rt_cd') == '0' and data.get('output'):
                transformed_data = self.transform_chart_data(data.get('output', []))
                return {
                    'success': True,
                    'data': transformed_data,
                    'message': '차트 데이터 조회 성공'
                }
            else:
                return {
                    'success': False,
                    'data': [],
                    'message': data.get('msg1', '차트 데이터 조회 실패'),
                    'raw_response': data
                }

        except Exception as e:
            current_app.logger.error(f"차트 데이터 API 호출 실패: {e}")
            return {
                'success': False,
                'data': [],
                'message': str(e),
                'raw_response': {}
            }

    def transform_chart_data(self, kis_output):
        """
        KIS API 응답을 차트 컴포넌트용 데이터로 변환
        """
        if not kis_output or len(kis_output) == 0:
            return {
                'candleData': [],
                'priceRange': {'min': 0, 'max': 0},
                'maxVolume': 0
            }

        candleData = []
        
        # 날짜 오름차순으로 정렬
        sorted_output = sorted(kis_output, key=lambda x: x['stck_bsop_date'])

        for i, item in enumerate(reversed(kis_output)):  # 날짜 오름차순으로 정렬
            try:
                open_price = float(item.get('stck_oprc', 0) or 0)
                high = float(item.get('stck_hgpr', 0) or 0)
                low = float(item.get('stck_lwpr', 0) or 0)
                close = float(item.get('stck_clpr', 0) or 0)
                volume = int(item.get('acml_vol', 0) or 0)

                # 이동평균 계산 (간단히 구현)
                ma5 = close
                if i >= 4:
                    ma5_values = []
                    for j in range(max(0, i-4), i+1):
                        if j < len(candleData):
                            ma5_values.append(candleData[j]['close'])
                        else:
                            ma5_values.append(close)
                    ma5 = sum(ma5_values) / len(ma5_values)

                ma20 = close
                if i >= 19:
                    ma20_values = []
                    for j in range(max(0, i-19), i+1):
                        if j < len(candleData):
                            ma20_values.append(candleData[j]['close'])
                        else:
                            ma20_values.append(close)
                    ma20 = sum(ma20_values) / len(ma20_values)

                candle_data = {
                    'timestamp': item.get('stck_bsop_date', ''),
                    'date': datetime.strptime(item.get('stck_bsop_date', ''), '%Y%m%d') if item.get('stck_bsop_date') else datetime.now(),
                    'open': open_price,
                    'high': high,
                    'low': low,
                    'close': close,
                    'volume': volume,
                    'ma5': ma5,
                    'ma20': ma20,
                    'changeAmount': int(item.get('prdy_vrss', 0) or 0),
                    'changeRate': float(item.get('prdy_ctrt', 0) or 0),
                    'isUp': item.get('prdy_vrss_sign') in ['1', '2']
                }

                candleData.append(candle_data)

            except (ValueError, TypeError) as e:
                current_app.logger.warning(f"차트 데이터 변환 중 오류: {e}, item: {item}")
                continue

        # 가격 범위 계산
        if candleData:
            all_prices = []
            for d in candleData:
                all_prices.extend([d['high'], d['low']])

            priceRange = {
                'min': min(all_prices) * 0.98,
                'max': max(all_prices) * 1.02
            }

            # 거래량 범위 계산
            maxVolume = max([d['volume'] for d in candleData]) if candleData else 0
        else:
            priceRange = {'min': 0, 'max': 0}
            maxVolume = 0

        return {
            'candleData': candleData,
            'priceRange': priceRange,
            'maxVolume': maxVolume
        }

    # def fetch_daily_data_raw(self, stock_code, start_date, end_date):
        """
        국내주식기간별시세 API - 순수 API 호출만
        start_date, end_date: datetime 객체
        """
        try:
            url = "https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice"

            headers = {
                "Content-Type": "application/json",
                "authorization": f"Bearer {self.kis_token}",
                "appkey": KIS_CLIENT_ID,
                "appsecret": KIS_CLIENT_SECRET,
                "tr_id": "FHKST03010100"
            }

            params = {
                "fid_cond_mrkt_div_code": "J",
                "fid_input_iscd": stock_code,
                "fid_input_date_1": start_date.strftime("%Y%m%d"),
                "fid_input_date_2": end_date.strftime("%Y%m%d"),
                "fid_period_div_code": "D",  # D:일봉
                "fid_org_adj_prc": "1"
            }

            response = requests.get(url, headers=headers, params=params)
            data = response.json()

            current_app.logger.info(f"일봉 API 호출: {stock_code}, rt_cd={data.get('rt_cd')}")

            return {
                'success': data.get('rt_cd') == '0',
                'data': data.get('output2', []) if data.get('rt_cd') == '0' else [],
                'message': data.get('msg1', ''),
                'raw_response': data
            }

        except Exception as e:
            current_app.logger.error(f"국내주식기간별시세 API 호출 실패: {e}")
            return {
                'success': False,
                'data': [],
                'message': str(e),
                'raw_response': {}
            }
