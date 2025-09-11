import React from 'react';

const StockInfo = ({ stockData }) => {
    // 데이터 포맷팅 헬퍼 함수
    const formatNumber = (num) => {
        if (!num) return '-';
        return new Intl.NumberFormat('ko-KR').format(num);
    };

    const formatCurrency = (num) => {
        if (!num) return '-';
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW',
            minimumFractionDigits: 0
        }).format(num);
    };

    const stockInfo = [
        { label: '시가총액', value: formatCurrency(stockData?.market_cap) },
        { label: '주식수', value: `${formatNumber(stockData?.shares_outstanding)}주` },
        { label: '산업군', value: stockData?.sector || '-' },
        { label: '세부산업군', value: stockData?.sector_detail || '-' },
        { label: '52주 최저', value: formatCurrency(stockData?.week52_low) },
        { label: '52주 최고', value: formatCurrency(stockData?.week52_high) },
        { label: 'PER', value: stockData?.per ? `${stockData.per.toFixed(2)}배` : '-' },
        { label: 'PBR', value: stockData?.pbr ? `${stockData.pbr.toFixed(2)}배` : '-' }
    ];

    return (
        <div className="bg-white rounded-[20px] h-[425px] w-full lg:w-1/2 py-[19px] px-[28px]" style={{fontFamily: 'DM Sans'}}>
            <h2 className="text-[20px] font-bold text-[#0F250B] mb-1">종목요약</h2>
            <div className="space-y-0">
                {stockInfo.map((item, index) => (
                    <div key={index} className="flex justify-between items-center h-[45px] px-2 border-b border-[#E9E9E9] last:border-b-0">
                        <span className="font-normal text-base text-[#8A8A8A] flex-shrink-0">{item.label}</span>
                        <span className="font-normal flex-1 text-base text-[#0F250B] truncate min-w-0 pr-2 text-right">{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StockInfo;