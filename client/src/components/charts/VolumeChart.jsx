import { useState, useEffect, useRef } from 'react';

const VolumeChart = ({ stockData, chartState }) => {
    const containerRef = useRef(null);
    const [chartContainerWidth, setChartContainerWidth] = useState(600);
    const [chartContainerHeight] = useState(200);

    const candleData = stockData?.candleData;
    const timeData = stockData?.timeData;
    const priceRange = stockData?.priceRange;

    console.log('=== VolumeChart rendering ===');
    console.log('stockData:', stockData);
    console.log('candleData length:', candleData?.length);
    console.log('timeData length:', timeData?.length);
    
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

    if (!stockData?.candleData?.length) {
        return (
            <div ref={containerRef} className="w-full h-20 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-gray-500 text-sm">거래량 데이터를 불러오는 중입니다</div>
            </div>
        );
    };

    const leftMargin = 60;
    const rightMargin = 20;
    const topMargin = 10;
    const bottomMargin = 25;
    const chartAreaWidth = chartContainerWidth - leftMargin - rightMargin;
    const chartAreaHeight = chartContainerHeight - topMargin - bottomMargin;

    const maxVolume = Math.max(...candleData.map(d => d.volume));
    const barWidth = Math.max(1, Math.min(8, chartAreaWidth / candleData.length * 0.8))

    const shouldShowTimeLabel = (index) => {
        const totalCount = candleData.length;
        if (totalCount <= 15) return index % 2 === 0;
        if (totalCount <= 30) return index % 3 === 0;
        if (totalCount <= 50) return index % 5 === 0;
        return index % 8 === 0;
    };

    // const getCandleWidth = () => {
    // const barWidth = chartAreaWidth / candleData.length * 0.7;

    // if (chartAreaWidth >= 1200) {
    //     // 데스크톱
    //     return Math.max(6, Math.min(24, barWidth));
    // } else if (chartAreaWidth >= 768) {
    //     // 태블릿
    //     return Math.max(4, Math.min(16, barWidth));
    // } else {
    //     // 모바일
    //     return Math.max(3, Math.min(12, barWidth));
    // }
    // };

    // const candleWidth = getCandleWidth();

    // const candleSpacing = chartAreaWidth / data.length;

    return (
        <div ref={containerRef} className="w-full">
            <div className="overflow-x-auto">
                <svg
                    width={chartContainerWidth}
                    height={chartContainerHeight}
                    className="overflow-visible"
                >
                    <g>
                        {candleData.map((candle, index) => {
                            const height = (candle.volume / maxVolume) * 50;
                            const x = leftMargin + (index / Math.max(candleData.length - 1, 1)) * chartAreaWidth - barWidth / 2;
                            const y = topMargin + chartAreaHeight - height;
                            const isGreen = candle.close > candle.open;

                            return (
                                <rect
                                    key={`volume-${candle.timestamp}-${index}`}
                                    x={x}
                                    y={y}
                                    width={barWidth}
                                    height={height}
                                    fill={isGreen ? "#22c55e" : "#ef4444"}
                                    opacity="0.6"
                                    className="hover:opacity-80 cursor-pointer transition-opacity"
                                />
                            );
                        })}
                    </g>

                    {/* API 받아온 시간 뿌리기 */}
                    <g>
                        {timeData.labels.map((timeLabel, index) => {
                            if (!shouldShowTimeLabel(index)) return null;

                            const x = leftMargin + (index / Math.max(candleData.length - 1, 1)) * chartAreaWidth;

                            return (
                                <text
                                    key={`time-${timeData.timestamps[index]}-${index}`}
                                    x={x}
                                    y={chartContainerHeight - 5}
                                    fontSize="9"
                                    fill="#888"
                                    textAnchor="middle"
                                >
                                    {timeLabel}
                                </text>
                            );
                        })}
                    </g>

                    <g>
                        <text x={leftMargin - 5} y={topMargin + 5} fontSize="9" fill="#888" textAnchor="end">
                            {(maxVolume / 1000000).toFixed(1)}M
                        </text>
                        <text x={leftMargin - 5} y={topMargin + chartAreaHeight / 2 + 3} fontSize="9" fill="#888" textAnchor="end">
                            {(maxVolume / 2000000).toFixed(1)}M
                        </text>
                    </g>
                </svg>
            </div>
        </div>
    );
};

export default VolumeChart;