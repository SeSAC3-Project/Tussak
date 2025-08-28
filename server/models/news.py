from . import db
from datetime import datetime
from decimal import Decimal

class News(db.Model):
    __tablename__ = 'news'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    keyword_id = db.Column(db.Integer, db.ForeignKey('keywords.id', ondelete='CASCADE'), nullable=False)
    headline = db.Column(db.String(500), nullable=False)
    source = db.Column(db.String(100))
    published_at = db.Column(db.TIMESTAMP)
    created_at = db.Column(db.TIMESTAMP, default=datetime.now())