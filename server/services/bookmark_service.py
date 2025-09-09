from models.bookmark import Bookmark
from models.stock import Stock
from models.user import User
from models import db
from flask import current_app
from sqlalchemy.exc import IntegrityError
from sqlalchemy import and_

class BookmarkService:
    
    @staticmethod
    def add_bookmark(user_id, stock_code):
        """
        사용자의 즐겨찾기 목록에 주식 추가
        
        Args:
            user_id (int): 사용자 ID
            stock_code (str): 주식 코드
            
        Returns:
            dict: 결과 메시지와 상태
        """
        try:
            # 사용자 존재 확인
            user = User.query.get(user_id)
            if not user:
                return {
                    'success': False,
                    'message': '사용자를 찾을 수 없습니다.',
                    'code': 'USER_NOT_FOUND'
                }
            
            # 주식 존재 확인
            stock = Stock.query.filter_by(stock_code=stock_code).first()
            if not stock:
                return {
                    'success': False,
                    'message': '주식을 찾을 수 없습니다.',
                    'code': 'STOCK_NOT_FOUND'
                }
            
            # 이미 즐겨찾기에 등록되어 있는지 확인
            existing_bookmark = Bookmark.query.filter(
                and_(Bookmark.user_id == user_id, Bookmark.stock_code == stock_code)
            ).first()
            
            if existing_bookmark:
                return {
                    'success': False,
                    'message': '이미 즐겨찾기에 등록된 주식입니다.',
                    'code': 'ALREADY_BOOKMARKED'
                }
            
            # 사용자의 현재 즐겨찾기 개수 확인 (최대 4개 제한)
            current_bookmark_count = Bookmark.query.filter_by(user_id=user_id).count()
            if current_bookmark_count >= 4:
                return {
                    'success': False,
                    'message': '관심종목은 최대 4개까지 등록할 수 있습니다.',
                    'code': 'BOOKMARK_LIMIT_EXCEEDED'
                }
            
            # 즐겨찾기 추가
            bookmark = Bookmark(
                user_id=user_id,
                stock_code=stock_code
            )
            
            db.session.add(bookmark)
            db.session.commit()
            
            current_app.logger.info(f"즐겨찾기 추가 성공: 사용자 {user_id}, 주식 {stock_code}")
            
            return {
                'success': True,
                'message': '즐겨찾기에 추가되었습니다.',
                'data': {
                    'bookmark_id': bookmark.id,
                    'user_id': user_id,
                    'stock_code': stock_code,
                    'created_at': bookmark.created_at.isoformat()
                }
            }
            
        except IntegrityError as e:
            db.session.rollback()
            current_app.logger.error(f"즐겨찾기 추가 중 무결성 오류: {e}")
            return {
                'success': False,
                'message': '데이터 무결성 오류가 발생했습니다.',
                'code': 'INTEGRITY_ERROR'
            }
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"즐겨찾기 추가 중 오류: {e}")
            return {
                'success': False,
                'message': '즐겨찾기 추가 중 오류가 발생했습니다.',
                'code': 'INTERNAL_ERROR'
            }
    
    @staticmethod
    def remove_bookmark(user_id, stock_code):
        """
        사용자의 즐겨찾기 목록에서 주식 제거
        
        Args:
            user_id (int): 사용자 ID
            stock_code (str): 주식 코드
            
        Returns:
            dict: 결과 메시지와 상태
        """
        try:
            # 즐겨찾기 찾기
            bookmark = Bookmark.query.filter(
                and_(Bookmark.user_id == user_id, Bookmark.stock_code == stock_code)
            ).first()
            
            if not bookmark:
                return {
                    'success': False,
                    'message': '즐겨찾기에 등록되지 않은 주식입니다.',
                    'code': 'BOOKMARK_NOT_FOUND'
                }
            
            # 즐겨찾기 삭제
            db.session.delete(bookmark)
            db.session.commit()
            
            current_app.logger.info(f"즐겨찾기 삭제 성공: 사용자 {user_id}, 주식 {stock_code}")
            
            return {
                'success': True,
                'message': '즐겨찾기에서 제거되었습니다.',
                'data': {
                    'user_id': user_id,
                    'stock_code': stock_code
                }
            }
            
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"즐겨찾기 삭제 중 오류: {e}")
            return {
                'success': False,
                'message': '즐겨찾기 삭제 중 오류가 발생했습니다.',
                'code': 'INTERNAL_ERROR'
            }
    
    @staticmethod
    def get_user_bookmarks(user_id):
        """
        사용자의 즐겨찾기 목록 조회 (생성일자 순으로 정렬)
        
        Args:
            user_id (int): 사용자 ID
            
        Returns:
            dict: 결과 메시지와 즐겨찾기 목록
        """
        try:
            # 사용자 존재 확인
            user = User.query.get(user_id)
            if not user:
                return {
                    'success': False,
                    'message': '사용자를 찾을 수 없습니다.',
                    'code': 'USER_NOT_FOUND'
                }
            
            # 즐겨찾기 목록 조회 (생성일자 순으로 정렬)
            bookmarks = db.session.query(Bookmark, Stock).join(
                Stock, Bookmark.stock_code == Stock.stock_code
            ).filter(
                Bookmark.user_id == user_id
            ).order_by(Bookmark.created_at.desc()).all()
            
            bookmark_list = []
            for bookmark, stock in bookmarks:
                bookmark_list.append({
                    'bookmark_id': bookmark.id,
                    'stock_code': stock.stock_code,
                    'stock_name': stock.stock_name,
                    'market': stock.market,
                    'sector': stock.sector,
                    'sector_detail': stock.sector_detail,
                    'created_at': bookmark.created_at.isoformat()
                })
            
            current_app.logger.info(f"즐겨찾기 목록 조회 성공: 사용자 {user_id}, {len(bookmark_list)}개 항목")
            
            return {
                'success': True,
                'message': f'즐겨찾기 목록을 조회했습니다. ({len(bookmark_list)}개 항목)',
                'data': {
                    'bookmarks': bookmark_list,
                    'total_count': len(bookmark_list)
                }
            }
            
        except Exception as e:
            current_app.logger.error(f"즐겨찾기 목록 조회 중 오류: {e}")
            return {
                'success': False,
                'message': '즐겨찾기 목록 조회 중 오류가 발생했습니다.',
                'code': 'INTERNAL_ERROR'
            }
    
    @staticmethod
    def is_bookmarked(user_id, stock_code):
        """
        특정 주식이 사용자의 즐겨찾기에 등록되어 있는지 확인
        
        Args:
            user_id (int): 사용자 ID
            stock_code (str): 주식 코드
            
        Returns:
            dict: 결과 메시지와 즐겨찾기 상태
        """
        try:
            bookmark = Bookmark.query.filter(
                and_(Bookmark.user_id == user_id, Bookmark.stock_code == stock_code)
            ).first()
            
            is_bookmarked = bookmark is not None
            
            return {
                'success': True,
                'message': '즐겨찾기 상태를 확인했습니다.',
                'data': {
                    'is_bookmarked': is_bookmarked,
                    'bookmark_id': bookmark.id if bookmark else None
                }
            }
            
        except Exception as e:
            current_app.logger.error(f"즐겨찾기 상태 확인 중 오류: {e}")
            return {
                'success': False,
                'message': '즐겨찾기 상태 확인 중 오류가 발생했습니다.',
                'code': 'INTERNAL_ERROR'
            }
