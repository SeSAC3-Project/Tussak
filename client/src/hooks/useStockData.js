import { useState, useEffect, useCallback } from 'react';
import { stockApi } from '../services/stockApi';

export const useStockData = (symbol) => {
  console.log('🚀 useStockData 훅 호출됨:', symbol);
    
  const [chartData, setChartData] = useState(null);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // fetchChartData 함수 - StockDetail.jsx에서 기대하는 함수명
  const fetchChartData = useCallback(async (stockCode, period = '1d') => {
    if (!stockCode) {
      console.log('❌ stockCode가 없어서 API 호출 중단');
      return;
    }

    console.log('📡 fetchChartData 시작:', stockCode, period);
    setLoading(true);
    setError(null);
  
    try {
      console.log('🔄 stockApi.fetchStockDetail 호출 시작');
      const result = await stockApi.fetchStockDetail(stockCode, period);
      console.log('✅ stockApi.fetchStockDetail 결과:', result);

      if (result.success && result.data) {
        // chartData는 candleData 배열을 직접 저장
        setChartData(result.data.candleData);
        setCurrentPrice(result.data.currentPrice);
        console.log('✅ 데이터 설정 완료');
        console.log('📊 candleData 길이:', result.data.candleData?.length);
        console.log('💰 currentPrice:', result.data.currentPrice);
      } else {
        setError('데이터를 불러오는 데 실패했습니다.');
        console.log('❌ API 결과 success: false');
      }
    } catch (error) {
      setError('네트워크 오류가 발생했습니다.');
      console.error('❌ fetchChartData 에러:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // symbol 변경 시 자동 호출
  useEffect(() => {
    console.log('🔄 useEffect 실행 - symbol 변경:', symbol);
    if (symbol) {
      fetchChartData(symbol, '1d'); // 기본 period
    } else {
      console.log('⚠️ symbol이 없어서 초기화');
      setChartData(null);
      setCurrentPrice(null);
      setError(null);
    }
  }, [symbol, fetchChartData]);

  console.log('📊 useStockData 현재 상태:');
  console.log('- chartData:', chartData);
  console.log('- currentPrice:', currentPrice);
  console.log('- loading:', loading);
  console.log('- error:', error);

  return {
    chartData, // candleData 배열을 직접 반환
    currentPrice,
    loading,
    error,
    fetchChartData
  };
};