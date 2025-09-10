const StockHeader = ({ selectedStock, currentPrice, onBuyClick, onSellClick }) => {
    if (!selectedStock) return null;

    const stockName = selectedStock.stock_name || '종목명 없음';
    const stockCode = selectedStock.stock_code || '';
    const market = selectedStock.market || '';
    const price = selectedStock.current_price || 0;
    const change = selectedStock.change_amount || 0;
    const changePercent = selectedStock.change_rate || 0;

    const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
    const textColor = direction === 'up' ? 'text-[#FF383C]' : direction === 'down' ? 'text-[#0088FF]' : 'text-[#8A8A8A]';
    const changeIcon = direction === 'up' ? '▲' : direction === 'down' ? '▼' : '';

    return (
        <div className="bg-white rounded-[20px] py-[19px] px-[28px]" style={{fontFamily: 'DM Sans'}}>
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <h1 className="text-[20px] font-bold text-[#0F250B]">{stockName}</h1>
                    <span className="text-[16px] font-light text-[#8A8A8A]">{stockCode} {market}</span>
                    <span className="text-lg font-normal text-[#0F250B] pl-4">{price.toLocaleString()}</span>
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
                        disabled={!currentPrice}
                        className="bg-[#0088FF] text-white px-5 py-2 rounded-lg hover:bg-blue-600 transition-colors font-normal">
                        매도
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StockHeader;