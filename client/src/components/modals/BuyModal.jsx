import { useState, useEffect } from 'react';
import { useApp } from '../../AppContext';
import transactionApi from '../../services/transactionApi';

const BuyModal = ({
    isOpen,
    onClose,
    onBuyComplete,
    stockName,
    stockCode,
    initialPrice
}) => {
    const { authToken, user } = useApp();
    const [orderPrice, setOrderPrice] = useState(initialPrice || 0)
    const [quantity, setQuantity] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // 초기 가격 설정
    useEffect(() => {
        if (initialPrice !== undefined && initialPrice !== null) {
            setOrderPrice(initialPrice);
        }
    }, [initialPrice]);


    // 모달 기본 세팅
    useEffect(() => {
        if (isOpen) {
            setOrderPrice(initialPrice || 0)
            setQuantity(1);
            setIsSubmitting(false);
            setError('');
        }
    }, [isOpen, initialPrice]);

    // 프로필카드와 동일한 방식으로 잔고 계산
    const currentBalance = user?.current_balance || 0;
    console.log('BuyModal 잔고 정보:', { user, currentBalance, orderPrice });

    const maxQuantity = orderPrice > 0 ? Math.floor(currentBalance / orderPrice) : 100;
    console.log('BuyModal 최대 수량 계산:', { currentBalance, orderPrice, maxQuantity });
    const totalAmount = (quantity === '' || quantity === 0) ? 0 : orderPrice * quantity;

    const handleQuantityChange = (e) => {
        const inputValue = e.target.value;
        console.log('Input value:', inputValue);

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
        } else if (value > maxQuantity && maxQuantity > 0) {
            // 최대 수량을 초과하는 경우 자동으로 최대값으로 설정
            console.log(`수량이 최대값(${maxQuantity})을 초과하여 자동 조정`);
            setQuantity(maxQuantity);
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

    const isValidOrder = quantity !== '' && Number(quantity) > 0 && Number(quantity) <= maxQuantity;

    const handleBuy = async () => {
        if (!isValidOrder) return;

        setIsSubmitting(true);
        setError('');

        try {
            const transactionData = {
                stockCode: stockCode,
                stockName: stockName,
                type: 'BUY',
                quantity: quantity,
                price: orderPrice
            };

            const result = await transactionApi.createTransaction(transactionData, authToken);
            
            const orderDetails = {
                name: stockName,
                code: stockCode,
                price: orderPrice,
                quantity: quantity,
                total: totalAmount,
                timestamp: new Date().toISOString(),
                transactionId: result.transaction.transaction_id,
                updatedBalance: result.transaction.updated_balance
            };

            setIsSubmitting(false);
            onBuyComplete(orderDetails);
        } catch (error) {
            setIsSubmitting(false);
            setError(error.message || '매수 주문에 실패했습니다');
        }
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat('ko-KR').format(num);
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
                aria-labelledby="buy-modal-title"
                aria-modal="true"
            >
                <div className="flex items-center mb-6 relative w-full">
                    <h2 id="buy-modal-title" className="absolute left-1/2 transform -translate-x-1/2 text-xl font-bold text-gray-900">
                        매수 주문
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
                        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                            수량 <span className="text-xs text-gray-500">(최대 {maxQuantity.toLocaleString()}주)</span>
                        </label>
                        <div className="flex items-center space-x-2">
                            <input
                                id="quantity"
                                type="number"
                                value={quantity}
                                onChange={handleQuantityChange}
                                onBlur={handleQuantityBlur}
                                className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus:ring-red-500 focus:border-red-500 text-right text-gray-900"
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
                            {formatNumber(orderPrice)}원
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
                            <span className="text-xl font-black text-[#FF383C]">
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
                            onClick={handleBuy}
                            disabled={!isValidOrder || isSubmitting}
                            className="flex-1 py-3 px-4 bg-[#FF383C] text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                            {isSubmitting ? '처리중...' : '매수'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
};

export default BuyModal;