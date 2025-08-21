// stock 은 direction, id, market(코스피/코스닥), name, price, change, changePercent 을 키로 가져야 한다

import React from 'react';

const StockCard = ({ stock }) => {
    // 가격 변동에 따라서 색상, 화살표 아이콘 결정하기
    const isUp = stock.direction === 'up';
    const textColor = isUp ? 'text-red-500' : 'text-blue-500';
    const changeIcon = isUp ? '▲' : '▼';

    return (
        <div className="bg-white p-4 rounded-lg border border-gray-200 flex flex-col justify-between h-full">
            {/* 상단 요소들: 종목코드, 시장, 좋아요*/}
            <div className="flex justify-between items-center text-gray-500 text-xs mb-2">
                <span>{stock.id} {stock.market}</span>
                <button className="hover:text-red-500">
                    <img src="/icon/vector.svg" alt="heart icon" className="w-5 h-5" />
                </button>
            </div>

            {/* 중간 요소: 종목명 */}
            <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-800">{stock.name}</h3>
            </div>

            {/* 하단 요소들: 현재가, 변동(화살표, 1주당얼마, 비율) */}
            <div>
                <p className="text-xl font-bold text-gray-900">{stock.price.toLocaleString()}</p>
                <div className={`flex items-center text-sm ${textColor}`}>
                    <span>{changeIcon} {stock.change.toLocalString()}</span>
                    <span className="ml-2">({stock.changePercent.toFixed(2)}%)</span>
                </div>
            </div>
        </div>
    )
};

export default StockCard;
