import React, { useState, useEffect } from 'react';
import { FaHome, FaChartLine, FaLightbulb, FaWallet, FaHistory, FaBars, FaTimes } from "react-icons/fa";
import SproutLogo from './componenets/SproutLogo';


// --- Main App Component ---
export default function App() {
  const [activeSection, setActiveSection] = useState('Market');

  return (
    <div className="flex min-h-screen text-white font-sans">
      <NavSidebar activeSection={activeSection} setActiveSection={setActiveSection} />
      
      <div className="flex-1 p-8 overflow-y-auto">
        {activeSection === 'Home' && <Home />}
        {activeSection === 'Market' && <Market />}
        {activeSection === 'Insight' && <Insight />}
        {activeSection === 'Portfolio' && <Portfolio />}
        {activeSection === 'History' && <History />}
      </div>
    </div>
  );
}

// --- Navigation Sidebar Component ---
function NavSidebar({ activeSection, setActiveSection }) {
  // New state to manage the mobile sidebar's open/close status
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { name: 'Home', icon: FaHome },
    { name: 'Market', icon: FaChartLine },
    { name: 'Insight', icon: FaLightbulb },
    { name: 'Portfolio', icon: FaWallet },
    { name: 'History', icon: FaHistory },
  ];


  return (
    <>
      {/* Mobile-only hamburger menu button */}
      <button 
        onClick={() => setIsSidebarOpen(true)}
        className="fixed top-4 left-4 z-40 p-2 text-[#8A8A8A] bg-white rounded-lg sm:hidden"
      >
        <FaBars className="w-6 h-6" />
      </button>

      {/* Mobile-only overlay when the sidebar is open */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-400 opacity-50 z-30 sm:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* The navigation sidebar itself */}
      {/* I've added the 'h-screen' class to ensure the sidebar takes up the full viewport height. */}
      <nav 
        className={`fixed top-0 left-0 w-64 h-screen bg-white p-6 shadow-xl flex-col z-50 transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          sm:relative sm:translate-x-0 sm:flex`}
      >
        {/* Mobile-only close button */}
        <button 
          onClick={() => setIsSidebarOpen(false)}
          className="absolute top-4 right-4 p-2 text-[#8A8A8A] hover:text-gray sm:hidden"
        >
          <FaTimes className="w-6 h-6" />
        </button>

        <div className="flex flex-col justify-between h-full">
          <div>
            <div className="text-3xl font-bold text-[#0F250B] mb-10 text-center flex items-center ">
              <img 
                src="/icon/sprout.png" 
                alt="Description of Image" 
                className="w-8 h-8" // Resize image and add right margin
              />
              투싹증권
            </div>
            <ul>
              {navItems.map((item) => {
                const isActive = activeSection === item.name;
                return (
                  <li key={item.name} className="mb-2">
                    <button
                      onClick={() => {
                        setActiveSection(item.name);
                        setIsSidebarOpen(false); // Close sidebar on mobile after clicking
                      }}
                      className={`flex items-center w-full py-3 px-4 rounded-lg transition-colors duration-200 
                        ${isActive ? 'bg-[#A4E480] text-white font-semibold' : 'hover:bg-gray-500 text-gray-300'}`}
                    >
                      <item.icon className="w-5 h-5 mr-4" />
                      <span>{item.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="text-center text-sm text-gray-500 flex items-center justify-center p-4 cursor-pointer hover:bg-lime-100 rounded-md transition-colors duration-200">
             <FaHistory className="w-4 h-4 mr-2" />
            <p>로그인</p>
          </div>
          <div className="text-center text-sm text-gray-500">
            <p>&copy; 2025 Tussac</p>
          </div>
        </div>
      </nav>
    </>
  );
}

function Market() {
  const [stock, setStock] = useState(null);
  const [symbol, setSymbol] = useState('AAPL');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStockData = async () => {
    setIsLoading(true);
    setError(null);
    setStock(null);
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/stock/${symbol}`);
      if (!response.ok) {
        throw new Error('Stock not found or server error');
      }
      const data = await response.json();
      setStock(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData();
  }, [symbol]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newSymbol = e.target.elements.symbolInput.value.toUpperCase();
    if (newSymbol) {
      setSymbol(newSymbol);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-gray-800 p-8 rounded-xl shadow-lg">
      <h1 className="text-4xl font-bold text-center text-teal-400 mb-6">Stock Tracker</h1>
      
      <form onSubmit={handleSubmit} className="mb-8 flex justify-center">
        <input
          type="text"
          id="symbolInput"
          placeholder="Enter stock symbol (e.g., GOOGL)"
          className="p-3 w-2/3 md:w-1/2 rounded-l-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400"
        />
        <button
          type="submit"
          className="p-3 bg-teal-500 hover:bg-teal-600 text-white rounded-r-lg font-semibold transition duration-200"
        >
          Search
        </button>
      </form>

      {isLoading && (
        <p className="text-center text-gray-400 text-xl animate-pulse">Loading stock data...</p>
      )}

      {error && (
        <div className="bg-red-900 border border-red-700 text-red-300 p-4 rounded-lg text-center">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {stock && (
        <div className="bg-gray-700 p-6 rounded-lg shadow-inner">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-3xl font-bold text-teal-300">{stock.symbol}</h2>
            <span className={`text-2xl font-bold ${stock.price >= stock.open ? 'text-green-400' : 'text-red-400'}`}>
              ${stock.price.toFixed(2)}
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-300">
            <div className="bg-gray-600 p-4 rounded-lg">
              <p className="text-sm uppercase font-semibold text-gray-400">Open</p>
              <p className="text-lg font-medium">${stock.open.toFixed(2)}</p>
            </div>
            <div className="bg-gray-600 p-4 rounded-lg">
              <p className="text-sm uppercase font-semibold text-gray-400">High</p>
              <p className="text-lg font-medium">${stock.high.toFixed(2)}</p>
            </div>
            <div className="bg-gray-600 p-4 rounded-lg">
              <p className="text-sm uppercase font-semibold text-gray-400">Low</p>
              <p className="text-lg font-medium">${stock.low.toFixed(2)}</p>
            </div>
            <div className="bg-gray-600 p-4 rounded-lg">
              <p className="text-sm uppercase font-semibold text-gray-400">Previous Close</p>
              <p className="text-lg font-medium">${stock.prevClose.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
          <ChatWindow />
        </div>
      </div>
    </div>
  );
};


function SearchBar() {
    return (
        <div className="flex items-center w-full bg-white rounded-lg p-2 shadow-sm">
            {/* <FaSearch className="w-4 h-4 text-gray-400 mx-2" /> */}
            <input 
                type="text" 
                placeholder="종목 검색"
                className="flex-1 p-2 focus:outline-none placeholder-gray-400 text-gray-800"
            />
        </div>
    );
}

// --- Stock Rank Component ---
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
                <h2 className="text-xl font-bold">거래량 순위</h2>
                <a href="#" className="flex items-center text-sm text-lime-600 font-semibold">
                    더보기 
                    {/* <FaChevronRight className="ml-1 w-3 h-3" /> */}
                </a>
            </div>
            <ul>
                {stockData.map((stock, index) => (
                    <li key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                        <div className="flex items-center">
                            <span className="w-6 text-center font-bold text-gray-500">{index + 1}</span>
                            <span className="ml-4 font-medium">{stock.name}</span>
                        </div>
                        <div className="flex items-center">
                            <span className="text-gray-600 mr-4">{stock.volume.toLocaleString()}</span>
                            <span className={`flex items-center font-semibold ${stock.up ? 'text-red-500' : 'text-blue-500'}`}>
                                {/* {stock.up ? <FaArrowUp className="w-3 h-3 mr-1" /> : <FaArrowDown className="w-3 h-3 mr-1" />} */}
                                {stock.change.toFixed(2)}%
                            </span>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}


function InvestorRank() {
    const investorData = [
        { name: '김주식', gain: 130.00 },
        { name: '박투자', gain: 95.50 },
        { name: '최새싹', gain: 30.25 },
        { name: '이초보', gain: 15.07 },
    ];

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">투자 랭킹</h2>
                <a href="#" className="flex items-center text-sm text-lime-600 font-semibold">
                    더보기 
                    {/* <FaChevronRight className="ml-1 w-3 h-3" /> */}
                </a>
            </div>
            <ul>
                {investorData.map((investor, index) => (
                    <li key={index} className="flex items-center py-2 border-b last:border-b-0">
                        <span className="w-6 text-center font-bold text-gray-500">{index + 1}</span>
                        <div className="w-8 h-8 rounded-full bg-gray-300 ml-4 flex items-center justify-center text-xs">
                        </div>
                        <span className="ml-4 font-medium flex-1">{investor.name}</span>
                        <span className="text-red-500 font-bold">
                            +{investor.gain.toFixed(2)} %
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function LoginCard() {
  return (
    <div className="bg-lime-100 rounded-xl shadow-lg p-6 flex flex-col items-center justify-center space-y-4">
      <div className="bg-yellow-400 p-2 rounded-lg inline-flex items-center text-gray-800 font-semibold shadow-md cursor-pointer">
        {/* <RiKakaoTalkFill className="w-5 h-5 mr-2" /> */}
        <span>카카오 로그인</span>
      </div>
      <p className="text-sm text-gray-500">관심종목을 조회 또는 추가하려면<br/>로그인이 필요합니다.</p>
    </div>
  );
}

function ChatWindow() {
    return (
      <div className="bg-lime-100 rounded-xl shadow-lg p-4 h-96 flex flex-col justify-between">
        <div className="flex-1 overflow-y-auto mb-4 space-y-2">
            {/* Chat bubbles */}
            <div className="bg-white p-3 rounded-xl rounded-bl-none text-gray-800 max-w-3/4 self-start">
                <p>무어라무어라</p>
            </div>
            <div className="bg-lime-200 p-3 rounded-xl rounded-br-none text-gray-800 max-w-3/4 self-end ml-auto">
                <p>그렇군그렇군</p>
            </div>
        </div>
        <div className="flex items-center border-t border-gray-200 pt-4">
          <input 
            type="text" 
            placeholder="메시지를 입력하세요" 
            className="flex-1 p-2 bg-white rounded-full text-gray-800 placeholder-gray-400 focus:outline-none"
          />
          <button className="bg-lime-600 text-white rounded-full p-3 ml-2 hover:bg-lime-700 transition-colors duration-200">
            {/* <BsSend className="w-4 h-4" /> */}
          </button>
        </div>
      </div>
    );
  };


function Insight() {
  return (
    <div className="p-8 text-center text-gray-400">
      <h1 className="text-3xl font-bold mb-4">Market Insights</h1>
      <p>This section will provide keywords and news!!</p>
    </div>
  );
}

function Portfolio() {
  return (
    <div className="p-8 text-center text-gray-400">
      <h1 className="text-3xl font-bold mb-4">Your Portfolio</h1>
      <p>This is where you can view and manage your stock holdings.</p>
    </div>
  );
}

function History() {
  return (
    <div className="p-8 text-center text-gray-400">
      <h1 className="text-3xl font-bold mb-4">Trade History</h1>
      <p>This section will display a history of all your trades and transactions.</p>
    </div>
  );
}
