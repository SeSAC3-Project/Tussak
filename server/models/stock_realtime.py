from . import db
from datetime import datetime
from decimal import Decimal

class StockRealtime(db.Model):
    __tablename__ = 'stock_realtimes'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    stock_id = db.Column(db.Integer, db.ForeignKey('stocks.id', ondelete='CASCADE'), nullable=False)

    current_price = db.Column(db.DECIMAL(10, 2))   # 현재가
    previous_close = db.Column(db.DECIMAL(10, 2))  # 전일종가
    change_rate = db.Column(db.DECIMAL(5, 2))      # 등락률
    change_amount = db.Column(db.DECIMAL(10, 2))   # 등락금액
    
    day_open = db.Column(db.DECIMAL(10, 2))   # 당일 시가
    day_high = db.Column(db.DECIMAL(10, 2))   # 당일 고가  
    day_low = db.Column(db.DECIMAL(10, 2))    # 당일 저가
    
    daily_volume = db.Column(db.BigInteger)        # 일거래량
    shares_outstanding = db.Column(db.BigInteger)  # 발행주식수
    market_cap = db.Column(db.BigInteger)          # 시가총액
    
    week52_high = db.Column(db.DECIMAL(10, 2))  
    week52_low = db.Column(db.DECIMAL(10, 2))
    
    updated_at = db.Column(db.TIMESTAMP, default=datetime.now())
    
    stock = db.relationship('Stock', backref='realtime_data', lazy=True)
    