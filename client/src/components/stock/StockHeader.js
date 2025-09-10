import { useState, useEffect } from 'react';

const StockHeader = ({ selectedStock, currentPrice, realTimePrice, onBuyClick, onSellClick }) => {
    const [currentRealtimeData, setCurrentRealtimeData] = useState(null);

    const stockName = selectedStock?.stock_name || '종목명 없음';
    const stockCode = selectedStock?.stock_code || '000000';
    const market = selectedStock?.market || '';

    // 거래시간 체크 함수
    const isMarketOpen = () => {
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        const currentTime = hour * 100 + minute; // 1530 형식으로 변환

        // 주말 체크
        if (now.getDay() === 0 || now.getDay() === 6) {
            return false;
        }

        // 거래 시간 체크 (9:00 - 15:30)
        return currentTime >= 900 && currentTime <= 1530;
    };

    // 실시간 데이터 업데이트 (2초마다)
    useEffect(() => {
        // selectedStock이 없거나 stockCode가 유효하지 않으면 실행하지 않음
        if (!selectedStock || !stockCode || stockCode === '000000') {
            return;
        }

        const fetchRealtimeData = async () => {
            // 장 시간이 아니면 실시간 데이터를 조회하지 않음
            if (!isMarketOpen()) {
                // console.log('장 시간이 아닙니다.');
                return;
            }

            try {
                const response = await fetch(`/api/stock/realtime/${stockCode}`);
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

    // 초기 로드 및 폴링은 장중일 때만 수행
    if (!isMarketOpen()) return;

    fetchRealtimeData();

    // 2초마다 실시간 데이터 가져오기
    const interval = setInterval(fetchRealtimeData, 2000);

    return () => clearInterval(interval);
    }, [selectedStock, stockCode]);

    if (!selectedStock) return null;

    // 우선순위: 실시간 데이터 > props의 realTimePrice > 기본 데이터
    const price = currentRealtimeData?.current_price || realTimePrice || selectedStock.current_price || 0;
    const previousClose = currentRealtimeData?.previous_close || selectedStock.previous_close || selectedStock.current_price || 0;

    // 실시간 등락 계산
    const change = price - previousClose;
    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

    const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
    const textColor = direction === 'up' ? 'text-[#FF383C]' : direction === 'down' ? 'text-[#0088FF]' : 'text-[#8A8A8A]';
    const changeIcon = direction === 'up' ? '▲' : direction === 'down' ? '▼' : '';

    return (
        <div className="bg-white rounded-[20px] py-[19px] px-[28px]" style={{fontFamily: 'DM Sans'}}>
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <h1 className="text-[20px] font-bold text-[#0F250B]">{stockName}</h1>
                    <span className="text-[16px] font-light text-[#8A8A8A]">{stockCode} {market}</span>
                    <span className="text-lg font-normal text-[#0F250B] pl-4">
                        {typeof price === 'number' ? price.toLocaleString() : (parseFloat(price) || 0).toLocaleString()}원
                    </span>
                    <div className="flex items-center pl-1">
                        <span className={`font-normal text-base ${textColor}`}>
                            {changeIcon} {Math.abs(change).toLocaleString()} ({Math.abs(changePercent).toFixed(2)}%)
                        </span>
                    </div>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={onBuyClick}
                        className="bg-[#FF383C] text-white px-5 py-2 rounded-lg hover:bg-red-600 transition-colors font-normal">
                        매수
                    </button>
                    <button
                        onClick={onSellClick}
                        disabled={!currentPrice && !price}
                        className="bg-[#0088FF] text-white px-5 py-2 rounded-lg hover:bg-blue-600 transition-colors font-normal disabled:opacity-50 disabled:cursor-not-allowed">
                        매도
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StockHeader;