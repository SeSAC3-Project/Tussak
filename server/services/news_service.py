import requests
import os
from datetime import datetime, timedelta
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
            
            # 거래대금 상위 28개에서 해당 세부산업군에 속하는 주식들 조회
            from services.stock_service import StockService
            top_stocks = StockService.get_volume_ranking(28)
            
            # 해당 키워드(세부산업군)에 속하는 주식들 필터링
            matching_stocks = [
                stock for stock in top_stocks 
                if stock.get('sector_detail') and keyword in stock.get('sector_detail', '')
            ]
            
            news_data = []
            if not matching_stocks:
                # 키워드로 직접 검색 (백업 경로)
                # 부정 키워드로 노이즈 억제
                backup_query = (
                    f"{keyword} (주가 OR 실적 OR 공시 OR 증설 OR 투자 OR 컨퍼런스콜)"
                    f" -칼럼 -사설 -오피니언 -브리핑 -기고 -인터뷰"
                )
                current_app.logger.info(f"직접 검색: {backup_query}")
                news_data = NewsService.get_naver_news(backup_query, max(display, 20))
            else:
                # 해당 세부산업군의 상위 종목명들을 개별로 조회하여 합치기
                stock_names = [stock['stock_name'] for stock in matching_stocks[:5]]  # 상위 5개 종목까지 확대
                stock_codes = [stock['stock_code'] for stock in matching_stocks[:5] if stock.get('stock_code')]
                current_app.logger.info(f"종목 기반 개별 검색: {stock_names} / codes: {stock_codes}")
                
                # 회사별로 소량씩 가져와 병합 (최신순 유지)
                import math
                base_take = max(display, 20)
                per_company = max(1, math.ceil(base_take / max(len(stock_names), 1)))
                aggregated = []
                for idx, name in enumerate(stock_names):
                    code = stock_codes[idx] if idx < len(stock_codes) else None
                    # 회사명/티커 중심 쿼리 + 부정 키워드로 노이즈 억제
                    parts = [
                        f"{name}",
                        f"{name} 주가",
                        f"{name} 실적",
                        f"{name} 공시",
                    ]
                    if code:
                        parts.append(code)
                    positive = " OR ".join(parts)
                    negative = "-칼럼 -사설 -오피니언 -브리핑 -기고 -인터뷰"
                    query = f"({positive}) {negative}"
                    current_app.logger.info(f"회사별 검색: {query}")
                    items = NewsService.get_naver_news(query, per_company)
                    aggregated.extend(items or [])
                
                # 부족하면 종합 쿼리로 보충
                if len(aggregated) < display:
                    # 회사명+티커 통합 쿼리
                    combined_positive = " OR ".join(list(dict.fromkeys(stock_names + stock_codes))) if stock_codes else " OR ".join(stock_names)
                    combined_query = (
                        f"({combined_positive}) (주가 OR 실적 OR 공시) -칼럼 -사설 -오피니언 -브리핑 -기고 -인터뷰"
                    )
                    current_app.logger.info(f"보충 검색: {combined_query}")
                    extra = NewsService.get_naver_news(combined_query, max(display - len(aggregated), 10))
                    aggregated.extend(extra or [])

                # 너무 오래된 기사 제거 (최근 30일 이내)
                cutoff = datetime.now().date() - timedelta(days=30)
                filtered = []
                for item in aggregated:
                    try:
                        d = datetime.strptime(item.get('pub_date', ''), '%Y-%m-%d').date()
                        if d >= cutoff:
                            filtered.append(item)
                    except Exception:
                        # 날짜 파싱 실패 시 일단 포함
                        filtered.append(item)

                # 제목 기준 중복 제거(대소문자/공백 무시)
                seen = set()
                deduped = []
                for it in filtered:
                    t = (it.get('title') or '').strip().lower()
                    if not t or t in seen:
                        continue
                    seen.add(t)
                    deduped.append(it)

                # 종목명이 제목에 포함된 기사 우선 필터링
                candidate_list = deduped if deduped else filtered if filtered else aggregated
                try:
                    # 제목 정규화(소문자, 공백 제거)
                    def _norm(s: str) -> str:
                        return (s or '').lower().replace(' ', '')
                    name_tokens = [
                        _norm(n) for n in stock_names
                    ] + [
                        _norm(c) for c in stock_codes
                    ]
                    def title_has_name(item):
                        t = _norm(item.get('title') or '')
                        return any(tok and tok in t for tok in name_tokens)
                    name_matched = [it for it in candidate_list if title_has_name(it)]
                except Exception:
                    name_matched = []

                # 최신순으로 정렬하여 상위 display 개 제한
                try:
                    (name_matched if name_matched else candidate_list).sort(key=lambda x: x.get('pub_date', ''), reverse=True)
                except Exception:
                    pass
                # 사용자 요구: 종목명이 제목에 포함된 것만 반환 (없으면 빈 목록)
                news_data = name_matched[:display]

                # 폴백 1: 결과가 없으면 부정키워드 제거 + 회사명 OR 단순 검색
                if not news_data:
                    simple_query = " OR ".join(stock_names)
                    current_app.logger.info(f"폴백1 단순 검색: {simple_query}")
                    extra = NewsService.get_naver_news(simple_query, max(display, 20))
                    # 30일 필터만 재적용
                    try:
                        cutoff2 = datetime.now().date() - timedelta(days=30)
                        extra = [it for it in (extra or []) if datetime.strptime(it.get('pub_date',''), '%Y-%m-%d').date() >= cutoff2]
                    except Exception:
                        pass
                    news_data = (extra or [])[:display]

                # 폴백 2: 그래도 없으면 키워드 백업 검색(부정키워드 제거)로 채움
                if not news_data:
                    backup_simple = f"{keyword}"
                    current_app.logger.info(f"폴백2 키워드 단순 검색: {backup_simple}")
                    extra2 = NewsService.get_naver_news(backup_simple, max(display, 20))
                    news_data = (extra2 or [])[:display]
            
            # 1시간 캐싱
            if news_data:
                CacheService.set(cache_key, news_data, expire_hours=0.5)  # 30분 캐시
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