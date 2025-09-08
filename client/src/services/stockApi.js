import { generatePeriodData, getPriceRange, formatDate } from '../utils/stockDataGenerator';

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
        try {
            const response = await fetch('#');
            const data = await response.json();
            return data.currentPrice;

        } catch (error) {
            console.error('실시간 가격 조회에 실패하였습니다: ', error);
            // 더미용 랜덤 변동
            const basePrice = 235000;
            const variation = (Math.random() - 0.5) * 5000;
            return Math.round(basePrice + variation);
        }
    }
};

export { stockApi };