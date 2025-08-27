import urllib.request
import os
import ssl
import zipfile
# import pandas as pd
import tempfile
import shutil

from flask import current_app

# 종목 마스터 파일 다운로드 및 파싱
# market (str): 시장 구분 -> 'kospi' or 'kosdaq'
# return -> list: 종목 정보 딕셔너리 리스트
def download_stock_master_file(market='kospi'):

    try:
        current_app.logger.info(f"{market.upper()} 종목 마스터 파일 다운로드 시작")
        
        # SSL 인증서 검증 비활성화
        ssl._create_default_https_context = ssl._create_unverified_context
        
        # 임시 디렉토리 생성
        temp_dir = tempfile.mkdtemp()
        
        try:
            if market.lower() == 'kospi':
                url = "https://new.real.download.dws.co.kr/common/master/kospi_code.mst.zip"
                zip_filename = "kospi_code.zip"
                mst_filename = "kospi_code.mst"
            else:  # kosdaq
                url = "https://new.real.download.dws.co.kr/common/master/kosdaq_code.mst.zip"
                zip_filename = "kosdaq_code.zip"
                mst_filename = "kosdaq_code.mst"
            
            zip_path = os.path.join(temp_dir, zip_filename)
            
            # 파일 다운로드
            current_app.logger.info(f"{market.upper()} 마스터 파일 다운로드 중...")
            urllib.request.urlretrieve(url, zip_path)
            
            # ZIP 파일 압축 해제
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(temp_dir)
            
            # MST 파일 파싱
            mst_path = os.path.join(temp_dir, mst_filename)
            stocks_data = parse_mst_file(mst_path, market)
            
            current_app.logger.info(f"{market.upper()} 종목 {len(stocks_data)}개 파싱 완료")
            return stocks_data
            
        finally:
            # 임시 디렉토리 정리
            shutil.rmtree(temp_dir, ignore_errors=True)
            
    except Exception as e:
        current_app.logger.error(f"{market.upper()} 마스터 파일 처리 실패: {e}")
        raise e

# 파일 파싱 후 종목 정보 추출
# file_path (str): MST 파일 경로 , market (str): 시장 구분
# return -> list: 종목 정보 딕셔너리 리스트
def parse_mst_file(file_path, market):

    stocks_data = []
    
    try:
        with open(file_path, mode="r", encoding="cp949") as f:
            for line in f:
                if market.lower() == 'kospi':
                    # 코스피: 228바이트 구조
                    basic_info = line[0:len(line) - 228]
                else:
                    # 코스닥: 222바이트 구조  
                    basic_info = line[0:len(line) - 222]
                
                # 기본 정보 추출
                stock_code = basic_info[0:9].rstrip() # 단축코드
                standard_code = basic_info[9:21].rstrip() # 표준코드
                stock_name = basic_info[21:].strip() # 한글종목명
                
                if not stock_code or not stock_name:
                    continue
                
                # 데이터 정리
                if stock_code and stock_name:
                    stock_info = {
                        'stock_code': stock_code,
                        'standard_code': standard_code,
                        'stock_name': stock_name,
                        'market': market.upper()
                    }
                    stocks_data.append(stock_info)
        
        return stocks_data
        
    except Exception as e:
        current_app.logger.error(f"확장 MST 파일 파싱 실패: {e}")
        raise e

# 코스피 전체 종목 조회
def get_kospi_stocks():
    try:
        current_app.logger.info("코스피 종목 정보 조회 시작")
        stocks = download_stock_master_file('kospi')
        current_app.logger.info(f"코스피 종목 {len(stocks)}개 조회 완료")
        return stocks
    except Exception as e:
        current_app.logger.error(f"코스피 종목 조회 실패: {e}")
        raise e

# 코스닥 전체 종목 조회
def get_kosdaq_stocks():
    try:
        current_app.logger.info("코스닥 종목 정보 조회 시작")
        stocks = download_stock_master_file('kosdaq')
        current_app.logger.info(f"코스닥 종목 {len(stocks)}개 조회 완료")
        return stocks
    except Exception as e:
        current_app.logger.error(f"코스닥 종목 조회 실패: {e}")
        raise e

# 코스피 + 코스닥 전체 종목 조회
def get_all_domestic_stocks():
    try:
        current_app.logger.info("전체 국내 주식 종목 조회 시작")
        
        # 코스피와 코스닥 종목 각각 조회
        kospi_stocks = get_kospi_stocks()
        kosdaq_stocks = get_kosdaq_stocks()
        
        # 합치기
        all_stocks = kospi_stocks + kosdaq_stocks
        
        current_app.logger.info(f"전체 종목 조회 완료 - 코스피: {len(kospi_stocks)}개, 코스닥: {len(kosdaq_stocks)}개, 총: {len(all_stocks)}개")
        
        return all_stocks
        
    except Exception as e:
        current_app.logger.error(f"전체 종목 조회 실패: {e}")
        raise e
