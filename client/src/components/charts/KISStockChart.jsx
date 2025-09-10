import React, { useState, useEffect, useRef } from 'react';

import CandlestickChart from './CandlestickChart';

const KISStockChart = ({ stockCode }) => {
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('일');
  
  const containerRef = useRef(null);
    // KIS API 응답 데이터를 차트 데이터로 변환
  const transformApiData = (apiData) => {
    if (!apiData || !apiData.candleData || !Array.isArray(apiData.candleData)) {
      return null;
    }

    const candleData = apiData.candleData.map(item => {
      // 날짜 형식 변환 (YYYYMMDD -> YYYY-MM-DD)
      const dateStr = item.timestamp || item.stck_bsop_date;
      const date = dateStr ? 
        new Date(dateStr.slice(0, 4) + '-' + dateStr.slice(4, 6) + '-' + dateStr.slice(6, 8)) :
        new Date();

      return {
        timestamp: dateStr,
        date: date,
        open: parseFloat(item.stck_oprc || '0'),
        high: parseFloat(item.stck_hgpr || '0'),
        low: parseFloat(item.stck_lwpr || '0'),
        close: parseFloat(item.stck_clpr || '0'),
        volume: parseInt(item.acml_vol || '0', 10),
        changeAmount: parseFloat(item.prdy_vrss || '0'),
        changeRate: parseFloat(item.prdy_ctrt || '0'),
        isUp: item.prdy_vrss_sign === '2' || parseFloat(item.prdy_vrss || '0') >= 0
      };
    });

    // 이동평균 계산
    candleData.forEach((item, index) => {
      // MA5 계산
      if (index >= 4) {
        const ma5Sum = candleData
          .slice(index - 4, index + 1)
          .reduce((sum, d) => sum + d.close, 0);
        item.ma5 = Math.round(ma5Sum / 5);
      }

      // MA20 계산
      if (index >= 19) {
        const ma20Sum = candleData
          .slice(index - 19, index + 1)
          .reduce((sum, d) => sum + d.close, 0);
        item.ma20 = Math.round(ma20Sum / 20);
      }
    });

    const allPrices = candleData.flatMap(d => [d.high, d.low]);
    const priceRange = {
      min: Math.min(...allPrices) * 0.98,
      max: Math.max(...allPrices) * 1.02
    };

    const maxVolume = Math.max(...candleData.map(d => d.volume));

    return {
      candleData,
      priceRange,
      maxVolume
    };
  };

  // 차트 데이터 로드
  const loadChartData = async (period = selectedPeriod, code = stockCode) => {
    setLoading(true);
    setError(null);
  
    try {
      const periodCode = { '일': 'D', '주': 'W', '월': 'M', '년': 'Y' };
      const response = await fetch(
        `/api/stock/kis-chart/${code}?period=${periodCode[period] || 'D'}`
      );
      const data = await response.json();
  
      if (response.ok && data.success) {
        const transformedData = transformApiData(data.data);
        if (transformedData) {
          setStockData(transformedData);
        } else {
          setError('차트 데이터 변환에 실패했습니다.');
        }
      } else {
        setError(data.message || '차트 데이터를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('데이터 로드 오류:', err);
      setError(`데이터 로드 실패: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // 기간 변경 핸들러
  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    loadChartData(period);
  };

  // stockCode가 변경될 때마다 차트 데이터 로드
  useEffect(() => {
    if (stockCode) {
      loadChartData(selectedPeriod, stockCode);
    }
  }, [stockCode, selectedPeriod]);

  // 캔들차트 컴포넌트
  const CandlestickChart = ({ stockData }) => {
    const [chartSize, setChartSize] = useState({ width: 800, height: 500 });
    
    useEffect(() => {
      const updateSize = () => {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          setChartSize({
            width: Math.max(600, rect.width - 40),
            height: 500
          });
        }
      };
      
      updateSize();
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }, []);

    if (!stockData?.candleData?.length) return null;

    const { candleData, priceRange, maxVolume } = stockData;

    // 데이터 변환: 서버에서 받은 timestamp와 date를 Date 객체로 변환
    const processedCandleData = candleData.map(item => ({
      ...item,
      date: item.date ? new Date(item.date) : new Date(item.timestamp.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'))
    }));
    
    const margin = { left: 60, right: 40, top: 20, bottom: 120 };
    const chartAreaWidth = chartSize.width - margin.left - margin.right;
    const chartAreaHeight = chartSize.height - margin.top - margin.bottom;
    const volumeAreaHeight = 80;
    const priceAreaHeight = chartAreaHeight - volumeAreaHeight - 20;
    
    const candleWidth = Math.max(2, Math.min(12, chartAreaWidth / candleData.length * 0.8));
    
    const scaleY = (price) => {
      return margin.top + priceAreaHeight - ((price - priceRange.min) / (priceRange.max - priceRange.min)) * priceAreaHeight;
    };
    
    const scaleVolumeY = (volume) => {
      const volumeTop = margin.top + priceAreaHeight + 20;
      return volumeTop + volumeAreaHeight - (volume / maxVolume) * volumeAreaHeight;
    };

    return (
      <div ref={containerRef} className="w-full">
        <svg width={chartSize.width} height={chartSize.height} className="bg-white border rounded">
          {/* 그리드 */}
          <defs>
            <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect
            x={margin.left}
            y={margin.top}
            width={chartAreaWidth}
            height={priceAreaHeight}
            fill="url(#grid)"
          />
          
          {/* 가격 눈금 */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const price = priceRange.min + (priceRange.max - priceRange.min) * ratio;
            const y = scaleY(price);
            return (
              <g key={i}>
                <line
                  x1={margin.left}
                  y1={y}
                  x2={margin.left + chartAreaWidth}
                  y2={y}
                  stroke="#ddd"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
                <text
                  x={margin.left - 5}
                  y={y + 4}
                  fontSize="11"
                  fill="#666"
                  textAnchor="end"
                >
                  {Math.round(price).toLocaleString()}
                </text>
              </g>
            );
          })}

          {/* 이동평균선 */}
          {processedCandleData.length > 1 && (
            <>
              {/* MA5 */}
              <polyline
                fill="none"
                stroke="#3b82f6"
                strokeWidth="1.5"
                points={processedCandleData.map((d, i) => {
                  const x = margin.left + (i / Math.max(processedCandleData.length - 1, 1)) * chartAreaWidth;
                  const y = scaleY(d.ma5);
                  return `${x},${y}`;
                }).join(' ')}
              />
              {/* MA20 */}
              <polyline
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1.5"
                points={processedCandleData.map((d, i) => {
                  const x = margin.left + (i / Math.max(processedCandleData.length - 1, 1)) * chartAreaWidth;
                  const y = scaleY(d.ma20);
                  return `${x},${y}`;
                }).join(' ')}
              />
            </>
          )}

          {/* 캔들스틱 */}
          {processedCandleData.map((candle, index) => {
            const x = margin.left + (index / Math.max(processedCandleData.length - 1, 1)) * chartAreaWidth - candleWidth / 2;
            const isGreen = candle.close >= candle.open;
            const bodyTop = Math.max(candle.open, candle.close);
            const bodyBottom = Math.min(candle.open, candle.close);
            const bodyHeight = Math.abs(scaleY(bodyBottom) - scaleY(bodyTop));
            
            return (
              <g key={`candle-${index}`}>
                {/* 그림자 (High-Low) */}
                <line
                  x1={x + candleWidth / 2}
                  y1={scaleY(candle.high)}
                  x2={x + candleWidth / 2}
                  y2={scaleY(candle.low)}
                  stroke={isGreen ? "#22c55e" : "#ef4444"}
                  strokeWidth="1"
                />
                {/* 몸통 (Open-Close) */}
                <rect
                  x={x}
                  y={scaleY(bodyTop)}
                  width={candleWidth}
                  height={Math.max(bodyHeight, 1)}
                  fill={isGreen ? "#22c55e" : "#ef4444"}
                  stroke={isGreen ? "#22c55e" : "#ef4444"}
                />
              </g>
            );
          })}

          {/* 거래량 차트 */}
          <g>
            <text
              x={margin.left}
              y={margin.top + priceAreaHeight + 35}
              fontSize="12"
              fill="#666"
            >
              거래량
            </text>
            {processedCandleData.map((candle, index) => {
              const x = margin.left + (index / Math.max(processedCandleData.length - 1, 1)) * chartAreaWidth - candleWidth / 2;
              const volumeHeight = (candle.volume / maxVolume) * volumeAreaHeight;
              const y = scaleVolumeY(candle.volume);
              const isGreen = candle.close >= candle.open;
              
              return (
                <rect
                  key={`volume-${index}`}
                  x={x}
                  y={y}
                  width={candleWidth}
                  height={volumeHeight}
                  fill={isGreen ? "#22c55e" : "#ef4444"}
                  opacity={0.6}
                />
              );
            })}
          </g>

          {/* 범례 */}
          <g>
            <rect x={margin.left} y={margin.top} width={200} height={60} fill="white" fillOpacity={0.9} stroke="#ddd"/>
            <line x1={margin.left + 10} y1={margin.top + 15} x2={margin.left + 30} y2={margin.top + 15} stroke="#3b82f6" strokeWidth="2"/>
            <text x={margin.left + 35} y={margin.top + 20} fontSize="11" fill="#666">MA5</text>
            <line x1={margin.left + 10} y1={margin.top + 35} x2={margin.left + 30} y2={margin.top + 35} stroke="#f59e0b" strokeWidth="2"/>
            <text x={margin.left + 35} y={margin.top + 40} fontSize="11" fill="#666">MA20</text>
          </g>
        </svg>
      </div>
    );
  };

  return (
    <div className="w-full">
        {/* 기간 선택 버튼 */}
      <div className="flex gap-2 mb-4">
          {['일', '주', '월', '년'].map(period => (
            <button
              key={period}
              onClick={() => handlePeriodChange(period)}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                selectedPeriod === period
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {period}봉
            </button>
          ))}
      </div>


      {/* 로딩 및 에러 표시 */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">데이터 로딩 중...</span>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 rounded-md">
          <p className="text-red-800">{error}</p>
          <button 
            onClick={() => loadChartData()}
            className="mt-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 차트 */}
      {stockData && !loading && (
        <div className="bg-white border rounded-lg">
          <CandlestickChart stockData={stockData} />
        </div>
      )}
    </div>
  );
};

export default KISStockChart;