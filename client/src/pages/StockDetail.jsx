import React, { useState, useRef, useCallback } from 'react';

const StockDashboard = () => {
    const [chartState, setChartState] = useState({
        startIndex: 0,
        visibleCandles: 40,
        isDragging: false,
        dragStart: null,
        selectedPeriod: '1개월',
        mousePosition: null,
        crosshair: { x: null, y: null, visible: false }
    });

    const chartRef = useRef(null);
    const dragRef = useRef({ isDragging: false, startX: 0, startIndex: 0});

    // 더미데이터 생성용
    const generatePeriodData = (period) => {
        const data = [];
        let basePrice = 235000;
        
        const totalPoints = 300;
        const dateIncrement = (i) => new Date(2024, 0, 15 + i);

        // 실제로 화면에 보여줄 개수 설정
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
        }

        const volatilityMap = {
            '1일': { price: 2000, volume: 0.1 },
            '1주': { price: 5000, volume: 0.05 },
            '1개월': { price: 8000, volume: 0.1 },
            '3개월': { price: 12000, volume: 0.3 }
        };

        const volatility = volatilityMap[period] || volatilityMap['1개월'];

        for (let i = 0; i < totalPoints; i++) {
            const trendFactor = Math.sin(i * 0.1) * 0.3 + (Math.random() - 0.5) * 0.7;
            const open = basePrice + (Math.random() - 0.5) * volatility.price;
            const close = open + trendFactor * volatility.price;
            const high = Math.max(open, close) + Math.random() * volatility.price * 0.5
            const low = Math.min(open, close) - Math.random() * volatility.price * 0.5;
            const volume = (Math.random() * 1000000 + 500000) * volatility.volume;

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

        return data;
    }
}

export default StockDetail;