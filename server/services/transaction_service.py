from models.transaction import Transaction
from models.user import User
from models.portfolio import Portfolio
from models import db
from datetime import datetime
from decimal import Decimal
from flask import current_app
import traceback

class TransactionService:
    @staticmethod
    def create_transaction(user_id, stock_code, stock_name, transaction_type, quantity, price):
        try:
            total_amount = Decimal(str(quantity)) * Decimal(str(price))
            
            # 사용자 조회
            user = User.query.get(user_id)
            if not user:
                raise ValueError("사용자를 찾을 수 없습니다")
            
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
                    # 기존 보유 주식이 있는 경우 평균 단가 계산
                    total_existing_amount = portfolio.quantity * portfolio.average_price
                    new_total_amount = total_existing_amount + total_amount
                    new_total_quantity = portfolio.quantity + quantity
                    portfolio.average_price = new_total_amount / new_total_quantity
                    portfolio.quantity = new_total_quantity
                else:
                    # 새로운 주식 추가
                    portfolio = Portfolio(
                        user_id=user_id,
                        stock_code=stock_code,
                        stock_name=stock_name,
                        quantity=quantity,
                        average_price=Decimal(str(price))
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
                stock_name=stock_name,
                type=transaction_type,
                quantity=quantity,
                price=Decimal(str(price)),
                total_amount=total_amount,
                created_at=datetime.now()
            )
            
            db.session.add(transaction)
            db.session.commit()
            
            current_app.logger.info(f"거래 완료: {transaction_type} {stock_name} {quantity}주 @ {price}원")
            
            return {
                'transaction_id': transaction.id,
                'user_id': user_id,
                'stock_code': stock_code,
                'stock_name': stock_name,
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
            transactions = Transaction.query.filter_by(user_id=user_id)\
                .order_by(Transaction.created_at.desc())\
                .paginate(page=page, per_page=per_page, error_out=False)
            
            return {
                'transactions': [{
                    'id': t.id,
                    'stock_code': t.stock_code,
                    'stock_name': t.stock_name,
                    'type': t.type,
                    'quantity': t.quantity,
                    'price': float(t.price),
                    'total_amount': float(t.total_amount),
                    'created_at': t.created_at.isoformat()
                } for t in transactions.items],
                'total': transactions.total,
                'pages': transactions.pages,
                'current_page': transactions.page,
                'per_page': transactions.per_page
            }
            
        except Exception as e:
            current_app.logger.error(f"거래 내역 조회 실패: {str(e)}")
            raise e