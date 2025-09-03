import { useState } from 'react';
import { useApp } from '../AppContext.js';
import { FaSearch, FaChevronRight } from 'react-icons/fa';
import InvestorRank from './InvestorRank.jsx';
import Chatbot from '../components/Chatbot.jsx'
import StockCard from '../components/StockCard.jsx'


export default function Home() {
    const { navigateToMarket } = useApp();
    const [activeSection, setActiveSection] = useState(null)

    // Home 에서 검색 시 Market 페이지로 이동
    const handleSearch = (searchTerm) => {
        navigateToMarket(searchTerm);
    };

    return (
    <div className="pt-[30px] pb-[48px] px-[39px] max-w-full mx-auto">
        <div className="flex flex-col gap-[25px]">
            <div className="flex justify-end items-center">
                <div className="w-full lg:w-[calc(50%-6px)]">
                    <SearchBar 
                        onSearch={handleSearch}
                        placeholder="종목 검색"
                        variant="home"
                    />
                </div>
            </div>

            <WatchList />

            <div className="flex flex-col lg:flex-row gap-8">
                
                <div className="flex-1 flex flex-col gap-8">
                    <StockRank />
                    <InvestorRank setActiveSection={setActiveSection} />
                </div>

                <div className="w-full lg:w-96 flex flex-col gap-8">
                    <LoginCard />
                    <ChatWindow />
                </div>
            </div>
        </div>
    </div>
    )
}


function SearchBar() {
    return (
        <div className="flex items-center bg-white rounded-[10px] h-[46px] px-5 focus-within:shadow-lg transition-shadow duration-200">
            <img src="/icon/search.png" alt="Search icon" className="w-3 h-3 mr-3"/>
            <input 
                type="text" 
                placeholder="종목 검색" 
                className="flex-1 bg-transparent focus:outline-none placeholder-[#8A8A8A] text-gray-800 text-sm font-regular"
                style={{fontFamily: 'DM Sans'}}
            />
        </div>
    )
}


function WatchList() {
    const mockStockData = [
        { id: '001201', market: '코스피', name: '상지전자', price: 81300, change: 1200, changePercent: 1.50, direction: 'up' },
        { id: '001202', market: '코스피', name: '지니생명', price: 45750, change: -50, changePercent: -0.11, direction: 'down' },
        { id: '001203', market: '코스피', name: 'Calia솔루션', price: 350000, change: 2000, changePercent: 0.57, direction: 'up' },
        { id: '001204', market: '코스피', name: 'HM캐피털', price: 224000, change: -1500, changePercent: -0.67, direction: 'down' },
    ];

    return (
        <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {mockStockData.map((stock, index) => (
                    <StockCard key={index} stock={stock} />
                ))}
            </div>
        </div>
    )
}


function StockRank() {
    const stockData = [
        { name: '대한전선', volume: 13120, change: +0.54, up: true },
        { name: '삼성전자', volume: 64200, change: +0.54, up: true },
        { name: '현대자동차', volume: 121000, change: -0.54, up: false },
        { name: 'SK텔레콤', volume: 121000, change: -0.54, up: false },
    ];

    return (
        <div className="bg-white rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-black">거래량 순위</h2>
                <a href="#" className="flex items-center text-sm text-lime-600 font-semibold">
                    더보기
                    <FaChevronRight className="ml-1 w-3 h-3" />
                </a>
            </div>
            <ul>
                {stockData.map((stock, index) => (
                    <li key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                        <div className="flex items-center">
                            <span className="w-6 text-center font-bold text-gray-500">{index + 1}</span>
                            <span className="ml-4 font-medium text-black">{stock.name}</span>
                        </div>
                        <div className="flex items-center">
                            <span className="text-gray-600 mr-4">{stock.volume.toLocaleString()}</span>
                            <span className={`flex items-center font-semibold ${stock.up ? 'text-red-500' : 'text-blue-500'}`}>
                                {stock.up ? '▲' : '▼'}
                                {stock.change >= 0 ? `+${stock.change.toFixed(2)}%` : `${stock.change.toFixed(2)}%`}
                            </span>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    )
};


function LoginCard() {
    return (
        <div className="bg-lime-100 rounded-xl p-6 flex flex-col items-center justify-center space-y-4">
            <img className="cursor-pointer" src="/icon/kakao_login.png" />
            <p className="text-sm text-gray-500" alt="카카오 로그인">모의 투자를 진행하려면<br/>로그인이 필요합니다.</p>
        </div>
    );
}

function ChatWindow() {
    return (
        <div>
            <div className="h-96">
                <Chatbot isExpanded={true} />
            </div>
        </div>
    );
};