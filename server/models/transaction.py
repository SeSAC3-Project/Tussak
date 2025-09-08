from . import db
from datetime import datetime
from decimal import Decimal

class Transaction(db.Model):
    __tablename__ = 'transactions'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    stock_code = db.Column(db.String(20), db.ForeignKey('stocks.stock_code', onupdate='CASCADE'), nullable=False)
    type = db.Column(db.Enum('BUY', 'SELL', name='transaction_type_enum'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.DECIMAL(10, 2), nullable=False)
    total_amount = db.Column(db.DECIMAL(15, 2), nullable=False)
    created_at = db.Column(db.TIMESTAMP, default=datetime.now())