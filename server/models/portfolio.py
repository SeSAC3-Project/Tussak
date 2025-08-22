from . import db
from datetime import datetime
from decimal import Decimal

class Portfolio(db.Model):
    __tablename__ = 'portfolios'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    stock_code = db.Column(db.String(20), db.ForeignKey('stocks.stock_code', onupdate='CASCADE'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.TIMESTAMP, default=datetime.now())
    updated_at = db.Column(db.TIMESTAMP, default=datetime.now(), onupdate=datetime.now())
    
    transactions = db.relationship('Transaction', backref='portfolio', lazy=True)

    # 종목명, 평균단가, 현재가, 평가금액, 평가수익률