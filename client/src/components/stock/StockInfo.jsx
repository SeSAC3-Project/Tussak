import React from 'react';

const StockInfo = () => {
    const stockInfo = [
        { label: '시가총액', value: '52,254' },
        { label: '주식수', value: '52,254' },
        { label: '상장일자', value: 'n/254' },
        { label: '상장자본금', value: '52,254' },
        { label: '52주 최저', value: '52,254' },
        { label: '52주 최고', value: '52,254' },
        { label: 'PER', value: '52,254' },
        { label: 'PBR', value: '52,254' }
    ];

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-6">종목요약</h2>
            <div className="space-y-4">
                {stockInfo.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-1 border-b border-gray-50 last:border-b-0">
                        <span className="text-gray-600 text-sm">{item.label}</span>
                        <span className="font-semibold text-gray-800 text-sm">{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StockInfo;