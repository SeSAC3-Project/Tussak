import React from 'react';
import { formatDate } from '../../utils/stockDataGenerator';

const VolumeChart = ({ data, chartState }) => {
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
                                x={x + candleWidth/2}
                                y="75"
                                fontSize="9"
                                fill="#888"
                                textAnchor="middle"
                            >
                                {formatDate(candle.date, chartState.selectedPeriod)}
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

export default VolumeChart;