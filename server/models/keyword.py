from . import db
from datetime import datetime

class Keyword(db.Model):
    __tablename__ = 'keywords'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    word = db.Column(db.String(50), nullable=False)
    frequency = db.Column(db.Integer, default=1)
    category = db.Column(db.String(20), default='sector')
    created_at = db.Column(db.TIMESTAMP, default=datetime.now())
    updated_at = db.Column(db.TIMESTAMP, default=datetime.now(), onupdate=datetime.now())
    
    news = db.relationship("News", backref='keyword', lazy=True)