import requests
import os
from datetime import datetime
from flask import current_app
from services.cache_service import CacheService
from models.stock import Stock

class NewsService:
    # 네이버 뉴스 API
    @staticmethod
    def get_naver_news(query, display=5):
        try:
            client_id = os.getenv('NAVER_CLIENT_ID')
            client_secret = os.getenv('NAVER_CLIENT_SECRET')
            
            if not client_id or not client_secret:
                current_app.logger.error("네이버 API 키가 설정되지 않았습니다")
                return []
            
            url = "https://openapi.naver.com/v1/search/news.json"
            headers = {
                'X-Naver-Client-Id': client_id,
                'X-Naver-Client-Secret': client_secret
            }
            
            params = {
                'query': query,
                'display': display,
                'start': 1,
                'sort': 'date'  # 최신순
            }
            
            response = requests.get(url, headers=headers, params=params)
            
            if response.status_code == 200:
                data = response.json()
                return NewsService._format_news_data(data.get('items', []))
            else:
                current_app.logger.error(f"네이버 뉴스 API 호출 실패: {response.status_code}")
                return []
                
        except Exception as e:
            current_app.logger.error(f"뉴스 조회 중 오류: {e}")
            return []
    
    @staticmethod
    def _format_news_data(news_items):
        formatted_news = []
        
        for item in news_items:
            try:
                title = NewsService._remove_html_tags(item.get('title', ''))
                
                pub_date = item.get('pubDate', '')
                formatted_date, time_ago = NewsService._parse_date(pub_date)
                
                formatted_news.append({
                    'title': title,
                    'pub_date': formatted_date,
                    'time_ago': time_ago,
                })
                
            except Exception as e:
                current_app.logger.warning(f"뉴스 아이템 처리 중 오류: {e}")
                continue
        
        return formatted_news
    
    @staticmethod
    def _remove_html_tags(text):
        import re
        clean = re.compile('<.*?>')
        return re.sub(clean, '', text)
    
    @staticmethod
    def _parse_date(pub_date_str):
        try:
            # RFC 2822 형식: "Wed, 01 Jan 2025 12:00:00 +0900"
            from email.utils import parsedate_to_datetime
            
            pub_date = parsedate_to_datetime(pub_date_str)
            now = datetime.now(pub_date.tzinfo)
            
            formatted_date = pub_date.strftime('%Y-%m-%d')
            
            time_diff = now - pub_date
            
            if time_diff.days > 0:
                time_ago = f"{time_diff.days}일 전"
            elif time_diff.seconds >= 3600:
                hours = time_diff.seconds // 3600
                time_ago = f"{hours}시간 전"
            elif time_diff.seconds >= 60:
                minutes = time_diff.seconds // 60
                time_ago = f"{minutes}분 전"
            else:
                time_ago = "방금 전"
                
            return formatted_date, time_ago
            
        except Exception as e:
            current_app.logger.warning(f"날짜 파싱 오류: {e}")
            return datetime.now().strftime('%Y-%m-%d'), "알 수 없음"
    
    # 키워드 기반 뉴스 조회 및 캐싱
    @staticmethod
    def get_keyword_news(keyword, display=5):
        try:
            cache_key = f"news_{keyword}_{display}"
            
            cached_news = CacheService.get(cache_key)
            if cached_news:
                current_app.logger.info(f"캐시된 뉴스: {keyword}")
                return cached_news
            
            # 해당 키워드(섹터)의 주요 주식들 조회 - 수정 필요
            stocks = Stock.query.filter(Stock.sector.like(f'%{keyword}%')).limit(10).all()
            
            if not stocks:
                # 키워드로 직접 검색
                search_query = f"{keyword} 주식"
            else:
                # 종목명들로 검색 쿼리 생성
                stock_names = [stock.stock_name for stock in stocks[:3]]  # 상위 3개 종목
                search_query = f"{keyword} " + " OR ".join(stock_names)
            
            news_data = NewsService.get_naver_news(search_query, display)
            
            # 1시간 캐싱
            if news_data:
                CacheService.set(cache_key, news_data, expire_hours=1)
                current_app.logger.info(f"새 뉴스 조회 완료: {keyword}, {len(news_data)}개")
            
            return news_data
            
        except Exception as e:
            current_app.logger.error(f"키워드 뉴스 조회 실패: {e}")
            return []
    
    # 뉴스 데이터 갱신
    @staticmethod
    def refresh_keyword_news(keyword, display=5):
        try:
            cache_key = f"news_{keyword}_{display}"
            CacheService.delete(cache_key)
            return NewsService.get_keyword_news(keyword, display)
        except Exception as e:
            current_app.logger.error(f"뉴스 갱신 실패: {e}")
            return []
    
    # 기본 뉴스(키워드 선택 전)
    @staticmethod
    def get_default_news():
        try:
            cache_key = "default_news"
            cached_news = CacheService.get(cache_key)
            
            if cached_news:
                return cached_news
            
            # 기본 검색어
            search_queries = ["주식 시장", "증권", "투자"]
            all_news = []
            
            for query in search_queries:
                news = NewsService.get_naver_news(query, 2)
                all_news.extend(news)
                
                if len(all_news) >= 5:
                    break
            
            # 5개, 최신순
            all_news = all_news[:5]
            
            # 1시간 캐싱
            CacheService.set(cache_key, all_news, expire_hours=1)
            
            return all_news
            
        except Exception as e:
            current_app.logger.error(f"기본 뉴스 조회 실패: {e}")
            return []