from . import db
from datetime import datetime

class Keyword(db.Model):
    __tablename__ = 'keywords'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    word = db.Column(db.String(50), nullable=False)
    
    news = db.relationship("News", backref='keyword', lazy=True)