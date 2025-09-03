export const generatePeriodData = (period) => {
    const data = [];
    let basePrice = 235000;
    const totalPoints = 300;
    const dateIncrement = (i) => new Date(2024, 0, 15 + i);

    let sliceCount;
        switch(period) {
            case '1일':
                sliceCount = 78;   // 최근 78개만 표시
                break;
            case '1주':
                sliceCount = 140;  // 최근 140개만 표시
                break;
            case '1개월':
                sliceCount = 220;  // 최근 220개만 표시
                break;
            case '3개월':
                sliceCount = 300;  // 전부 표시
                break;
            default:
                sliceCount = 220;
        };

    const volatilityMap = {
        '1일': { price: 2000, volume: 0.1 },
        '1주': { price: 5000, volume: 0.05 },
        '1개월': { price: 8000, volume: 0.1 },
        '3개월': { price: 12000, volume: 0.3 }
    };

    const volatility = volatilityMap[period] || volatilityMap['1개월'];

    for (let i = 0; i < totalPoints; i++) {
        // 파동 생성
        const wave = Math.sin(i * 0.1) * volatility.price * 0.3;
        const randomChange = (Math.random() - 0.5) * volatility.price;
        
        const open = basePrice + wave;
        const close = open + randomChange;
        const high = Math.max(open, close) + Math.random() * volatility.price * 0.2;
        const low = Math.min(open, close) - Math.random() * volatility.price * 0.2;
        const volume = Math.random() * 1000000 * (1 + volatility.volume);

        data.push({
            date: dateIncrement(i),
            open,
            high,
            low,
            close,
            volume,
            period
        });

        basePrice += (close - basePrice) * 0.1;
    }

    // 이동평균선 계산
    data.forEach((item, index) => {
        const calculateMA = (period) => {
            const start = Math.max(0, index - period + 1);
            const slice = data.slice(start, index + 1);
            return slice.reduce((sum, d) => sum + d.close, 0) / slice.length;
        };

        item.ma5 = calculateMA(5);
        item.ma20 = calculateMA(20);
        item.ma60 = calculateMA(60);
    });

    return data.slice(-sliceCount);
};

export const getPriceRange = (data) => {
    if (!data || !data.length) return { min: 0, max: 100000 };
    
    const prices = data.flatMap(d => [d.high, d.low]);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.1;
    
    return {
        min: min - padding,
        max: max + padding
    };
};

export const formatDate = (date, period) => {
    if (!date) return '';

    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();

    switch (period) {
        case '1일':
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        case '1주':
            return `${month}/${day}`;
        case '1개월':
        case '3개월':
        default:
            return `${month}/${day}`;
    }
};
