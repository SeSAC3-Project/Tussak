import { useState, useEffect } from 'react';
import { useApp } from '../AppContext';
import portfolioApi from '../services/portfolioApi';

// API 데이터를 화면에 맞게 변환하는 함수
const transformPortfolioData = (apiData) => {
    if (!apiData || !apiData.portfolios) {
        return [];
    }

    return apiData.portfolios.map(portfolio => ({
        stock_code: portfolio.stock_code,
        name: portfolio.stock_name,
        quantity: portfolio.quantity,
        averageCost: portfolio.average_price,
        currentPrice: portfolio.current_price,
        evaluationAmount: portfolio.current_value,
        totalInvestment: portfolio.investment_amount,
        unrealizedPL: portfolio.profit_loss,
        returnRate: portfolio.profit_loss_rate
    }));
};

const formatKRW = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(Math.round(amount)) + '원';
};

const formatPercentage = (rate) => {
    const sign = rate >= 0 ? '+' : '';
    return `${sign}${rate.toFixed(2)}%`;
};

export default function Portfolio() {
    const { authToken, isLoggedIn } = useApp();
    const [portfolioData, setPortfolioData] = useState(null);
    const [portfolioStocks, setPortfolioStocks] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPortfolioData = async () => {
            if (!isLoggedIn || !authToken) {
                setError('로그인이 필요합니다.');
                return;
            }

            try {
                setError(null);
                const data = await portfolioApi.getPortfolio(authToken);

                if (data) {
                    setPortfolioData(data);
                    const transformedStocks = transformPortfolioData(data);
                    setPortfolioStocks(transformedStocks);
                }
            } catch (error) {
                console.error('포트폴리오 데이터 로드 실패:', error);
                setError(error.message || '포트폴리오 조회에 실패했습니다.');
            }
        };

        fetchPortfolioData();
    }, [authToken, isLoggedIn]);

    // 로그인하지 않은 경우
    if (!isLoggedIn) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">로그인 후 포트폴리오를 확인하실 수 있습니다.</div>
            </div>
        );
    }

    // 에러가 있는 경우
    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-red-500">{error}</div>
            </div>
        );
    }

    // 로딩 중인 경우
    if (!portfolioData) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">포트폴리오를 불러오는 중입니다 ...</div>
            </div>
        );
    }

    return (

            <div className="max-w-7xl mx-auto">
                {/* 내 자산 현황 */}
                <div className="mt-4 mx-2 mb-7 overflow-visible">

                    <div className="bg-white px-7 py-5 rounded-lg mb-7">
                        <h1 className="font-bold mb-6" style={{ fontFamily: 'DM Sans', fontSize: '20px', color: 'rgb(15, 37, 11)' }}>내 자산 현황</h1>
                        <div className="bg-white-300 p-4 rounded-lg shadow-[inset_0_0_10px_rgba(0,0,0,0.1)]">
                            <div className="text-gray-600">
                                현금잔고: {formatKRW(portfolioData.user_info?.current_balance || 0)}
                            </div>
                            <div className="text-gray-600">
                                투자금액: {formatKRW(portfolioData.portfolio_summary?.total_investment || 0)}
                            </div>
                            <div className={`${portfolioData.portfolio_summary?.total_profit_loss >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                                투자손익: {formatKRW(portfolioData.portfolio_summary?.total_profit_loss || 0)} ({formatPercentage(portfolioData.portfolio_summary?.total_profit_loss_rate || 0)})
                            </div>
                            <div className="text-gray-600">
                                총 자산: {formatKRW(portfolioData.portfolio_summary?.total_asset || 0)}
                            </div>
                            
                        </div>
                    </div>
                </div>
                {/* 보유 주식 */}
                <div className="mx-2 mb-4">
                    <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm overflow-hidden" style={{ fontFamily: 'DM Sans' }}>
                        <h2 className="text-[20px] font-bold text-[#0F250B] mb-6">보유 주식</h2>
                        {/* 테이블 - lg 이상 */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-4 font-medium text-gray-500">종목명</th>
                                        <th className="text-left py-3 px-2 font-medium text-gray-500">보유수량</th>
                                        <th className="text-left py-3 px-2 font-medium text-gray-500">평가금액</th>
                                        <th className="text-left py-3 px-2 font-medium text-gray-500">평가손익</th>
                                        <th className="text-left py-3 px-2 font-medium text-gray-500">수익률</th>
                                        <th className="text-right py-3 px-2 font-medium text-gray-500">현재가</th>
                                        <th className="text-right py-3 px-4 font-medium text-gray-500">평균단가</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {portfolioStocks.map((stock, index) => (
                                        <tr key={`${stock.stock_code}-${index}`} className="border-b border-[#E9E9E9] last:border-b-0 hover:bg-gray-50">
                                            <td className="py-4 px-4 text-gray-800 font-normal text-base">{stock.name}</td>
                                            <td className="py-4 px-2 text-gray-700 font-normal text-base">{stock.quantity}주</td>
                                            <td className="py-4 px-2 text-gray-800 font-normal text-base">{formatKRW(stock.evaluationAmount)}</td>
                                            <td className={`py-4 px-2 font-normal text-base ${stock.unrealizedPL >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                                                {formatKRW(stock.unrealizedPL)}
                                            </td>
                                            <td className={`py-4 px-2 font-normal text-base ${stock.returnRate >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                                                {formatPercentage(stock.returnRate)}
                                            </td>
                                            <td className="py-4 px-2 text-right text-gray-800 font-normal text-base">
                                                {formatKRW(stock.currentPrice)}
                                            </td>
                                            <td className="py-4 px-4 text-right text-gray-800 font-normal text-base">
                                                {formatKRW(stock.averageCost)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* 카드 형태 - lg 미만 */}
                        <div className="block lg:hidden space-y-3">
                            {portfolioStocks.map((stock, index) => (
                                <div key={`${stock.stock_code}-${index}`} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                    {/* 주식명과 보유수량 */}
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="text-lg font-normal text-gray-800">{stock.name}</h3>
                                            <p className="text-base font-normal text-gray-600">{stock.quantity}주</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-normal text-gray-800">{formatKRW(stock.evaluationAmount)}</p>
                                            <p className={`text-base font-normal ${stock.unrealizedPL >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                                                {formatKRW(stock.unrealizedPL)} ({formatPercentage(stock.returnRate)})
                                            </p>
                                        </div>
                                    </div>

                                    {/* 평균단가와 현재가 */}
                                    <div className="flex justify-between text-base font-normal text-gray-600">
                                        <div>
                                            <span className="text-gray-500">평균단가</span>
                                            <span className="ml-2 text-gray-800">{formatKRW(stock.averageCost)}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">현재가</span>
                                            <span className="ml-2 text-gray-800">{formatKRW(stock.currentPrice)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>



                    {portfolioStocks.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            보유 주식이 없습니다.
                        </div>
                    )}
                </div>
            </div>
    );
};