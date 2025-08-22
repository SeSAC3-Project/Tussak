import React from 'react';
import { FaSearch, FaChevronRight } from 'react-icons/fa';

function Home() {
    return (
        <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:space-x-8 space-y-8 lg:space-y-0">
                <div className="flex-1 space-y-8">
                    <SearchBar />
                    <StockRank />
                    <InvestorRank />
                </div>

                <div className="w-full lg:w-96 space-y-8">
                    <LoginCard />
                    <CharWindow />
                </div>
            </div>
        </div>
    );
};


function SearchBar() {
    return (
        <div className="flex items-center w-full bg-white rounded-lg p-2 shadow-sm border border-gray-200 focus-within:ring-2 focus-within:ring-green-500">
            <FaSearch className="w-4 h-4 text-gray-400 mx-2"/>
            <input type="text" placeholder="종목 검색" className="flex-1 p-1 bg-transparent focus:outline-none placeholder-gray-400 text-gray-800" />
        </div>
    )
}

// 관심 종목 

// 이벤트 조작하려구 결국 인라인
const HeartIcon = ({ active }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 cursor-pointer ${active ? 'text-red-500 fill-current' : 'text-gray-300'}`} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
    </svg>
);

function WatchlistCard({ stock }) {
    const { name, code, market, price, change, up, active } = stock;
    return (
        <div className="bg-white rounded-xl shadow-lg p-4 flex flex-col justify-between">
            <div>
                <div className="flex justify-between items-start mb-2">
                    <div className="w-10 h-10 bg-lime-100 rounded-full flex items-center justify-center font-bold text-lime-500 text-lg">
                        {name.charAt(0)}
                    </div>
                    <HeartIcon active={active} />
                </div>
                <p className="text-xs text-gray-500">{code} · {market}</p>
                <p className="text-lg font-bold text-black mt-1">{name}</p>
            </div>
            <div>
                <p className="text-2xl font-bold text-black mt-4">{price.toLocaleString()}</p>
                {/* /components/StockCard 에서 받아오자 .. */}
            </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {mockStockData.map((stock, index) => (
                    <WatchlistCard key={index} stock={stock} />
                ))}
            </div>
        </div>
    )
}


function StockRank() {
    const stockData = [
        { name: '대한전선', volume: 13120, change: 0.54, up: true },
        { name: '삼성전자', volume: 64200, change: 0.54, up: true },
        { name: '현대자동차', volume: 121000, change: -0.54, up: false },
        { name: 'SK텔레콤', volume: 121000, change: -0.54, up: false },
    ];

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-black">거래량 순위</h2>
                <a href="#" className="flex items-center text-sm text-lime-600 font-semibold">
                    더보기
                    <FaChevronRight className="ml-1 w-3 h-3" />
                </a>
            </div>

            <ul>
                {stockData.map((stock, index) => (
                    <li key={index} className=";flex justify-between items-center py-2 border-b-0"></li>
                ))}
            </ul>
        </div>
    )
}