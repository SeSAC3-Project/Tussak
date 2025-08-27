import React from 'react';

const StockHeader = ({ stock }) => {
    return (
        <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <h1 className="text-2xl font-bold text-gray-800">{stock.name}</h1>
                    <span className="text-sm text-gray-500">{stock.id} {stock.market}</span>
                    <span className="text-2xl font-bold text-gray-800">{stock.price.toLocaleString()}</span>
                    <div className="flex items-center space-x-2">
                        <span className={`font-semibold ${stock.direction === 'up' ? 'text-red-500' : 'text-blue-500'}`}>
                            {stock.direction === 'up' ? '▲' : '▼'} {stock.change.toLocaleString()} ({stock.changePercent}%)
                        </span>
                    </div>
                </div>
                <div className="flex space-x-2">
                    <button className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors font-medium">
                        매도
                    </button>
                    <button className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium">
                        매수
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StockHeader;