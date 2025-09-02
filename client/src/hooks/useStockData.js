import { useState, useEffect, useCallback } from 'react';
import { stockDetailApi } from '../services/stockDetailApi';
import { stockApi } from '../services/stockApi';

export const useStockData = (symbol, period) => {
  const [stockData, setStockData] = useState(null);
  const [realTimePrice, setRealTimePrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadStockData = async () => {
    if (!symbol) return;

    setLoading(true);
    setError(null);
  }

  try {
    const result = await stockApi.fetchStockData(symbol, period);

    if (result.success) {
      setStockData(result.data);
      setRealTimePrice(result.data.currentPrice);
    } else {
      setError('데이터를 불러오는 데 실패했습니다.');
    }
  } catch (error) {
    setError('네트워크 오류가 발생했습니다.');
    console.error('주식 데이터 불러오기 실패:', error);
  } finally {
    setLoading(false);
  };

  // 실시간 현재가 업데이트 (폴링으루)
  useEffect(() => {
    if (!symbol || period ==! '10') return;

    // 5초마다 실시간 업데이트
    const interval = setInterval(async () => {
      const price = await stockApi.fetchRealTimePrice(symbol);
      if (price) setRealTimePrice(price);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [symbol, period]);

  // symbol or period 변경 시 데이터 재로드
  useEffect(() => {
    loadStockData();
  }, [symbol, period]);

  return {
    stockData,
    realTimePrice,
    loading,
    error,
    refetch: loadStockData
  };
};