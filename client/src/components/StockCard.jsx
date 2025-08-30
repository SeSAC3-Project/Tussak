// API에서 받아온 데이터 구조에 맞게 stock 필드명 설정하기

import React from 'react';
import { useState } from 'react';


const HeartIcon = ({ active }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 cursor-pointer ${active ? 'text-red-500 fill-current' : 'text-gray-300'}`} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
    </svg>
);

const StockCard = ({ stock, realtimeData }) => {
    const [active, setActive] = useState(false);

    const stockCode = stock.stock_code || '';
    const stockName = stock.stock_name || '종목명 없음';
    const market = stock.market || '';
    const sector = stock.sector || '';
    const per = stock.per || null;
    const pbr = stock.pbr || null;

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
        <div className="bg-white p-3 rounded-lg border border-gray-200 flex flex-col justify-between h-full shadow-lg">
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
