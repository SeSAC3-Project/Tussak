// API에서 받아온 데이터 구조에 맞게 stock 필드명 설정하기
import { useState } from 'react';
import { useApp } from '../AppContext'

const HeartIcon = ({ active }) => (
    <img 
        src={active ? '/icon/heart-filled.png' : '/icon/heart-unfilled.png'}
        alt="Heart icon"
        className="w-5 h-5 cursor-pointer"
    />
);

const StockCard = ({ stock, realtimeData, navigateToStockDetail }) => {
    const [active, setActive] = useState(true);
    console.log('StockCard 변수 형태는:', stock)

    // StockCard에서 home, market에서 필드 차이 발생 (home 더미데이터 market에 맞게 ... 수정해야겠다 )
    const stockCode = stock.stock_code || '000000'; 
    //  '' 에서 '000000'로 수정
    const stockName = stock.stock_name || '종목명 없음';
    const market = stock.market || '';
    const price = stock.current_price || '';
    const changeAmount = stock.change_amount || '';
    const changeRate = stock.change_rate || '';

    // const sector = stock.sector || '';
    // const per = stock.per || null;
    // const pbr = stock.pbr || null;

    // const stockCode = stock.id || '000000';
    // const stockName = stock.name || '';
    // const market = stock.market || '';
    // const price = stock.price || '';
    // const changeAmount = stock.change || '';
    // const changeRate = stock.changePercent || '';

    // 실시간 데이터 (없으면 기본 정보만)
    const hasRealtimeData = realtimeData && realtimeData.current_price;
    const currentPrice = realtimeData?.current_price || 0;
    const priceChange = realtimeData?.price_change || 0;
    const changePercent = realtimeData?.change_percent || 0;
    
    // 가격 변동에 따라 화살표, 색상 결정
    const isUp = priceChange > 0;
    const isDown = priceChange < 0;
    const textColor = isUp ? 'text-red-500' : isDown ? 'text-blue-500' : 'text-gray-600';
    const changeIcon = isUp ? '▲' : isDown ? '▼' : '';


    return (
        <div 
            className="bg-white py-[15px] px-[19px] rounded-[20px] flex flex-col justify-between h-full" style={{fontFamily: 'DM Sans'}}
            onClick={navigateToStockDetail}
        >
            {/* 상단 요소들: 종목코드, 시장, 좋아요*/}
            <div className="flex justify-between items-center text-gray-500 text-xs mb-1">
                <span>{stockCode} · {market}</span>
                <button className="hover:text-red-500" onClick={() => setActive(!active)}>
                    <HeartIcon active={active} />
                </button>
            </div>

            {/* 중간 요소: 종목명, 섹터 */}
            <div className="mb-2">
                <h3 className="text-base font-bold text-gray-800">{stockName}</h3>
                {sector && (
                    <p classNAme="text-xs text-gray-500 mt-1">{ sector }</p>
                )}
            </div>

            {/* 하단 요소들: 현재가, 변동(화살표, 1주당얼마, 비율) -> 없으면 PER/PBR */}
            <div>
                {hasRealtimeData ? (
                    // 실시간 가격 데이터 표시
                    <div>
                        <div className="text-base font-bold text-gray-800 mb-1">
                            {currentPrice.toLocaleString()}원
                        </div>
                        <div className={`flex items-center justify-between text-sm ${textColor}`}>
                            <div>
                                <span>{changeIcon}</span>
                                <span className="ml-1">{Math.abs(priceChange).toLocaleString()}</span>
                            </div>
                            <span>({changePercent > 0 ? '+' : ''}{changePercent.toFixed(2)}%)</span>
                        </div>
                    </div>
                ) : (
                    // 기본 정보 표시 (PER, PBR)
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-600">
                            <span>PER</span>
                            <span className="font-medium">
                                {per ? Number(per).toFixed(2) : 'N/A'}
                            </span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600">
                            <span>PBR</span>
                            <span className="font-medium">
                                {pbr ? Number(pbr).toFixed(2) : 'N/A'}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
};

export default StockCard;
