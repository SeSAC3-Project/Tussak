from models.transaction import Transaction
from models.user import User
from models.portfolio import Portfolio
from models.stock import Stock
from models import db
from datetime import datetime
from decimal import Decimal
from flask import current_app
import traceback

class TransactionService:
    @staticmethod
    def create_transaction(user_id, stock_code, transaction_type, quantity, price):
        try:
            total_amount = Decimal(str(quantity)) * Decimal(str(price))
            
            # 사용자 조회
            user = User.query.get(user_id)
            if not user:
                raise ValueError("사용자를 찾을 수 없습니다")
                
            # 주식 정보 조회
            stock = Stock.query.filter_by(stock_code=stock_code).first()
            if not stock:
                raise ValueError("주식 정보를 찾을 수 없습니다")
            
            if transaction_type == 'BUY':
                # 매수: 잔고 확인
                if user.current_balance < total_amount:
                    raise ValueError("잔고가 부족합니다")
                
                # 잔고 차감
                user.current_balance -= total_amount
                
                # 포트폴리오 업데이트 (보유 주식 추가)
                portfolio = Portfolio.query.filter_by(
                    user_id=user_id, 
                    stock_code=stock_code
                ).first()
                
                if portfolio:
                    # 기존 보유 주식 수량만 증가 (평균단가는 포트폴리오 서비스에서 계산)
                    portfolio.quantity = portfolio.quantity + quantity
                else:
                    # 새로운 주식 보유 기록 추가 (수량만 저장)
                    portfolio = Portfolio(
                        user_id=user_id,
                        stock_code=stock_code,
                        quantity=quantity
                    )
                    db.session.add(portfolio)
            
            elif transaction_type == 'SELL':
                # 매도: 보유 주식 확인
                portfolio = Portfolio.query.filter_by(
                    user_id=user_id, 
                    stock_code=stock_code
                ).first()
                
                if not portfolio or portfolio.quantity < quantity:
                    raise ValueError("보유 주식이 부족합니다")
                
                # 보유 주식 차감
                portfolio.quantity -= quantity
                if portfolio.quantity == 0:
                    db.session.delete(portfolio)
                
                # 잔고 증가
                user.current_balance += total_amount
            
            # 거래 내역 생성
            transaction = Transaction(
                user_id=user_id,
                stock_code=stock_code,
                type=transaction_type,
                quantity=quantity,
                price=Decimal(str(price)),
                total_amount=total_amount
            )
            
            db.session.add(transaction)
            db.session.commit()
            
            current_app.logger.info(f"거래 완료: {transaction_type} {stock.stock_name} {quantity}주 @ {price}원")
            
            return {
                'transaction_id': transaction.id,
                'user_id': user_id,
                'stock_code': stock_code,
                'stock_name': stock.stock_name,
                'type': transaction_type,
                'quantity': quantity,
                'price': float(price),
                'total_amount': float(total_amount),
                'created_at': transaction.created_at.isoformat(),
                'updated_balance': float(user.current_balance)
            }
            
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"거래 처리 실패: {str(e)}")
            current_app.logger.error(traceback.format_exc())
            raise e
    
    @staticmethod
    def get_user_transactions(user_id, page=1, per_page=10):
        try:
            # Stock 테이블과 JOIN하여 stock_name을 가져옴
            transactions = db.session.query(Transaction, Stock)\
                .join(Stock, Transaction.stock_code == Stock.stock_code)\
                .filter(Transaction.user_id == user_id)\
                .order_by(Transaction.created_at.desc())\
                .paginate(page=page, per_page=per_page, error_out=False)
            
            return {
                'transactions': [{
                    'id': t.id,
                    'stock_code': t.stock_code,
                    'stock_name': s.stock_name,  # Stock 테이블에서 가져온 stock_name
                    'type': t.type,
                    'quantity': t.quantity,
                    'price': float(t.price),
                    'total_amount': float(t.total_amount),
                    'created_at': t.created_at.isoformat()
                } for t, s in transactions.items],
                'total': transactions.total,
                'pages': transactions.pages,
                'current_page': transactions.page,
                'per_page': transactions.per_page
            }
            
        except Exception as e:
            current_app.logger.error(f"거래 내역 조회 실패: {str(e)}")
            raise e