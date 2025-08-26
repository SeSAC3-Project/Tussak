import React, { useState, useRef } from 'react';

export default function StockDetail({ stock }) {

    const [chartState, setChartState] = useState({
        startIndex: 0,
        visibleCandles: 80,
        isDragging: false,
        dragStart: null,
        selectedPeriod: '1개월',
        mousePosition: null,
        crosshair: { x: null, y: null, visible: false }
    });

    const chartRef = useRef(null);
    // const dragRef = useRef({ isDragging: false, startX: 0, startIndex: 0});

    // 더미데이터 생성용
    const generatePeriodData = (period) => {
        const data = [];
        let basePrice = 235000;

        const totalPoints = 300;
        const dateIncrement = (i) => new Date(2024, 0, 15 + i);

        // 실제로 화면에 보여줄 개수 설정
        // let sliceCount;
        // switch(period) {
        //     case '1일':
        //         sliceCount = 78;   // 최근 78개만 표시
        //         break;
        //     case '1주':
        //         sliceCount = 140;  // 최근 140개만 표시
        //         break;
        //     case '1개월':
        //         sliceCount = 220;  // 최근 220개만 표시
        //         break;
        //     case '3개월':
        //         sliceCount = 300;  // 전부 표시
        //         break;
        //     default:
        //         sliceCount = 220;
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
        const ma5Data = data.slice(Math.max(0, index - 4), index + 1);
        item.ma5 = ma5Data.reduce((sum, d) => sum + d.close, 0) / ma5Data.length;

        const ma20Data = data.slice(Math.max(0, index - 19), index + 1);
        item.ma20 = ma20Data.reduce((sum, d) => sum + d.close, 0) / ma20Data.length;

        const ma60Data = data.slice(Math.max(0, index - 59), index + 1);
        item.ma60 = ma60Data.reduce((sum, d) => sum + d.close, 0) / ma60Data.length;

        const ma120Data = data.slice(Math.max(0, index - 119), index + 1);
        item.ma120 = ma120Data.reduce((sum, d) => sum + d.close, 0) / ma120Data.length;
    });

    return data;
};

const candleData = generatePeriodData(chartState.selectedPeriod);

const visibleData = candleData.slice(
    chartState.startIndex,
    chartState.startIndex + chartState.visibleCandles
);

const currentPrice = candleData.length > 0 ? candleData[candleData.length - 1].close : 235000;

const handlePeriodChange = (period) => {
    const newData = generatePeriodData(period);
    // const visibleCandles = period === '1일' ? 60 : period === '1주' ? 25 : period === '1개월' ? 22 : 40;
    const visibleCandles = 80;
    const startIndex = Math.max(0, newData.length - visibleCandles);

    setChartState(prev => ({
        ...prev,
        selectedPeriod: period,
        startIndex: startIndex,
        visibleCandles: visibleCandles
    }));
};

// const handleWheel = useCallback((event) => {
//     event.preventDefault();

//     const rect = chartRef.current.getBoundingClientRect();
//     const mouseX = event.clientX - rect.left - 40;

//     // if (mouseX < 0 || mouseX > 600) return;

//     setChartState(prev => {
//         const delta = event.deltaY;
//         const zoomFactor = delta > 0 ? 1.15 : 1 / 1.15;
//         const newVisibleCandles = Math.max(10, Math.min(Math.min(candleData.length, 150), prev.visibleCandles * zoomFactor));

//         const chartWidth = 600;
//         const mouseRatio = mouseX / chartWidth;
//         const currentCenterIndex = prev.startIndex + (prev.visibleCandles * mouseRatio);

//         let newStartIndex = Math.round(currentCenterIndex - (newVisibleCandles * mouseRatio));
//         newStartIndex = Math.max(0, Math.min(candleData.length - newVisibleCandles, newStartIndex));

//         return {
//             ...prev,
//             startIndex: Math.floor(newStartIndex),
//             visibleCandles: Math.floor(newVisibleCandles)
//         };
//     });
// }, [candleData.length]);

// const handleMouseDown = useCallback((event) => {
//     if (event.button !== 0) return;

//     const rect = chartRef.current.getBoundingClientRect();
//     dragRef.current = {
//         isDragging: true, 
//         startX: event.clientX - rect.left,
//         startIndex: chartState.startIndex
//     };

//     setChartState(prev => ({ ...prev, isDragging: true}));
//     event.preventDefault();
// }, [chartState.startIndex]);

// const handleMouseMove = useCallback((event) => {
//     if (!dragRef.current.isDragging) return;

//     const rect = chartRef.current.getBoundingClientRect();
//     const currentX = event.clientX - rect.left;
//     const deltaX = currentX - dragRef.current.startX;

//     const chartWidth = 600;
//     const candleWidth = Math.max(4, Math.min(16, chartWidth / chartState.visibleCandles));
//     const spacing = candleWidth + 2;
//     const candlesMoved = Math.round(-deltaX / spacing);

//     setChartState(prev => {
//         const newStartIndex = Math.max(0,
//             Math.min(candleData.length - prev.visibleCandles, dragRef.current.startIndex + candlesMoved)
//         );

//         return {
//             ...prev,
//             startIndex: newStartIndex
//         };
//     });
// }, [candleData.length, chartState.visibleCandles]);

// const handleMouseUp = useCallback(() => {
//     dragRef.current.isDragging = false;
//     setChartState(prev => ({ ...prev, isDragging: false}));
// }, []);

// const handleMouseMoveChart = useCallback((event) => {
//     if (!chartRef.current || dragRef.current.isDragging) return;

//     const rect = chartRef.current.getBoundingClientRect();
//     const x = event.clientX - rect.left;
//     const y = event.clientY - rect.top;

//     const isInChartArea = x > 40 && x < rect.width - 10 && y > 20 && y < 300;

//     setChartState(prev => ({
//         ...prev,
//         crosshair:{
//             x: x-40,
//             y: y-20,
//             visible: isInChartArea
//         }
//     }));
// }, []);

// const handleMouseLeaveChart = useCallback(() => {
//     setChartState(prev => ({
//         ...prev,
//         crosshair: { ...prev.crosshair, visible: false }
//     }));
// }, []);

// const formatDate = (date, period) => {
//     if (period === '1일') {
//         return date.toLocaleTimeString('ko-KR', {
//             hour: '2-digit',
//             minute: '2-digit',
//             hour12: false
//         });
//     } else {
//         return date.toLocaleDateString('ko-KR', {
//             month: '2-digit',
//             day: '2-digit'
//         }).replace(/\./g, '/').replace(/ /g, '');
//     }
// };

// const handleKeyDown = useCallback((event) => {
//     if (!chartRef.current) return;

//     switch(event.key) {
//         case 'ArrowLeft':
//             event.preventDefault();
//             setChartState(prev => ({
//                 ...prev,
//                 startIndex: Math.max(0, prev.startIndex - 5)
//             }));
//             break;
//         case 'ArrowRight':
//             event.preventDefault();
//             setChartState(prev => ({
//                 ...prev,
//                 startIndex: Math.min(candleData.length - prev.visibleCandles, prev.startIndex + 5)
//             }));
//             break;
//         case 'Home':
//             event.preventDefault();
//             setChartState(prev => ({
//                 ...prev,
//                 startIndex: Math.max(0, candleData.length - prev.visibleCandles)
//             }));
//             break;
//     }
// }, [candleData.length]);

// React.useEffect(() => {
//     const handleGlobalMouseMove = (e) => handleMouseMove(e);
//     const handleGlobalMouseUp = (e) => handleMouseUp(e);

//     if (dragRef.current.isDragging) {
//         document.addEventListener('mousemove', handleGlobalMouseMove);
//         document.addEventListener('mouseup',  handleGlobalMouseUp);
//     }

//     const handleGlobalKeyDown = (e) => handleKeyDown(e);
//     document.addEventListener('keydown', handleGlobalKeyDown);

//     return () => {
//         document.removeEventListener('mousemove', handleGlobalMouseMove);
//         document.removeEventListener('mouseup', handleGlobalMouseMove);
//         document.removeEventListener('keydown', handleGlobalMouseMove);
//     };

// }, [handleMouseMove, handleMouseUp, handleKeyDown]);

// React.useEffect(() => {
//     if (chartRef.current) {
//         chartRef.current.tabIndex = 0;
//     }
// }, []);

const getPriceRange = (data) => {
    if (!data.length) return { min: 0, max: 100000 };

    let min = Infinity;
    let max = -Infinity;

    data.forEach(candle => {
        min = Math.min(min, candle.low, candle.ma5, candle.ma20, candle.ma60, candle.ma120);
        max = Math.max(max, candle.high, candle.ma5, candle.ma20, candle.ma60, candle.ma120);
    });

    const padding = (max - min) * 0.2;
    return { min: min - padding, max: max + padding };
};

const priceRange = getPriceRange(visibleData);

// 드디어 캔들차트
const CandlestickChart = ({ data }) => {
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
            // onWheel={handleWheel}
            // onMouseDown={handleMouseDown}
            // onMouseMove={handleMouseMoveChart}
            // onMouseLeave={handleMouseLeaveChart}
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
                </g>

                <g transform="translate(40, 20)">
                    {data.length > 1 && (
                        <>
                            <polyline
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="1.5"
                                points={data.map((d, i) => `${leftOffset + i * spacing + candleWidth / 2},${scaleY(d.ma5) - 20}`).join(' ')}
                            />
                            <polyline
                                fill="none"
                                stroke="#f59e0b"
                                strokeWidth="1.5"
                                points={data.map((d, i) => `${leftOffset + i * spacing + candleWidth / 2}, ${scaleY(d.ma20) - 20}`).join(' ')}
                            />
                            <polyline
                                fill="none"
                                stroke="#8b5cf6"
                                strokeWidth="1.5"
                                points={data.map((d, i) => `${leftOffset + i * spacing + candleWidth / 2}, ${scaleY(d.ma60) - 20}`).join(' ')}
                            />
                            <polyline
                                fill="none"
                                stroke="#6b7280"
                                strokeWidth="1.5"
                                strokeDasharray="3,3"
                                points={data.map((d, i) => `${leftOffset + i * spacing + candleWidth / 2}, ${scaleY(d.ma120) - 20}`).join(' ')}
                            />
                        </>
                    )}

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

                    {/* <g>
                            <rect
                                x={chartContainerWidth - 85}
                                y={scaleY(currentPrice) - 28}
                                width="75"
                                height="14"
                                fill="#ef4444"
                                rx="7"
                                opacity="0.95"
                            />
                            <text
                                x={chartContainerWidth - 47.5}
                                y={scaleY(currentPrice) - 19}
                                fontSize="9"
                                fill="white"
                                textAnchor="middle"
                                fontWeight="600"
                            >
                                {Math.round(currentPrice).toLocaleString()}
                            </text>
                        </g> */}

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
                                stroke="#66"
                                strokeWidth="1"
                                strokeDasharray="2,2"
                            />
                        </g>
                    )}

                    {data.map((candle, index) => {
                        const x = leftOffset + index * spacing;
                        const isGreen = candle.close > candle.open;
                        const bodyTop = Math.min(candle.open, candle.close);
                        const bodyBottom = Math.max(candle.open, candle.close);
                        const bodyHeight = Math.abs(candle.close - candle.open);

                        return (
                            <g key={index}>
                                <line
                                    x1={x + candleWidth / 2}
                                    y1={scaleY(candle.high) - 20}
                                    x2={x + candleWidth / 2}
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

            <div className="absolute top-2 right-2 bg-black bg=opacity-70 text-white px-3 py-2 rounded-lg text-xs space-y-1">
                <div className="flex items-center space-x-2">
                    <span className="text-blue-400">🔍</span>
                    <span>{chartState.visibleCandles}개 캔들</span>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-green-400">📊</span>
                    <span>{chartState.startIndex + 1}-{chartState.startIndex + visibleData.length}</span>
                </div>
                <div className="text-center text-xs text-gray-300">
                    {chartState.selectedPeriod === '1일' ? '📈' :
                        chartState.selectedPeriod === '1주' ? '📊' :
                            chartState.selectedPeriod === '1개월' ? '📅' : '🗓️'}
                    {' '}
                    {chartState.selectedPeriod}
                </div>
            </div>

            {/* <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-xs">
                    <div className="hidden lg:block">
                        🖱️ 휠:줌 | 드래그:이동 | ⌨️ ←→:스크롤 | Home/End:처음/끝
                    </div>
                    <div className="lg:hidden">
                        🖱️ 휠:줌 | 드래그:이동
                    </div>
                </div> */}
        </div>
    );
};

const VolumeChart = ({ data }) => {
    const maxVolume = Math.max(...data.map(d => d.volume));
    const chartContainerWidth = 600;
    const candleWidth = Math.max(2, Math.min(8, chartContainerWidth / Math.max(data.length, chartState.visibleCandles)));
    const spacing = candleWidth + 2;

    const totalDataWidth = data.length * spacing;
    const maxPossibleWidth = chartState.visibleCandles * spacing;
    const leftOffset = Math.max(0, maxPossibleWidth - totalDataWidth);

    return (
        <div className="w-full h-20">
            <svg width="100%" height="100%">
                <g transform="translate(40, 0)">
                    {data.map((candle, index) => {
                        const x = leftOffset + index * spacing;
                        const height = (candle.volume / maxVolume) * 50;
                        const isGreen = candle.close > candle.open;

                        return (
                            <rect
                                key={index}
                                x={x}
                                y={60 - height}
                                width={candleWidth}
                                height={height}
                                fill={isGreen ? "#22c55e" : "#ef4444"}
                                opacity="0.6"
                            />
                        );
                    })}
                </g>

                <g transform="translate(40,0)">
                    {data.map((candle, index) => {
                        const shouldShowDate = data.length <= 15 ? index % 2 === 0 :
                            data.length <= 30 ? index % 3 === 0 :
                                data.length <= 50 ? index % 5 === 0 :
                                    index % 8 === 0;

                        if (!shouldShowDate) return null;

                        const x = leftOffset + index * spacing;

                        return (
                            <text
                                key={`date-${index}`}
                                x={x + candleWidth / 2}
                                y="75"
                                fontSize="9"
                                fill="#888"
                                textAnchor="middle"
                            >
                                {/* {formatDate(candle.date, chartState.selectedPeriod)} */}
                            </text>
                        );
                    })}
                </g>

                <g>
                    <text x="32" y="15" fontSize="9" fill="#888" textAnchor="end">
                        {(maxVolume / 1000000).toFixed(1)}M
                    </text>
                    <text x="32" y="35" fontSize="9" fill="#888" textAnchor="end">
                        {(maxVolume / 2000000).toFixed(1)}M
                    </text>
                </g>
            </svg>
        </div>
    );
};

const stockInfo = [
    { label: '시가총액', value: '52,254' },
    { label: '주식수', value: '52,254' },
    { label: '상장일자', value: 'n/254' },
    { label: '상장자본금', value: '52,254' },
    { label: '52주 최저', value: '52,254' },
    { label: '52주 최고', value: '52,254' },
    { label: 'PER', value: '52,254' },
    { label: 'PBR', value: '52,254' }
];

return (
    <div>
        <div className="max-2-7xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <h1 className="text-2xl font-bold text-gray-800">{stock.name}</h1>
                        <span className="text-sm text-gray-500">{stock.id} {stock.market}</span>
                        <span className="text-2xl font-bold text-gray-800">{stock.price.toLocaleString()}</span>
                        <div className="flex items-center space-x-2">
                            <span className={`font-semibold ${stock.direction === 'up' ? 'text-red-500' : 'text-blue-500'}`} >
                                {stock.direction === 'up' ? '▲' : '▼'} {stock.change.toLocaleString()} ({stock.changePercent}%)
                            </span>
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        <button className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors font-medium">
                            매도
                        </button>
                        <button className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium">
                            매수
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="mb-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold text-gray-700">차트</span>
                        <div className="flex items-center space-x-1 sm:space-x-2 text-xs">
                            {['1일', '1주', '1개월', '3개월'].map(period => (
                                <button
                                    key={period}
                                    onClick={() => handlePeriodChange(period)}
                                    className={`px-2 sm:px-3 py-1 rounded transition-colors ${chartState.selectedPeriod === period ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {period}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="hidden lg:flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                                <div className="w-4 h-0.5 bg-blue-500"></div>
                                <span>MA5</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <div className="w-4 h-0.5 bg-amber-500"></div>
                                <span>MA20</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <div className="w-4 h-0.5 bg-violet-500"></div>
                                <span>MA60</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <div className="w-4 h-0.5 bg-gray-500 opacity-60 border-dashed"></div>
                                <span>MA120</span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3 text-xs">
                            <div classNAme="text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                💡 마우스 휠: 줌 | 드래그: 이동
                            </div>
                            <div className="text-green-600 bg-green-50 px-2 py-1 rounded">
                                📊 {chartState.selectedPeriod} - {
                                    chartState.selectedPeriod === '1일' ? '5분봉' :
                                        chartState.selectedPeriod === '1주' ? '1시간봉' : '일봉'
                                }
                            </div>
                        </div>
                    </div>

                    <div className="lg:hidden">
                        <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-2 text-gray-500">
                                <span className="text-blue-500">MA5</span>
                                <span className="text-amber-500">MA20</span>
                                <span className="text-violet-500">MA60</span>
                                <span className="text-gray-500">MA120</span>
                            </div>
                            <div className="text-green-600 bg-green-50 px-2 py-1 rounded">
                                {chartState.selectedPeriod} - {
                                    chartState.selectedPeriod === '1일' ? '5분봉' :
                                        chartState.selectedPeriod === '1주' ? '1시간봉' : '일봉'
                                }
                            </div>
                        </div>
                    </div>
                </div>

                <CandlestickChart data={visibleData} />

                <div className="mt-4 border-to border-gray-100 pt-2">
                    <div className="flex items-center mb-2">
                        <span className="text-xs text-gray-500 ml-10">거래량</span>
                    </div>
                    <VolumeChart data={visibleData} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-6">종목요약</h2>
                    <div className="space-y-4">
                        {stockInfo.map((item, index) => (
                            <div key={index} className="flex justify-between items-center py-1 border-b border-gray-50 las:border-b-0">
                                <span className="text-gray-600 text-sm">{item.label}</span>
                                <span className="font-semibold text-gray-800 text-sm">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">기업개요</h2>
                    <p className="text-gray-600 leading-relaxed text-sm mb-6">
                        대한전선 베트남 생산법인 대한비나, 초고압 케이블 공장 짓는다. 대한전선 베트남 생산법인 대한비나, 초고압 케이블 공장 짓는다. 대한전선 베트남 생산법인 대한비나, 초고압 케이블 공장 짓는다. 대한전선 베트남 생산법인 대한비나, 초고압 케이블 공장 짓는다. 대한전선 베트남 생산법인 대한비나, 초고압 케이블 공장 짓는다.
                    </p>
                    <div className="flex justify-end">
                        <div className="w-12 h-12 bg-green-400 rounded-full flex items-center justify-center hover:bg-green-500 transition-colors cursor-pointer shadow-md">
                            챗봇이
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
)
