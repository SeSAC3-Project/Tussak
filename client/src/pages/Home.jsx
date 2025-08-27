import React from 'react';
import { FaSearch, FaChevronRight } from 'react-icons/fa';
import InvestorRank from './InvestorRank.jsx';
import Chatbot from '../components/Chatbot.jsx'


export default function Home({ setActiveSection }) {
    return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex justify-end items-center">
            <div className="w-full lg:w-1/2">
                <SearchBar />
            </div>
        </div>

        <WatchList />

        <div className="flex flex-col lg:flex-row lg:space-x-8 space-y-8 lg:space-y-0">
            
            <div className="flex-1 flex flex-col space-y-8">
                <StockRank />
                <InvestorRank setActiveSection={setActiveSection} />
            </div>

            <div className="w-full lg:w-96 flex flex-col space-y-8">
                <LoginCard />
                <ChatWindow />
            </div>
        </div>
    </div>
    )
}


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
  const { name, id, market, price, change, changePercent, direction } = stock;

  // 변화율 스타일 (상승/하락 색상)
  const changeColor =
    direction === "up" ? "text-red-500" : direction === "down" ? "text-blue-500" : "text-gray-500";

  return (
    <div className="bg-white rounded-xl shadow-md p-4 flex flex-col justify-between hover:shadow-lg transition-shadow duration-200">
      {/* 상단: 종목명 + 코드 */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-sm font-semibold text-gray-900">{name}</p>
          <p className="text-xs text-gray-500">{id} · {market}</p>
        </div>
        {/* 하트 아이콘 영역 */}
        <HeartIcon active={stock.active} />
      </div>

      {/* 가격 정보 */}
      <div className="mt-2">
        <p className="text-lg font-bold text-gray-900">{price.toLocaleString()}원</p>
        <p className={`text-sm font-medium ${changeColor}`}>
          {change >= 0 ? `+${change.toLocaleString()}` : change.toLocaleString()} 
          ({changePercent.toFixed(2)}%)
        </p>
      </div>
    </div>
  );
};

// function WatchlistCard({ stock }) {
//     const { name, code, market, price, change, up, active } = stock;
//     return (
//         <div className="bg-white rounded-xl shadow-md p-4 flex flex-col justify-between hover:shadow-lg transition-shadow duration-200">
//             {/* 상단부 */}
//             <div>
//                 <div className="flex justify-between items-start mb-2">
//                     <div className="w-10h-10 bg-lime-100 rounded-full flex items-center justify-center font-bold text-lime-500 text-lg">
//                         {name.charAt(0)}
//                     </div>
//                     <HeartIcon active={active} />
//                 </div>
//             </div>
//             {/* 하단부 */}
//             <div>
//                 <p className="text-xs text-gray-500">{code} · {market}</p>
//                 <p className="text-lg font-bold text-black mt-1">{name}</p>
//                 <p className="text-2xl font-bold text-black mt-4">{price.toLocaleString()}</p>
//                 {/* /components/StockCard 에서 받아오자 .. */}
//             </div>
//         </div>
//     )
// }


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
        { name: '대한전선', volume: 13120, change: +0.54, up: true },
        { name: '삼성전자', volume: 64200, change: +0.54, up: true },
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
        <div className="bg-lime-100 rounded-xl shadow-lg p-6 flex flex-col items-center justify-center space-y-4">
            <img className="shadow-md cursor-pointer" src="/icon/kakao_login.png" />
            <p className="text-sm text-gray-500" alt="카카오 로그인">모의 투자를 진행하려면<br/>로그인이 필요합니다.</p>
        </div>
    );
}

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
);

function ChatWindow() {
    return (
        <div>
            <div className="h-96">
                <Chatbot isExpanded={true} />
            </div>
            {/* <div className="flex-1 overflow-y-auto mb-4 space-y-3 p-2">
                <div className="bg-white p-3 rounded-xl rounded-br-none text-gray-800 max-w-xs sm:max-w-sm ml-auto">
                    <p>엄청난 부자가 될거야 !!</p>
                </div>
                <div className="flex justify-start">
                    <div className="bg-lime-200 p-3 rounded-xl rounded-bl-none text-gray-800 max-w-xs sm:max-w-sm">
                        <p>힘내 \^o^/</p>
                    </div>
                </div>
            </div>
            <div className="flex items-center border-t border-gray-200 pt-3 w-full">
                <input type="text" placeholder="메시지를 입력하세요" className="flex-1 p-2 px-4 bg-white rounded-full text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-500" />
                <button className="bg-lime-600 text-white rounded-full p-3 ml-2 hover:bg-lime-700transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2"
                >
                    <SendIcon />
                </button>
            </div> */}
        </div>
    );
};