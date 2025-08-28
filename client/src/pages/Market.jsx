import React, { useState } from 'react';
import StockList from './StockList';
import StockDetail from './StockDetail' 


export default function Market() {
    const [selectedStock, setSelectedStock] = useState(null);

    return (
        <div>
            {selectedStock ? (
                <StockDetail stock={selectedStock} onBack={() => setSelectedStock(null)} />
                ) : (
                    <StockList onSelectStock={(stock) => setSelectedStock(stock)} />
                )}
        </div>
    );
};
