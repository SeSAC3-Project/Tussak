from collections import Counter
from models.stock_history import StockHistory
from services.cache_service import CacheService

class KeywordService:
    # 거래대금순 상위 30개 주식의 세부산업군 빈도수 기반
    @staticmethod
    def get_keywords():
        try:
            cached_keywords = CacheService.get('keywords')
            if cached_keywords:
                return cached_keywords
            
            # 거래대금순 종목 호출 작업 완료 후 수정
            top_stocks = StockHistory.all()
            
            if not top_stocks:
                return []
            
            sector_counter = Counter()
            for stock_data in top_stocks:
                sector = stock_data.sector
                if sector:
                    sector_counter[sector] += 1
            
            keywords = []
            for sector, frequency in sector_counter.most_common(10):
                keywords.append({
                    'keyword': sector,
                    'frequency': frequency
                })
            
            CacheService.set('keywords', keywords, expire_hours=1)
            
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
