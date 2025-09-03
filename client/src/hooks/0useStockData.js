import { useState, useEffect } from 'react';
import { stockApi } from '../services/stockApi';

export const useStockData = (symbol, period = '1d') => {
  console.log('🚀 useStockData 훅 호출됨:',  symbol, period);
    
  const [stockData, setStockData] = useState(null);
  const [realTimePrice, setRealTimePrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadStockData = async () => {
    if (!symbol) return;

    setLoading(true);
    setError(null);
  
    try {
      // stockApi.fetchStockDetail 사용
      console.log('🔄 stockApi.fetchStockDetail 호출 시작');
      const result = await stockApi.fetchStockDetail(symbol, period);
      console.log('✅ stockApi.fetchStockDetail 결과:', result);

      if (result.success) {
        setStockData(result.data);
        setRealTimePrice(result.data.currentPrice);
      } else {
        setError('데이터를 불러오는 데 실패했습니다.');
      }
    } catch (error) {
      setError('네트워크 오류가 발생했습니다.');
      console.error('❌ fetchChartData 에러:', error);
    } finally {
      setLoading(false);
    };
  };

  // 실시간 현재가 업데이트 (폴링으루)
  useEffect(() => {
    if (!symbol || period !== '10') return;

    // 5초마다 실시간 업데이트
    const interval = setInterval(async () => {
      try {
        const price = await stockApi.fetchRealTimePrice(symbol);
        if (price) setRealTimePrice(price);
      } catch (error) {
        console.error('실시간 해당 종목의 가격 업데이트 실패:', error);
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [symbol, period]);

  // symbol or period 변경 시 데이터 재로드
  useEffect(() => {
    loadStockData();
  }, [symbol, period]);

  return {
    // stockDetail 에서 사용할 수 있도록 매핑
    chartData: stockData?.candleData || null,
    currentPrice: realTimePrice || stockData?.currentPrice || null,
    timeData: stockData?.timeData || null,
    priceRange: stockData?.priceRange || null,
    loading,
    error,
    fetchChartData: loadStockData,
    refetch: loadStockData
  };
};