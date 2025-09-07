from flask import Blueprint, request, jsonify
from functools import wraps
from services.auth_service import AuthService
from services.transaction_service import TransactionService
import jwt
from flask import current_app

user_bp = Blueprint('user', __name__, url_prefix='/api/user')

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if token and token.startswith('Bearer '):
            token = token.split(' ')[1]
        
        if not token:
            return jsonify({'error': '토큰이 필요합니다'}), 401
        
        try:
            data = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
            current_user_id = data['user_id']
        except jwt.ExpiredSignatureError:
            return jsonify({'error': '토큰이 만료되었습니다'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': '유효하지 않은 토큰입니다'}), 401
        
        return f(current_user_id, *args, **kwargs)
    return decorated

@user_bp.route('/transaction', methods=['POST'])
@token_required
def create_transaction(current_user_id):
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
            user_id=current_user_id,
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
@token_required
def get_transactions(current_user_id):
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        if per_page > 100:  # 한 번에 너무 많은 데이터 요청 방지
            per_page = 100
        
        result = TransactionService.get_user_transactions(
            user_id=current_user_id,
            page=page,
            per_page=per_page
        )
        
        return jsonify(result), 200
        
    except Exception as e:
        current_app.logger.error(f"거래 내역 조회 실패: {str(e)}")
        return jsonify({'error': '거래 내역 조회 중 오류가 발생했습니다'}), 500