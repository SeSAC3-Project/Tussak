import React, { useState } from 'react';
import StockList from './StockList';
import StockDetail from './StockDetail' 


export default function Market() {
    const [selectedStock, setSelectedStock] = useState(null);

    const dummyStock = {
    id: '001230',
    market: '코스피',
    name: 'SK하이닉스',
    price: 233120,
    change: 60,
    changePercent: 0.54,
    direction: 'up'
  };

    return (
        <div>
            {selectedStock ? (
                <StockDetail stock={selectedStock} onBack={() => setSelectedStock(null)} />
                ) : (
                    // <StockList onSelectStock={(stock) => setSelectedStock(stock)} />
                    // UI 시뮬레이션용으로 StockDetail은 하이닉스를 고정으로 띄우기
                    <StockList onSelectStock={() => setSelectedStock(dummyStock)} />
                )}
        </div>
    );
};
