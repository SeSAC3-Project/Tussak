import logging
import os
from logging.handlers import RotatingFileHandler
from datetime import datetime

def setup_logging(app):
    
    # logs 디렉토리 생성
    if not os.path.exists('logs'):
        os.mkdir('logs')
    
    # 로그 포매터 설정
    formatter = logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    )
    
    # 개발 환경 설정
    if app.debug:
        # 콘솔 핸들러 (개발 시 터미널에 출력)
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.DEBUG)
        console_handler.setFormatter(logging.Formatter(
            '%(asctime)s - %(levelname)s - %(message)s'
        ))
        app.logger.addHandler(console_handler)
        app.logger.setLevel(logging.DEBUG)
        
    else:
        # 프로덕션 환경 설정
        # 파일 핸들러 (로그를 파일에 저장)
        file_handler = RotatingFileHandler(
            'logs/tussak.log',
            maxBytes=10240000,  # 10MB
            backupCount=10,
            encoding='utf-8'
        )
        file_handler.setFormatter(formatter)
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)
        
        # 에러 로그 별도 파일
        error_handler = RotatingFileHandler(
            'logs/tussak_error.log',
            maxBytes=10240000,
            backupCount=5,
            encoding='utf-8'
        )
        error_handler.setFormatter(formatter)
        error_handler.setLevel(logging.ERROR)
        app.logger.addHandler(error_handler)
        
        app.logger.setLevel(logging.INFO)
    
    # 시작 로그
    app.logger.info('Tussak 애플리케이션 시작')
    
    return app
