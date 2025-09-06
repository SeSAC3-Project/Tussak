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

// 모달 구현용 
import { useState, useEffect } from 'react';
import BuyModal from '../components/modals/BuyModal';
import OrderConfirmedModal from '../components/modals/OrderConfirmedModal';
import SellModal from '../components/modals/SellModal';
import { stockApi } from '../services/stockApi';


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
        timeData,
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
        if (chartData && Array.isArray(chartData) && chartData.length > 0) {
            return chartData;
        }
        return [];
    }, [chartData]);

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
        originalHandlePeriodChange(period, candleData.length);
        console.log('기간변경 시 selectedStock 바뀌나요?:', selectedStock)
        if (selectedStock?.stock_code) {
            fetchChartData(selectedStock.stock_code, period);
        }
    };

    console.log('🔍 chartState debugging:');
    console.log('  - candleData.length:', candleData?.length);
    console.log('  - chartState.startIndex:', chartState.startIndex);
    console.log('  - chartState.visibleCandles:', chartState.visibleCandles);
    console.log('  - slice range:', chartState.startIndex, 'to', chartState.startIndex + chartState.visibleCandles);

    // 보여줄 데이터 슬라이싱
    const visibleData = useMemo(() => {
        if (loading || !candleData || candleData.length === 0) {
            return [];
        }
        return candleData.slice(
            chartState.startIndex,
            chartState.startIndex + chartState.visibleCandles
        );
    }, [candleData, chartState.startIndex, chartState.visibleCandles, loading]);

    console.log('🎯 CandlestickChart render 직전:');
    console.log('  - loading:', loading);
    console.log('  - candleData.length:', candleData?.length);
    console.log('  - visibleData.length:', visibleData?.length);
    console.log('  - visibleData:', visibleData);


    // 가격 범위
    const priceRange = useMemo(() => {
        if (!visibleData || visibleData.length === 0) {
            console.log('⚠️ priceRange: visibleData 없음');
            return { min: 0, max: 0 };
        }
        const result = getPriceRange(visibleData);
        console.log('📈 priceRange 계산:', result);
        return result;
    }, [visibleData]);


    // 차트 인터랙션 
    const {
        handleWheel,
        handleMouseDown,
        handleMouseMoveChart,
        handleMouseLeaveChart
    } = useChartInteraction(chartState, setChartState, chartRef, dragRef, candleData);

    

    
    // ================ [매수] 모달 ==============
    const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
    const [isOrderConfirmedModalOpen, setIsOrderConfirmedModalOpen] = useState(false);
    const [orderDetails, setOrderDetails] = useState(null);

    const [realTimePrice, setRealTimePrice] = useState(null);

    useEffect(() => {
        if (!selectedStock?.stock_code) return;

        const fetchRealTimePrice = async () => {
            try {
                const price = await stockApi.fetchRealTimePrice(selectedStock.stock_code);
                setRealTimePrice(price);
            } catch (error) {
                console.warn('실시간 데이터 불러오는데 실패하였습니다', error)
                // setRealTimePrice 더미 vs 여기서 또 더미
                // 그냥 임의로
                setRealTimePrice(20000); 
            }
        };

        fetchRealTimePrice();

        // 여기서 fetch 간격 5초 주기 vs stockApi 에서 이미 5초 설정
    }, [selectedStock?.stock_code]);

    const handleBuyClick = () => {
        setIsBuyModalOpen(true);
    };

    const handleBuyModalClose = () => {
        setIsBuyModalOpen(false);
    };

    const handleBuyComplete = (orderDetails) => {
        setIsBuyModalOpen(false);
        setOrderDetails(orderDetails);
        setIsOrderConfirmedModalOpen(true);
    };
    
    const handleOrderConfirmedClose = () => {
        setIsOrderConfirmedModalOpen(false);
        setOrderDetails(null);
    };
    
    // API인지 데미인지 피드 결정하고..
    // const displayPrice = realTimePrice || currentPrice || 0;
    const displayPrice = 20000;
    
    // ============ [매도] 모달 ===========

    // <SellModal
    //             isOpen={isSellModalOpen}
    //             onClose={handleSellModalClose}
    //             onSellComplete={handleSellComplete}
    //             stockCode={selectedStock?.stock_code || ''}
    //             stockName={selectedStock?.stock_name || ''}
    //             initialPrice={displayPrice}
    //         />
    const [isSellModalOpen, setIsSellModalOpen] = useState(false);
    // const [isOrderConfirmedModalOpen, setIsOrderConfirmedModalOpen] = useState(false);
    // const [orderDetails, setOrderDetails] = useState(null);



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
            <div className="max-w-7xl mx-auto space-y-6">
                {/* 주식 헤더 */}
                <StockHeader
                    selectedStock={selectedStock}
                    onBuyClick={handleBuyClick}
                />

                {/* 차트 섹션 */}
                <div className="bg-white rounded-2xl shadow-lg p-6">

                    <ChartControls
                        chartState={chartState}
                        onPeriodChange={handlePeriodChange}
                    />

                    {/* 캔들스틱 차트 */}
                    <CandlestickChart
                        stockData={{
                            candleData: visibleData,
                            priceRange: priceRange
                        }}
                        chartState={chartState}
                        currentPrice={currentPrice}
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
                            stockData={{
                                candleData: visibleData,
                                priceRange: priceRange,
                                timeData: timeData
                            }}
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

            {/* 매수 모달 */}
            <BuyModal
                isOpen={isBuyModalOpen}
                onClose={handleBuyModalClose}
                onBuyComplete={handleBuyComplete}
                stockCode={selectedStock?.stock_code || ''}
                stockName={selectedStock?.stock_name || ''}
                initialPrice={displayPrice}
            />

            <OrderConfirmedModal
                isOpen={isOrderConfirmedModalOpen}
                onClose={handleOrderConfirmedClose}
                orderDetails={orderDetails}
            />
            
            {/* 매도 모달 */}
            <SellModal
                isOpen={isSellModalOpen}
                onClose={handleSellModalClose}
                onSellComplete={handleSellComplete}
                stockCode={selectedStock?.stock_code || ''}
                stockName={selectedStock?.stock_name || ''}
                initialPrice={displayPrice}
            />
        </div>
    );
};
