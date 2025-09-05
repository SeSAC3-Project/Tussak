const StockHeader = ({ selectedStock, onBuyClick }) => {
    if (!selectedStock) return null;

    const stockName = selectedStock.stock_name || '종목명 없음';
    const stockCode = selectedStock.stock_code || '';
    const market = selectedStock.market || '';
    const price = selectedStock.current_price || 0;
    const change = selectedStock.change_amount || 0;
    const changePercent = selectedStock.change_rate || 0;

    const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
    const textColor = direction === 'up' ? 'text-red-500' : direction === 'down' ? 'text-blue-500' : 'text-gray-600';
    const changeIcon = direction === 'up' ? '▲' : direction === 'down' ? '▼' : '';

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <h1 className="text-2xl font-bold text-gray-800">{stockName}</h1>
                    <span className="text-sm text-gray-500">{stockCode} {market}</span>
                    <span className="text-2xl font-bold text-gray-800">{price.toLocaleString()}</span>
                    <div className="flex items-center space-x-2">
                        <span className={`font-semibold ${textColor}`}>
                            {changeIcon} {change.toLocaleString()} ({changePercent.toFixed(2)}%)
                        </span>
                    </div>
                </div>
                <div className="flex space-x-2">
                    <button 
                        onClick={onBuyClick}
                        className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors font-medium">
                        매도
                    </button>
                    <button 
                        className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium">
                        매수
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StockHeader;