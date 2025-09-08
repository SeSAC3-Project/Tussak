from flask import Blueprint, request, jsonify
from services.auth_service import AuthService
from services.transaction_service import TransactionService
from services.portfolio_service import PortfolioService
from routes.auth_routes import jwt_required
from flask import current_app

user_bp = Blueprint('user', __name__, url_prefix='/api/user')

@user_bp.route('/transaction', methods=['POST'])
@jwt_required
def create_transaction(current_user):
    try:
        data = request.get_json()
        
        # 필수 파라미터 검증
        required_fields = ['stock_code', 'stock_name', 'type', 'quantity', 'price']
        if not all(field in data for field in required_fields):
            return jsonify({'error': '필수 파라미터가 누락되었습니다'}), 400
        
        # 거래 타입 검증
        if data['type'] not in ['BUY', 'SELL']:
            return jsonify({'error': '유효하지 않은 거래 타입입니다'}), 400
        
        # 수량과 가격이 양수인지 검증
        if data['quantity'] <= 0 or data['price'] <= 0:
            return jsonify({'error': '수량과 가격은 0보다 커야 합니다'}), 400
        
        # 거래 처리
        result = TransactionService.create_transaction(
            user_id=current_user.id,
            stock_code=data['stock_code'],
            stock_name=data['stock_name'],
            transaction_type=data['type'],
            quantity=data['quantity'],
            price=data['price']
        )
        
        return jsonify({
            'message': '거래가 성공적으로 처리되었습니다',
            'transaction': result
        }), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        current_app.logger.error(f"거래 생성 실패: {str(e)}")
        return jsonify({'error': '거래 처리 중 오류가 발생했습니다'}), 500

@user_bp.route('/transactions', methods=['GET'])
@jwt_required
def get_transactions(current_user):
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        if per_page > 100:  # 한 번에 너무 많은 데이터 요청 방지
            per_page = 100
        
        result = TransactionService.get_user_transactions(
            user_id=current_user.id,
            page=page,
            per_page=per_page
        )
        
        return jsonify(result), 200
        
    except Exception as e:
        current_app.logger.error(f"거래 내역 조회 실패: {str(e)}")
        return jsonify({'error': '거래 내역 조회 중 오류가 발생했습니다'}), 500

@user_bp.route('/portfolio', methods=['GET'])
@jwt_required
def get_portfolio(current_user):
    try:
        result = PortfolioService.get_user_portfolio(current_user.id)
        return jsonify(result), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        current_app.logger.error(f"포트폴리오 조회 실패: {str(e)}")
        return jsonify({'error': '포트폴리오 조회 중 오류가 발생했습니다'}), 500

@user_bp.route('/portfolio/summary', methods=['GET'])
@jwt_required
def get_portfolio_summary(current_user):
    try:
        result = PortfolioService.get_portfolio_summary(current_user.id)
        return jsonify(result), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        current_app.logger.error(f"포트폴리오 요약 조회 실패: {str(e)}")
        return jsonify({'error': '포트폴리오 요약 조회 중 오류가 발생했습니다'}), 500