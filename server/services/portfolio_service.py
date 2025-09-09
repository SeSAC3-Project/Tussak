from models.portfolio import Portfolio
from models.user import User
from models import db
from flask import current_app
from decimal import Decimal
import traceback

class PortfolioService:
    @staticmethod
    def get_user_portfolio(user_id): # 보유주식명, 보유주식수, 평가금액, 등락금액, 등락율, 평균단가, 현재가
        try:
            # 사용자 조회
            user = User.query.get(user_id)
            if not user:
                raise ValueError("사용자를 찾을 수 없습니다")
            
            # 포트폴리오 조회 (수량이 0보다 큰 것만)
            portfolios = Portfolio.query.filter_by(user_id=user_id)\
                .filter(Portfolio.quantity > 0)\
                .all()
            
            portfolio_data = []
            total_investment = Decimal('0')  # 총 투자금액
            total_current_value = Decimal('0')  # 총 평가금액
            
            for portfolio in portfolios:
                # 현재가 조회 (임시로 평균단가 기준 ±5% 랜덤 설정)
                # 실제 환경에서는 실시간 주식 API에서 가져와야 함
                current_price = PortfolioService._get_current_price(portfolio.stock_code)
                
                # 계산
                investment_amount = portfolio.average_price * portfolio.quantity  # 투자금액
                current_value = current_price * portfolio.quantity  # 현재 평가금액
                profit_loss = current_value - investment_amount  # 손익금액
                profit_loss_rate = (profit_loss / investment_amount * 100) if investment_amount > 0 else 0  # 손익률
                
                portfolio_item = {
                    'stock_code': portfolio.stock_code,
                    'stock_name': portfolio.stock_name,
                    'quantity': portfolio.quantity,
                    'average_price': float(portfolio.average_price),
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
                    'total_asset': float(user.current_balance + total_current_value),
                    'portfolio_count': len(portfolio_data)
                },
                'portfolios': portfolio_data
            }
            
        except Exception as e:
            current_app.logger.error(f"포트폴리오 조회 실패: {str(e)}")
            current_app.logger.error(traceback.format_exc())
            raise e
    
    @staticmethod
    def _get_current_price(stock_code):
        # 임시로 주식별 고정 가격 설정 - 시간 주식 API 연동 필요
        mock_prices = {
            '005930': Decimal('75500'),   # 삼성전자
            '000660': Decimal('123000'),  # SK하이닉스  
            '005380': Decimal('182000'),  # 현대차
        }
        
        # 해당 주식코드의 가격이 있으면 반환, 없으면 기본값
        price = mock_prices.get(stock_code, Decimal('50000'))
        return price.quantize(Decimal('1'))  # 소수점 제거
    
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
