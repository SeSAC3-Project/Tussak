import React from 'react';
import { Trophy, Medal, Award } from 'lucide-react';


const InvestmentRanking = () => {
    const allInvestorData = [
        { name: '김수식', gain: 199.99 },
        { name: '박투자', gain: 199.99 },
        { name: '최재벌', gain: 189.99 },
        { name: '이초보', gain: 189.99 },
        { name: '이초보', gain: 189.99 },
        { name: '이초보', gain: 189.99 },
        { name: '이초보', gain: 189.99 },
        { name: '이초보', gain: 189.99 },
        { name: '이초보', gain: 189.99 },
        { name: '이초보', gain: 189.99 },
        { name: '이초보', gain: 189.99 },
        { name: '이초보', gain: 189.99 },
        { name: '이초보', gain: 189.99 },
        { name: '이초보', gain: 189.99 },
        { name: '이초보', gain: 189.99 },
        { name: '이초보', gain: 189.99 },
        { name: '이초보', gain: 189.99 },
        { name: '이초보', gain: 189.99 },
        { name: '이초보', gain: 189.99 },
        { name: '이초보', gain: 189.99 },
        { name: '이초보', gain: 189.99 },
        { name: '이초보', gain: 189.99 },
        { name: '이초보', gain: 189.99 },
        { name: '이초보', gain: 189.99 },
        { name: '이초보', gain: 189.99 },
        { name: '이초보', gain: 189.99 },
        { name: '이초보', gain: 189.99 },
        { name: '이초보', gain: 189.99 },
        { name: '이초보', gain: 189.99 },
        { name: '이초보', gain: 189.99 },
    ];

    const getRankIcon = (index) => {
        switch (index) {
            case 0:
                return <Trophy className="w-6 h-6 text-lime-400" />;
            case 1:
                return <Medal className="w-6 h-6 text-lime-400" />;
            case 2:
                return <Award className="w-6 h-6 text-lime-400" />;
            default:
                return null;
        }
    };

    const getProfileColor = (name) => {
        const colors = [
            'from-blue-400 to-purple-500',
            'from-green-400 to-blue-500',
            'from-purple-400 to-pink-500',
            'from-red-400 to-yellow-500',
            'from-indigo-400 to-purple-500',
            'from-pink-400 to-red-500',
            'from-yellow-400 to-orange-500',
            'from-teal-400 to-blue-500',
            'from-orange-400 to-red-500',
            'from-cyan-400 to-blue-500'
        ];
        const hash = name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
        return colors[hash % colors.length];
    };

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* 사이드바와 메인 컨텐츠를 감싸는 컨테이너 */}
                <div className="lg:flex lg:gap-8">

                    {/* 메인 컨텐츠 */}
                    <div className="flex-1">

                        {/* 랭킹 카드 */}
                        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                            {/* '투자 랭킹' */}
                            <div className="bg-[#B0EE8E] p-4 lg:p-6">
                                <div className="flex items-center justify-between">
                                    <div className="ml-4">
                                        <h2 className="text-xl lg:text-2xl font-bold text-black mb-2 ">전체 투자 랭킹</h2>
                                        <p className="text-sm text-gray-600">수익률 기준으로 정렬됩니다</p>
                                    </div>
                                    <div className="bg-white bg-opacity-20 rounded-full p-4">
                                        <div className="text-xl">🏆</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-6 lg:p-8">
                                {/* 상위 3명 하이라이트 */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                    {allInvestorData.slice(0, 3).map((investor, index) => (
                                        <div key={index} className={`p-6 rounded-2xl ${
                                            // index === 0 ? 'bg-gradient-to-br from-[#DFFFD6] to-lime-100 border-2 border-lime-300' :
                                            // index === 1 ? 'bg-gradient-to-br from-[#DFFFD6] to-lime-100 border-2 border-lime-300' :
                                            'bg-gradient-to-br from-[#DFFFD6] to-lime-100 hover:to-[#B0EE8E] transition-colors border-2 border-[#DFFFD6]'
                                        }`}>
                                            <div className="text-center">
                                                <div className="flex justify-center mb-3">
                                                    {getRankIcon(index)}
                                                </div>
                                                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getProfileColor(investor.name)} mx-auto mb-3 flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                                                    {investor.name.charAt(0)}
                                                </div>
                                                <h3 className="font-bold text-gray-800 mb-1">{investor.name}</h3>
                                                <p className="text-2xl font-bold text-red-500">+{investor.gain}%</p>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {index === 0 ? '👑 1위' : index === 1 ? '🥈 2위' : '🥉 3위'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* 나머지 순위 리스트 */}
                                <div className="space-y-3">
                                    <div className="grid gap-2 max-h-[800px] overflow-y-scroll scrollbar-thin scrollbar-thumb-line-300">
                                        {allInvestorData.slice(3).map((investor, index) => (
                                            <div key={index + 3} className="flex items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors mr-4">
                                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-gray-600 font-bold mr-4">
                                                    {index + 4}
                                                </div>
                                                
                                                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getProfileColor(investor.name)} flex items-center justify-center text-white font-bold shadow-md mr-4`}>
                                                    {investor.name.charAt(0)}
                                                </div>
                                                
                                                <div className="flex-1">
                                                    <span className="font-medium text-gray-800 text-lg">{investor.name}</span>
                                                </div>
                                                
                                                <div className="text-right">
                                                    <span className="text-xl font-bold text-red-500">
                                                        +{investor.gain}% (+130.00%)
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                {/* 통계 정보 */}
                                <div className="mt-8 pt-6 border-t border-gray-200">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl">
                                            <div className="text-3xl font-bold text-blue-600 mb-2">{allInvestorData.length}</div>
                                            <div className="text-sm text-gray-600">총 투자자</div>
                                        </div>
                                        <div className="text-center p-4 bg-gradient-to-br from-red-50 to-pink-100 rounded-xl">
                                            <div className="text-3xl font-bold text-red-500 mb-2">
                                                {(allInvestorData.reduce((sum, investor) => sum + investor.gain, 0) / allInvestorData.length).toFixed(1)}%
                                            </div>
                                            <div className="text-sm text-gray-600">평균 수익률</div>
                                        </div>
                                        <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl">
                                            <div className="text-3xl font-bold text-green-600 mb-2">{Math.max(...allInvestorData.map(i => i.gain)).toFixed(1)}%</div>
                                            <div className="text-sm text-gray-600">최고 수익률</div>
                                        </div>
                                        <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl">
                                            <div className="text-3xl font-bold text-purple-600 mb-2">{Math.min(...allInvestorData.map(i => i.gain)).toFixed(1)}%</div>
                                            <div className="text-sm text-gray-600">최저 수익률</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvestmentRanking;