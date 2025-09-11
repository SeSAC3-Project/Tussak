import json
from config.redis import get_redis

class CacheService:
    # 캐시 데이터 조회
    @staticmethod
    def get(key):
        try:
            client = get_redis()
            if not client:
                return None
                
            cached_data = client.get(key)
            if cached_data:
                return json.loads(cached_data)
            return None
        except Exception as e:
            print(f"캐시 조회 오류 [{key}]: {e}")
            return None
    
    # 데이터 캐시(저장)
    @staticmethod
    def set(key, data, expire_hours=1):
        try:
            client = get_redis()
            if not client:
                return False
                
            # 시간을 초로 변환
            expire_seconds = int(expire_hours * 3600)
            client.setex(
                key,
                expire_seconds,
                json.dumps(data, ensure_ascii=False)
            )
            return True
        except Exception as e:
            print(f"캐시 저장 오류 [{key}]: {e}")
            return False
    
    # 초 단위 TTL 데이터 캐시(저장)
    @staticmethod
    def set_with_ttl(key, data, expire_seconds):
        try:
            client = get_redis()
            if not client:
                return False
                
            client.setex(
                key,
                expire_seconds,
                json.dumps(data, ensure_ascii=False)
            )
            return True
        except Exception as e:
            print(f"캐시 저장 오류 [{key}]: {e}")
            return False
    
    # 캐시 삭제
    @staticmethod
    def delete(key):
        try:
            client = get_redis()
            if not client:
                return False
                
            client.delete(key)
            return True
        except Exception as e:
            print(f"캐시 삭제 오류 [{key}]: {e}")
            return False
    
    # 패턴에 매칭되는 모든 키 삭제
    @staticmethod
    def delete_pattern(pattern):
        try:
            client = get_redis()
            if not client:
                return False
                
            keys = client.keys(pattern)
            if keys:
                client.delete(*keys)
            return True
        except Exception as e:
            print(f"패턴 캐시 삭제 오류 [{pattern}]: {e}")
            return False
    
    # 키 존재 여부 확인
    @staticmethod
    def exists(key):
        try:
            client = get_redis()
            if not client:
                return False
                
            return client.exists(key) > 0
        except Exception as e:
            print(f"캐시 존재 확인 오류 [{key}]: {e}")
            return False
    
    # 키의 남은 TTL 조회 (초 단위)
    @staticmethod
    def get_ttl(key):
        try:
            client = get_redis()
            if not client:
                return -1
                
            return client.ttl(key)
        except Exception as e:
            print(f"TTL 조회 오류 [{key}]: {e}")
            return -1