import utils.stock_download as stock_dl
from utils.sector_crawler import SectorCodeConverter
from models.stock import Stock
from models import db
from flask import current_app
from sqlalchemy.dialects.mysql import insert
from sqlalchemy import text

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
            success_count = StockService._save_stocks_to_db(all_stocks)
            
            # 3. 업종명 자동 동기화
            current_app.logger.info("업종 정보 자동 동기화 시작...")
            sector_count = StockService._auto_sync_sectors()
            
            current_app.logger.info(f"주식 종목 동기화 완료: {success_count}개 처리, {sector_count}개 업종 업데이트")
            return True
            
        except Exception as e:
            current_app.logger.error(f"주식 종목 동기화 실패: {e}")
            db.session.rollback()
            raise e

    @staticmethod
    def _save_stocks_to_db(stocks_data):
        """종목 데이터를 DB에 저장 (개별 UPSERT)"""
        try:
            success_count = 0
            
            for stock_info in stocks_data:
                stock_code = stock_info.get('stock_code', '').strip()
                stock_name = stock_info.get('stock_name', '').strip()
                market = stock_info.get('market', '').strip()
                sector = stock_info.get('sector', '').strip() or None
                
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
                        existing_stock.sector = sector
                        existing_stock.updated_at = db.func.now()
                        # current_app.logger.debug(f"종목 업데이트: {stock_code} - {stock_name}")
                    else:
                        # 새로 추가
                        new_stock = Stock(
                            stock_code=stock_code,
                            stock_name=stock_name,
                            market=market,
                            sector=sector,
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
                    'sector': stock.sector
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
                'per': float(stock.per) if stock.per else None,
                'pbr': float(stock.pbr) if stock.pbr else None,
                'company_info': stock.company_info,
                'updated_at': stock.updated_at.isoformat() if stock.updated_at else None
            }

        except Exception as e:
            current_app.logger.error(f"단일 종목 조회 중 오류: {e}")
            raise e

    @staticmethod
    def _auto_sync_sectors():
        """주식 데이터 저장 시 자동으로 업종 정보 동기화"""
        try:
            
            converter = SectorCodeConverter()
            result = converter.convert_all_sectors()
            
            if result['total_stocks'] == 0:
                current_app.logger.warning("업종 변환 결과가 없습니다")
                return 0
            
            # DB 업데이트
            updated_count = StockService._update_sectors_in_db(result['stocks_data'])
            
            current_app.logger.info(f"업종 자동 동기화 완료: {updated_count}개 종목 업데이트")
            return updated_count
            
        except Exception as e:
            current_app.logger.error(f"업종 자동 동기화 실패: {e}")
            return 0

    @staticmethod
    def _update_sectors_in_db(stocks_data):
        """크롤링한 업종 데이터로 DB 업데이트"""
        try:
            updated_count = 0
            
            for stock_info in stocks_data:
                stock_code = stock_info.get('stock_code', '').strip()
                sector_name = stock_info.get('sector_name', '').strip()
                
                if not stock_code or not sector_name:
                    continue
                
                # DB에서 해당 종목 찾기
                existing_stock = Stock.query.filter_by(stock_code=stock_code).first()
                
                if existing_stock:
                    # 업종명 업데이트 (기존 sector 필드 활용)
                    existing_stock.sector = sector_name
                    existing_stock.updated_at = db.func.now()
                    updated_count += 1
                    
                    # current_app.logger.debug(f"업종 업데이트: {stock_code} → {sector_name}")
            
            db.session.commit()
            current_app.logger.info(f"DB 업종 업데이트 완료: {updated_count}개 종목")
            
            return updated_count
            
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"DB 업종 업데이트 실패: {e}")
            raise e


