from models.user import User
from models import db
from sqlalchemy import desc
from flask import current_app

class RankingService:
    @staticmethod
    def get_investment_ranking(limit=30):
        """
        투자 수익금 기준 랭킹 조회
        profit_amount(총 등락금액)을 기준으로 상위 사용자들을 반환 (최대 30위)
        """
        try:
            # 최대 30위로 제한
            limit = min(limit, 30)
            
            # ranking 컬럼 기준으로 정렬하여 상위 사용자 조회
            users = User.query.filter(User.ranking.isnot(None)).order_by(User.ranking).limit(limit).all()
            
            ranking_data = []
            for user in users:
                # 수익률 계산 (total_asset - initial_balance) / initial_balance * 100
                profit_amount = float(user.total_asset - user.initial_balance)
                profit_rate = (profit_amount / float(user.initial_balance)) * 100 if user.initial_balance > 0 else 0
                
                ranking_data.append({
                    'rank': user.ranking,
                    'user_id': user.id,
                    'nickname': user.nickname,
                    'profile_image_url': user.profile_image_url,
                    'total_asset': float(user.total_asset),
                    'initial_balance': float(user.initial_balance),
                    'current_balance': float(user.current_balance),
                    'profit_amount': profit_amount,
                    'profit_rate': round(profit_rate, 2)
                })
            
            return {
                'success': True,
                'data': ranking_data,
                'total_count': len(ranking_data)
            }
            
        except Exception as e:
            return {
                'success': False,
                'message': f'랭킹 조회 중 오류가 발생했습니다: {str(e)}'
            }
    
    @staticmethod
    def get_user_rank(user_id):
        """
        특정 사용자의 투자 랭킹 조회
        """
        try:
            # 해당 사용자 조회
            user = User.query.get(user_id)
            if not user:
                return {
                    'success': False,
                    'message': '사용자를 찾을 수 없습니다.'
                }
            
            # ranking이 None인 경우 (아직 계산되지 않음)
            if user.ranking is None:
                return {
                    'success': False,
                    'message': '랭킹이 아직 계산되지 않았습니다.'
                }
            
            # 수익률 계산
            profit_amount = float(user.total_asset - user.initial_balance)
            profit_rate = (profit_amount / float(user.initial_balance)) * 100 if user.initial_balance > 0 else 0
            
            return {
                'success': True,
                'data': {
                    'rank': user.ranking,
                    'user_id': user.id,
                    'nickname': user.nickname,
                    'profile_image_url': user.profile_image_url,
                    'total_asset': float(user.total_asset),
                    'initial_balance': float(user.initial_balance),
                    'current_balance': float(user.current_balance),
                    'profit_amount': profit_amount,
                    'profit_rate': round(profit_rate, 2)
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'message': f'내 랭킹 조회 중 오류가 발생했습니다: {str(e)}'
            }
    
    @staticmethod
    def calculate_and_update_rankings():
        """
        모든 사용자의 랭킹을 계산하고 업데이트
        총 등락금액(profit_amount = total_asset - initial_balance) 기준으로 랭킹 계산
        스케줄러에서 호출되는 메서드
        """
        try:
            current_app.logger.info("랭킹 계산 시작...")
            
            # 모든 사용자를 조회하고 profit_amount를 계산하여 정렬
            users = User.query.all()
            
            # 각 사용자의 profit_amount 계산 후 정렬
            users_with_profit = []
            for user in users:
                profit_amount = float(user.total_asset - user.initial_balance)
                users_with_profit.append((user, profit_amount))
            
            # profit_amount 기준으로 내림차순 정렬 (수익이 높은 순)
            users_with_profit.sort(key=lambda x: x[1], reverse=True)
            
            # 각 사용자에게 순위 부여
            for rank, (user, profit_amount) in enumerate(users_with_profit, 1):
                user.ranking = rank
                current_app.logger.debug(f"사용자 {user.nickname}: 순위 {rank}, 등락금액 {profit_amount:,.0f}원")
            
            # 데이터베이스에 저장
            db.session.commit()
            
            current_app.logger.info(f"랭킹 계산 완료: {len(users)}명")
            return {
                'success': True,
                'message': f'{len(users)}명의 랭킹이 업데이트되었습니다.'
            }
            
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"랭킹 계산 중 오류: {e}")
            return {
                'success': False,
                'message': f'랭킹 계산 중 오류가 발생했습니다: {str(e)}'
            }
