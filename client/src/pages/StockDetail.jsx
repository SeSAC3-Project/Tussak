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
import SellModal from '../components/modals/SellModal';
import OrderConfirmedModal from '../components/modals/OrderConfirmedModal';
import SellConfirmedModal from '../components/modals/SellConfirmedModal';
import { stockApi } from '../services/stockApi';


export default function StockDetail() {

    const { selectedStock, isLoggedIn } = useApp();
    const { goBack } = useApp();

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
    const [isSellModalOpen, setIsSellModalOpen] = useState(false);
    const [isSellConfirmedModalOpen, setIsSellConfirmedModalOpen] = useState(false);
    const [orderDetails, setOrderDetails] = useState(null);

    const [realTimePrice, setRealTimePrice] = useState(null);
    const [buyModalPrice, setBuyModalPrice] = useState(null);
    const [currentRealtimeData, setCurrentRealtimeData] = useState(null);

    useEffect(() => {
        if (!selectedStock?.stock_code) return;

        const fetchRealTimePrice = async () => {
            try {
                const price = await stockApi.fetchRealTimePrice(selectedStock.stock_code);
                setRealTimePrice(price);
            } catch (error) {
                console.warn('실시간 데이터 불러오는데 실패하였습니다:', error)
                // setRealTimePrice 더미 vs 여기서 또 더미
                // 그냥 임의로
                setRealTimePrice(20000);
            }
        };

        fetchRealTimePrice();

        // 3초마다 실시간 가격 업데이트
        const interval = setInterval(fetchRealTimePrice, 3000);

        return () => clearInterval(interval);

    }, [selectedStock?.stock_code]);

    // StockHeader와 동일한 실시간 데이터 로직
    useEffect(() => {
        if (!selectedStock || !selectedStock.stock_code || selectedStock.stock_code === '000000') {
            return;
        }

        const fetchRealtimeData = async () => {
            try {
                const response = await fetch(`/api/stock/realtime/${selectedStock.stock_code}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.data) {
                        setCurrentRealtimeData(data.data);
                    }
                }
            } catch (error) {
                console.log('실시간 데이터 업데이트 실패:', error);
            }
        };

        // 초기 로드
        fetchRealtimeData();

        // 2초마다 실시간 데이터 가져오기
        const interval = setInterval(fetchRealtimeData, 2000);

        return () => clearInterval(interval);
    }, [selectedStock]);

    const handleBuyClick = () => {
        if (!isLoggedIn) {
            alert('로그인이 필요한 서비스입니다');
            return;
        }
        // 모달이 열릴 때의 현재 가격을 고정 (StockHeader와 동일한 우선순위)
        const price = currentRealtimeData?.current_price || realTimePrice || currentPrice || 0;
        setBuyModalPrice(price);
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
    
    const handleSellClick = () => {
        if (!isLoggedIn) {
            alert('로그인이 필요한 서비스입니다');
            return;
        }
        setIsSellModalOpen(true);
    };

    const handleSellModalClose = () => {
        setIsSellModalOpen(false);
    };

    const handleSellComplete = (orderDetails) => {
        setIsSellModalOpen(false);
        setOrderDetails(orderDetails);
        setIsOrderConfirmedModalOpen(true);
    };
    
    const handleSellConfirmedClose = () => {
        setIsSellConfirmedModalOpen(false);
        setOrderDetails(null);
    };
    
    // API인지 데미인지 피드 결정하고..
    const displayPrice = realTimePrice || currentPrice || 20000;
    // const displayPrice = 20000;
    
    // ============ [매도] 모달 ===========

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
        <div className="max-w-7xl mx-auto">
            <div className="pt-[15px] pb-[20px] mx-2 flex flex-col gap-[16px]">
                {/* 주식 헤더 */}
                <StockHeader
                    selectedStock={selectedStock}
                    currentPrice={displayPrice}
                    realTimePrice={realTimePrice}
                    onBuyClick={handleBuyClick}
                    onSellClick={handleSellClick}
                />

                {/* 차트 섹션 */}
                <div className="bg-white rounded-[20px] h-[400px] py-[19px] px-[28px]" style={{fontFamily: 'DM Sans'}}>
                    <ChartControls
                        chartState={chartState}
                        onPeriodChange={handlePeriodChange}
                    />

                    {/* 캔들스틱 차트 */}
                    {/* <CandlestickChart
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
                    /> */}

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
                <div className="flex flex-col lg:flex-row gap-[16px]">
                    <StockInfo stockData={selectedStock} />
                    <CompanyOverview companyInfo={selectedStock?.company_info} />
                </div>
            </div>

            {/* 매수 모달 */}
            <BuyModal
                isOpen={isBuyModalOpen}
                onClose={handleBuyModalClose}
                onBuyComplete={handleBuyComplete}
                stockCode={selectedStock?.stock_code || ''}
                stockName={selectedStock?.stock_name || ''}
                initialPrice={buyModalPrice}
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
                // 필드명 고민 initialPrice VS currentPrice
                initialPrice={displayPrice} 
                holdingQuantity={100}
            />

            <SellConfirmedModal
                isOpen={isSellConfirmedModalOpen}
                onClose={handleSellConfirmedClose}
                orderDetails={orderDetails}
            />
        </div>
    );
};
