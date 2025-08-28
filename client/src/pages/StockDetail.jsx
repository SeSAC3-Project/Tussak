import React, { useMemo } from 'react';
import { useChartState } from '../hooks/useChartState';
import { useChartInteraction } from '../hooks/useChartInteraction';
import { generatePeriodData, getPriceRange } from '../utils/stockDataGenerator';
import CandlestickChart from '../components/charts/CandlestickChart';
import VolumeChart from '../components/charts/VolumeChart';
import ChartControls from '../components/charts/ChartControls';
import StockHeader from '../components/stock/StockHeader';
import StockInfo from '../components/stock/StockInfo';
import CompanyOverview from '../components/stock/CompanyOverview';

export default function StockDetail({ stock }) {
    // 커스텀 훅으로 상태 관리
    const {
        chartState,
        setChartState,
        chartRef,
        dragRef,
        handlePeriodChange
    } = useChartState();

    // 데이터 생성 (메모이제이션)
    const candleData = useMemo(() => {
        return generatePeriodData(chartState.selectedPeriod);
    }, [chartState.selectedPeriod]);

    // 보여줄 데이터 슬라이싱
    const visibleData = useMemo(() => {
        return candleData.slice(
            chartState.startIndex,
            chartState.startIndex + chartState.visibleCandles
        );
    }, [candleData, chartState.startIndex, chartState.visibleCandles]);

    // 현재가
    const currentPrice = useMemo(() => {
        return candleData.length > 0 ? candleData[candleData.length - 1].close : 235000;
    }, [candleData]);

    // 가격 범위
    const priceRange = useMemo(() => {
        return getPriceRange(visibleData);
    }, [visibleData]);

    // 차트 인터랙션 훅
    const {
        handleWheel,
        handleMouseDown,
        handleMouseMoveChart,
        handleMouseLeaveChart
    } = useChartInteraction(chartState, setChartState, chartRef, dragRef, candleData);

    return (
        <div>
            <div className="max-w-7xl mx-auto space-y-6">
                {/* 주식 헤더 */}
                <StockHeader stock={stock} />

                {/* 차트 섹션 */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    {/* 차트 컨트롤 */}
                    <ChartControls 
                        chartState={chartState}
                        onPeriodChange={handlePeriodChange}
                    />

                    {/* 캔들스틱 차트 */}
                    <CandlestickChart
                        data={visibleData}
                        chartState={chartState}
                        currentPrice={currentPrice}
                        priceRange={priceRange}
                        chartRef={chartRef}
                        handleWheel={handleWheel}
                        handleMouseDown={handleMouseDown}
                        handleMouseMoveChart={handleMouseMoveChart}
                        handleMouseLeaveChart={handleMouseLeaveChart}
                    />

                    {/* 거래량 차트 */}
                    <div className="mt-4 border-t border-gray-100 pt-2">
                        <div className="flex items-center mb-2">
                            <span className="text-xs text-gray-500 ml-10">거래량</span>
                        </div>
                        <VolumeChart 
                            data={visibleData} 
                            chartState={chartState} 
                        />
                    </div>
                </div>

                {/* 하단 정보 섹션 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <StockInfo />
                    <CompanyOverview />
                </div>
            </div>
        </div>
    );
}