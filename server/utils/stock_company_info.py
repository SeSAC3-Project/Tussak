from dotenv import load_dotenv
import requests
import os
import zipfile
import io
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup, XMLParsedAsHTMLWarning
import warnings
import re

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.prompts import SystemMessagePromptTemplate, HumanMessagePromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableLambda

from flask import current_app

load_dotenv()

DART_CLIENT_ID=os.getenv("DART_API_KEY")
GPT_API_KEY = os.getenv("OPENAI_API_KEY")

def get_company_info(stock_code):

    """반기보고서에서 사업의 개요 추출"""

    # 1단계: 기업 고유번호 조회
    corp_code_url = "https://opendart.fss.or.kr/api/corpCode.xml"
    response = requests.get(corp_code_url, params={'crtfc_key': DART_CLIENT_ID})
    
    zip_file = zipfile.ZipFile(io.BytesIO(response.content))
    xml_data = zip_file.read('CORPCODE.xml').decode('utf-8')
    root = ET.fromstring(xml_data)
    
    corp_code = None
    corp_name = None
    for item in root.findall('.//list'):
        if item.find('stock_code') is not None and item.find('stock_code').text == stock_code:
            corp_code = item.find('corp_code').text
            corp_name = item.find('corp_name').text
            break
    
    if not corp_code:
        return {"error": f"종목코드 {stock_code}를 찾을 수 없습니다."}
    
    # current_app.logger.info(f"기업: {corp_name} ({corp_code})")
    
    # 2단계: 반기보고서 접수번호 조회
    list_url = "https://opendart.fss.or.kr/api/list.json"
    params = {
        'crtfc_key': DART_CLIENT_ID,
        'corp_code': corp_code,
        'bgn_de': '20230101',  # 2023년부터
        'pblntf_ty': 'A',      # 정기공시
        'page_count': 10
    }
    
    response = requests.get(list_url, params=params)
    data = response.json()
    
    if data['status'] != '000' or 'list' not in data:
        return {"error": "반기보고서를 찾을 수 없습니다."}
    
    # 반기보고서 접수번호 찾기 (가장 최근)
    rcept_no = None
    report_nm = None
    for report in data['list']:
        if '반기보고서' in report.get('report_nm', ''):
            rcept_no = report['rcept_no']
            report_nm = report['report_nm']
            break
    
    if not rcept_no:
        return {"error": "반기보고서를 찾을 수 없습니다."}
    
    # current_app.logger.info(f"반기보고서 발견: {report_nm} (접수번호: {rcept_no})")
    
    # 3단계: 반기보고서 ZIP 파일 다운로드 및 압축해제
    doc_url = "https://opendart.fss.or.kr/api/document.xml"
    params = {
        'crtfc_key': DART_CLIENT_ID,
        'rcept_no': rcept_no
    }
    
    response = requests.get(doc_url, params=params)
    # current_app.logger.info(f"응답 상태: {response.status_code}")
    
    # ZIP 파일 처리
    if response.content[:2] == b'PK':
        try:
            zip_file = zipfile.ZipFile(io.BytesIO(response.content))
            file_list = zip_file.namelist()
            
            # 첫 번째 XML 파일 읽기
            xml_filename = file_list[0]
            xml_content = zip_file.read(xml_filename).decode('utf-8')
            
        except Exception as e:
            current_app.logger.error(f"ZIP 파일 처리 오류: {e}")
            return {"error": f"ZIP 파일 처리 오류: {e}"}
    else:
        xml_content = response.text
    
    # 4단계: "사업의 개요" 섹션 추출
    
    try:
        # XML parser 사용
        warnings.filterwarnings("ignore", category=XMLParsedAsHTMLWarning)
        
        soup = BeautifulSoup(xml_content, 'xml')
        full_text = soup.get_text()
                
        # 사업의 개요 추출을 위한 패턴들
        business_overview = ""
        
        # 방법 1: 정규식 패턴 매칭
        patterns = [
            r'사업의\s*개요[\s\S]*?(?=(?:사업의\s*내용|주요\s*제품|영업\s*현황|II\.|2\.)[\s\S]{0,100})',
            r'I\.\s*사업의\s*개요[\s\S]*?(?=(?:II\.|2\.|사업의\s*내용)[\s\S]{0,100})',
            r'1\.\s*사업의\s*개요[\s\S]*?(?=(?:2\.|사업의\s*내용|주요\s*제품)[\s\S]{0,100})',
            r'가\.\s*사업의\s*개요[\s\S]*?(?=(?:나\.|사업의\s*내용)[\s\S]{0,100})',
        ]
        
        for i, pattern in enumerate(patterns):
            matches = re.finditer(pattern, full_text, re.IGNORECASE | re.DOTALL)
            for match in matches:
                text = match.group(0)
                if len(text) > 300:  # 충분한 길이의 텍스트만
                    business_overview = text
                    break
            if business_overview:
                break
        
        # 방법 2: 키워드 주변 대량 텍스트 추출
        if not business_overview or len(business_overview) < 300:
            
            # 사업의 개요 시작 위치 찾기
            start_keywords = ['사업의 개요', '사업개요', 'I. 사업', '1. 사업']
            start_pos = -1
            
            for keyword in start_keywords:
                pos = full_text.find(keyword)
                if pos != -1:
                    start_pos = pos
                    # current_app.logger.info(f"시작 키워드 '{keyword}' 발견: 위치 {pos}")
                    break
            
            if start_pos != -1:
                # 시작 위치에서 4000자 추출
                business_overview = full_text[start_pos:start_pos + 4000]
                
                # 적절한 끝 위치에서 자르기
                end_keywords = ['사업의 내용', '주요 제품', '영업 현황', 'II.', '2.', '나.']
                for keyword in end_keywords:
                    pos = business_overview.find(keyword, 300)  # 최소 300자 이후에서 찾기
                    if pos != -1:
                        business_overview = business_overview[:pos]
                        break
                        
        # 방법 3: 전체 텍스트에서 사업 관련 부분 추출 (최후의 수단)
        if not business_overview or len(business_overview) < 100:
            
            # 사업 관련 키워드가 포함된 문단들 찾기
            sentences = full_text.split('\n')
            business_sentences = []
            
            business_keywords = ['사업', '제품', '서비스', '영업', '매출', '고객', '시장']
            
            for sentence in sentences:
                sentence = sentence.strip()
                if len(sentence) > 20 and any(keyword in sentence for keyword in business_keywords):
                    business_sentences.append(sentence)
                if len('\n'.join(business_sentences)) > 2000:
                    break
            
            if business_sentences:
                business_overview = '\n'.join(business_sentences[:20])  # 최대 20문장
        
        # 텍스트 정리
        if business_overview:
            # 줄바꿈과 공백 정리
            lines = []
            for line in business_overview.splitlines():
                line = line.strip()
                if line and len(line) > 5:  # 의미있는 줄만
                    lines.append(line)
            
            business_overview = '\n'.join(lines)
            
            # 길이 제한
            if len(business_overview) > 2500:
                business_overview = business_overview[:2500] + "..."
                
        # 결과 반환
        result = {
            'stock_code': stock_code,
            'corp_code': corp_code,
            'company_name': corp_name,
            'rcept_no': rcept_no,
            'report_name': report_nm,
            'business_overview': business_overview if business_overview else "사업의 개요를 추출할 수 없습니다.",
            'text_length': len(business_overview) if business_overview else 0
        }
        
        return result
        
    except Exception as e:
        current_app.logger.error(f"XML 처리 오류: {e}")
        
        # 최후의 수단: 기업개황 API
        # current_app.logger.info("기업개황 API로 대체...")
        company_url = "https://opendart.fss.or.kr/api/company.json"
        params = {
            'crtfc_key': DART_CLIENT_ID,
            'corp_code': corp_code
        }
        
        response = requests.get(company_url, params=params)
        company_data = response.json()
        
        if company_data['status'] == '000':
            overview = f"{corp_name}의 사업 개요:\n"
            overview += f"대표자: {company_data.get('ceo_nm', '')}\n"
            overview += f"소재지: {company_data.get('adres', '')}\n"
            overview += f"홈페이지: {company_data.get('hm_url', '')}"
            
            return {
                'stock_code': stock_code,
                'corp_code': corp_code,
                'company_name': corp_name,
                'business_overview': overview,
                'fallback': True
            }
        else:
            return {"error": f"모든 방법 실패: {e}"}

def ask_gpt_company_info(stock_code):

    company_info = get_company_info(stock_code)

    if "error" in company_info:
        return company_info

    # 템플릿 정의
    __system_template = '당신은 사업 개요를 보고 기업 개요를 작성해주는 전문가입니다.'

    __user_template = '''
    하기 사업 개요를 바탕으로 기업 개요를 작성해주세요.

    작성 유의사항
    1. 기업 개요는 한국어로 작성해주세요.
    2. 기업 개요는 500자 이내로 해주세요.
    3. 사업 개요가 없다면 종목 코드번호로 기업 정보를 확인해서 기업 개요를 작성해주세요.
    4. 답변에 기업개요:, \n 같은 값은 없어야 합니다.

    종목 코드 번호 : {stock}
    사업개요 : {business_overview}
    '''

    __prompt = ChatPromptTemplate.from_messages([
        SystemMessagePromptTemplate.from_template(__system_template),
        HumanMessagePromptTemplate.from_template(__user_template)
    ])

    # 모델 정의
    __llm = ChatOpenAI(
        model='gpt-4o-mini',
        temperature=0.7,
        api_key=GPT_API_KEY
    )

    # 파서 생성
    __parser = StrOutputParser()

    # 체인 생성
    __chain = __prompt | __llm | __parser

    try:
        current_app.logger.info(f"GPT 요약 요청 시작: {stock_code}")
        response = __chain.invoke({'stock': stock_code, 'business_overview': company_info['business_overview']})
        current_app.logger.info(f"GPT 요약 완료: {stock_code}")
    except Exception as e:
        current_app.logger.error(f"GPT 처리 오류: {e}")
        return {"error": f"GPT 처리 오류: {e}"}

    return {
        'stock_code': stock_code,
        'company_name': company_info.get('company_name'),
        'summary': response
    }
