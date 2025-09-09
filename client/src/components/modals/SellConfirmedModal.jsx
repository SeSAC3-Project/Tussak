import { useEffect } from 'react';

const SellConfirmedModal = ({
    isOpen,
    onClose,
    orderDetails
}) => {
    // 모달 시간 설정: 5s
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                onClose();
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose]);

    const formatNumber = (num) => {
        return new Intl.NumberFormat('ko-KR').format(num);
    };

    const formatDateTime = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('ko-KR') + ' ' + date.toLocaleTimeString('ko-KR')
    };

    if (!isOpen || !orderDetails) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* 배경 */}
            <div
                className="absolute inset-0 bg-black bg-opacity-50"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* 체결 모달 */}
            <div
                className="relative bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 p-6"
                role="dialog"
                aria-labelledby="sell-confirmed-title"
                aria-modal="true"
            >
                <div className="text-center">
                    {/* Success Icon */}
                    <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    {/* Title */}
                    <h2 id="sell-confirmed-title" className="text-xl font-bold text-gray-900 mb-6">
                        매도 주문 완료
                    </h2>

                    {/* Sell Order Details */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3 text-left">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">종목</span>
                            <span className="font-medium">{orderDetails.name}</span>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">코드</span>
                            <span className="text-sm text-gray-500">{orderDetails.symbol}</span>
                        </div>

                        <div className="border-t border-gray-200 pt-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">매도가격</span>
                                <span className="font-medium">{formatNumber(orderDetails.price)}원</span>
                            </div>

                            <div className="flex justify-between items-center mt-1">
                                <span className="text-sm text-gray-600">매도수량</span>
                                <span className="font-medium">{formatNumber(orderDetails.quantity)}주</span>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 pt-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700">총 주문금액</span>
                                <span className="text-lg font-bold text-green-600">
                                    {formatNumber(orderDetails.total)}원
                                </span>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 pt-3">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">주문시간</span>
                                <span className="text-xs text-gray-500">
                                    {formatDateTime(orderDetails.timestamp)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Success Message */}
                    <p className="text-sm text-gray-600 mb-6">
                        매도 주문이 성공적으로 접수되었습니다.
                    </p>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="w-full py-3 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                    >
                        확인
                    </button>

                    {/* Auto-close notice */}
                    <p className="text-xs text-gray-400 mt-3">
                        5초 후 자동으로 닫힙니다
                    </p>
                </div>
            </div>
        </div>
    )
};

export default SellConfirmedModal;

