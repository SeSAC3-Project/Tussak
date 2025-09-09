import redis
import os

class RedisConfig:
    
    def __init__(self):
        self.redis_client = None
    
    def init_redis(self, app):
        """Redis 초기화"""
        redis_url = os.getenv('REDIS_URL')
        
        try:
            self.redis_client = redis.from_url(
                redis_url,
                decode_responses=True,  # 문자열로 자동 디코딩
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True,
                health_check_interval=30
            )
            
            # 연결 테스트
            self.redis_client.ping()
            app.logger.info("✅ Redis 연결 성공!")
            
        except Exception as e:
            app.logger.error(f"❌ Redis 연결 실패: {e}")
            # Redis 연결 실패해도 앱은 계속 실행 (선택적)
            # self.redis_client = None
            raise
    
    def get_client(self):
        """Redis 클라이언트 반환"""
        return self.redis_client

# 전역 Redis 인스턴스
redis_config = RedisConfig()

def get_redis():
    return redis_config.get_client()