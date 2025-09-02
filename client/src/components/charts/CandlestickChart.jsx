import { useEffect, useState, useRef } from 'react';

const CandlestickChart = ({ 
    data, 
    chartState, 
    currentPrice, 
    priceRange,
    chartRef,
    handleWheel,
    handleMouseDown,
    handleMouseMoveChart,
    handleMouseLeaveChart
}) => {
    const containerRef = useRef(null);
    const [chartContainerWidth, setChartContainerWidth] = useState(600);
    const [chartContainerHeight] = useState(400);

    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const finalWidth = rect.width - 48;
                setChartContainerWidth(Math.max(300, finalWidth));
            }
        };

        updateWidth();

        const resizeObserver = new ResizeObserver(updateWidth);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        window.addEventListener('resize', updateWidth);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', updateWidth)
        };
    }, []);

    const leftMargin = 60;
    const rightMargin = 20;
    const topMargin = 20;
    const chartAreaWidth = chartContainerWidth - leftMargin - rightMargin;
    const chartAreaHeight = chartContainerHeight - topMargin - 40;

    const candleWidth = Math.max(2, Math.min(8, chartAreaWidth / Math.max(data.length, 50)));
    const candleSpacing = chartAreaWidth / data.length;

    const scaleY = (price) => {
        return topMargin + chartAreaHeight - ((price - priceRange.min) / (priceRange.max - priceRange.min)) * chartAreaHeight;
    };

    return (
<div ref={containerRef} className="w-full">
    <div className="overflow-x-auto">
        <div
            ref={chartRef}
            className={`relative outline-none cursor-grab`
                // ${chartState.isDragging ? 'cursor-grabbing' : 'cursor-grab'}
            }
            style={{
                userSelect: 'none',
                width: `${chartContainerWidth}px`,
                height: `${chartContainerHeight}px`,
            }}
            tabIndex={0}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMoveChart}
            onMouseLeave={handleMouseLeaveChart}
        >
            <svg width="100%" height="100%" className="overflow-visible">
                <defs>
                    <pattern id="grid" width={chartAreaWidth / 10} height="20" patternUnits="userSpaceOnUse">
                        <path d={`M ${chartAreaWidth / 10} 0 L 0 0 0 20`} fill="none" stroke="#f0f0f0" strokeWidth="1" />
                    </pattern>
                </defs>
                <rect 
                    x={leftMargin}
                    y={topMargin}
                    width={chartAreaWidth}
                    height={chartAreaHeight}
                    fill="url(#grid)"
                />

                {/* 가격 눈금 */}
                <g>
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                        const price = priceRange.min + (priceRange.max - priceRange.min) * ratio;
                        const y = scaleY(price);
                        return (
                            <g key={i}>
                                {/* 가격선 */}
                                <line 
                                    x1={leftMargin} 
                                    y1={y} 
                                    x2={leftMargin + chartAreaWidth} 
                                    y2={y} 
                                    stroke="#ccc" 
                                    strokeWidth="1" 
                                    strokeDasharray="2,2"
                                    opacity="0.5"
                                />
                                {/* 가격 텍스트 */}
                                <text 
                                    x={leftMargin - 5} 
                                    y={y + 4} 
                                    fontSize="10" 
                                    fill="#666" 
                                    textAnchor="end"
                                >
                                    {Math.round(price).toLocaleString()}
                                </text> 
                            </g>
                        );
                    })}
                </g>

                {/* 차트 영역에서 */}
                <g 
                    // transform="translate(40, 20)"
                >
                    {/* 이동평균선 */}
                    {data.length > 1 && (
                        <>
                            <polyline 
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="1.5"
                                points={data.map((d, i) => {
                                    const xPosition = leftMargin + (i / Math.max(data.length - 1, 1)) * chartAreaWidth;
                                    const yPosition = scaleY(d.ma5 || d.close);
                                    return `${xPosition}, ${yPosition}`;
                                }).join(' ')}
                            />
                            <polyline
                                fill="none"
                                stroke="#f59e0b"
                                strokeWidth="1.5"
                                points={data.map((d, i) => {
                                            const xPosition = leftMargin + (i / Math.max(data.length - 1, 1)) * chartAreaWidth;
                                            const yPosition = scaleY(d.ma20 || d.close);
                                            return `${xPosition},${yPosition}`;
                                        }).join(' ')}
                            />
                            <polyline
                                fill="none"
                                stroke="#8b5cf6"
                                strokeWidth="1.5"
                                points={data.map((d, i) => {
                                            const xPosition = leftMargin + (i / Math.max(data.length - 1, 1)) * chartAreaWidth;
                                            const yPosition = scaleY(d.ma60 || d.close);
                                            return `${xPosition},${yPosition}`;
                                        }).join(' ')}
                            />
                        </>
                    )}

                    {/* 현재가 라인 */}
                    <line
                        x1={leftMargin}
                        y1={scaleY(currentPrice)}
                        x2={leftMargin + chartAreaWidth}
                        y2={scaleY(currentPrice)}
                        stroke="#ef4444"
                        strokeWidth="2"
                        strokeDasharray="4,4"
                        opacity="0.7"
                    />

                    {/* 크로스헤어 */}
                    {chartState.crosshair.visible && (
                        <g opacity="0.7">
                            <line
                                x1={chartState.crosshair.x}
                                y1="0"
                                x2={chartState.crosshair.x}
                                y2="260"
                                stroke="#666"
                                strokeWidth="1"
                                strokeDasharray="2,2"
                            />
                            <line
                                x1="0"
                                y1={chartState.crosshair.y}
                                x2={chartContainerWidth}
                                y2={chartState.crosshair.y}
                                stroke="#666"
                                strokeWidth="1"
                                strokeDasharray="2,2"
                            />
                        </g>
                    )}

                    {/* 캔들 */}
                    {data.map((candle, index) => {
                        const x = leftMargin + (index / Math.max(data.length - 1, 1)) * chartAreaWidth - candleWidth / 2;
                        const isGreen = candle.close > candle.open;
                        const bodyTop = Math.min(candle.open, candle.close);
                        const bodyBottom = Math.max(candle.open, candle.close);
                        const bodyHeight = Math.abs(scaleY(bodyBottom) - scaleY(bodyTop));

                        return (
                            <g key={index}>
                                <line
                                    x1={x + candleWidth/2}
                                    y1={scaleY(candle.high) - 20}
                                    x2={x + candleWidth/2}
                                    y2={scaleY(candle.low) - 20}
                                    stroke={isGreen ? "#22c55e" : "#ef4444"}
                                    strokeWidth="1"
                                />
                                <rect
                                    className="hover:opacity-80 cursor-pointer transition-opacity"
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
                </g>
            </svg>

            {/* 차트 정보 패널 */}
            <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg text-xs space-y-1">
                <div className="flex items-center space-x-2">
                    <span className="text-blue-400">🔍</span>
                    <span>{chartState.visibleCandles}개 캔들</span>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-green-400">📊</span>
                    <span>{chartState.startIndex + 1}-{chartState.startIndex + data.length}</span>
                </div>
                <div className="text-center text-xs text-gray-300">
                    {chartState.selectedPeriod === '1일' ? '📈' :
                    chartState.selectedPeriod === '1주' ? '📊' :
                    chartState.selectedPeriod === '1개월' ? '📅' : '🗓️'}
                    {' '}
                    {chartState.selectedPeriod}
                </div>
            </div>

            {/* 컨트롤 가이드 */}
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-xs">
                <div className="hidden lg:block">
                    🖱️ 휠:줌 | 드래그:이동 | ⌨️ ←→:스크롤 | Home/End:처음/끝
                </div>
                <div className="lg:hidden">
                    🖱️ 휠:줌 | 드래그:이동
                </div>
            </div>
        </div>
    </div>
</div>
    );
};

export default CandlestickChart;
