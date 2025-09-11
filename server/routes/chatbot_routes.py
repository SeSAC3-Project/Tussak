from flask import Blueprint, request, jsonify, current_app
from services.chatbot_service import ChatbotService

chatbot_bp = Blueprint('chatbot', __name__, url_prefix='/api/chatbot')

# 요청 -> json 형식으로 받음
# 요청 ex) {"question" : "코스닥과 코스피가 뭐야?"}
# 응답 ex) {"response": "코스닥과 코스피는 한국의 주식 시장을 나타내는 지수입니다.\n\n- **코스피**: 한국거래소에 상장된 대형 기업들의 주식이 거래되는 시장으로, 한국의 대표적인 주식 시장입니다. 주로 대기업들이 포함되어 있습니다.\n\n- **코스닥**: 주로 중소기업과 벤처기업의 주식이 거래되는 시장입니다. 기술 기반의 기업들이 많아 성장 가능성이 큰 기업들이 포함되어 있습니다."}
@chatbot_bp.route('/', methods=['POST'])
def chatbot_response():
    current_app.logger.debug('함수 진입')
    user_request = request.get_json()['question']
    current_app.logger.debug(f'사용자 질문 : {user_request}')

    response = ChatbotService.ask_chatbot(user_request)

    return jsonify({'response' : f'{response}'})
