import { generatePeriodData, getPriceRange, formatDate } from '../utils/stockDataGenerator';
import { isMarketOpen } from '../utils/timeUtils';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

// stockApi 객체 내부에 추가하는 더미 데이터 생성 합본 함수
const generateMockStockData = (symbol, period) => {
    console.log('🎲 generateMockStockData 호출:', symbol, period);
    
    // 더미 캔들스틱 데이터 생성
    const periodData = generatePeriodData(period);


    const candleData = periodData.map(item => ({
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume,
        timestamp: item.date.getTime()

    }));
    
    console.log('📊 생성된 candleData:', candleData.length, '개');
    console.log('📊 첫 번째 캔들:', candleData[0]);

    // 현재가 or 마지막 종가
    const currentPrice = candleData.length > 0 ? candleData[candleData.length - 1].close : 235000;

    const priceRange = getPriceRange(candleData);

    const labels = candleData.map(item => formatDate(new Date(item.timestamp), period))
    console.log('formatDate 설정 후 labels:', labels)

    const timeData = {
        labels,
        timestamps: candleData.map(item => item.timestamp)
    };

    const cleanCandleData = candleData.map(({ date, ...rest }) => rest);

    const result = {
        success: true,
        data: {
            candleData: cleanCandleData,
            timeData: timeData,
            currentPrice: currentPrice,
            priceRange: priceRange
        }
    };

    console.log('🎯 generateMockStockData 반환값:', result);
    return result;
};

const stockApi = {
    
    // 주식 상세 데이터 (캔들, 거래량, 시간 통합)
    fetchStockDetail: async (symbol, period = '10') => {
        console.log('🎯 fetchStockDetail 시작:', symbol, period);

        try {
            // API 호출
            const response = await fetch('#')
            const data = await response.json();

            return {
                success: true,
                data: {
                    candleData: data.candleData || [],
                    timeData: {
                        labels: data.timeLables || [],
                        timestamps: data.timestamps || []
                    },
                    currentPrice: data.currentPrice || 0,
                    priceRange: {
                        min: data.priceRange?.min || 0,
                        max: data.priceRange?.max || 0
                    }
                }
            };
        } catch (error) {
            console.log('⚠️ API 실패, generateMockStockData 호출');
            // 더미 데이터 반환
            return generateMockStockData(symbol, period);
        }
    },

    // 실시간 현재가 업데이트
    fetchRealTimePrice: async (symbol) => {
        // 장외이면 네트워크 요청을 하지 않고 null 반환
        if (!isMarketOpen()) return null;

        try {
            const response = await fetch(`${API_BASE_URL}/api/stock/realtime/${symbol}`);
            const data = await response.json();
            if (!response.ok) {
                throw new Error('실시간 데이터 조회 실패');
            }
            return data.currentPrice;
        } catch (error) {
            console.error('실시간 가격 조회에 실패하였습니다: ', error);
            return null; // 목데이터 대신 null 반환
        }
    },

    // 거래량 순위 조회 (실시간 데이터 포함)
    fetchVolumeRanking: async (limit = 4) => {
        try {
            // 먼저 기본 거래대금 순위(서버가 제공하는 정적/집계 데이터)를 항상 가져옵니다.
            const rankingResp = await fetch(`${API_BASE_URL}/api/stock/ranking?limit=${limit}`);
            const rankingData = await rankingResp.json();

            if (!rankingResp.ok || !rankingData.success) {
                throw new Error(rankingData.message || '거래대금 순위 조회에 실패했습니다');
            }

            let resultData = rankingData.data || [];

            // 장중일 때만 추가로 실시간 가격/등락 정보를 보강합니다.
            if (isMarketOpen()) {
                try {
                    const symbolsParam = resultData.map(r => r.stock_code).join(',');
                    // 서버에서 여러 종목 실시간을 지원하지 않으면 기존 endpoint를 사용
                    const realtimeResp = await fetch(`${API_BASE_URL}/api/stock/realtime?symbols=${encodeURIComponent(symbolsParam)}`);
                    if (realtimeResp.ok) {
                        const realtimeData = await realtimeResp.json();
                        if (realtimeData.success && Array.isArray(realtimeData.data)) {
                            const realtimeMap = new Map(realtimeData.data.map(d => [d.stock_code, d]));
                            resultData = resultData.map(item => ({
                                ...item,
                                current_price: realtimeMap.get(item.stock_code)?.current_price ?? item.current_price,
                                change_amount: realtimeMap.get(item.stock_code)?.change_amount ?? item.change_amount,
                                change_rate: realtimeMap.get(item.stock_code)?.change_rate ?? item.change_rate
                            }));
                        }
                    }
                } catch (err) {
                    console.warn('실시간 추가 정보 로드 실패:', err);
                }
            }

            return { success: true, data: resultData };
        } catch (error) {
            console.error('거래량 순위 조회 API 오류:', error);
            return { success: false, data: [], error: error.message };
        }
    }
};

export { stockApi };