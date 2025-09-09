import { useState, useEffect } from 'react';
import { useApp } from '../AppContext';
import { FaChevronRight } from "react-icons/fa";
import { rankingApi } from '../services/rankingApi';

export default function InvestorRank({ setActiveSection }) {
    const { navigateToInvestorRankPage } = useApp();
    const [investorData, setInvestorData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // 투자 랭킹 데이터 로드
    useEffect(() => {
        const fetchInvestorRanking = async () => {
            try {
                setIsLoading(true);
                const response = await rankingApi.getInvestmentRanking(4); // 상위 4개만
                
                if (response.success && response.data) {
                    setInvestorData(response.data);
                } else {
                    console.error('투자 랭킹 조회 실패:', response.error);
                    setInvestorData([]);
                }
            } catch (error) {
                console.error('투자 랭킹 로드 오류:', error);
                setInvestorData([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInvestorRanking();
    }, []);

    return (
        <div className="bg-white rounded-[20px] h-[345px] py-[19px] px-[28px]" style={{fontFamily: 'DM Sans'}}>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-[20px] font-bold text-[#0F250B]">투자 랭킹</h2>
                <button
                    onClick={navigateToInvestorRankPage}
                    className="flex items-center text-[16px] text-[#8A8A8A] font-regular"
                >
                    더보기
                    <FaChevronRight className="ml-1 w-3 h-3" />
                </button>
            </div>
            
            {isLoading ? (
                <div className="flex justify-center items-center h-[250px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-gray-500">투자 랭킹을 불러오는 중...</span>
                </div>
            ) : investorData.length === 0 ? (
                <div className="flex justify-center items-center h-[250px]">
                    <span className="text-gray-500">투자 랭킹 데이터를 불러올 수 없습니다</span>
                </div>
            ) : (
                <ul className="space-y-0">
                    {investorData.map((investor, index) => (
                        <li key={investor.user_id || index} className="flex items-center h-[60px] border-b border-[#E9E9E9] last:border-b-0">
                            <span className={`w-6 text-center font-normal text-base lg:text-[20px] flex-shrink-0 ${
                                index === 0 ? 'text-[#FFCC00]' : 
                                index === 1 ? 'text-[#CCCCCC]' : 
                                index === 2 ? 'text-[#AC7F5E]' : 
                                'text-[#8A8A8A]'
                            }`}>{investor.rank || index + 1}</span>
                            <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full ml-4 flex-shrink-0 flex items-center justify-center text-xs overflow-hidden">
                                {investor.profile_image_url ? (
                                    <img 
                                        src={investor.profile_image_url} 
                                        alt={investor.nickname}
                                        className="w-full h-full rounded-full object-cover"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <div className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center text-gray-600" style={{display: investor.profile_image_url ? 'none' : 'flex'}}>
                                    {investor.nickname ? investor.nickname.charAt(0) : '?'}
                                </div>
                            </div>
                            <span className="ml-4 font-normal flex-1 text-lg text-[#0F250B] truncate min-w-0 pr-2">{investor.nickname || '익명'}</span>
                            <span className={`text-xs lg:text-lg font-normal flex-shrink-0 whitespace-nowrap ${
                                investor.profit_amount > 0 ? 'text-[#FF383C]' :
                                investor.profit_amount < 0 ? 'text-[#0088FF]' :
                                'text-[#8A8A8A]'
                            }`}>
                                {investor.profit_amount > 0 ? '+' : ''}{(investor.profit_amount || 0).toLocaleString()}원
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
