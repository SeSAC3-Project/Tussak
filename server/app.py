from flask import Flask
from flask_cors import CORS
import os
from dotenv import load_dotenv
import threading

# scheduler
from utils.kis_api import kis_access_token
from utils.kis_websocket import kis_websocket_access_token, scheduled_refresh_websocket_token
from services.websocket_service import get_websocket_service
from services.stock_service import StockService
from services.ranking_service import RankingService
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import atexit
import time

# config
from config import setup_logging # logging
from config.redis import redis_config # redis

# models
from models import db
from models.user import User
from models.stock import Stock
from models.stock_history import StockHistory
from models.portfolio import Portfolio
from models.transaction import Transaction
from models.bookmark import Bookmark

# routes
from routes.auth_routes import auth_bp
from routes.chatbot_routes import chatbot_bp
from routes.insight_routes import insight_bp
from routes.user_routes import user_bp
from routes.ranking_routes import ranking_bp
from routes.stock_routes import stock_bp
from routes.bookmark_routes import bookmark_bp

load_dotenv()

def create_app(): 
    app = Flask(__name__)
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')

    app.debug = True # 개발 모드 설정 -> 배포 시 수정 필요
    setup_logging(app)

    CORS(app, origins=['http://localhost:3000', 'http://127.0.0.1:3000'])

    init_db(app)
    init_redis(app)
    register_blueprints(app)
    # setup_scheduler(app)

    # DB
    with app.app_context():
        try:
            # DB 연결 테스트
            db.engine.connect()
            app.logger.info("✅ 데이터베이스 연결 성공!")

            # DB 테이블 생성
            db.create_all()
            app.logger.info("✅ 테이블 생성 완료!")

        except Exception as e:
            app.logger.error(f"❌ 데이터베이스 연결 실패: {e}")
            raise

        # KIS Token
        try:
            kis_access_token()  # 앱 시작 시 토큰 발급
            app.logger.info("✅ 앱 시작 시 KIS Access Token 생성 완료")

        except Exception as e:
            app.logger.error(f"❌ 앱 시작 시 KIS Token 생성 실패: {e}")

        # KIS WebSocket Token
        try:
            kis_websocket_access_token()  # 앱 시작 시 토큰 발급
            app.logger.info("✅ 앱 시작 시 KIS WebSocket Access Token 생성 완료")

        except Exception as e:
            app.logger.error(f"❌ 앱 시작 시 KIS WebSocket Token 생성 실패: {e}")

        # Stock and StockHistory Data Sync
        # 코드 수정하면 app reload 발생 


        # -> 전체 종목, history update 호출되서 시간 오래걸리니 한번 app 시작되면 하기 try... except 주석처리하기!
        # try:
        #     StockService.all_stocks()  # 앱 시작 시 종목 데이터 동기화
        #     app.logger.info("✅ 앱 시작 시 주식 종목 데이터 동기화 완료")

        #     StockService.update_stock_info_and_history()  # 앱 시작 시 종목 데이터 동기화
        #     app.logger.info("✅ 종목 상세정보 및 히스토리 업데이트 완료")

        # except Exception as e:
        #     app.logger.error(f"❌ 앱 시작 시 주식 종목 데이터 동기화 실패: {e}")

        # WebSocket 서비스 시작 (앱 시작 후 3초 지연)
        try:
            def delayed_websocket_start():
                time.sleep(3)  # 앱 완전 시작 후 3초 대기
                start_websocket_service(app)
            
            ws_thread = threading.Thread(target=delayed_websocket_start)
            ws_thread.daemon = True
            ws_thread.start()
            
            app.logger.info("✅ WebSocket 서비스 시작 스레드 생성 완료")
            
        except Exception as e:
            app.logger.error(f"❌ WebSocket 서비스 시작 실패: {e}")

    return app

def init_db(app):
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_recycle': 3600, # 연결 재활용 시간 (1시간)
        'pool_pre_ping': True, # 연결 상태 확인
        'pool_size': 10, # 연결 풀 크기
        'max_overflow': 20, # 최대 추가 연결
    }
    
    db.init_app(app)

def init_redis(app):
    redis_config.init_redis(app)

def refresh_kis_token(app):
    with app.app_context():
        try:
            kis_access_token()
            app.logger.info("✅ KIS Access Token 갱신 완료")
        except Exception as e:
            app.logger.error(f"❌ KIS Token 갱신 실패: {e}")

def update_stock_basic_info(app):
    with app.app_context():
        try:
            StockService.all_stocks()
            app.logger.info("✅ 주식 종목 데이터 동기화 완료")
        except Exception as e:
            app.logger.error(f"❌ 주식 종목 데이터 동기화 실패: {e}")

def save_daily_stock_history(app):
    with app.app_context():
        try:
            StockService.update_stock_info_and_history()
            app.logger.info("✅ 일별 OHLCV 히스토리 저장 완료")
        except Exception as e:
            app.logger.error(f"❌ 일별 OHLCV 히스토리 저장 실패: {e}")

def update_daily_rankings(app):
    with app.app_context():
        try:
            result = RankingService.calculate_and_update_rankings()
            if result['success']:
                app.logger.info("✅ 일별 투자 랭킹 업데이트 완료")
            else:
                app.logger.error(f"❌ 일별 투자 랭킹 업데이트 실패: {result['message']}")
        except Exception as e:
            app.logger.error(f"❌ 일별 투자 랭킹 업데이트 실패: {e}")

# WebSocket 실시간 시세 서비스 시작
def start_websocket_service(app):
    with app.app_context():
        try:
            # 거래대금 상위 28개 종목 코드 가져오기
            stocks = StockService.get_volume_ranking(28)
            stock_codes = [stock['stock_code'] for stock in stocks]
            
            # 웹소켓 서비스 초기화 및 연결
            websocket_service = get_websocket_service(app)
            websocket_service.connect(stock_codes)
            
            app.logger.info(f"✅ WebSocket 실시간 시세 서비스 시작: {len(stock_codes)}개 종목")

            # 연결 상태 확인
            max_wait = 10  # 최대 10초 대기
            wait_count = 0
            while not websocket_service.is_connected and wait_count < max_wait:
                time.sleep(1)
                wait_count += 1
            
            if websocket_service.is_connected:
                app.logger.info("✅ WebSocket 연결 성공 확인")
            else:
                app.logger.warning("⚠️ WebSocket 연결 상태를 확인할 수 없습니다")
            
        except Exception as e:
            app.logger.error(f"❌ WebSocket 서비스 시작 실패: {e}")

# WebSocket 토큰 갱신
def refresh_websocket_token(app):
    with app.app_context():
        try:
            token = scheduled_refresh_websocket_token()
            app.logger.info("✅ 스케줄러에 의한 WebSocket 토큰 갱신 완료")
        except Exception as e:
            app.logger.error(f"❌ 스케줄러 WebSocket 토큰 갱신 실패: {e}")

# 앱 종료 시 웹소켓 연결 해제
def cleanup_websocket():
    try:
        websocket_service = get_websocket_service(None)
        if websocket_service:
            websocket_service.disconnect()
        print("✅ WebSocket 정리 완료")
    except Exception as e:
        print(f"❌ WebSocket 정리 중 오류: {e}")


def setup_scheduler(app):
    # 스케줄러 초기화
    scheduler = BackgroundScheduler()
    scheduler.start()
    
    # 매일 오전 8시에 토큰 갱신 (한국 시간)
    scheduler.add_job(
        func=lambda: refresh_kis_token(app),
        trigger=CronTrigger(hour=8, minute=0, timezone='Asia/Seoul'),
        id='refresh_kis_token',
        name='Refresh KIS Access Token',
        replace_existing=True
    )

    # 매일 오전 8시 30분에 WebSocket 토큰 갱신 (한국 시간)
    scheduler.add_job(
        func=lambda: refresh_websocket_token(app),
        trigger=CronTrigger(hour=8, minute=30, timezone='Asia/Seoul'),
        id='refresh_websocket_token',
        name='Refresh KIS WebSocket Token',
        replace_existing=True
    )
    
    # 주 1회 일요일 - 기본정보 업데이트 (한국 시간)
    scheduler.add_job(
        func=lambda: update_stock_basic_info(app),
        trigger=CronTrigger(day_of_week='sun', hour=20, minute=0, timezone='Asia/Seoul'),
        id='update_basic_info',
        name='Update Stock Basic Info Weekly',
        replace_existing=True
    )

    # 매일 오후 10시 - 일별 OHLCV 히스토리 저장 (한국 시간)
    scheduler.add_job(
    func=lambda: save_daily_stock_history(app),
    trigger=CronTrigger(hour=22, minute=0, timezone='Asia/Seoul'),
    id='save_daily_history',
    name='Save Daily OHLCV History',
    replace_existing=True
)

    # 매일 오후 11시 45분 - 일별 투자 랭킹 업데이트 (한국 시간)
    scheduler.add_job(
        func=lambda: update_daily_rankings(app),
        trigger=CronTrigger(hour=23, minute=45, timezone='Asia/Seoul'),
        id='update_daily_rankings',
        name='Update Daily Investment Rankings',
        replace_existing=True
    )
    
    # 앱 종료 시 웹소켓 연결 해제, 스케줄러도 종료
    atexit.register(cleanup_websocket)
    atexit.register(lambda: scheduler.shutdown())

def register_blueprints(app):
    app.register_blueprint(auth_bp)
    app.register_blueprint(chatbot_bp)
    app.register_blueprint(insight_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(ranking_bp)
    app.register_blueprint(stock_bp)
    app.register_blueprint(bookmark_bp)

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5001)
