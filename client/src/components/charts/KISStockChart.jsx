import React, { useState, useEffect, useRef, useCallback } from 'react';

const KISStockChart = ({ stockCode }) => {
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('일');
  // simple in-memory cache per component instance: key = `${stockCode}:${period}`
  const cacheRef = useRef(new Map());
  // in-flight requests to dedupe simultaneous fetches: key -> Promise
  const inflightRef = useRef(new Map());
  
  const containerRef = useRef(null);
  // animation trigger when stockData updates
  const [shouldAnimate, setShouldAnimate] = useState(false);

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

        // 날짜 -> 타임스탬프 생성: 다양한 포맷 대응
        let timestamp = null;
        // 1) server가 YYYYMMDD 형태의 문자열을 'timestamp' 필드로 보낼 수 있음
        if (item.timestamp && typeof item.timestamp === 'string' && /^\d{8}$/.test(item.timestamp)) {
          const ds = item.timestamp;
          const y = parseInt(ds.slice(0, 4), 10);
          const m = parseInt(ds.slice(4, 6), 10) - 1;
          const d = parseInt(ds.slice(6, 8), 10);
          timestamp = new Date(y, m, d).getTime();
        }

        // 2) dateStr가 ISO 문자열(e.g. 2025-09-10T00:00:00)인 경우 파싱
        if (!timestamp && dateStr && typeof dateStr === 'string') {
          // YYYYMMDD 형식인지 확인
          if (/^\d{8}$/.test(dateStr)) {
            const y = parseInt(dateStr.slice(0, 4), 10);
            const m = parseInt(dateStr.slice(4, 6), 10) - 1;
            const d = parseInt(dateStr.slice(6, 8), 10);
            timestamp = new Date(y, m, d).getTime();
          } else {
            // ISO 형식 또는 기타 JS Date로 파싱 가능한 형식
            const parsed = new Date(dateStr);
            if (!isNaN(parsed.getTime())) {
              timestamp = parsed.getTime();
            }
          }
        }

        // 3) 마지막 수단: 숫자형 timestamp가 있으면 사용
        if (!timestamp && item.timestamp && !isNaN(Number(item.timestamp))) {
          // but if value looks like YYYYMMDD as number (e.g. 20250910), treat accordingly
          const num = Number(item.timestamp);
          if (num > 19700101 && num < 99991231) {
            const ds = String(item.timestamp).padStart(8, '0');
            const y = parseInt(ds.slice(0, 4), 10);
            const m = parseInt(ds.slice(4, 6), 10) - 1;
            const d = parseInt(ds.slice(6, 8), 10);
            timestamp = new Date(y, m, d).getTime();
          } else {
            timestamp = Number(item.timestamp);
          }
        }

        return {
          date: dateStr,
          timestamp,
          open,
          high,
          low,
          close,
          isUp: close >= open
        };
      })
      .filter(item => item !== null) // null 항목 제거
      .sort((a, b) => {
        const ta = a.timestamp || 0;
        const tb = b.timestamp || 0;
        return ta - tb; // 오름차순: 오래된 -> 최신
      });

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
  // stable loader that accepts explicit params to avoid identity changes
  const loadChartData = useCallback(async (period, code) => {
    setError(null);

    const periodCode = { '일': 'D', '주': 'W', '월': 'M', '년': 'Y' };
    const codeParam = periodCode[period] || 'D';
    const cacheKey = `${code}:${codeParam}`;

    // return cached immediately if exists
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      setStockData(cached);
      return cached;
    }

    // If there's an in-flight request for the same key, await it (dedupe)
    const inflight = inflightRef.current.get(cacheKey);
    if (inflight) {
      try {
        const result = await inflight;
        if (result) setStockData(result);
        return result;
      } catch (err) {
        // fallthrough to try fetching again
        console.warn('In-flight request failed, refetching:', err);
      }
    }

    // create fetch promise and store in inflight map
    const fetchPromise = (async () => {
      try {
        const url = `/api/stock/kis-chart/${code}?period=${codeParam}`;
        console.log('차트 데이터 API 호출:', url);
        const response = await fetch(url);
        const data = await response.json();
        console.log('API Response (loadChartData):', data);

        if (response.ok && data && (data.success || data.data || data.output)) {
          const payload = data.data || data.output || data;
          const transformedData = transformApiData(payload);
          if (transformedData) {
            try { cacheRef.current.set(cacheKey, transformedData); } catch (e) { console.warn('캐시 저장 실패:', e); }
            return transformedData;
          } else {
            throw new Error('차트 데이터 변환에 실패했습니다.');
          }
        } else {
          throw new Error((data && data.message) || '차트 데이터를 불러오는데 실패했습니다.');
        }
      } finally {
        // cleanup inflight later in finally of caller
      }
    })();

    inflightRef.current.set(cacheKey, fetchPromise);

    try {
      const result = await fetchPromise;
      if (result) setStockData(result);
      return result;
    } catch (err) {
      console.error('데이터 로드 오류:', err);
      setError(err.message || `데이터 로드 실패`);
      return null;
    } finally {
      inflightRef.current.delete(cacheKey);
    }
  }, []);
  
  // 기간 변경 핸들러
  const handlePeriodChange = (period) => {
  // selectedPeriod 상태만 변경하면 useEffect가 실질적인 데이터 로드를 담당합니다.
  setSelectedPeriod(period);
  };

  // stockCode 또는 선택 기간이 변경될 때마다 차트 데이터 로드
  useEffect(() => {
    if (stockCode) {
      // call stable loader with explicit params
      loadChartData(selectedPeriod, stockCode);
    }
  }, [stockCode, selectedPeriod, loadChartData]);

  // trigger a brief animation when stockData updates
  useEffect(() => {
    if (!stockData) return;
    setShouldAnimate(true);
    const t = setTimeout(() => setShouldAnimate(false), 420); // matches dur below
    return () => clearTimeout(t);
  }, [stockData]);

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

    // 균일한 간격으로 그리기: 인덱스 기반 X 스케일 사용
    // (주말/공휴일에 데이터가 없더라도 캔들 사이에 공백이 생기지 않음)
    const scaleX = (_value, index) => {
      return margin.left + (index + 0.5) * candleSpacing;
    };

    return (
  <div ref={containerRef} className="w-full h-[300px] overflow-hidden flex justify-center">
  <svg width={Math.min(chartSize.width, 1200)} height={chartSize.height} className="bg-white rounded mx-auto max-w-full">
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
            const x = scaleX(candle.timestamp, index);
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
                >
                  {shouldAnimate && (
                    <>
                      {/* grow height from 1px to full height, and adjust y from bottom to bodyTop */}
                      <animate
                        attributeName="height"
                        from="1"
                        to={Math.max(bodyHeight, 1)}
                        dur="350ms"
                        fill="freeze"
                      />
                      <animate
                        attributeName="y"
                        from={bodyTop + Math.max(bodyHeight, 1) - 1}
                        to={bodyTop}
                        dur="350ms"
                        fill="freeze"
                      />
                    </>
                  )}
                </rect>
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
            // 날짜를 적당히 간격을 두고 표시 (index 기반 샘플링)
            if (index % Math.max(1, Math.floor(candleData.length / 8)) === 0) {
              const x = scaleX(candle.timestamp, index);
              // 포맷: timestamp(ms) 우선, ISO 문자열, YYYYMMDD 문자열 순으로 처리하여 MM.DD 반환
              let formattedDate = '';
              if (candle.timestamp && typeof candle.timestamp === 'number' && !isNaN(candle.timestamp)) {
                const d = new Date(candle.timestamp);
                if (selectedPeriod === '년') {
                  formattedDate = String(d.getFullYear());
                } else {
                  const mm = String(d.getMonth() + 1).padStart(2, '0');
                  const dd = String(d.getDate()).padStart(2, '0');
                  formattedDate = `${mm}.${dd}`;
                }
              } else if (candle.date && typeof candle.date === 'string') {
                // ISO 형식인지 확인
                const isoCheck = /\d{4}-\d{2}-\d{2}/.test(candle.date);
                if (isoCheck) {
                  const d = new Date(candle.date);
                  if (!isNaN(d.getTime())) {
                    if (selectedPeriod === '년') {
                      formattedDate = String(d.getFullYear());
                    } else {
                      const mm = String(d.getMonth() + 1).padStart(2, '0');
                      const dd = String(d.getDate()).padStart(2, '0');
                      formattedDate = `${mm}.${dd}`;
                    }
                  }
                } else if (/^\d{8}$/.test(candle.date)) {
                  // YYYYMMDD
                  if (selectedPeriod === '년') {
                    formattedDate = `${candle.date.slice(0,4)}`;
                  } else {
                    formattedDate = `${candle.date.slice(4, 6)}.${candle.date.slice(6, 8)}`;
                  }
                }
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
      <div className="flex justify-end gap-2 mt-2 mb-4">
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

      // 로딩 및 에러 표시 (UI 로더는 제거됨; 기존 차트는 계속 표시됩니다)

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
          {stockData && (
            <div className="rounded-lg p-4 flex justify-center">
              <SimpleCandlestickChart stockData={stockData} />
            </div>
          )}
    </div>
  );
};

export default KISStockChart;