from flask import current_app

class SectorCodeConverter:
    """DB에 저장된 sector 코드를 업종명으로 변환"""
    
    def __init__(self):
        # sector 코드 패턴별 업종 매핑
        self.sector_code_mapping = {
            # 대분류 코드 기반 매핑 (첫 4자리)
            '1000': '음식료품',
            '1100': '음료',
            '1200': '담배',
            '1300': '섬유의복',
            '1400': '종이목재',
            '1500': '화학',
            '1600': '의약품',
            '1700': '고무플라스틱',
            '1800': '유리토석',
            '1900': '철강금속',
            '2000': '기계',
            '2100': '전기전자',
            '2200': '의료정밀',
            '2300': '운송장비',
            '2400': '기타제조',
            '2500': '전기가스업',
            '2600': '건설업',
            '2700': '유통업',
            '2800': '운송창고',
            '2900': '통신업',
            '3000': '금융업',
            '3100': '은행',
            '3200': '증권',
            '3300': '보험',
            '3400': '서비스업',
            '3500': '제조업',
            
            # 중분류 코드 기반 세부 매핑
            '1510': '화학',
            '1520': '화학섬유',
            '2110': '전기전자',
            '2120': '반도체',
            '2130': '컴퓨터',
            '2140': '통신장비',
            '2710': '유통',
            '2720': '백화점',
            '2730': '슈퍼마켓',
            '2910': '통신서비스',
            '2920': '방송서비스',
            '3110': '은행',
            '3120': '여신전문',
            '3210': '증권',
            '3220': '선물',
            '3310': '생명보험',
            '3320': '손해보험'
        }
    
    def convert_all_sectors(self):
        """DB의 모든 sector 코드를 업종명으로 변환"""
        try:
            current_app.logger.info("sector 코드를 업종명으로 변환 시작")
            
            # DB에서 기존 종목과 sector 코드 조회
            from models.stock import Stock
            stocks = Stock.query.filter(Stock.sector.isnot(None)).all()
            
            converted_stocks = []
            sector_stats = {}
            
            for stock in stocks:
                sector_code = stock.sector or ''
                sector_name = self._map_sector_code_to_name(sector_code)
                
                converted_stocks.append({
                    'stock_code': stock.stock_code,
                    'stock_name': stock.stock_name,
                    'sector_name': sector_name,
                    'sector_code': sector_code
                })
                
                # 업종별 통계
                sector_stats[sector_name] = sector_stats.get(sector_name, 0) + 1
            
            current_app.logger.info(f"sector 코드 변환 완료: {len(converted_stocks)}개 종목")
            current_app.logger.info(f"업종 분포: {dict(list(sector_stats.items())[:10])}...")  # 상위 10개만 로그
            
            return {
                'stocks_data': converted_stocks,
                'sector_stats': sector_stats,
                'total_stocks': len(converted_stocks),
                'total_sectors': len(sector_stats)
            }
            
        except Exception as e:
            current_app.logger.error(f"sector 코드 변환 실패: {e}")
            return {
                'stocks_data': [],
                'sector_stats': {},
                'total_stocks': 0,
                'total_sectors': 0
            }
    
    def _map_sector_code_to_name(self, sector_code):
        """sector 코드를 업종명으로 매핑"""
        if not sector_code or sector_code == '':
            return '기타'
        
        # 코드 패턴 분석 (예: "1000>1100>1110" 형태)
        if '>' in sector_code:
            parts = sector_code.split('>')
            
            # 가장 구체적인 코드부터 확인 (뒤에서부터)
            for i in range(len(parts) - 1, -1, -1):
                code = parts[i].strip()
                if code in self.sector_code_mapping:
                    return self.sector_code_mapping[code]
                
                # 부분 매칭도 시도 (앞 4자리, 3자리, 2자리)
                for length in [4, 3, 2]:
                    if len(code) >= length:
                        partial_code = code[:length]
                        if partial_code in self.sector_code_mapping:
                            return self.sector_code_mapping[partial_code]
        else:
            # 단일 코드인 경우
            code = sector_code.strip()
            if code in self.sector_code_mapping:
                return self.sector_code_mapping[code]
            
            # 부분 매칭 시도
            for length in [4, 3, 2]:
                if len(code) >= length:
                    partial_code = code[:length]
                    if partial_code in self.sector_code_mapping:
                        return self.sector_code_mapping[partial_code]
        
        return '기타'
    
    def get_sector_name_by_code(self, sector_code):
        """단일 sector 코드를 업종명으로 변환"""
        return self._map_sector_code_to_name(sector_code)
    
    def get_available_sectors(self):
        """사용 가능한 업종명 목록 반환"""
        return list(set(self.sector_code_mapping.values()))

# 전역 함수로 쉬운 접근 제공
def convert_sectors_to_names():
    """sector 코드를 업종명으로 변환 (전역 함수)"""
    converter = SectorCodeConverter()
    return converter.convert_all_sectors()

def get_sector_name_from_code(sector_code):
    """sector 코드에서 업종명 조회"""
    converter = SectorCodeConverter()
    return converter.get_sector_name_by_code(sector_code)