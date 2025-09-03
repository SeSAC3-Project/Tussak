import utils.stock_download as stock_dl
from utils.sector_crawler import SectorCodeConverter
from utils.kis_api import KisAPI
from utils.stock_company_info import ask_gpt_company_info
from models.stock import Stock
from models.stock_history import StockHistory
from models import db
from flask import current_app
from sqlalchemy.dialects.mysql import insert
from sqlalchemy import text, func, and_

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
                        existing_stock.company_info = StockService.__create_basic_company_info(stock_info)
                        existing_stock.updated_at = db.func.now()
                        # current_app.logger.debug(f"종목 업데이트: {stock_code} - {stock_name}")
                    else:
                        # 새로 추가
                        new_stock = Stock(
                            stock_code=stock_code,
                            stock_name=stock_name,
                            market=market,
                            # sector=sector,
                            company_info=StockService.__create_basic_company_info(stock_info),
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
    
    # 기본 정보로 기본 기업 개요 생성
    @staticmethod
    def __create_basic_company_info(stock_info):
        stock_name = stock_info.get('stock_name', '')
        stock_code = stock_info.get('stock_code', '')
        market = stock_info.get('market', '')
        
        # 시장별 설명
        market_desc = "코스피" if market == "KOSPI" else "코스닥" if market == "KOSDAQ" else market
        
        basic_info = f"""
    {stock_name}({stock_code})은(는) {market_desc}에 상장된 기업입니다.
    상세한 기업 개요는 추후 업데이트될 예정입니다.
    """
        return basic_info.strip()
    
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
                    if updated_count % 50 == 0:
                        db.session.commit()
                        current_app.logger.info(f"통합 업데이트 중간 커밋: {updated_count}개")
                    
                    time.sleep(0.06)  # API 제한 -> 60ms = 1초당 16건 정도
                    
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
            # 각 종목의 최신 StockHistory를 선택하기 위한 서브쿼리
            latest_history_subq = db.session.query(
                StockHistory.stock_id.label('stock_id'),
                func.max(StockHistory.updated_at).label('max_updated_at')
            ).group_by(StockHistory.stock_id).subquery()

            # Stock과 최신 StockHistory 조인하여 검색
            results = (
                db.session.query(
                    Stock.id,
                    Stock.stock_code,
                    Stock.stock_name,
                    Stock.market,
                    Stock.sector,
                    Stock.sector_detail,
                    Stock.company_info,
                    Stock.shares_outstanding,
                    Stock.updated_at,
                    StockHistory.current_price,
                    StockHistory.previous_close,
                    StockHistory.change_rate,
                    StockHistory.change_amount,
                    StockHistory.day_open,
                    StockHistory.day_high,
                    StockHistory.day_low,
                    StockHistory.daily_volume,
                    StockHistory.market_cap,
                    StockHistory.week52_high,
                    StockHistory.week52_low,
                    StockHistory.per,
                    StockHistory.pbr,
                    StockHistory.updated_at.label('history_updated_at')
                )
                .outerjoin(StockHistory, Stock.id == StockHistory.stock_id)
                .outerjoin(
                    latest_history_subq,
                    and_(
                        StockHistory.stock_id == latest_history_subq.c.stock_id,
                        StockHistory.updated_at == latest_history_subq.c.max_updated_at
                    )
                )
                .filter(Stock.stock_name.contains(keyword))
                .limit(100)
                .all()
            )
            
            # 결과를 딕셔너리 리스트로 변환
            return [
                {
                    'id': result.id,
                    'stock_code': result.stock_code,
                    'stock_name': result.stock_name,
                    'market': result.market,
                    'sector': result.sector,
                    'sector_detail': result.sector_detail,
                    'company_info': result.company_info,
                    'shares_outstanding': int(result.shares_outstanding) if result.shares_outstanding else None,
                    'updated_at': result.updated_at.isoformat() if result.updated_at else None,
                    'current_price': float(result.current_price) if result.current_price else None,
                    'previous_close': float(result.previous_close) if result.previous_close else None,
                    'change_rate': float(result.change_rate) if result.change_rate else None,
                    'change_amount': float(result.change_amount) if result.change_amount else None,
                    'day_open': float(result.day_open) if result.day_open else None,
                    'day_high': float(result.day_high) if result.day_high else None,
                    'day_low': float(result.day_low) if result.day_low else None,
                    'daily_volume': int(result.daily_volume) if result.daily_volume else None,
                    'market_cap': int(result.market_cap) if result.market_cap else None,
                    'week52_high': float(result.week52_high) if result.week52_high else None,
                    'week52_low': float(result.week52_low) if result.week52_low else None,
                    'per': float(result.per) if result.per else None,
                    'pbr': float(result.pbr) if result.pbr else None,
                    'history_updated_at': result.history_updated_at.isoformat() if result.history_updated_at else None
                }
                for result in results
            ]
        except Exception as e:
            current_app.logger.error(f"종목 검색 중 오류: {e}")
            raise e

    @staticmethod
    def get_stock_by_id(id):
        """ID로 단일 종목 조회"""
        try:
            # 각 종목의 최신 StockHistory를 선택하기 위한 서브쿼리
            latest_history_subq = db.session.query(
                StockHistory.stock_id.label('stock_id'),
                func.max(StockHistory.updated_at).label('max_updated_at')
            ).group_by(StockHistory.stock_id).subquery()

            # Stock과 최신 StockHistory 조회
            result = (
                db.session.query(
                    Stock.id,
                    Stock.stock_code,
                    Stock.stock_name,
                    Stock.market,
                    Stock.sector,
                    Stock.sector_detail,
                    Stock.company_info,
                    Stock.shares_outstanding,
                    Stock.updated_at,
                    StockHistory.current_price,
                    StockHistory.previous_close,
                    StockHistory.change_rate,
                    StockHistory.change_amount,
                    StockHistory.day_open,
                    StockHistory.day_high,
                    StockHistory.day_low,
                    StockHistory.daily_volume,
                    StockHistory.market_cap,
                    StockHistory.week52_high,
                    StockHistory.week52_low,
                    StockHistory.per,
                    StockHistory.pbr,
                    StockHistory.updated_at.label('history_updated_at')
                )
                .outerjoin(StockHistory, Stock.id == StockHistory.stock_id)
                .outerjoin(
                    latest_history_subq,
                    and_(
                        StockHistory.stock_id == latest_history_subq.c.stock_id,
                        StockHistory.updated_at == latest_history_subq.c.max_updated_at
                    )
                )
                .filter(Stock.id == id)
                .first()
            )
            
            if not result:
                return None

            company_info = ask_gpt_company_info(result.stock_code)

            if 'error' in company_info:
                company_info = result.company_info
            else:
                company_info = company_info.get('summary')
            
            return {
                'id': result.id,
                'stock_code': result.stock_code,
                'stock_name': result.stock_name,
                'market': result.market,
                'sector': result.sector,
                'sector_detail': result.sector_detail,
                'company_info': company_info,
                'shares_outstanding': int(result.shares_outstanding) if result.shares_outstanding else None,
                'updated_at': result.updated_at.isoformat() if result.updated_at else None,
                'current_price': float(result.current_price) if result.current_price else None,
                'previous_close': float(result.previous_close) if result.previous_close else None,
                'change_rate': float(result.change_rate) if result.change_rate else None,
                'change_amount': float(result.change_amount) if result.change_amount else None,
                'day_open': float(result.day_open) if result.day_open else None,
                'day_high': float(result.day_high) if result.day_high else None,
                'day_low': float(result.day_low) if result.day_low else None,
                'daily_volume': int(result.daily_volume) if result.daily_volume else None,
                'market_cap': int(result.market_cap) if result.market_cap else None,
                'week52_high': float(result.week52_high) if result.week52_high else None,
                'week52_low': float(result.week52_low) if result.week52_low else None,
                'per': float(result.per) if result.per else None,
                'pbr': float(result.pbr) if result.pbr else None,
                'history_updated_at': result.history_updated_at.isoformat() if result.history_updated_at else None
            }

        except Exception as e:
            current_app.logger.error(f"단일 종목 조회 중 오류: {e}")
            raise e

    @staticmethod
    def get_volume_ranking(limit=28):
        """거래대금 순위 조회 (캐시 우선, 없으면 DB에서 계산)"""
        try:
            # 2. 캐시가 없으면 DB에서 계산
            
            # 각 종목의 최신 StockHistory를 선택하기 위한 서브쿼리
            latest_history_subq = db.session.query(
                StockHistory.stock_id.label('stock_id'),
                func.max(StockHistory.updated_at).label('max_updated_at')
            ).group_by(StockHistory.stock_id).subquery()

            # 거래대금 = 현재가 × 거래량 (최신 이력 기준)
            ranking_query = (
                db.session.query(
                    Stock.stock_code,
                    Stock.stock_name,
                    Stock.market,
                    Stock.sector,
                    Stock.sector_detail,
                    Stock.company_info,
                    Stock.shares_outstanding,
                    StockHistory.current_price,
                    StockHistory.previous_close,
                    StockHistory.change_rate,
                    StockHistory.change_amount,
                    StockHistory.day_open,
                    StockHistory.day_high,
                    StockHistory.day_low,
                    StockHistory.daily_volume,
                    StockHistory.market_cap,
                    StockHistory.week52_high,
                    StockHistory.week52_low,
                    StockHistory.per,
                    StockHistory.pbr,
                    func.cast(
                        StockHistory.current_price * StockHistory.daily_volume,
                        db.BigInteger
                    ).label('trading_value')
                )
                # Stock.id와 StockHistory.stock_id 조인
                .join(StockHistory, Stock.id == StockHistory.stock_id)
                # 최신 이력만 선택
                .join(
                    latest_history_subq,
                    and_(
                        StockHistory.stock_id == latest_history_subq.c.stock_id,
                        StockHistory.updated_at == latest_history_subq.c.max_updated_at
                    )
                )
                .filter(
                    StockHistory.current_price.isnot(None),
                    StockHistory.daily_volume.isnot(None)
                )
                .order_by(
                    func.cast(
                        StockHistory.current_price * StockHistory.daily_volume,
                        db.BigInteger
                    ).desc()
                )
                .limit(limit)
            )
            
            results = []
            for row in ranking_query:
                results.append({
                    # Stock 정보
                    'stock_code': row.stock_code,
                    'stock_name': row.stock_name,
                    'market': row.market,
                    'sector': row.sector,
                    'sector_detail': row.sector_detail,
                    'company_info': row.company_info,
                    'shares_outstanding': int(row.shares_outstanding) if row.shares_outstanding else None,
                    
                    # StockHistory 정보
                    'current_price': float(row.current_price) if row.current_price else None,
                    'previous_close': float(row.previous_close) if row.previous_close else None,
                    'change_rate': float(row.change_rate) if row.change_rate else None,
                    'change_amount': float(row.change_amount) if row.change_amount else None,
                    'day_open': float(row.day_open) if row.day_open else None,
                    'day_high': float(row.day_high) if row.day_high else None,
                    'day_low': float(row.day_low) if row.day_low else None,
                    'daily_volume': int(row.daily_volume) if row.daily_volume else None,
                    'market_cap': int(row.market_cap) if row.market_cap else None,
                    'week52_high': float(row.week52_high) if row.week52_high else None,
                    'week52_low': float(row.week52_low) if row.week52_low else None,
                    'per': float(row.per) if row.per else None,
                    'pbr': float(row.pbr) if row.pbr else None,
                    'trading_value': int(row.trading_value) if getattr(row, 'trading_value', None) is not None else None
                })
            
            return results
            
        except Exception as e:
            current_app.logger.error(f"거래대금 순위 조회 실패: {e}")
            return []
