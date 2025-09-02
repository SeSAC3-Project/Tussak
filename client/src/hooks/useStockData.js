import { useState, useEffect, useCallback } from 'react';
import { stockDetailApi } from '../services/stockDetailApi';

export const useStockData = (stockCode) => {
  const [chartData, setChartData] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 차트 데이터 가져오기
  const fetchChartData = useCallback(async (period = '1d') => {
    if (!stockCode) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await stockDetailApi.getChartData(stockCode, '5m', period);
      setChartData(data);
    } catch (error) {
      setError(error.message);
      console.error('차트 데이터 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [stockCode]);

  // 실시간 현재가 업데이트 (폴링으루)
  useEffect(() => {
    if (!stockCode) return;

    const updateCurrentPrice = async () => {
      try {
        const priceData = await stockDetailApi.getCurrentPrice(stockCode);
        setCurrentPrice(priceData.price);
        
        // 마지막 캔들의 현재가도 업데이트
        setChartData(prev => {
          if (prev.length === 0) return prev;
          
          const newData = [...prev];
          const lastCandle = { ...newData[newData.length - 1] };
          lastCandle.close = priceData.price;
          lastCandle.high = Math.max(lastCandle.high, priceData.price);
          lastCandle.low = Math.min(lastCandle.low, priceData.price);
          newData[newData.length - 1] = lastCandle;
          
          return newData;
        });
      } catch (error) {
        console.error('실시간 가격 업데이트 실패:', error);
      }
    };

    // 5초마다 실시간 업데이트
    const interval = setInterval(updateCurrentPrice, 5000);
    
    return () => clearInterval(interval);
  }, [stockCode]);

  return {
    chartData,
    currentPrice,
    loading,
    error,
    fetchChartData
  };
};