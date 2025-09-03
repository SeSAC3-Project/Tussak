import { useApp } from '../AppContext'
import { useMemo } from 'react';
import { useChartState } from '../hooks/useChartState';
import { useStockData } from '../hooks/useStockData';
import { useChartInteraction } from '../hooks/useChartInteraction';
import { getPriceRange } from '../utils/stockDataGenerator';
import CandlestickChart from '../components/charts/CandlestickChart';
import VolumeChart from '../components/charts/VolumeChart';
import ChartControls from '../components/charts/ChartControls';
import StockHeader from '../components/stock/StockHeader';
import StockInfo from '../components/stock/StockInfo';
import CompanyOverview from '../components/stock/CompanyOverview';

export default function StockDetail() {

    const { selectedStock } = useApp()
    
    console.log('StockDetail시작 -- selectedStock:', selectedStock) 

    // 커스텀 훅으로 차트 상태 관리
    const {
        chartState,
        setChartState,
        chartRef,
        dragRef,
        handlePeriodChange: originalHandlePeriodChange
    } = useChartState();

    // API 데이터 훅
    const {
        chartData,
        currentPrice: apiCurrentPrice,
        loading,
        error,
        fetchChartData
    } = useStockData(selectedStock?.stock_code);

    console.log('=== StockDetail useStockData 결과 ===');
    console.log('selectedStock:', selectedStock);
    console.log('chartData from useStockData:', chartData);
    console.log('loading:', loading);
    console.log('error:', error);

    const candleData = useMemo(() => {
        if (!loading && chartData && Array.isArray(chartData) && chartData.length > 0) {
            return chartData;
        }
        return chartData || [];
    }, [chartData, loading]);
    
    // 현재가
    const currentPrice = useMemo(() => {
        // API 현재가 있으면
        if (apiCurrentPrice && apiCurrentPrice > 0) {
            return apiCurrentPrice
        }
        // 없으면 candleData의 마지막 종가
        if (candleData.length > 0) {
            return candleData[candleData.length - 1].close;
        }
        // 아니면 기본값
        return 235000;
    }, [apiCurrentPrice, candleData]);


    // 기간 변경 시 ( selectedStock 여부에 따라 API 재호출 )
    const handlePeriodChange = (period) => {
        originalHandlePeriodChange(period);
        if (selectedStock?.code) {
            fetchChartData(selectedStock.code, period);
        }
    };
        
    // 보여줄 데이터 슬라이싱
    const visibleData = useMemo(() => {
        if (!candleData || candleData.length === 0) return [];

        return candleData.slice(
            chartState.startIndex,
            chartState.startIndex + chartState.visibleCandles
        );
    }, [candleData, chartState.startIndex, chartState.visibleCandles]);


    // 가격 범위
    const priceRange = useMemo(() => {
        if (!visibleData || visibleData.length === 0) {
            return { min:0, max: 0};
        }
        return getPriceRange(visibleData);
    }, [visibleData]);

    // 차트 인터랙션 
    const {
        handleWheel,
        handleMouseDown,
        handleMouseMoveChart,
        handleMouseLeaveChart
    } = useChartInteraction(chartState, setChartState, chartRef, dragRef, candleData);

    // selectedStock 없을 때
    if (!selectedStock) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">주식을 선택해주세요.</div>
            </div>
        );
    }

    // 로딩 처리
     if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">차트 데이터를 불러오는 중...</div>
            </div>
        );
    }

    // 에러 처리
    if (error && (!candleData || candleData.length === 0)) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-red-500">차트 데이터가 없습니다.</div>
                <button 
                    onClick={() => fetchChartData(selectedStock.code, chartState.selectedPeriod)}
                    className="ml-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    다시 시도
                </button>
            </div>
        );
    }

    return (
        <div>
            {/* 더미 데이터로 렌더링하는 안내 */}
            {error && candleData && candleData.length > 0 &&(
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
                    <p className="text-sm">
                        Mr.dummy: API 연결에 문제 있어, 나라도 괜찮다면 ...
                        <button 
                            onClick={() => fetchChartData()}
                            className="ml-2 underline hover:no-underline"
                        >
                            다시 시도
                        </button>
                    </p>
                </div>
            )}

            <div className="max-w-7xl mx-auto space-y-6">
                {/* 주식 헤더 */}
                <StockHeader 
                    selectedStock={selectedStock} 
                />

                {/* 차트 섹션 */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    
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
                        // handleWheel={handleWheel}
                        // handleMouseDown={handleMouseDown}
                        // handleMouseMoveChart={handleMouseMoveChart}
                        // handleMouseLeaveChart={handleMouseLeaveChart}
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
};