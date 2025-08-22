from flask import Flask
import os

from models import db
from models.user import User
from models.stock import Stock
from models.portfolio import Portfolio
from models.transaction import Transaction
from models.bookmark import Bookmark

from routes.auth_routes import auth_bp
from routes.chatbot_routes import chatbot_bp
from routes.news_routes import news_bp
from routes.user_routes import user_bp
from routes.ranking_routes import ranking_bp
from routes.stock_routes import stock_bp
from server.routes.user_routes import user_bp

def create_app(): 
    app = Flask(__name__)

    init_db(app)
    register_blueprints(app)

    return app

def init_db(app):
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db.init_app(app)
    
    with app.app_context():
        db.create_all()

def register_blueprints(app):
    app.register_blueprint(auth_bp)
    app.register_blueprint(chatbot_bp)
    app.register_blueprint(news_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(ranking_bp)
    app.register_blueprint(stock_bp)

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)