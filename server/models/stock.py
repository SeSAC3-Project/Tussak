from . import db
from datetime import datetime
from decimal import Decimal

class Stock(db.Model):
    __tablename__ = 'stocks'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    stock_code = db.Column(db.String(20), unique=True, nullable=False, index=True)
    stock_name = db.Column(db.String(100), nullable=False)
    market = db.Column(db.String(20), nullable=False)  # 코스피, 코스닥
    sector = db.Column(db.String(50))  # 산업군
    per = db.Column(db.DECIMAL(8, 2))
    pbr = db.Column(db.DECIMAL(8, 2))
    company_info = db.Column(db.Text)  # 기업개요

    updated_at = db.Column(db.TIMESTAMP, default=datetime.now())
    
    portfolios = db.relationship('Portfolio', backref='stock', lazy=True)
    transactions = db.relationship('Transaction', backref='stock', lazy=True)
    bookmarks = db.relationship('Bookmark', backref='stock', lazy=True)
    # realtime_data = db.relationship('StockRealtime', backref='stock', lazy=True)  # 나중에 추가
    