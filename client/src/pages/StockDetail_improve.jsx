import React, { useState, useRef, useCallback } from 'react';

export default function StockDetail({ stock }) {
    
    const [chartState, setChartState] = useState({
        startIndex: 0,
        visibleCandles: 80, // 더 많은 캔들 표시
        isDragging: false,
        selectedPeriod: '1개월',
        crosshair: { x: null, y: null, visible: false }
    });

    const chartRef = useRef(null);
    const dragRef = useRef({ isDragging: false, startX: 0, startIndex: 0});

    // 더미데이터 생성용
    const generatePeriodData = (period) => {
        const data = [];
        let basePrice = 235000;
        
        const totalPoints = 300;
        const dateIncrement = (i) => new Date(2024, 0, 15 + i);

        // 실제로 화면에 보여줄 개수 설정
        let sliceCount;
        switch(period) {
            case '1일':
                sliceCount = 78;   
                break;
            case '1주':
                sliceCount = 140;  
                break;
            case '1개월':
                sliceCount = 220;  
                break;
            case '3개월':
                sliceCount = 300;  
                break;
            default:
                sliceCount = 220;
        }

        const volatilityMap = {
            '1일': { price: 2000, volume: 0.1 },
            '1주': { price: 5000, volume: 0.05 },
            '1개월': { price: 8000, volume: 0.1 },
            '3개월': { price: 12000, volume: 0.3 }
        };

        const volatility = volatilityMap[period] || volatilityMap['1개월'];

        for (let i = 0; i < totalPoints; i++) {
            const trendFactor = Math.sin(i * 0.1) * 0.3 + (Math.random() - 0.5) * 0.7;
            const open = basePrice + (Math.random() - 0.5) * volatility.price;
            const close = open + trendFactor * volatility.price;
            const high = Math.max(open, close) + Math.random() * volatility.price * 0.5
            const low = Math.min(open, close) - Math.random() * volatility.price * 0.5;
            const volume = (Math.random() * 1000000 + 500000) * volatility.volume;

            data.push({
                date: dateIncrement(i),
                open,
                high,
                low,
                close,
                volume,
                period
            });

            basePrice += (close - basePrice) * 0.1;
        }

        data.forEach((item, index) => {
            const ma5Data = data.slice(Math.max(0, index-4), index + 1);
            item.ma5 = ma5Data.reduce((sum, d) => sum + d.close, 0) / ma5Data.length;

            const ma20Data = data.slice(Math.max(0, index-19), index + 1);
            item.ma20 = ma20Data.reduce((sum, d) => sum + d.close, 0) / ma20Data.length;

            const ma60Data = data.slice(Math.max(0, index-59), index + 1);
            item.ma60 = ma60Data.reduce((sum, d) => sum + d.close, 0) / ma60Data.length;

            const ma120Data = data.slice(Math.max(0, index-119), index + 1);
            item.ma120 = ma120Data.reduce((sum, d) => sum + d.close, 0) / ma120Data.length;
        });

        return data.slice(Math.max(0, data.length - sliceCount));
    };

    const candleData = generatePeriodData(chartState.selectedPeriod);

    const visibleData = candleData.slice( 
        chartState.startIndex,
        chartState.startIndex + chartState.visibleCandles
    );

    const currentPrice = candleData.length > 0 ? candleData[candleData.length - 1].close : 235000;

    const handlePeriodChange = (period) => {
        const newData = generatePeriodData(period);
        const visibleCandles = 80; // 더 많은 캔들 표시
        const startIndex = Math.max(0, newData.length - visibleCandles);

        setChartState(prev => ({
            ...prev,
            selectedPeriod: period,
            startIndex: startIndex,
            visibleCandles: visibleCandles
        }));
    };

    const handleWheel = useCallback((event) => {
        event.preventDefault();

        const rect = chartRef.current.getBoundingClientRect();
        const mouseX = event.clientX - rect.left - 40;
        
        // 차트 영역 내부에서만 줌 허용
        if (mouseX < 0 || mouseX > 600) return;

        setChartState(prev => {
            const delta = event.deltaY;
            const zoomFactor = delta > 0 ? 1.15 : 1 / 1.15;
            const newVisibleCandles = Math.max(10, Math.min(Math.min(candleData.length, 150), prev.visibleCandles * zoomFactor));

            const chartWidth = 600;
            const mouseRatio = mouseX / chartWidth;
            const currentCenterIndex = prev.startIndex + (prev.visibleCandles * mouseRatio);

            let newStartIndex = Math.round(currentCenterIndex - (newVisibleCandles * mouseRatio));
            newStartIndex = Math.max(0, Math.min(candleData.length - newVisibleCandles, newStartIndex));

            return {
                ...prev,
                startIndex: Math.floor(newStartIndex),
                visibleCandles: Math.floor(newVisibleCandles)
            };
        });
    }, [candleData.length]);

    const handleMouseDown = useCallback((event) => {
        if (event.button !== 0) return;

        const rect = chartRef.current.getBoundingClientRect();
        const mouseX = event.clientX - rect.left - 40;
        
        // 차트 영역 내부에서만 드래그 허용
        if (mouseX < 0 || mouseX > 600) return;

        dragRef.current = {
            isDragging: true, 
            startX: event.clientX - rect.left,
            startIndex: chartState.startIndex
        };

        setChartState(prev => ({ ...prev, isDragging: true}));
        event.preventDefault();
    }, [chartState.startIndex]);

    const handleMouseMove = useCallback((event) => {
        if (!dragRef.current.isDragging) return;

        const rect = chartRef.current.getBoundingClientRect();
        const currentX = event.clientX - rect.left;
        const deltaX = currentX - dragRef.current.startX;

        const chartWidth = 600;
        const candleWidth = Math.max(4, Math.min(16, chartWidth / chartState.visibleCandles));
        const spacing = candleWidth + 2;
        const candlesMoved = Math.round(-deltaX / spacing);

        setChartState(prev => {
            const newStartIndex = Math.max(0,
                Math.min(candleData.length - prev.visibleCandles, dragRef.current.startIndex + candlesMoved)
            );
            
            return {
                ...prev,
                startIndex: newStartIndex
            };
        });
    }, [candleData.length, chartState.visibleCandles]);

    const handleMouseUp = useCallback(() => {
        dragRef.current.isDragging = false;
        setChartState(prev => ({ ...prev, isDragging: false}));
    }, []);

    // crosshair 이벤트 완전 제거 - 마우스 움직임으로는 아무 이벤트 없음
    
    const formatDate = (date, period) => {
        if (period === '1일') {
            return date.toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        } else {
            return date.toLocaleDateString('ko-KR', {
                month: '2-digit',
                day: '2-digit'
            }).replace(/\./g, '/').replace(/ /g, '');
        }
    };

    const handleKeyDown = useCallback((event) => {
        if (!chartRef.current) return;

        switch(event.key) {
            case 'ArrowLeft':
                event.preventDefault();
                setChartState(prev => ({
                    ...prev,
                    startIndex: Math.max(0, prev.startIndex - 5)
                }));
                break;
            case 'ArrowRight':
                event.preventDefault();
                setChartState(prev => ({
                    ...prev,
                    startIndex: Math.min(candleData.length - prev.visibleCandles, prev.startIndex + 5)
                }));
                break;
            case 'Home':
                event.preventDefault();
                setChartState(prev => ({
                    ...prev,
                    startIndex: Math.max(0, candleData.length - prev.visibleCandles)
                }));
                break;
        }
    }, [candleData.length]);

    React.useEffect(() => {
        const handleGlobalMouseMove = (e) => handleMouseMove(e);
        const handleGlobalMouseUp = (e) => handleMouseUp(e);

        if (dragRef.current.isDragging) {
            document.addEventListener('mousemove', handleGlobalMouseMove);
            document.addEventListener('mouseup', handleGlobalMouseUp);
        }

        const handleGlobalKeyDown = (e) => handleKeyDown(e);
        document.addEventListener('keydown', handleGlobalKeyDown);

        return () => {
            document.removeEventListener('mousemove', handleGlobalMouseMove);
            document.removeEventListener('mouseup', handleGlobalMouseUp);
            document.removeEventListener('keydown', handleGlobalKeyDown);
        };

    }, [handleMouseMove, handleMouseUp, handleKeyDown]);

    React.useEffect(() => {
        if (chartRef.current) {
            chartRef.current.tabIndex = 0;
        }
    }, []);

    const getPriceRange = (data) => {
        if (!data.length) return { min: 0, max: 100000};

        let min = Infinity;
        let max = -Infinity;

        data.forEach(candle => {
            min = Math.min(min, candle.low, candle.ma5, candle.ma20, candle.ma60, candle.ma120);
            max = Math.max(max, candle.high, candle.ma5, candle.ma20, candle.ma60, candle.ma120);
        });

        const padding = (max - min) * 0.2;
        return { min: min - padding, max: max + padding};
    };

    const getVolumeRange = (data) => {
        if (!data.length) return { min: 0, max: 1000000 };
        
        const volumes = data.map(d => d.volume);
        const maxVolume = Math.max(...volumes);
        return { min: 0, max: maxVolume };
    };

    const priceRange = getPriceRange(visibleData);
    const volumeRange = getVolumeRange(visibleData);

    // 캔들차트와 거래량 차트
    const CandlestickChart = ({ data }) => {
        const chartContainerWidth = 600;
        const candleWidth = Math.max(1, Math.min(6, chartContainerWidth / Math.max(data.length, chartState.visibleCandles)));
        const spacing = candleWidth + 2;

        const totalDataWidth = data.length * spacing;
        const maxPossibleWidth = chartState.visibleCandles * spacing;
        const leftOffset = Math.max(0, maxPossibleWidth - totalDataWidth);

        const scaleY = (price) => {
            return 280 - ((price - priceRange.min) / (priceRange.max - priceRange.min)) * 200;
        };

        const scaleVolumeY = (volume) => {
            return 80 - ((volume - volumeRange.min) / (volumeRange.max - volumeRange.min)) * 60;
        };

        return (
            <div className="w-full">
                {/* 기간 선택 버튼 */}
                <div className="flex gap-2 mb-4">
                    {['1일', '1주', '1개월', '3개월'].map(period => (
                        <button
                            key={period}
                            onClick={() => handlePeriodChange(period)}
                            className={`px-3 py-1 rounded text-sm ${
                                chartState.selectedPeriod === period 
                                    ? 'bg-blue-500 text-white' 
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            {period}
                        </button>
                    ))}
                </div>

                {/* 메인 차트 */}
                <div
                    ref={chartRef}
                    className={`relative w-full h-80 outline-none border ${
                        chartState.isDragging ? 'cursor-grabbing' : 'cursor-grab'
                    }`}
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    style={{ userSelect: 'none' }}
                    tabIndex={0}
                >
                    <svg width="100%" height="100%" className="overflow-visible">
                        <defs>
                            <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="1" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />

                        {/* Y축 가격 레이블 */}
                        <g>
                            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                                const price = priceRange.min + (priceRange.max - priceRange.min) * ratio;
                                const y = scaleY(price)
                                return (
                                    <g key={i}>
                                        <line x1="35" y1={y} x2="40" y2={y} stroke="#ccc" strokeWidth="1" />
                                        <text x="32" y={y + 4} fontSize="10" fill="#666" textAnchor="end">
                                            {Math.round(price).toLocaleString()}
                                        </text> 
                                    </g>
                                );
                            })}
                            
                            {/* 현재가 Y축 레이블 */}
                            <g>
                                <rect
                                    x="5"
                                    y={scaleY(currentPrice) - 8}
                                    width="30"
                                    height="16"
                                    fill="#ef4444"
                                    rx="2"
                                />
                                <text
                                    x="20"
                                    y={scaleY(currentPrice) + 3}
                                    fontSize="9"
                                    fill="white"
                                    textAnchor="middle"
                                    fontWeight="600"
                                >
                                    {Math.round(currentPrice).toLocaleString()}
                                </text>
                            </g>
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
                                    <polyline
                                        fill="none"
                                        stroke="#6b7280"
                                        strokeWidth="1.5"
                                        strokeDasharray="3,3"
                                        points={data.map((d, i) => `${leftOffset + i * spacing + candleWidth/2}, ${scaleY(d.ma120) - 20}`).join(' ')}
                                    />
                                </>
                            )}

                            {/* 현재가 수평선 */}
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

                            {/* 십자선 완전 제거 */}

                            {/* 캔들 */}
                            {data.map((candle, index) => {
                                const x = leftOffset + index * spacing;
                                const isGreen = candle.close > candle.open;
                                const bodyTop = Math.min(candle.open, candle.close);
                                const bodyBottom = Math.max(candle.open, candle.close);
                                const bodyHeight = Math.abs(candle.close - candle.open);

                                return (
                                    <g key={index}>
                                        {/* 심지 */}
                                        <line
                                            x1={x + candleWidth/2}
                                            y1={scaleY(candle.high) - 20}
                                            x2={x + candleWidth/2}
                                            y2={scaleY(candle.low) - 20}
                                            stroke={isGreen ? "#16a34a" : "#dc2626"}
                                            strokeWidth="1"
                                        />
                                        {/* 몸통 */}
                                        <rect
                                            x={x}
                                            y={scaleY(bodyBottom) - 20}
                                            width={candleWidth}
                                            height={Math.max(1, bodyHeight * 200 / (priceRange.max - priceRange.min))}
                                            fill={isGreen ? "#16a34a" : "#dc2626"}
                                            stroke={isGreen ? "#16a34a" : "#dc2626"}
                                            strokeWidth="1"
                                        />
                                    </g>
                                );
                            })}
                        </g>
                    </svg>
                </div>

                {/* 거래량 차트 */}
                <div className="w-full h-20 mt-2 border">
                    <svg width="100%" height="100%">
                        <g transform="translate(40, 0)">
                            {/* 거래량 막대 */}
                            {data.map((candle, index) => {
                                const x = leftOffset + index * spacing;
                                const isGreen = candle.close > candle.open;
                                const barHeight = (candle.volume / volumeRange.max) * 60;

                                return (
                                    <rect
                                        key={index}
                                        x={x}
                                        y={80 - barHeight}
                                        width={candleWidth}
                                        height={barHeight}
                                        fill={isGreen ? "#16a34a" : "#dc2626"}
                                        opacity="0.6"
                                    />
                                );
                            })}
                        </g>

                        {/* 거래량 Y축 레이블 */}
                        <g>
                            {[0, 0.5, 1].map((ratio, i) => {
                                const volume = volumeRange.max * ratio;
                                const y = 80 - (ratio * 60);
                                return (
                                    <g key={i}>
                                        <line x1="35" y1={y} x2="40" y2={y} stroke="#ccc" strokeWidth="1" />
                                        <text x="32" y={y + 4} fontSize="9" fill="#666" textAnchor="end">
                                            {volume > 1000000 
                                                ? `${(volume/1000000).toFixed(1)}M` 
                                                : volume > 1000 
                                                ? `${(volume/1000).toFixed(0)}K` 
                                                : Math.round(volume).toString()
                                            }
                                        </text>
                                    </g>
                                );
                            })}
                        </g>
                    </svg>
                </div>

                {/* 범례 */}
                <div className="flex gap-4 mt-4 text-sm">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-0.5 bg-blue-500"></div>
                        <span>MA5</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-0.5 bg-amber-500"></div>
                        <span>MA20</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-0.5 bg-purple-500"></div>
                        <span>MA60</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-0.5 bg-gray-500 border-dashed"></div>
                        <span>MA120</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">주식 차트 ({stock?.name || stock || 'SAMPLE'})</h1>
            <CandlestickChart data={visibleData} />
        </div>
    );
}