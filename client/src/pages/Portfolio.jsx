import { useState, useEffect } from 'react';

const dummyData = {
    userId: 'asdf',
    assets: {
        totalValue: 0,
        totalInvestment: 0,
        totalPL: 0,
        totalReturnRate: 0
    },
    stocks: [
        {
            id: 1,
            name: 'SJ텔레콤',
            quantity: 5,
            averageCost: 56400,
            currentPrice: 52254
        },
        {
            id: 2,
            name: 'SJ텔레콤',
            quantity: 10,
            averageCost: 57000,
            currentPrice: 52254
        },
        {
            id: 3,
            name: 'SJ텔레콤',
            quantity: 15,
            averageCost: 60000,
            currentPrice: 52254
        },
        {
            id: 4,
            name: '상지전자',
            quantity: 10,
            averageCost: 8500,
            currentPrice: 9200
        },
        {
            id: 5,
            name: '상지전자',
            quantity: 5,
            averageCost: 8800,
            currentPrice: 52254
        },
        {
            id: 6,
            name: '선상지퍼시픽',
            quantity: 20,
            averageCost: 15000,
            currentPrice: 13500
        },
        {
            id: 7,
            name: '선상지퍼시픽',
            quantity: 8,
            averageCost: 14200,
            currentPrice: 13500
        },
    ]
};

// 종목별로 모으기
const aggregateStocks = (stocks) => {
    const stockMap = new Map();

    stocks.forEach(stock => {
        if (stockMap.has(stock.name)) {
            const existing = stockMap.get(stock.name);
            const totalQuantity = existing.quantity + stock.quantity;
            const totalInvestment = (existing.quantity * existing.averageCost) + (stock.quantity * stock.averageCost);
            const newAverageCost = totalInvestment / totalQuantity;

            stockMap.set(stock.name, {
                ...existing,
                quantity: totalQuantity,
                averageCost: Math.round(newAverageCost),
                currentPrice: stock.currentPrice 
            });
        } else {
            stockMap.set(stock.name, { ...stock });
        }
    });

    return Array.from(stockMap.values());
};

// 종목 지표들 계산
const calculateStockMetrics = (stock) => {
    const evaluationAmount = stock.quantity * stock.currentPrice;
    const totalInvestment = stock.quantity * stock.averageCost;
    const unrealizedPL = evaluationAmount - totalInvestment;
    const returnRate = ((unrealizedPL / totalInvestment) * 100);
    
    return {
        ...stock,
        evaluationAmount,
        totalInvestment,
        unrealizedPL,
        returnRate
    };
};

const formatKRW = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(Math.round(amount)) + '원';
};

const formatPercentage = (rate) => {
    const sign = rate >= 0 ? '+' : '';
    return `${sign}${rate.toFixed(2)}%`;
};

export default function Portfolio() {
    const [userData, setUserData] = useState(null);
    const [aggregatedStocks, setAggregatedStocks] = useState([]);

    useEffect(() => {
        // API 호출 파트 
        // 현 더미데이터
        const fetchUserData = async () => {
            try {
                const data = { ...dummyData };

                const aggregated = aggregateStocks(data.stocks);

                const stocksWithMetrics = aggregated.map(calculateStockMetrics);

                const totalEvaluationAmount =stocksWithMetrics.reduce((sum, stock) => sum + stock.evaluationAmount, 0);
                const totalInvestment = stocksWithMetrics.reduce((sum, stock) => sum + stock.totalInvestment, 0);
                const totalUnrealizedPL = totalEvaluationAmount - totalInvestment;
                const totalReturnRate = totalInvestment > 0 ? (totalUnrealizedPL / totalInvestment) * 100 : 0;

                data.assets = {
                    totalValue: totalEvaluationAmount,
                    totalInvestment,
                    totalPL: totalUnrealizedPL,
                    totalReturnRate
                };

                setUserData(data);
                setAggregatedStocks(stocksWithMetrics);
            } catch (error) {
                console.error('사용자 정보를 가져오는 데 실패했습니다:', error);
            }
        };

        fetchUserData();
    }, []);

    if (!userData) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">포트폴리오를 불러오는 중입니다 ...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* 내 자산 현황 */}
                <div className="bg-white p-6 rounded-lg mb-7">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">내 자산 현황</h1>
                    <div className="bg-white-300 p-4 rounded-lg shadow-[inset_0_0_10px_rgba(0,0,0,0.1)]">
                        <div className="text-gray-600">
                            총 자산: {formatKRW(userData.assets.totalValue)}
                        </div>
                        <div className="text-gray-600">
                            총 투자금: {formatKRW(userData.assets.totalInvestment)}
                        </div>
                        <div className={`${userData.assets.totalPL >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                            평가손익: {formatKRW(userData.assets.totalPL)} ({formatPercentage(userData.assets.totalReturnRate)})
                        </div>
                    </div>
                </div>
 
                {/* 보유 주식 */}
                <div className="bg-white p-6 rounded-lg shadow-sm overflow-hidden">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">보유 주식</h2>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-8 font-medium text-gray-500">종목명</th>
                                    <th className="text-left py-3 px-2 font-medium text-gray-500">보유수량</th>
                                    <th className="text-left py-3 px-2 font-medium text-gray-500">평가금액</th>
                                    <th className="text-left py-3 px-2 font-medium text-gray-500">평가손익</th>
                                    <th className="text-left py-3 px-2 font-medium text-gray-500">수익률</th>
                                    <th className="text-left py-3 px-2 font-medium text-gray-500">현재가</th>
                                    <th className="text-left py-3 px-8 font-medium text-gray-500">평균단가</th>
                                </tr>
                            </thead>
                            <tbody>
                                {aggregatedStocks.map((stock, index) => {
                                    return (
                                        <tr key={`${stock.name}-${index}`} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 text-left px-8 text-gray-800">{stock.name}</td>
                                        <td className="py-3 px-2 text-left text-gray-700">{stock.quantity}주</td>
                                        <td className="py-3 px-2 text-left text-gray-800">{formatKRW(stock.evaluationAmount)}</td>
                                        <td className={`py-3 px-2 text-left ${stock.unrealizedPL >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                                            {formatKRW(stock.unrealizedPL)}
                                        </td>
                                        <td className={`py-3 px-2 text-left ${stock.returnRate >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                                            {formatPercentage(stock.returnRate)}
                                        </td>
                                        <td className="py-3 px-2 text-left text-gray-800">
                                            {formatKRW(stock.currentPrice)}
                                        </td>
                                        <td className="py-3 px-8 text-left text-gray-800">
                                            {formatKRW(stock.averageCost)}
                                        </td>
                                    </tr>
                                    )
                                    
                                })}
                            </tbody>
                        </table>
                    </div>

                    {aggregatedStocks.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            보유 주식이 없습니다.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
