import { useApp } from '../AppContext';
import { FaChevronRight } from "react-icons/fa";

export default function InvestorRank({ setActiveSection }) {
    const { navigateToInvestorRankPage } = useApp();

    const investorData = [
        { name: '김주식', gain: 130.00 },
        { name: '박투자', gain: 95.50 },
        { name: '최새싹', gain: 30.25 },
        { name: '이초보', gain: 15.07 },
    ];

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
            <ul className="space-y-0">
                {investorData.map((investor, index) => (
                    <li key={index} className="flex items-center h-[60px] border-b border-[#E9E9E9] last:border-b-0">
                        <span className={`w-6 text-center font-normal text-base lg:text-[20px] flex-shrink-0 ${
                            index === 0 ? 'text-[#FFCC00]' : 
                            index === 1 ? 'text-[#CCCCCC]' : 
                            index === 2 ? 'text-[#AC7F5E]' : 
                            'text-[#8A8A8A]'
                        }`}>{index+1}</span>
                        <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-gray-300 ml-4 flex-shrink-0 flex items-center justify-center text-xs"></div>
                        <span className="ml-4 font-normal flex-1 text-[20px] text-[#0F250B] truncate min-w-0 pr-2">{investor.name}</span>
                        <span className="text-sm lg:text-[20px] font-normal text-[#FF383C] flex-shrink-0 whitespace-nowrap">
                            +{investor.gain.toFixed(2)}%
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
