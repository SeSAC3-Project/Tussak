import websocket
import json
import threading
import time
from datetime import datetime
from config.redis import get_redis
import os

from services.stock_service import StockService
from utils.kis_websocket import get_websocket_token, invalidate_websocket_token, _is_token_format_valid

KIS_CLIENT_ID=os.getenv("KIS_API_KEY")
KIS_CLIENT_SECRET=os.getenv("KIS_SECRET_KEY")

class KisWebSocketService:
    def __init__(self, app=None):
        self.ws = None
        self.is_connected = False
        self.reconnect_attempts = 0
        self.max_reconnect_attempts = 3 # 재시도 횟수

        self.base_stock_codes = []       # 기본 top28 종목 (항상 유지)
        self.additional_stock_codes = [] # 추가 구독 종목들 (검색, 상세페이지 등)
        self.stock_codes = []           # 전체 구독 종목 (base + additional의 합)

        self.redis_client = get_redis()
        self.app = app
        
        # KIS API 정보
        self.app_key = KIS_CLIENT_ID
        self.app_secret = KIS_CLIENT_SECRET
        self.access_token = None
        self.successful_subscriptions = 0
        self.failed_subscriptions = []  # 실패한 구독 추적
        
    def connect(self, base_stock_codes):
        """웹소켓 연결 - 기본 종목들로 시작(top28)"""
        try:
            self.base_stock_codes = base_stock_codes
            self.additional_stock_codes = []  # 초기화
            self.stock_codes = base_stock_codes.copy()  # 초기에는 기본 종목만

            self.access_token = get_websocket_token()

            if not self.access_token:
                raise Exception("WebSocket 토큰이 없습니다")
            
            # 웹소켓 URL
            ws_url = "ws://ops.koreainvestment.com:21000"

            self.app.logger.info("🔴 WebSocket 서버 연결 시도")
            
            # 웹소켓 연결
            self.ws = websocket.WebSocketApp(
                ws_url,
                on_open=self.on_open,
                on_message=self.on_message,
                on_error=self.on_error,
                on_close=self.on_close
            )
            
            # 별도 스레드에서 웹소켓 실행
            ws_thread = threading.Thread(target=self.ws.run_forever)
            ws_thread.daemon = True
            ws_thread.start()
            
            self.app.logger.info("✅ 웹소켓 연결 스레드 시작")
            
        except Exception as e:
            self.app.logger.error(f"❌ 웹소켓 연결 실패: {e}")
    
    def on_open(self, ws):
        """웹소켓 연결 성공 시"""
        try:
            self.is_connected = True
            self.reconnect_attempts = 0
            self.failed_subscriptions = []  # 실패 목록 초기화

            self.app.logger.info("🎉 웹소켓 연결 성공!")

            # 종목 구독 (1초 간격)
            for i, stock_code in enumerate(self.base_stock_codes):
                self.app.logger.info(f"구독 시도 {i+1}/{len(self.base_stock_codes)}: {stock_code}")
                self.subscribe_stock(stock_code)
                time.sleep(1)
            
        except Exception as e:
            self.app.logger.error(f"❌ 웹소켓 연결 후 구독 실패: {e}")


    def subscribe_stock(self, stock_code):
        """개별 종목 구독 요청"""
        try:
            # 토큰 유효성 재확인
            if not self.access_token or not _is_token_format_valid(self.access_token):
                self.app.logger.error(f"유효하지 않은 토큰으로 구독 시도: {self.access_token}")
                return
            
            # 요청 메시지
            auth_message = {
                "header": {
                    "approval_key": self.access_token,
                    "custtype": "P",  # 개인
                    "tr_type": "1",   # 등록
                    "content-type": "utf-8"
                },
                "body": {
                    "input": {
                        "tr_id": "H0STCNT0",  # 실시간 시세 조회
                        "tr_key": stock_code
                    }
                }
            }
            
            message_json = json.dumps(auth_message)

            if not self.ws or not hasattr(self.ws, 'sock') or self.ws.sock is None:
                self.app.logger.error("WebSocket 연결이 이미 끊어진 상태입니다")
                self.is_connected = False
                return False

            self.ws.send(message_json)
            self.app.logger.info(f"✅ 종목 구독 요청 전송 완료: {stock_code}")

            return True
            
        except Exception as e:
            self.app.logger.error(f"❌ 종목 구독 실패 {stock_code}: {e}")
            return False
    
    # 추가 구독 기능
    def add_additional_subscriptions(self, new_stock_codes):
        """추가 종목 구독 (기본 종목은 유지)"""
        try:
            # 중복 제거: 이미 구독 중인 종목 제외
            current_all_codes = set(self.base_stock_codes + self.additional_stock_codes)
            codes_to_add = [code for code in new_stock_codes if code not in current_all_codes]
            
            if not codes_to_add:
                self.app.logger.info("추가할 새로운 종목이 없습니다")
                return True
            
            # 최대 추가 구독 수 제한 (예: 50개)
            max_additional = 50
            if len(self.additional_stock_codes) + len(codes_to_add) > max_additional:
                available_slots = max_additional - len(self.additional_stock_codes)
                codes_to_add = codes_to_add[:available_slots]
                self.app.logger.warning(f"추가 구독 제한으로 {len(codes_to_add)}개만 구독")
            
            # 새 종목들 구독
            success_count = 0
            for stock_code in codes_to_add:
                if self.subscribe_stock(stock_code):
                    self.additional_stock_codes.append(stock_code)
                    self.stock_codes.append(stock_code)
                    success_count += 1
                time.sleep(0.5)  # 구독 간격
            
            self.app.logger.info(f"추가 구독 완료: {success_count}/{len(codes_to_add)}개 종목")
            self.app.logger.info(f"현재 총 구독: {len(self.stock_codes)}개 (기본: {len(self.base_stock_codes)}, 추가: {len(self.additional_stock_codes)})")
            
            return success_count > 0
            
        except Exception as e:
            self.app.logger.error(f"추가 구독 실패: {e}")
            return False
    
    def unsubscribe_stock(self, stock_code):
        """개별 종목 구독 해제"""
        try:
            unsubscribe_message = {
                "header": {
                    "approval_key": self.access_token,
                    "custtype": "P",
                    "tr_type": "2",  # 2 = 해제
                    "content-type": "utf-8"
                },
                "body": {
                    "input": {
                        "tr_id": "H0STCNT0",
                        "tr_key": stock_code
                    }
                }
            }
            
            if not self.ws or not hasattr(self.ws, 'sock') or self.ws.sock is None:
                self.app.logger.error("WebSocket 연결이 끊어진 상태입니다")
                return False
            
            self.ws.send(json.dumps(unsubscribe_message))
            self.app.logger.info(f"구독 해제: {stock_code}")
            return True
            
        except Exception as e:
            self.app.logger.error(f"구독 해제 실패 {stock_code}: {e}")
            return False

    def remove_additional_subscriptions(self, stock_codes_to_remove):
        """특정 추가 구독 종목 해제 (기본 종목은 유지)"""
        try:
            removed_count = 0
            
            for stock_code in stock_codes_to_remove:
                # 기본 구독 종목은 해제하지 않음
                if stock_code in self.base_stock_codes:
                    self.app.logger.info(f"기본 구독 종목은 해제하지 않습니다: {stock_code}")
                    continue
                
                if stock_code in self.additional_stock_codes:
                    if self.unsubscribe_stock(stock_code):
                        self.additional_stock_codes.remove(stock_code)
                        self.stock_codes.remove(stock_code)
                        removed_count += 1
                    time.sleep(0.5)
            
            self.app.logger.info(f"추가 구독 해제 완료: {removed_count}개 종목")
            return True
            
        except Exception as e:
            self.app.logger.error(f"추가 구독 해제 실패: {e}")
            return False

    def clear_all_additional_subscriptions(self):
        """모든 추가 구독 해제 (기본 종목은 유지)"""
        return self.remove_additional_subscriptions(self.additional_stock_codes.copy())
    
    def on_message(self, ws, message):
        """웹소켓 메시지 수신 시"""
        try:
            # 메시지가 JSON 형태인지 확인 (초기 응답)
            if message.startswith('{'):
                try:
                    data = json.loads(message)

                    header = data.get("header", {})
                    body = data.get("body", {})
                    tr_id = header.get("tr_id")
                    
                    if tr_id == "PINGPONG":
                        self.app.logger.debug("🏓 PINGPONG 메시지 수신")
                        return
                    
                    if tr_id == "H0STCNT0":
                        rt_cd = body.get("rt_cd", "")
                        msg = body.get("msg1", "")
                        tr_key = header.get("tr_key", "")
                        
                        if rt_cd == "0":
                            self.successful_subscriptions += 1
                            self.app.logger.info(f"🎉 구독 성공 ({self.successful_subscriptions}): {tr_key}")

                            # 실패 목록에서 제거 (재구독 성공한 경우)
                            if tr_key in self.failed_subscriptions:
                                self.failed_subscriptions.remove(tr_key)
                        else:
                            self.app.logger.error(f"❌ 구독 실패: {tr_id} - RT_CD: {rt_cd}, MSG: {msg}")

                            # 실패 목록에 추가
                            if tr_key not in self.failed_subscriptions:
                                self.failed_subscriptions.append(tr_key)
                            
                            # 토큰 관련 에러 시 자동 처리
                            if "invalid approval" in msg.lower() or "not found" in msg.lower():
                                self.app.logger.warning("토큰 관련 오류 감지 - 자동 갱신 시도")
                                self._handle_token_error()

                    return
                    
                except Exception as json_error:
                    self.app.logger.error(f"JSON 파싱 오류: {json_error}")
            
            # 실시간 데이터 처리
            if message[0] in ['0', '1']:
                # self.app.logger.info(f"📊 실시간 데이터 수신: {message[:100]}...")
                self.process_realtime_data(message)
            else:
                self.app.logger.debug(f"알 수 없는 메시지: {message[:50]}...")
                
        except Exception as e:
            self.app.logger.error(f"❌ 메시지 처리 실패: {e}")

    def _handle_token_error(self):
        """토큰 오류 자동 처리"""
        try:
            self.app.logger.info("토큰 오류 자동 갱신 시작")
            
            # 기존 토큰 무효화
            invalidate_websocket_token()
            
            # 새 토큰 발급 (5초 대기 후)
            time.sleep(5)
            new_token = get_websocket_token()
            self.access_token = new_token
            
            self.app.logger.info(f"토큰 자동 갱신 완료: {new_token}")
            
            # 실패한 종목들 재구독 (별도 스레드)
            if self.failed_subscriptions:
                threading.Thread(target=self._retry_failed_subscriptions, daemon=True).start()
            
        except Exception as e:
            self.app.logger.error(f"토큰 자동 갱신 실패: {e}")
    
    def _retry_failed_subscriptions(self):
        """실패한 구독 재시도"""
        try:
            if not self.failed_subscriptions:
                return
                
            self.app.logger.info(f"실패한 {len(self.failed_subscriptions)}개 종목 재구독 시도")
            
            # 토큰 갱신 후 잠시 대기
            time.sleep(3)
            
            retry_list = self.failed_subscriptions.copy()
            for stock_code in retry_list:
                self.app.logger.info(f"재구독 시도: {stock_code}")
                self.subscribe_stock(stock_code)
                time.sleep(2)  # 구독 간격
            
            self.app.logger.info("재구독 시도 완료")
            
        except Exception as e:
            self.app.logger.error(f"재구독 실패: {e}")
    
    def process_realtime_data(self, data):
        """실시간 데이터 처리 및 Redis 저장"""
        try:
            if data[0] == '0':  # 암호화되지 않은 데이터
                parts = data.split('|')
                if len(parts) < 4:
                    self.app.logger.warning(f"데이터 형식 오류: {len(parts)}개 부분만 있음")
                    return
                    
                tr_id = parts[1]
                data_count = parts[2]
                raw_data = parts[3]

                # self.app.logger.info(f"📊 실시간 데이터 파싱: TR_ID={tr_id}, COUNT={data_count}")
                
                if tr_id == "H0STCNT0":  # 주식 체결가
                    self.process_stock_price_data(raw_data)
                    
        except Exception as e:
            self.app.logger.error(f"실시간 데이터 처리 실패: {e}")

    def process_stock_price_data(self, raw_data):
        """주식 체결가 데이터 처리"""
        try:
            # 데이터를 ^ 구분자로 분리
            fields = raw_data.split('^')
            
            if len(fields) < 14:
                self.app.logger.warning(f"⚠️ 필드 수 부족: {len(fields)}개 (최소 14개 필요)")
                return
            
            # 주요 데이터 추출
            stock_code = fields[0]
            trade_time = fields[1]
            current_price = fields[2]
            change_sign = fields[3]
            change_amount = fields[4]
            change_rate = fields[5]

            
            # 데이터 검증 및 변환
            try:
                current_price_float = float(current_price) if current_price else 0
                change_rate_float = float(change_rate) if change_rate else 0
                change_amount_int = int(change_amount) if change_amount else 0
            except (ValueError, TypeError):
                self.app.logger.warning(f"⚠️ 데이터 변환 실패: {stock_code}")
                return

            
            # Redis에 저장
            if self.redis_client and stock_code:
                realtime_key = f"realtime_price:{stock_code}"
                realtime_data = {
                    "stock_code": stock_code,
                    "current_price": str(current_price_float),
                    "change_rate": str(change_rate_float),
                    "change_amount": str(change_amount_int),
                    "change_sign": change_sign,
                    "updated_at": datetime.now().isoformat()
                }
                
                self.redis_client.hset(realtime_key, mapping=realtime_data)
                self.redis_client.expire(realtime_key, 300)  # 5분 만료
                
                # 성공적인 데이터 처리 로깅 (부호 변환)
                sign_map = {'1': '↑', '2': '▲', '3': '=', '4': '↓', '5': '▼'}
                sign_symbol = sign_map.get(change_sign, '')
                
                # self.app.logger.info(
                #     f"📊 실시간 저장: {stock_code} {current_price_float:,.0f}원 "
                #     f"{sign_symbol} {change_rate_float:+.2f}%"
                # )
                    
        except Exception as e:
            self.app.logger.error(f"❌ 주식 체결가 데이터 처리 실패: {e}")
    
    def on_error(self, ws, error):
        """웹소켓 에러 시"""
        self.app.logger.error(f"웹소켓 에러: {error}")
        self.is_connected = False
    
    def on_close(self, ws, close_status_code, close_msg):
        """웹소켓 연결 종료 시"""
        self.app.logger.warning(f"🔌 웹소켓 연결 종료 - 상태코드: {close_status_code}, 메시지: {close_msg}")
        self.is_connected = False
        
        # 자동 재연결 시도
        if self.reconnect_attempts < self.max_reconnect_attempts:
            self.reconnect_attempts += 1
            self.app.logger.info(f"웹소켓 재연결 시도 {self.reconnect_attempts}/{self.max_reconnect_attempts}")
            time.sleep(5)  # 5초 대기 후 재연결
            self.connect(self.base_stock_codes) # 기본 종목으로 재연결
        else:
            self.app.logger.error("❌ 최대 재연결 시도 횟수 초과. 재연결을 포기합니다.")
    
    def disconnect(self):
        """웹소켓 연결 해제"""
        if self.ws:
            self.ws.close()
            self.is_connected = False
            self.app.logger.info("웹소켓 연결 해제")
    
    def get_realtime_price(self, stock_code):
        """Redis에서 실시간 가격 조회"""
        if not self.redis_client:
            return None
            
        realtime_key = f"realtime_price:{stock_code}"
        data = self.redis_client.hgetall(realtime_key)
        
        if data:
            return {
                "stock_code": data.get("stock_code"),
                "current_price": float(data.get("current_price", 0)),
                "change_rate": float(data.get("change_rate", 0)),
                "change_amount": int(data.get("change_amount", 0)),
                "change_sign": data.get("change_sign"),
                "updated_at": data.get("updated_at")
            }
        return None
    
    def get_realtime_ranking(self, limit=28):
        """실시간 거래대금 순위 조회"""
        
        # 기본 거래대금 순위 조회
        stocks = StockService.get_volume_ranking(limit)
        
        # 실시간 가격 데이터로 업데이트
        for stock in stocks:
            realtime_data = self.get_realtime_price(stock['stock_code'])
            if realtime_data:
                stock['current_price'] = realtime_data['current_price']
                stock['change_rate'] = realtime_data['change_rate']
                stock['change_amount'] = realtime_data['change_amount']
                stock['change_sign'] = realtime_data['change_sign']
                stock['realtime_updated_at'] = realtime_data['updated_at']
        
        return stocks

    def get_subscription_status(self):
        """구독 상태 정보 반환"""
        return {
            'base_subscriptions': {
                'count': len(self.base_stock_codes),
                'codes': self.base_stock_codes
            },
            'additional_subscriptions': {
                'count': len(self.additional_stock_codes),
                'codes': self.additional_stock_codes,
                'max_limit': 50
            },
            'total_subscriptions': {
                'count': len(self.stock_codes),
                'codes': self.stock_codes
            },
            'connection_status': self.is_connected,
            'successful_subscriptions': self.successful_subscriptions,
            'failed_subscriptions': len(self.failed_subscriptions),
            'failed_stock_codes': self.failed_subscriptions
        }

# 전역 웹소켓 서비스 인스턴스 (None으로 초기화)
websocket_service = None

def get_websocket_service(app):
    """웹소켓 서비스 인스턴스 반환 (지연 초기화)"""
    global websocket_service
    if websocket_service is None:
        websocket_service = KisWebSocketService(app)
    return websocket_service
