import React from 'react';

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
    const chartContainerWidth = 600;
    const candleWidth = Math.max(2, Math.min(8, chartContainerWidth / Math.max(data.length, chartState.visibleCandles)));
    const spacing = candleWidth + 2;

    const totalDataWidth = data.length * spacing;
    const maxPossibleWidth = chartState.visibleCandles * spacing;
    const leftOffset = Math.max(0, maxPossibleWidth - totalDataWidth);

    const scaleY = (price) => {
        return 280 - ((price - priceRange.min) / (priceRange.max - priceRange.min)) * 260;
    };

    return (
        <div
            ref={chartRef}
            className={`relative w-full h-80 outline-none ${chartState.isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMoveChart}
            onMouseLeave={handleMouseLeaveChart}
            style={{ userSelect: 'none' }}
            tabIndex={0}
        >
            <svg width="100%" height="100%" className="overflow-visible">
                <defs>
                    <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="1" />
                    </pattern>
                </defs>
                <rect width="70%" height="100%" fill="url(#grid)" />

                {/* 가격 눈금 */}
                <g>
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                        const price = priceRange.min + (priceRange.max - priceRange.min) * ratio;
                        const y = scaleY(price);
                        return (
                            <g key={i}>
                                <line x1="35" y1={y} x2="40" y2={y} stroke="#ccc" strokeWidth="1" />
                                <text x="32" y={y + 4} fontSize="10" fill="#666" textAnchor="end">
                                    {Math.round(price).toLocaleString()}
                                </text> 
                            </g>
                        );
                    })}
                </g>

                <g transform="translate(40, 20)">
                    {/* 이동평균선 */}
                    {data.length > 1 && (
                        <>
                            <polyline 
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="1.5"
                                points={data.map((d, i) => `${leftOffset + i * spacing + candleWidth/2},${scaleY(d.ma5) - 20}`).join(' ')}
                            />
                            <polyline
                                fill="none"
                                stroke="#f59e0b"
                                strokeWidth="1.5"
                                points={data.map((d, i) => `${leftOffset + i * spacing + candleWidth/2}, ${scaleY(d.ma20) - 20}`).join(' ')}
                            />
                            <polyline
                                fill="none"
                                stroke="#8b5cf6"
                                strokeWidth="1.5"
                                points={data.map((d, i) => `${leftOffset + i * spacing + candleWidth/2}, ${scaleY(d.ma60) - 20}`).join(' ')}
                            />
                        </>
                    )}

                    {/* 현재가 라인 */}
                    <line
                        x1="0"
                        y1={scaleY(currentPrice) - 20}
                        x2={chartContainerWidth}
                        y2={scaleY(currentPrice) - 20}
                        stroke="#ef4444"
                        strokeWidth="1"
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
                        const x = leftOffset + index * spacing;
                        const isGreen = candle.close > candle.open;
                        const bodyTop = Math.min(candle.open, candle.close);
                        const bodyBottom = Math.max(candle.open, candle.close);
                        const bodyHeight = Math.abs(candle.close - candle.open);

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
                                    x={x}
                                    y={scaleY(bodyTop) - 20}
                                    width={candleWidth}
                                    height={Math.max((bodyHeight / (priceRange.max - priceRange.min)) * 260, 1)}
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
    );
};

export default CandlestickChart;
