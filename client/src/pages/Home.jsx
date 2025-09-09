import { useState } from 'react';
import { useApp } from '../AppContext.js';
import { FaChevronRight } from 'react-icons/fa';
import InvestorRank from './InvestorRank.jsx';
import Chatbot from '../components/Chatbot.jsx'
import StockCard from '../components/StockCard.jsx'
import SearchBar from '../components/SearchBar.jsx'
import EmptyStockCard from '../components/EmptyStockCard.jsx'


export default function Home() {
    const { navigateToMarket } = useApp();
    const [activeSection, setActiveSection] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Home 에서 검색 시 Market 페이지로 이동
    const handleSearch = (searchTerm) => {
        if (searchTerm.trim()) {
            navigateToMarket(searchTerm.trim());
        }
    };

    return (
        <div className="pt-[15px] pb-[20px] px-[39px] max-w-full mx-auto">
            <div className="flex flex-col gap-[16px]">
                <div className="flex justify-end items-center">
                    <div className="w-full lg:w-[calc(50%-6px)]">
                        <SearchBar
                            value={searchTerm}
                            onSearch={handleSearch}
                            onSearchChange={setSearchTerm}
                            placeholder="종목 검색"
                            variant="home"
                        />
                    </div>
                </div>

                <WatchList />

                <div className="flex flex-col lg:flex-row gap-3">

                    <div className="flex-1 flex flex-col gap-[16px]">
                        <StockRank />
                        <InvestorRank setActiveSection={setActiveSection} />
                    </div>

                    <div className="w-full lg:w-96 flex flex-col gap-4">
                        <LoginCard />
                        <ChatWindow />
                    </div>
                </div>
            </div>
        </div>
    )
}


function WatchList() {
    const { isLoggedIn } = useApp();
    // 관심종목 데이터 - 기본값은 빈 배열
    const watchlistData = [];

    const mockData = [
        { stock_code: '001201', market: '코스피', stock_name: '상지전자', current_price: 81300, change_amount: 1200, changePercent: 1.50 },
        { stock_code: '001202', market: '코스피', stock_name: '지니생명', current_price: 45750, change_amount: -50, change_rate: -0.11 },
        { stock_code: '001203', market: '코스피', stock_name: 'Calia솔루션', current_price: 350000, change_amount: 2000, change_rate: 0.57 },
        { stock_code: '001204', market: '코스피', stock_name: 'HM캐피털', current_price: 224000, change_amount: -1500, change_rate: -0.67 }
    ];

    return (
        <div>
            {!isLoggedIn || watchlistData.length === 0 ? (
                // 로그인 안했거나 관심종목이 없는 경우 - 전체 너비 사용
                <div className="w-full">
                    <EmptyStockCard 
                        message={!isLoggedIn 
                            ? "관심종목을 조회 또는 추가하려면\n로그인이 필요합니다" 
                            : "관심종목을 추가하면 여기에 표시됩니다"
                        } 
                    />
                </div>
            ) : (
                // 관심종목이 있는 경우 - 그리드 레이아웃 사용
                <div className="grid lg:grid-cols-2 xl:grid-cols-4 gap-3">
                    {watchlistData.map((stock, index) => (
                        <StockCard key={index} stock={stock} />
                    ))}
                </div>
            )}
        </div>
    )
}


function StockRank() {
    const { navigateToMarket } = useApp();

    const stockData = [
        { name: '대한전선', volume: 13120, change: +0.54, amount: 10000, up: true },
        { name: '삼성전자', volume: 64200, change: +0.54, amount: 10000, up: true },
        { name: '현대자동차', volume: 121000, change: -0.54, amount: 10000, up: false },
        { name: 'SK텔레콤', volume: 121000, change: -0.54, amount: 10000, up: false },
    ];

    return (
        <div className="bg-white rounded-[20px] h-[345px] py-[19px] px-[28px]" style={{ fontFamily: 'DM Sans' }}>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-[20px] font-bold text-[#0F250B]">거래량 순위</h2>
                <button
                    onClick={() => navigateToMarket('')}
                    className="flex items-center text-[16px] text-[#8A8A8A] font-regular">
                    더보기
                    <FaChevronRight className="ml-1 w-3 h-3" />
                </button>
            </div>
            <ul className="space-y-0">
                {stockData.map((stock, index) => (
                    <li key={index} className="flex items-center h-[60px] border-b border-[#E9E9E9] last:border-b-0">

                        <span className="w-6 lg:w-8 text-center font-normal text-base lg:text-[20px] flex-shrink-0 text-[#8A8A8A]">{index + 1}</span>
                        <span className="flex-1 font-normal lg: text-[20px] text-[#0F250B] min-w-0 ml-4 pr-2 truncate">{stock.name}</span>
                        <span className={`hidden lg:inline text-base md:text-[18px] font-normal text-[#0F250B] flex-shrink-0 whitespace-nowrap mr-4`}>{stock.volume.toLocaleString()}원</span>
                        <span className={`text-base lg:text-[20px] font-normal ml-auto flex-shrink-0 whitespace-nowrap ${stock.up ? 'text-[#FF383C]' : 'text-[#0088FF]'}`}>
                            {stock.up ? '+' : '-'}{stock.amount.toLocaleString()}원 ({Math.abs(stock.change).toFixed(2)}%)
                        </span>


                    </li>
                ))}
            </ul>
        </div >
    )
};


function LoginCard() {
    const { isLoggedIn, user, handleKakaoLogin, handleLogout, isLoading } = useApp();

    if (isLoggedIn) {
        return (
            <div
                className="rounded-[20px] h-[345px] p-6 flex flex-col items-center justify-center space-y-4 bg-cover bg-bottom"
                style={{ backgroundImage: "url('/icon/blurred.png')" }}
            >
                <div className="text-center">
                    <p className="text-sm text-white font-medium mb-2">안녕하세요!</p>
                    <p className="text-lg text-white font-bold">{user?.nickname || '사용자'}님</p>
                    <p className="text-sm text-white mt-2">
                        보유 현금: {user?.current_balance?.toLocaleString() || '0'}원
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="rounded-[20px] h-[345px] p-6 flex flex-col items-center justify-start pt-14 space-y-1 bg-cover bg-bottom"
            style={{ backgroundImage: "url('/icon/blurred.png')" }}
        >
            <p className="text-sm text-gray-500 text-center" alt="카카오 로그인">모의 투자를 진행하려면<br />로그인이 필요합니다</p>
            <img 
                className="cursor-pointer w-64 hover:opacity-80 transition-opacity" 
                src="/icon/kakao_login.png" 
                alt="카카오 로그인"
                onClick={handleKakaoLogin}
                style={{ pointerEvents: isLoading ? 'none' : 'auto' }}
            />
        </div>
    );
}

function ChatWindow() {
    return (
        <div>
            <Chatbot isExpanded={true} height="h-[345px]" />
        </div>
    );
};