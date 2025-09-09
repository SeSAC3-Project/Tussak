from models.portfolio import Portfolio
from models.user import User
from models.stock import Stock
from models.transaction import Transaction
from models import db
from flask import current_app
from decimal import Decimal
import traceback
from services.websocket_service import get_websocket_service

class PortfolioService:
    @staticmethod
    def get_user_portfolio(user_id): # 보유주식명, 보유주식수, 평가금액, 등락금액, 등락율, 평균단가, 현재가
        try:
            # 사용자 조회
            user = User.query.get(user_id)
            if not user:
                raise ValueError("사용자를 찾을 수 없습니다")
            
            # 포트폴리오 조회 (수량이 0보다 큰 것만) - Stock 테이블과 JOIN
            portfolios = db.session.query(Portfolio, Stock)\
                .join(Stock, Portfolio.stock_code == Stock.stock_code)\
                .filter(Portfolio.user_id == user_id)\
                .filter(Portfolio.quantity > 0)\
                .all()
            
            portfolio_data = []
            total_investment = Decimal('0')  # 총 투자금액
            total_current_value = Decimal('0')  # 총 평가금액
            
            for portfolio, stock in portfolios:
                # 평균단가 계산 (거래 내역에서 계산)
                average_price = PortfolioService._calculate_average_price(portfolio.user_id, portfolio.stock_code)
                
                # 현재가 조회 (임시로 평균단가 기준 ±5% 랜덤 설정)
                # 실제 환경에서는 실시간 주식 API에서 가져와야 함
                current_price = PortfolioService._get_current_price(portfolio.stock_code)
                
                # 계산
                investment_amount = average_price * portfolio.quantity  # 투자금액
                current_value = current_price * portfolio.quantity  # 현재 평가금액
                profit_loss = current_value - investment_amount  # 손익금액
                profit_loss_rate = (profit_loss / investment_amount * 100) if investment_amount > 0 else 0  # 손익률
                
                portfolio_item = {
                    'stock_code': portfolio.stock_code,
                    'stock_name': stock.stock_name,  # Stock 테이블에서 가져오기
                    'quantity': portfolio.quantity,
                    'average_price': float(average_price),
                    'current_price': float(current_price),
                    'investment_amount': float(investment_amount),
                    'current_value': float(current_value),
                    'profit_loss': float(profit_loss),
                    'profit_loss_rate': float(profit_loss_rate)
                }
                
                portfolio_data.append(portfolio_item)
                total_investment += investment_amount
                total_current_value += current_value
            
            # 전체 손익 계산
            total_profit_loss = total_current_value - total_investment
            total_profit_loss_rate = (total_profit_loss / total_investment * 100) if total_investment > 0 else 0
            
            return {
                'user_info': {
                    'user_id': user.id,
                    'nickname': user.nickname,
                    'current_balance': float(user.current_balance)
                },
                'portfolio_summary': {
                    'total_investment': float(total_investment),
                    'total_current_value': float(total_current_value),
                    'total_profit_loss': float(total_profit_loss),
                    'total_profit_loss_rate': float(total_profit_loss_rate),
                    'portfolio_count': len(portfolio_data)
                },
                'portfolios': portfolio_data
            }
            
        except Exception as e:
            current_app.logger.error(f"포트폴리오 조회 실패: {str(e)}")
            current_app.logger.error(traceback.format_exc())
            raise e
    
    @staticmethod
    def _calculate_average_price(user_id, stock_code):
        """사용자의 특정 주식에 대한 평균단가를 계산 (매도 고려한 가중평균)"""
        try:
            # 해당 주식의 모든 거래들을 시간순으로 조회
            transactions = Transaction.query.filter_by(
                user_id=user_id, 
                stock_code=stock_code
            ).order_by(Transaction.created_at.asc()).all()
            
            if not transactions:
                return Decimal('0')
            
            total_cost = Decimal('0')
            total_quantity = 0
            
            # 거래 내역을 순차적으로 처리하여 평균단가 계산
            for transaction in transactions:
                if transaction.type == 'BUY':
                    # 매수: 비용과 수량 추가
                    total_cost += transaction.total_amount
                    total_quantity += transaction.quantity
                elif transaction.type == 'SELL':
                    # 매도: 평균단가 기준으로 비용 차감
                    if total_quantity > 0:
                        avg_price = total_cost / total_quantity
                        sold_cost = avg_price * transaction.quantity
                        total_cost -= sold_cost
                        total_quantity -= transaction.quantity
            
            if total_quantity <= 0:
                return Decimal('0')
            
            average_price = total_cost / total_quantity
            return average_price.quantize(Decimal('0.01'))  # 소수점 2자리까지
            
        except Exception as e:
            current_app.logger.error(f"평균단가 계산 실패: {str(e)}")
            return Decimal('50000')  # 기본값
    
    @staticmethod
    def _get_current_price(stock_code):
        """실시간 주식 가격 조회"""
        try:
            # WebSocket 서비스에서 실시간 가격 조회
            websocket_service = get_websocket_service(current_app._get_current_object())
            realtime_data = websocket_service.get_realtime_price(stock_code)
            
            if realtime_data and 'current_price' in realtime_data:
                current_price = Decimal(str(realtime_data['current_price']))
                current_app.logger.info(f"실시간 가격 조회 성공: {stock_code} = {current_price}")
                return current_price.quantize(Decimal('1'))
            else:
                current_app.logger.warning(f"실시간 데이터 없음: {stock_code}, 기본값 사용")
                
        except Exception as e:
            current_app.logger.warning(f"실시간 가격 조회 실패: {stock_code}, 오류: {str(e)}")
        
        # 실시간 데이터가 없을 경우 임시 가격 사용
        mock_prices = {
            '005930': Decimal('75500'),   # 삼성전자
            '000660': Decimal('123000'),  # SK하이닉스  
            '005380': Decimal('182000'),  # 현대차
        }
        
        price = mock_prices.get(stock_code, Decimal('50000'))
        current_app.logger.info(f"기본 가격 사용: {stock_code} = {price}")
        return price.quantize(Decimal('1'))
    
    @staticmethod
    def get_portfolio_summary(user_id):
        try:
            result = PortfolioService.get_user_portfolio(user_id)
            return {
                'user_info': result['user_info'],
                'portfolio_summary': result['portfolio_summary']
            }
        except Exception as e:
            current_app.logger.error(f"포트폴리오 요약 조회 실패: {str(e)}")
            raise e
