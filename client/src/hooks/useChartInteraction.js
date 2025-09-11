import { useCallback, useEffect } from 'react';

export const useChartInteraction = (chartState, setChartState, chartRef, dragRef, candleData) => {
    const handleWheel = useCallback((e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 5 : -5;
        const newVisibleCandles = Math.max(20, Math.min(150, chartState.visibleCandles + delta));
        
        setChartState(prev => ({
            ...prev,
            visibleCandles: newVisibleCandles,
            startIndex: Math.max(0, Math.min(candleData.length - newVisibleCandles, prev.startIndex))
        }));
    }, [chartState.visibleCandles, candleData.length, setChartState]);

    const handleMouseDown = useCallback((e) => {
        dragRef.current = {
            isDragging: true,
            startX: e.clientX,
            startIndex: chartState.startIndex
        };
        
        setChartState(prev => ({ ...prev, isDragging: true }));
    }, [chartState.startIndex, setChartState]);

    const handleMouseMove = useCallback((e) => {
        if (!dragRef.current.isDragging) return;
        
        const deltaX = e.clientX - dragRef.current.startX;
        const candleWidth = 600 / chartState.visibleCandles;
        const indexChange = Math.floor(-deltaX / candleWidth);
        
        const newIndex = Math.max(0, 
            Math.min(candleData.length - chartState.visibleCandles, 
                dragRef.current.startIndex + indexChange)
        );
        
        setChartState(prev => ({ ...prev, startIndex: newIndex }));
    }, [chartState.visibleCandles, candleData.length, setChartState]);

    const handleMouseUp = useCallback(() => {
        dragRef.current.isDragging = false;
        setChartState(prev => ({ ...prev, isDragging: false }));
    }, [setChartState]);

    const handleMouseMoveChart = useCallback((e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left - 40;
        const y = e.clientY - rect.top - 20;
        
        setChartState(prev => ({
            ...prev,
            crosshair: { x, y, visible: true }
        }));
    }, [setChartState]);

    const handleMouseLeaveChart = useCallback(() => {
        setChartState(prev => ({
            ...prev,
            crosshair: { x: null, y: null, visible: false }
        }));
    }, [setChartState]);

    const handleKeyDown = useCallback((e) => {
        switch (e.key) {
            case 'ArrowLeft':
                setChartState(prev => ({
                    ...prev,
                    startIndex: Math.max(0, prev.startIndex - 5)
                }));
                break;
            case 'ArrowRight':
                setChartState(prev => ({
                    ...prev,
                    startIndex: Math.min(candleData.length - prev.visibleCandles, prev.startIndex + 5)
                }));
                break;
            case 'Home':
                setChartState(prev => ({ ...prev, startIndex: 0 }));
                break;
            case 'End':
                setChartState(prev => ({
                    ...prev,
                    startIndex: Math.max(0, candleData.length - prev.visibleCandles)
                }));
                break;
        }
    }, [candleData.length, setChartState]);

    useEffect(() => {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleMouseMove, handleMouseUp, handleKeyDown]);

    useEffect(() => {
        if (chartRef.current) {
            chartRef.current.tabIndex = 0;
        }
    }, []);

    return {
        handleWheel,
        handleMouseDown,
        handleMouseMoveChart,
        handleMouseLeaveChart
    };
};