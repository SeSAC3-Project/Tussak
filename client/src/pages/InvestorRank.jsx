import { FaChevronRight } from "react-icons/fa";

export default function InvestorRank({ setActiveSection }) {
    const investorData = [
        { name: '김주식', gain: 130.00 },
        { name: '박투자', gain: 95.50 },
        { name: '최새싹', gain: 30.25 },
        { name: '이초보', gain: 15.07 },
    ];

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-black">투자 랭킹</h2>
                <button
                    onClick={() => setActiveSection('InvestorRankPage')}
                    className="flex items-center text-lime-500 hover:text-lime-700"
                >
                    더보기
                    <FaChevronRight className="ml-1 w-3 h-3" />
                </button>
            </div>
            <ul>
                {investorData.map((investor, index) => (
                    <li key={index} className="flex items-center py-2 border-b last:border-b-0">
                        <span className="w-6 text-center font-bold text-gray-500">{index+1}</span>
                        <div className="w-8 h-8 rounded-full bg-gray-300 ml-4 flex items-center justify-center text-xs"></div>
                        <span className="ml-4 font-medium flex-1 text-black">{investor.name}</span>
                        <span className="text-red-500 font-bold">
                            +{investor.gain.toFixed(2)} %
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
