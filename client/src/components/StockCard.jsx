// API에서 받아온 데이터 구조에 맞게 stock 필드명 설정하기

import React from 'react';
import { useState } from 'react';


const HeartIcon = ({ active }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 cursor-pointer ${active ? 'text-red-500 fill-current' : 'text-gray-300'}`} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
    </svg>
);

const StockCard = ({ stock }) => {
    const [active, setActive] = useState(false);
    // 가격 변동에 따라서 색상, 화살표 아이콘 결정하기
    const isUp = stock.direction === 'up';
    const textColor = isUp ? 'text-red-500' : 'text-blue-500';
    const changeIcon = isUp ? '▲' : '▼';

    return (
        <div className="bg-white p-3 rounded-lg border border-gray-200 flex flex-col justify-between h-full">
            {/* 상단 요소들: 종목코드, 시장, 좋아요*/}
            <div className="flex justify-between items-center text-gray-500 text-xs mb-1">
                <span>{stock.id} · {stock.market}</span>
                <button className="hover:text-red-500" onClick={() => setActive(!active)}>
                    <HeartIcon active={active} />
                </button>
            </div>

            {/* 중간 요소: 종목명 */}
            <div className="mb-2">
                <h3 className="text-base font-bold text-gray-800">{stock.name}</h3>
            </div>

            {/* 하단 요소들: 현재가, 변동(화살표, 1주당얼마, 비율) */}
            <div>
                <div className={`flex items-center justify-between text-sm ${textColor}`}>
                    <p className="text-base font-bold mr-3">{stock.price.toLocaleString()}</p>
                    <div>
                        <span>{changeIcon}{stock.change.toLocaleString()}</span>
                        <span className="ml-1">({stock.changePercent.toFixed(2)}%)</span>
                    </div>
                </div>
            </div>
        </div>
    )
};

export default StockCard;
