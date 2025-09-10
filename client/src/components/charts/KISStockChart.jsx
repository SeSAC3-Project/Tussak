import React, { useState, useEffect, useRef, useCallback } from 'react';

const KISStockChart = ({ stockCode }) => {
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('일');
  
  const containerRef = useRef(null);

  // KIS API 응답 데이터를 차트 데이터로 변환 (단순화)
  const transformApiData = (apiData) => {
    console.log('Received API data (transform):', apiData);

    // 여러 형태의 응답을 허용: Array, { output: [...] }, { candleData: [...] }, wrapper { data: { output: [...] }} 등
    let dataArray = null;
    if (!apiData) {
      console.error('No API data provided to transformApiData');
      return null;
    }

    if (Array.isArray(apiData)) {
      dataArray = apiData;
    } else if (apiData.output && Array.isArray(apiData.output)) {
      dataArray = apiData.output;
    } else if (apiData.candleData && Array.isArray(apiData.candleData)) {
      dataArray = apiData.candleData;
    } else if (apiData.data && Array.isArray(apiData.data)) {
      dataArray = apiData.data;
    } else if (apiData.data && apiData.data.output && Array.isArray(apiData.data.output)) {
      dataArray = apiData.data.output;
    }

    if (!Array.isArray(dataArray)) {
      console.error('Invalid data structure - expected array-like payload. Received:', apiData);
      return null;
    }

    const candleData = dataArray
      .map((item, index) => {
        // 날짜/가격 필드명 다양성 대응
        const dateStrRaw = item.stck_bsop_date || item.date || item.stck_bsop_dt || null;
        let dateStr = null;
        if (dateStrRaw && typeof dateStrRaw === 'string') {
          dateStr = dateStrRaw;
        } else if (item.timestamp) {
          // timestamp가 있으면 YYYYMMDD 형태로 만들어 둠
          const d = new Date(Number(item.timestamp));
          const y = d.getFullYear().toString();
          const m = (d.getMonth() + 1).toString().padStart(2, '0');
          const dd = d.getDate().toString().padStart(2, '0');
          dateStr = `${y}${m}${dd}`;
        }

        if (!dateStr) {
          console.warn(`Missing date at index ${index}:`, item);
          return null;
        }

        const open = parseFloat(item.stck_oprc || item.open || item.o || '0');
        const high = parseFloat(item.stck_hgpr || item.high || item.h || '0');
        const low = parseFloat(item.stck_lwpr || item.low || item.l || '0');
        const close = parseFloat(item.stck_clpr || item.close || item.c || '0');

        // 유효한 데이터만 반환
        if (isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close) || 
            open <= 0 || high <= 0 || low <= 0 || close <= 0) {
          console.warn(`Invalid price data at index ${index}:`, { open, high, low, close });
          return null;
        }

        return {
          date: dateStr,
          open,
          high,
          low,
          close,
          isUp: close >= open
        };
      })
      .filter(item => item !== null) // null 항목 제거
      .reverse(); // 날짜순 정렬 (오래된 것부터)

    if (candleData.length === 0) {
      console.error('No valid candle data after processing');
      return null;
    }

    // 유효한 가격만 추출
    const validPrices = candleData.flatMap(d => [d.high, d.low]);
    let minPrice = Math.min(...validPrices);
    let maxPrice = Math.max(...validPrices);

    // 방어 코드: min/max가 같은 경우 약간의 패딩 추가
    if (minPrice === maxPrice) {
      minPrice = minPrice * 0.98;
      maxPrice = maxPrice * 1.02;
    } else {
      const padding = (maxPrice - minPrice) * 0.02;
      minPrice = minPrice - padding;
      maxPrice = maxPrice + padding;
    }

    const priceRange = {
      min: minPrice,
      max: maxPrice
    };

    console.log(`Processed ${candleData.length} candles, price range: ${priceRange.min} - ${priceRange.max}`);

    return {
      candleData,
      priceRange
    };
  };

  // 차트 데이터 로드 (useCallback으로 감싸서 useEffect 의존성 경고 방지)
  const loadChartData = useCallback(async (period = selectedPeriod, code = stockCode) => {
    setLoading(true);
    setError(null);

    try {
      const periodCode = { '일': 'D', '주': 'W', '월': 'M', '년': 'Y' };
      const url = `/api/stock/kis-chart/${code}?period=${periodCode[period] || 'D'}`;
      console.log('차트 데이터 API 호출:', url);

      const response = await fetch(url);
      const data = await response.json();

      console.log('API Response (loadChartData):', data);

      // 서버에서 래핑한 구조일 수 있으니 transformApiData에 통째로 전달
      if (response.ok && data && (data.success || data.data || data.output)) {
        const payload = data.data || data.output || data;
        const transformedData = transformApiData(payload);
        if (transformedData) {
          setStockData(transformedData);
        } else {
          setStockData(null);
          setError('차트 데이터 변환에 실패했습니다.');
        }
      } else {
        setStockData(null);
        setError((data && data.message) || '차트 데이터를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('데이터 로드 오류:', err);
      setStockData(null);
      setError(`데이터 로드 실패: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, stockCode]);
  
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
  }, [stockCode, loadChartData]);

  // 간단한 캔들차트 컴포넌트
  const SimpleCandlestickChart = ({ stockData }) => {
  const [chartSize, setChartSize] = useState({ width: 1200, height: 350 });
    
    useEffect(() => {
      const updateSize = () => {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          setChartSize({
            width: Math.max(950, rect.width - 40),
            height: 300
          });
        }
      };
      
      updateSize();
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }, []);

    if (!stockData?.candleData?.length) {
      return <div className="text-center py-8 text-gray-500">차트 데이터가 없습니다.</div>;
    }

    const { candleData, priceRange } = stockData;
    
    const margin = { left: 60, right: 40, top: 20, bottom: 60 };
    const chartAreaWidth = chartSize.width - margin.left - margin.right;
    const chartAreaHeight = chartSize.height - margin.top - margin.bottom;
    
    const candleWidth = Math.max(2, Math.min(12, chartAreaWidth / candleData.length * 0.7));
    const candleSpacing = chartAreaWidth / candleData.length;
    
    const scaleY = (price) => {
      if (typeof price !== 'number' || isNaN(price)) return null;
      const denom = (priceRange.max - priceRange.min);
      if (!denom || Math.abs(denom) < 1e-8) {
        // priceRange가 0에 가까운 경우 중앙값으로 매핑
        return margin.top + chartAreaHeight / 2;
      }
      return margin.top + ((priceRange.max - price) / denom) * chartAreaHeight;
    };

    const scaleX = (index) => {
      return margin.left + (index + 0.5) * candleSpacing;
    };

    return (
  <div ref={containerRef} className="w-full h-[300px] overflow-hidden">
  <svg width={chartSize.width} height={chartSize.height} className="bg-white rounded">
          {/* 배경 그리드 */}
          <defs>
            <pattern id="grid" width="50" height="25" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 25" fill="none" stroke="#f5f5f5" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect
            x={margin.left}
            y={margin.top}
            width={chartAreaWidth}
            height={chartAreaHeight}
            fill="url(#grid)"
          />
          
          {/* 가격 눈금선 */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const price = priceRange.min + (priceRange.max - priceRange.min) * ratio;
            const y = scaleY(price);
            if (y === null || isNaN(y)) return null;
            return (
              <g key={i}>
                <line
                  x1={margin.left}
                  y1={y}
                  x2={margin.left + chartAreaWidth}
                  y2={y}
                  stroke="#e5e5e5"
                  strokeWidth="1"
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

          {/* 캔들스틱 */}
          {candleData.map((candle, index) => {
            const x = scaleX(index);
            const isGreen = candle.isUp;
            
            const openY = scaleY(candle.open);
            const closeY = scaleY(candle.close);
            const highY = scaleY(candle.high);
            const lowY = scaleY(candle.low);
            // 좌표 계산 실패 시 해당 캔들 건너뜀
            if ([openY, closeY, highY, lowY].some(v => v === null || isNaN(v))) {
              return null;
            }

            const bodyTop = Math.min(openY, closeY);
            const bodyHeight = Math.abs(openY - closeY);
            
            return (
              <g key={`candle-${index}`}>
                {/* 위아래 선 (High-Low) */}
                <line
                  x1={x}
                  y1={highY}
                  x2={x}
                  y2={lowY}
                  stroke={isGreen ? "#22c55e" : "#ef4444"}
                  strokeWidth="1"
                />
                {/* 캔들 몸통 (Open-Close) */}
                <rect
                  x={x - candleWidth / 2}
                  y={bodyTop}
                  width={candleWidth}
                  height={Math.max(bodyHeight, 1)}
                  fill={isGreen ? "#22c55e" : "#ef4444"}
                  stroke={isGreen ? "#22c55e" : "#ef4444"}
                  strokeWidth="1"
                />
              </g>
            );
          })}

          {/* X축 */}
          <line
            x1={margin.left}
            y1={chartSize.height - margin.bottom}
            x2={margin.left + chartAreaWidth}
            y2={chartSize.height - margin.bottom}
            stroke="#333"
            strokeWidth="1"
          />

          {/* Y축 */}
          <line
            x1={margin.left}
            y1={margin.top}
            x2={margin.left}
            y2={chartSize.height - margin.bottom}
            stroke="#333"
            strokeWidth="1"
          />

          {/* 날짜 레이블 */}
          {candleData.map((candle, index) => {
            // 날짜를 적당히 간격을 두고 표시
            if (index % Math.max(1, Math.floor(candleData.length / 8)) === 0) {
              const x = scaleX(index);
              const dateStr = (candle.date || '').toString();
              let formattedDate = dateStr;
              if (dateStr.length >= 8) {
                formattedDate = `${dateStr.slice(4, 6)}.${dateStr.slice(6, 8)}`;
              }
              return (
                <text
                  key={`date-${index}`}
                  x={x}
                  y={chartSize.height - margin.bottom + 15}
                  fontSize="10"
                  fill="#666"
                  textAnchor="middle"
                >
                  {formattedDate}
                </text>
              );
            }
            return null;
          })}

          
        </svg>
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* 기간 선택 버튼 */}
      <div className="flex justify-end gap-2 mb-4">
        {['일', '주', '월', '년'].map(period => (
          <button
            key={period}
            onClick={() => handlePeriodChange(period)}
            className={`px-2 py-1 rounded-md font-medium text-sm transition-colors ${
              selectedPeriod === period
                ? 'bg-[#89D67D] text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {period}
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
        <div className="rounded-lg p-4">
          <SimpleCandlestickChart stockData={stockData} />
        </div>
      )}
    </div>
  );
};

export default KISStockChart;