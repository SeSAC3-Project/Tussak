from . import db
from datetime import datetime
from decimal import Decimal
from utils.constants import USER_INITIAL_BALANCE

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    kakao_id = db.Column(db.String(50), unique=True, nullable=False, index=True)
    email = db.Column(db.String(100), unique=True, nullable=False)
    nickname = db.Column(db.String(50), nullable=False)
    profile_image_url = db.Column(db.Text)

    initial_balance = db.Column(db.DECIMAL(15, 2), default=USER_INITIAL_BALANCE)
    current_balance = db.Column(db.DECIMAL(15, 2), default=USER_INITIAL_BALANCE)
    total_asset = db.Column(db.DECIMAL(15, 2), default=USER_INITIAL_BALANCE)
    
    created_at = db.Column(db.TIMESTAMP, default=datetime.now())
    updated_at = db.Column(db.TIMESTAMP, default=datetime.now())
    
    portfolios = db.relationship('Portfolio', backref='user', lazy=True, cascade='all, delete-orphan')
    transactions = db.relationship('Transaction', backref='user', lazy=True, cascade='all, delete-orphan')
    bookmarks = db.relationship('Bookmark', backref='user', lazy=True, cascade='all, delete-orphan')
    
    # 수익금액, 수익률