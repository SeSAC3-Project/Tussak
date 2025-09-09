import { useState, useEffect } from 'react';
import { useApp } from '../AppContext.js';
import { FaChevronRight } from 'react-icons/fa';
import InvestorRank from './InvestorRank.jsx';
import Chatbot from '../components/Chatbot.jsx'
import StockCard from '../components/StockCard.jsx'
import SearchBar from '../components/SearchBar.jsx'
import EmptyStockCard from '../components/EmptyStockCard.jsx'
import { stockApi } from '../services/stockApi.js'


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
        <div className="max-w-7xl mx-auto">
            <div className="pt-[15px] pb-[20px] mx-2 flex flex-col gap-[16px]">
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

                <div className="flex flex-col lg:flex-row gap-[16px]">

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
    const { isLoggedIn, bookmarkDetails, bookmarksLoading, navigateToStockDetail } = useApp();
    
    // 사용자의 실제 관심종목 데이터 사용
    const watchlistData = bookmarkDetails || [];

    return (
        <div>
            {bookmarksLoading ? (
                // 로딩 중
                <div className="w-full flex justify-center items-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-gray-500">관심종목 목록을 불러오는 중...</span>
                </div>
            ) : !isLoggedIn || watchlistData.length === 0 ? (
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
                <div>
                    <div className="grid lg:grid-cols-2 xl:grid-cols-4 gap-3">
                        {watchlistData.map((stock, index) => (
                            <StockCard 
                                key={stock.stock_code || index} 
                                stock={stock} 
                                navigateToStockDetail={() => navigateToStockDetail(stock)}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}



function StockRank() {
    const { navigateToMarket } = useApp();
    const [stockData, setStockData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // 거래량 순위 데이터 로드 (실시간 데이터 포함)
    const fetchVolumeRanking = async () => {
        try {
            const response = await stockApi.fetchVolumeRanking(4); // 상위 4개만
            
            if (response.success && response.data) {
                setStockData(response.data);
            } else {
                console.error('거래량 순위 조회 실패:', response.error);
                setStockData([]);
            }
        } catch (error) {
            console.error('거래량 순위 로드 오류:', error);
            setStockData([]);
        }
    };

    useEffect(() => {
        // 초기 로드
        const initialLoad = async () => {
            setIsLoading(true);
            await fetchVolumeRanking();
            setIsLoading(false);
        };

        initialLoad();

        // 2초마다 업데이트 (로딩 표시 없이)
        const interval = setInterval(() => {
            fetchVolumeRanking();
        }, 2000);

        return () => clearInterval(interval);
    }, []);

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
            
            {isLoading ? (
                <div className="flex justify-center items-center h-[250px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-gray-500">거래량 순위를 불러오는 중...</span>
                </div>
            ) : stockData.length === 0 ? (
                <div className="flex justify-center items-center h-[250px]">
                    <span className="text-gray-500">거래량 순위 데이터를 불러올 수 없습니다</span>
                </div>
            ) : (
                <ul className="space-y-0">
                    {stockData.map((stock, index) => (
                        <li key={stock.stock_code || index} className="flex items-center h-[60px] border-b border-[#E9E9E9] last:border-b-0">
                            <span className="w-6 lg:w-8 text-center font-normal text-base lg:text-[20px] flex-shrink-0 text-[#8A8A8A]">{index + 1}</span>
                            <span className="flex-1 font-normal lg: text-[20px] text-[#0F250B] min-w-0 ml-4 pr-2 truncate">{stock.stock_name}</span>
                            <div className={`hidden lg:inline text-base md:text-[18px] font-normal text-[#0F250B] flex-shrink-0 whitespace-nowrap mr-4`}>
                                {stock.current_price ? stock.current_price.toLocaleString() : '-'}원
                            </div>
                            <div className={`text-base lg:text-[20px] font-normal ml-auto flex-shrink-0 whitespace-nowrap ${
                                stock.change_rate > 0 ? 'text-[#FF383C]' : stock.change_rate < 0 ? 'text-[#0088FF]' : 'text-[#8A8A8A]'
                            }`}>
                                {`${stock.change_rate > 0 ? '+' : ''}${stock.change_amount?.toLocaleString() || 0}원 (${stock.change_rate?.toFixed(2) || '0.00'}%)`}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
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