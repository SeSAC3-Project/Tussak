import { useState, useEffect } from 'react';

const SellModal = ({
    isOpen,
    onClose,
    onSellComplete,
    stockName,
    stockCode,
    initialPrice,
    holdingQuantity = 100
}) => {
    const [sellPrice, setSellPrice] = useState(initialPrice || 0)
    const [quantity, setQuantity] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 시세 변할 때 orderPrice update
    useEffect(() => {
        if (initialPrice) {
            setSellPrice(initialPrice);
        }
    }, [initialPrice]);

    // 모달 기본 세팅
    useEffect(() => {
        if (isOpen) {
            setSellPrice(initialPrice || 0)
            setQuantity(1);
            setIsSubmitting(false)
        }
    }, [isOpen, initialPrice]);

    const totalAmount = sellPrice * quantity;
    // 주문 가능 수량 : 사용자 자금에 따라 설정 (지금은 하드코딩)

    const handlePriceChange = (e) => {
        const value = parseFloat(e.target.value) || 0;
        if (value >= 0) {
            setSellPrice(value);
        }
    };

    const handleQuantityChange = (e) => {
        const value = parseInt(e.target.value) || 0;
        if (value >= 0 && value <= holdingQuantity) {
            setQuantity(value);
        }
    };

    const isValidOrder = sellPrice > 0 && quantity > 0 && quantity <= holdingQuantity;

    const handleSell = async () => {
        if (!isValidOrder) return;

        setIsSubmitting(true);

        // API 지연 상황 임의로 반영
        await new Promise(resolve => setTimeout(resolve, 500));

        const orderDetails = {
            name: stockName,
            code: stockCode,
            price: sellPrice,
            quantity: quantity,
            total: totalAmount,
            timestamp: new Date().toISOString(),
            orderType: 'sell'
        };

        setIsSubmitting(false)
        onSellComplete(orderDetails);
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat('ko-KR').format(num);
    };

    const handleSellAll = () => {
        setQuantity(holdingQuantity);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black bg-opacity-50"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal */}
            <div
                className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6"
                role="dialog"
                aria-labelledby="sell-modal-title"
                aria-modal="true"
            >
                <div className="flex items-center mb-6 relative w-full">
                    <h2 id="buy-modal-title" className="absolute left-1/2 transform -translate-x-1/2 text-xl font-bold text-gray-900">
                        매도 주문
                    </h2>

                    <button
                        onClick={onClose}
                        className="ml-auto text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Close modal"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Quantity */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                                매도 수량 <span className="text-xs text-gray-500">(보유 {holdingQuantity}주)</span>
                            </label>
                            <button
                                type="button"
                                onClick={handleSellAll}
                                className="text-xs text-blue-600 hover:text:blue-800 underline"
                            >
                                전량 매도
                            </button>
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                id="quantity"
                                type="number"
                                value={quantity}
                                onChange={handleQuantityChange}
                                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                                placeholder="1"
                                min="1"
                                max={holdingQuantity}
                            />
                        </div>
                        <div className="mt-2 text-xs text-gray-600">
                            매도 후 보유: <span className="font-medium">{formatNumber(holdingQuantity - quantity)}주</span>
                        </div>
                    </div>

                    {/* Order Price */}
                    <div>
                        <label htmlFor="order-price" className="block text-sm font-medium text-gray-700 mb-2">
                            매도가격
                        </label>
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
                            {/* <input
                                id="order-price"
                                type="number"
                                value={orderPrice}
                                onChange={handlePriceChange}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-blue-500 text-right mr-8 text-gray-800"
                                placeholder="0"
                                min="0"
                                step="100"
                            /> */}
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
                                {sellPrice}원
                            </span>
                        </div>
                    </div>

                    {/* Total Amount */}
                    <div className="mt-8 bg-blue-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">주문 총액</span>
                            <span className="text-xl font-bold text-blue-600">
                                {formatNumber(totalAmount)}원
                            </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            {formatNumber(sellPrice)}원 × {quantity}주
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3 pt-4">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            disabled={isSubmitting}
                        >
                            취소
                        </button>
                        <button
                            onClick={handleSell}
                            disabled={!isValidOrder || isSubmitting}
                            className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                            {isSubmitting ? '처리중...' : '매도'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
};

export default SellModal;
