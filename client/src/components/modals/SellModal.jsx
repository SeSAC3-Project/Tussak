import { useState, useEffect } from 'react';
import { useApp } from '../../AppContext';
import transactionApi from '../../services/transactionApi';

const SellModal = ({
    isOpen,
    onClose,
    onSellComplete,
    stockName,
    stockCode,
    initialPrice,
    holdingQuantity = 100
}) => {
    const { authToken } = useApp();
    const [sellPrice, setSellPrice] = useState(initialPrice || 0)
    const [quantity, setQuantity] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // 매도 버튼 클릭 시점의 가격으로 고정
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
            setIsSubmitting(false);
            setError('');
        }
    }, [isOpen, initialPrice]);

    const totalAmount = (quantity === '' || quantity === 0) ? 0 : sellPrice * quantity;
    // 주문 가능 수량 : 사용자 자금에 따라 설정 (지금은 하드코딩)

    // 매도가격은 고정되어 사용자가 수정할 수 없음
    // const handlePriceChange = (e) => {
    //     const value = parseFloat(e.target.value) || 0;
    //     if (value >= 0) {
    //         setSellPrice(value);
    //     }
    // };

    const handleQuantityChange = (e) => {
        const inputValue = e.target.value;
        console.log('Sell quantity input:', inputValue);

        // 빈 문자열인 경우 그대로 유지 (사용자가 지우고 있는 중일 수 있음)
        if (inputValue === '') {
            setQuantity('');
            return;
        }

        // 숫자가 아닌 문자가 포함된 경우 무시
        if (isNaN(inputValue) || inputValue.includes('.') || inputValue.includes('-')) {
            return;
        }

        const value = parseInt(inputValue);

        // 범위 체크 후 설정
        if (value < 1) {
            setQuantity(1);
        } else if (value > holdingQuantity && holdingQuantity > 0) {
            // 최대 수량을 초과하는 경우 자동으로 최대값으로 설정
            console.log(`수량이 최대값(${holdingQuantity})을 초과하여 자동 조정`);
            setQuantity(holdingQuantity);
        } else {
            setQuantity(value);
        }
    };

    // 포커스를 잃었을 때 빈 값 처리
    const handleQuantityBlur = () => {
        if (quantity === '' || quantity === 0) {
            setQuantity(1);
        }
    };

    const isValidOrder = sellPrice > 0 && quantity !== '' && Number(quantity) > 0 && Number(quantity) <= holdingQuantity;

    const handleSell = async () => {
        if (!isValidOrder) return;

        setIsSubmitting(true);
        setError('');

        try {
            const transactionData = {
                stockCode: stockCode,
                stockName: stockName,
                type: 'SELL',
                quantity: quantity,
                price: sellPrice
            };

            const result = await transactionApi.createTransaction(transactionData, authToken);
            
            const orderDetails = {
                name: stockName,
                code: stockCode,
                price: sellPrice,
                quantity: quantity,
                total: totalAmount,
                timestamp: new Date().toISOString(),
                orderType: 'sell',
                transactionId: result.transaction.transaction_id,
                updatedBalance: result.transaction.updated_balance
            };

            setIsSubmitting(false);
            onSellComplete(orderDetails);
        } catch (error) {
            setIsSubmitting(false);
            setError(error.message || '매도 주문에 실패했습니다');
        }
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
                style={{ fontFamily: 'DM Sans, sans-serif' }}
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
                                수량 <span className="text-xs text-gray-500">(최대 {holdingQuantity}주)</span>
                            </label>
                            <button
                                type="button"
                                onClick={handleSellAll}
                                className="text-xs text-blue-600 hover:text:blue-800 underline"
                            >
                                전량매도
                            </button>
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                id="quantity"
                                type="number"
                                value={quantity}
                                onChange={handleQuantityChange}
                                onBlur={handleQuantityBlur}
                                className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 text-right text-gray-900 pr-3"
                                placeholder="1"
                            />
                        </div>
                    </div>

                    {/* Order Price - Fixed */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            주문가격
                        </label>
                        <div className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg text-right text-gray-800">
                            {formatNumber(sellPrice)}원
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    {/* Total Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            주문총액
                        </label>
                        <div className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg text-right">
                            <span className="text-xl font-black text-blue-600">
                                {formatNumber(totalAmount)}원
                            </span>
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
