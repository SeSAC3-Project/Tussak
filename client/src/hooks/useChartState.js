import { useState, useRef, useCallback } from 'react';

export const useChartState = () => {
    const [chartState, setChartState] = useState({
            startIndex: 0,
            visibleCandles: 80,
            isDragging: false,
            dragStart: null,
            selectedPeriod: '1개월',
            mousePosition: null,
            crosshair: { x: null, y: null, visible: false }
        });
    
        const chartRef = useRef(null);
        const dragRef = useRef({ isDragging: false, startX: 0, startIndex: 0});

    
        const handlePeriodChange = (period) => {
            // const visibleCandles = period === '1일' ? 60 : period === '1주' ? 25 : period === '1개월' ? 22 : 40;
            const visibleCandles = 80;
    
            setChartState(prev => ({
                ...prev,
                selectedPeriod: period,
                startIndex: Math.max(0, 300 - visibleCandles), 
                // 임시값 
                visibleCandles: visibleCandles
            }));
        };

        return {
            chartState,
            setChartState,
            chartRef,
            dragRef,
            handlePeriodChange
        };
};