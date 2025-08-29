from flask import Flask
from flask_cors import CORS
import os
from dotenv import load_dotenv

# scheduler
from utils.kis_api import kis_access_token
from services.stock_service import StockService
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import atexit

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
    setup_scheduler(app)

    with app.app_context():
        # DB
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

        # Stock and StockHistory Data Sync
        try:
            StockService.all_stocks()  # 앱 시작 시 종목 데이터 동기화
            app.logger.info("✅ 앱 시작 시 주식 종목 데이터 동기화 완료")

            StockService.update_stock_info_and_history()  # 앱 시작 시 종목 데이터 동기화
            app.logger.info("✅ 종목 상세정보 및 히스토리 업데이트 완료")

        except Exception as e:
            app.logger.error(f"❌ 앱 시작 시 주식 종목 데이터 동기화 실패: {e}")

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
    name='Save Daily OHLCV History'
)
    
    # 앱 종료 시 스케줄러도 종료
    atexit.register(lambda: scheduler.shutdown())

def register_blueprints(app):
    app.register_blueprint(auth_bp)
    app.register_blueprint(chatbot_bp)
    app.register_blueprint(insight_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(ranking_bp)
    app.register_blueprint(stock_bp)

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)

# 로그 사용 방법
# from flask import current_app
# DEBUG: 상세한 디버깅 정보 (개발 시에만) 
# -> 개발 중 변수 값 확인, 함수 진입/종료 추적
# current_app.logger.debug(f"API 요청 데이터: {request.json}")

# INFO: 일반적인 정보 (정상 동작) 
# -> 시스템 상태, 정상적인 비즈니스 로직 흐름
# current_app.logger.info("사용자 로그인 성공")

# WARNING: 경고 (문제가 될 수 있지만 동작은 계속) 
# -> 권한이나 접근 관련, 문제가 될 수 있지만 계속 진행
# current_app.logger.warning("데이터베이스 연결이 느립니다")

# ERROR: 에러 (기능이 실패했지만 앱은 계속 실행) 
# -> 외부 API 호출 실패, 기능 실패, 예외 발생
# current_app.logger.error("주식 데이터 조회 실패")

# CRITICAL: 심각한 에러 (앱이 중단될 수 있음) 
# -> 시스템 전체에 영향, 중요 데이터 손실, 중요 기능 중단
# current_app.logger.critical("데이터베이스 연결 완전 실패")

# redis 사용법
# from config import get_redis
# redis 저장
# redis_client = get_redis()
# if redis_client:
#     session_key = f'user_session:{user_id}'
#     redis_client.hset(session_key, mapping={
#         'nickname': user_data['nickname'],
#         'email': user_data['email'],
#         'login_time': datetime.now().isoformat(),
#         'last_activity': datetime.now().isoformat(),
#         'portfolio_value': str(user_data.get('portfolio_value', 0))
#     })
#     redis_client.expire(session_key, 86400)  # 24시간

# 저장된 redis 데이터 가져오기
# 특정 필드 조회 
# -> redis_client.hget('key', 'field')
# redis_client = get_redis()
# if redis_client:
#     # 닉네임만 조회
#     nickname = redis_client.hget(f'user_session:{user_id}', 'nickname')
#     return nickname
# return None

# 여러 필드 조회 
# -> redis_client.hmget('key', ['field1', 'field2'])
# redis_client = get_redis()
# if redis_client:
#     # 여러 필드 한번에 조회
#     user_info = redis_client.hmget(
#         f'user_session:{user_id}', 
#         ['nickname', 'email', 'last_activity']
#     )
    
#     return {
#         'nickname': user_info[0],
#         'email': user_info[1], 
#         'last_activity': user_info[2]
#     }
# return None

# 모든 필드 조회 
# -> redis_client.hgetall('key')
# redis_client = get_redis()
# if redis_client:
#     # 모든 필드 조회
#     all_data = redis_client.hgetall(f'user_session:{user_id}')
#     return all_data  # 딕셔너리 형태로 반환
# return {}
