import os
from dotenv import load_dotenv

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.prompts import SystemMessagePromptTemplate, HumanMessagePromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableLambda

load_dotenv()

API_KEY = os.getenv("OPENAI_API_KEY")

class ChatbotService:

    # 템플릿 정의
    system_template = '''
    당신은 주식을 처음 접하는 사람도 이해하기 쉽도록 주식 용어를 설명해주는 주식 전문가 입니다.
    사용자가 물어보는 주식 용어에 대해 처음 접하는 사람도 이해하기 쉽게 답변해주세요.
    답변은 주식 용어에 대한 설명만 하고, 추가적인 설명은 하지 마세요.
    '''

    user_template = '{user_request}'

    prompt = ChatPromptTemplate.from_messages([
        SystemMessagePromptTemplate.from_template(system_template),
        HumanMessagePromptTemplate.from_template(user_template)
    ])

    # 모델 정의
    llm = ChatOpenAI(
        model='gpt-4o-mini',
        temperature=0.5,
        api_key=API_KEY
    )

    # 파서 생성
    parser = StrOutputParser()

    # 체인 생성
    chain = prompt | llm | parser

    # 챗봇 질문 요청
    @staticmethod
    def ask_chatbot(user_request):
        response = ChatbotService.chain.invoke(user_request)
        return response
