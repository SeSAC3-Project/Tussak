from collections import Counter
from models.stock_history import StockHistory
from services.cache_service import CacheService

class KeywordService:
    # 거래대금순 상위 28개 주식의 세부산업군 빈도수 기반
    @staticmethod
    def get_keywords():
        try:
            cached_keywords = CacheService.get('keywords')
            if cached_keywords:
                return cached_keywords
            
            # 거래대금순 상위 28개 종목 조회
            from services.stock_service import StockService
            top_stocks = StockService.get_volume_ranking(28)
            
            if not top_stocks:
                return []
            
            # 세부산업군(sector_detail) 빈도수 계산
            sector_counter = Counter()
            for stock_data in top_stocks:
                sector_detail = stock_data.get('sector_detail')
                if sector_detail and sector_detail.strip():
                    sector_counter[sector_detail] += 1
            
            # 상위 10개 세부산업군을 키워드로 생성
            keywords = []
            for sector_detail, frequency in sector_counter.most_common(10):
                keywords.append({
                    'keyword': sector_detail,
                    'frequency': frequency
                })
            
            # 24시간 캐싱 (매일 한 번 업데이트)
            CacheService.set('keywords', keywords, expire_hours=24)
            
            return keywords
            
        except Exception as e:
            print(f"키워드 조회 오류: {e}")
            return []
    
    @staticmethod
    def refresh_keywords():
        try:
            CacheService.delete('keywords')
            return KeywordService.get_keywords()
        except Exception as e:
            print(f"키워드 갱신 오류: {e}")
            return []
