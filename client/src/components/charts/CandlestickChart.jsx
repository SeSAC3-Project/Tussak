import React, { useState, useEffect } from 'react';

const CandlestickChart = ({ stockData, containerRef }) => {
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
  }, [containerRef]);

  if (!stockData?.candleData?.length) return null;

  const { candleData, priceRange, maxVolume } = stockData;

    // 데이터는 이미 transformApiData에서 Date 객체로 변환되었으므로 그대로 사용
    const processedCandleData = candleData;  const margin = { left: 60, right: 40, top: 20, bottom: 120 };
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

export default CandlestickChart;
