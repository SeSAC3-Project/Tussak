import utils.stock_download as stock_dl
from utils.sector_crawler import SectorCodeConverter
from utils.kis_api import KisAPI
from models.stock import Stock
from models.stock_history import StockHistory
from models import db
from flask import current_app
from sqlalchemy.dialects.mysql import insert
from sqlalchemy import text

from datetime import datetime, date
import time

class StockService:

    @staticmethod
    def all_stocks():
        """전체 종목 동기화 (DB 저장)"""
        try:
            current_app.logger.info("주식 종목 동기화 시작")
            
            # 1. 파일에서 종목 정보 가져오기
            all_stocks = stock_dl.get_all_domestic_stocks()
            
            if not all_stocks:
                current_app.logger.warning("조회된 종목이 없습니다")
                return False
            
            # 2. DB에 저장
            success_count = StockService._save_stocks_basic_info_to_db(all_stocks)
            
            # 3. 업종명 자동 동기화
            # current_app.logger.info("업종 정보 자동 동기화 시작...")
            # sector_count = StockService._auto_sync_sectors()
            
            # current_app.logger.info(f"주식 종목 동기화 완료: {success_count}개 처리, {sector_count}개 업종 업데이트")
            # return True
            
        except Exception as e:
            current_app.logger.error(f"주식 종목 동기화 실패: {e}")
            db.session.rollback()
            raise e

    @staticmethod
    def _save_stocks_basic_info_to_db(stocks_data):
        """종목 데이터를 DB에 저장 (개별 UPSERT)"""
        try:
            success_count = 0
            
            for stock_info in stocks_data:
                stock_code = stock_info.get('stock_code', '').strip()
                stock_name = stock_info.get('stock_name', '').strip()
                market = stock_info.get('market', '').strip()
                # sector = stock_info.get('sector', '').strip() or None
                
                # 유효한 데이터만 처리
                if not stock_code or not stock_name:
                    continue
                
                try:
                    # 기존 종목 확인
                    existing_stock = Stock.query.filter_by(stock_code=stock_code).first()
                    
                    if existing_stock:
                        # 업데이트
                        existing_stock.stock_name = stock_name
                        existing_stock.market = market
                        # existing_stock.sector = sector
                        existing_stock.updated_at = db.func.now()
                        # current_app.logger.debug(f"종목 업데이트: {stock_code} - {stock_name}")
                    else:
                        # 새로 추가
                        new_stock = Stock(
                            stock_code=stock_code,
                            stock_name=stock_name,
                            market=market,
                            # sector=sector,
                            updated_at=db.func.now()
                        )
                        db.session.add(new_stock)
                        # current_app.logger.debug(f"종목 추가: {stock_code} - {stock_name}")
                    
                    success_count += 1
                    
                    # 100개마다 중간 커밋
                    if success_count % 100 == 0:
                        db.session.commit()
                        current_app.logger.info(f"중간 커밋: {success_count}개 처리")
                        
                except Exception as e:
                    current_app.logger.warning(f"종목 처리 실패: {stock_code} - {e}")
                    continue
            
            # 최종 커밋
            db.session.commit()
            current_app.logger.info(f"배치 저장 완료: {success_count}개")
            return success_count
            
        except Exception as e:
            current_app.logger.error(f"DB 저장 중 오류: {e}")
            db.session.rollback()
            raise e
    
    # 주식 기본정보(발행주식수)와 히스토리를 한 번에 업데이트
    @staticmethod
    def update_stock_info_and_history():
        try:
            current_app.logger.info("주식 정보 및 히스토리 통합 업데이트 시작")

            kis_api = KisAPI()
            
            stocks = Stock.query.all()
            updated_count = 0
            failed_count = 0
            today = datetime.now().date()
            
            for stock in stocks:
                try:
                    # 한 번의 API 호출로 모든 데이터 가져오기
                    stock_data = kis_api.fetch_stock_basic_info_and_history_from_kis(stock.stock_code)
                    
                    if stock_data:
                        # 1. Stock 기본정보 업데이트
                        if stock_data.get('shares_outstanding'):
                            stock.shares_outstanding = stock_data.get('shares_outstanding')
                            stock.sector = stock_data.get('sector')
                            stock.sector_detail = stock_data.get('sector_detail')
                            stock.updated_at = db.func.now()
                        
                        # 2. StockHistory 저장/업데이트
                        existing_history = StockHistory.query.filter(
                            StockHistory.stock_id == stock.id,
                            db.func.date(StockHistory.updated_at) == today
                        ).first()
                        
                        if existing_history:
                            StockService._update_stock_history(existing_history, stock_data)
                        else:
                            new_history = StockService._create_stock_history(stock.id, stock_data)
                            db.session.add(new_history)
                        
                        updated_count += 1
                        # current_app.logger.debug(f"통합 업데이트 완료: {stock.stock_code}")
                        
                    else:
                        failed_count += 1
                    
                    # 100개마다 중간 커밋
                    if updated_count % 100 == 0:
                        db.session.commit()
                        current_app.logger.info(f"통합 업데이트 중간 커밋: {updated_count}개")
                    
                    time.sleep(0.1)  # API 제한
                    
                except Exception as e:
                    failed_count += 1
                    current_app.logger.warning(f"종목 {stock.stock_code} 통합 업데이트 실패: {e}")
                    continue
            
            db.session.commit()
            current_app.logger.info(f"통합 업데이트 완료: {updated_count}개 성공, {failed_count}개 실패")
            return updated_count
            
        except Exception as e:
            current_app.logger.error(f"통합 업데이트 실패: {e}")
            db.session.rollback()
            raise e
    
    @staticmethod
    def _create_stock_history(stock_id, stock_data):
        """StockHistory 객체 생성"""
        return StockHistory(
            stock_id=stock_id,
            current_price=stock_data.get('current_price'),
            previous_close=stock_data.get('previous_close'),
            change_rate=stock_data.get('change_rate'),
            change_amount=stock_data.get('change_amount'),
            day_open=stock_data.get('day_open'),
            day_high=stock_data.get('day_high'),
            day_low=stock_data.get('day_low'),
            daily_volume=stock_data.get('daily_volume'),
            market_cap=stock_data.get('market_cap'),
            week52_high=stock_data.get('week52_high'),
            week52_low=stock_data.get('week52_low'),
            per=stock_data.get('per'),
            pbr=stock_data.get('pbr'),
            updated_at=datetime.now()
        )

    @staticmethod
    def _update_stock_history(history, stock_data):
        """기존 StockHistory 업데이트"""
        history.current_price = stock_data.get('current_price')
        history.previous_close = stock_data.get('previous_close')
        history.change_rate = stock_data.get('change_rate')
        history.change_amount = stock_data.get('change_amount')
        history.day_open = stock_data.get('day_open')
        history.day_high = stock_data.get('day_high')
        history.day_low = stock_data.get('day_low')
        history.daily_volume = stock_data.get('daily_volume')
        history.market_cap = stock_data.get('market_cap')
        history.week52_high = stock_data.get('week52_high')
        history.week52_low = stock_data.get('week52_low')
        history.per = stock_data.get('per')
        history.pbr = stock_data.get('pbr')
        history.updated_at = datetime.now()

    @staticmethod
    def get_all_stocks():
        """DB에서 모든 종목 조회"""
        try:
            stocks = Stock.query.all()
            return [
                {
                    'id': stock.id,
                    'stock_code': stock.stock_code,
                    'stock_name': stock.stock_name,
                    'market': stock.market,
                    'sector': stock.sector,
                    'sector_detail': stock.sector_detail,
                    'company_info': stock.company_info,
                    'shares_outstanding': stock.shares_outstanding,
                    'updated_at': stock.updated_at.isoformat() if stock.updated_at else None
                }
                for stock in stocks
            ]
        except Exception as e:
            current_app.logger.error(f"종목 조회 중 오류: {e}")
            raise e

    @staticmethod
    def search_stocks(keyword):
        """종목명으로 검색"""
        try:
            stocks = Stock.query.filter(
                Stock.stock_name.contains(keyword)
            ).limit(50).all()
            
            return [
                {
                    'id': stock.id,
                    'stock_code': stock.stock_code,
                    'stock_name': stock.stock_name,
                    'market': stock.market,
                    'sector': stock.sector,
                    'sector_detail': stock.sector_detail,
                    'company_info': stock.company_info,
                    'shares_outstanding': stock.shares_outstanding,
                    'updated_at': stock.updated_at.isoformat() if stock.updated_at else None
                }
                for stock in stocks
            ]
        except Exception as e:
            current_app.logger.error(f"종목 검색 중 오류: {e}")
            raise e

    @staticmethod
    def get_stock_by_id(id):
        """ID로 단일 종목 조회"""
        try:
            stock = Stock.query.filter_by(id=id).first()
            
            if not stock:
                return None
            
            return {
                'id': stock.id,
                'stock_code': stock.stock_code,
                'stock_name': stock.stock_name,
                'market': stock.market,
                'sector': stock.sector,
                'sector_detail': stock.sector_detail,
                'company_info': stock.company_info,
                'shares_outstanding': stock.shares_outstanding,
                'updated_at': stock.updated_at.isoformat() if stock.updated_at else None
            }

        except Exception as e:
            current_app.logger.error(f"단일 종목 조회 중 오류: {e}")
            raise e

    # @staticmethod
    # def _auto_sync_sectors():
    #     """주식 데이터 저장 시 자동으로 업종 정보 동기화"""
    #     try:
            
    #         converter = SectorCodeConverter()
    #         result = converter.convert_all_sectors()
            
    #         if result['total_stocks'] == 0:
    #             current_app.logger.warning("업종 변환 결과가 없습니다")
    #             return 0
            
    #         # DB 업데이트
    #         updated_count = StockService._update_sectors_in_db(result['stocks_data'])
            
    #         current_app.logger.info(f"업종 자동 동기화 완료: {updated_count}개 종목 업데이트")
    #         return updated_count
            
    #     except Exception as e:
    #         current_app.logger.error(f"업종 자동 동기화 실패: {e}")
    #         return 0

    # @staticmethod
    # def _update_sectors_in_db(stocks_data):
    #     """크롤링한 업종 데이터로 DB 업데이트"""
    #     try:
    #         updated_count = 0
            
    #         for stock_info in stocks_data:
    #             stock_code = stock_info.get('stock_code', '').strip()
    #             sector_name = stock_info.get('sector_name', '').strip()
                
    #             if not stock_code or not sector_name:
    #                 continue
                
    #             # DB에서 해당 종목 찾기
    #             existing_stock = Stock.query.filter_by(stock_code=stock_code).first()
                
    #             if existing_stock:
    #                 # 업종명 업데이트 (기존 sector 필드 활용)
    #                 existing_stock.sector = sector_name
    #                 existing_stock.updated_at = db.func.now()
    #                 updated_count += 1
                    
    #                 # current_app.logger.debug(f"업종 업데이트: {stock_code} → {sector_name}")
            
    #         db.session.commit()
    #         current_app.logger.info(f"DB 업종 업데이트 완료: {updated_count}개 종목")
            
    #         return updated_count
            
    #     except Exception as e:
    #         db.session.rollback()
    #         current_app.logger.error(f"DB 업종 업데이트 실패: {e}")
    #         raise e

    @staticmethod
    def get_volume_ranking(limit=28):
        """거래대금 순위 조회 (캐시 우선, 없으면 DB에서 계산)"""
        try:
            # 2. 캐시가 없으면 DB에서 계산
            from models.stock_history import StockHistory
            from models.stock import Stock
            from sqlalchemy import func
            
            # 거래대금 = 현재가 × 거래량
            ranking_query = db.session.query(
                Stock.stock_code,
                Stock.stock_name,
                Stock.market,
                StockHistory.current_price,
                StockHistory.change_rate,
                StockHistory.change_amount,
                StockHistory.daily_volume,
                func.cast(StockHistory.current_price * StockHistory.daily_volume, db.BigInteger).label('trade_amount')
            ).join(
                StockHistory, Stock.stock_code == StockHistory.stock_id
            ).filter(
                StockHistory.current_price.isnot(None),
                StockHistory.daily_volume.isnot(None)
            ).order_by(
                func.cast(StockHistory.current_price * StockHistory.daily_volume, db.BigInteger).desc()
            ).limit(limit)
            
            results = []
            for row in ranking_query:
                results.append({
                    'stock_code': row.stock_code,
                    'stock_name': row.stock_name,
                    'market': row.market,
                    'current_price': float(row.current_price) if row.current_price else None,
                    'change_rate': float(row.change_rate) if row.change_rate else None,
                    'change_amount': float(row.change_amount) if row.change_amount else None,
                    'daily_volume': int(row.daily_volume) if row.daily_volume else None,
                    'trade_amount': int(row.trade_amount) if row.trade_amount else None
                })
            
            return results
            
        except Exception as e:
            current_app.logger.error(f"거래대금 순위 조회 실패: {e}")
            return []

    # @staticmethod
    # def get_volume_ranking(limit=28):
    #     """거래대금 순위 조회 (캐시 우선, 없으면 KIS API 호출)"""
    #     try:
    #         # 1. 캐시에서 먼저 확인
    #         # from services.cache_service import CacheService
    #         cached_data = None # CacheService.get_volume_ranking()
            
    #         if cached_data:
    #             return cached_data[:limit]
            
    #         # 2. 캐시가 없으면 KIS API에서 조회
    #         return StockService.update_volume_ranking()[:limit]
            
    #     except Exception as e:
    #         current_app.logger.error(f"거래대금 순위 조회 실패: {e}")
    #         return []
    
    # @staticmethod
    # def update_volume_ranking():
    #     """거래대금 순위 데이터 수집 및 캐싱"""
    #     try:
    #         from utils.kis_api import KisAPI
    #         from services.cache_service import CacheService
            
    #         kis_api = KisAPI()
            
    #         # �� 1단계: 거래대금 순위 상위 종목들 조회
    #         ranking_data = kis_api.fetch_volume_ranking(limit=30)
            
    #         if ranking_data:
    #             # CacheService.set_volume_ranking(ranking_data, expire_hours=0.1)
    #             current_app.logger.info(f"거래대금 순위 업데이트 완료: {len(ranking_data)}개")
    #             return ranking_data  # 🆕 데이터 반환
            
    #         return []
            
    #     except Exception as e:
    #         current_app.logger.error(f"거래대금 순위 업데이트 실패: {e}")
    #         return []
