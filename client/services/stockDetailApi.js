export const stockApi = {

    // 5분봉 차트 데이터
    get5minChartData: async (stockCode, interval = '5m', period = '1d') => {
        try {
            const response = await fetch('#')
            if (!response.ok) throw new Error('실시간 데이터 조회 실패')

            const apiData = await response.json();

            // API 응답을 차트에서 사용하는 형태로 변환하기
            const chartData = apiData.data.map(item => ({
                date: new Date(item.timestamp),
                open: item.open,
                high: item.high,
                low: item.low,
                close: item.close,
                
            }));

            // 이동 평균선 계산
            return calculateMAs(chartData)
        
        } catch (error) {
            console.error('차트 데이터를 불러오는 데 실패하였습니다:', error);
            throw error;
        } 
    },

    // 실시간 현재가 조회
    getCurrentPrice: async (stockCode) => {
        try {
            const response = await fetch('#')
            if (!response.ok) throw new Error('현재가 조회 실패');
            return await response.json();
        } catch (error) {
            console.error('종목의 현재가를 불러오는 데 실패하였습니다:', error);
            throw error;
        }
    }
}

const calculateMAs = (data) => {
    return data.map((item, index) => {
        const calculateMA = (period) => {
            const start = Math.max(0, index - period + 1);
            const slice = data.slice(start, index + 1);
            return slice.reduce((sum, d) => sum + d.close, 0) / slice.length;
        };

        return {
            ...item,
            ma5: calculateMA(5),
            ma20: calculateMA(20),
            ma60: calculateMA(60)
        };        
    });
};
