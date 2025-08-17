import React, { useState, useEffect } from 'react';
import { FaHome, FaChartLine, FaLightbulb, FaWallet, FaHistory, FaBars, FaTimes } from "react-icons/fa";

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
        className="fixed top-4 left-4 z-40 p-2 text-white bg-gray-800 rounded-lg sm:hidden"
      >
        <FaBars className="w-6 h-6" />
      </button>

      {/* Mobile-only overlay when the sidebar is open */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black opacity-50 z-30 sm:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* The navigation sidebar itself */}
      {/* I've added the 'h-screen' class to ensure the sidebar takes up the full viewport height. */}
      <nav 
        className={`fixed top-0 left-0 w-64 h-screen bg-gray-800 p-6 shadow-xl flex-col z-50 transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          sm:relative sm:translate-x-0 sm:flex`}
      >
        {/* Mobile-only close button */}
        <button 
          onClick={() => setIsSidebarOpen(false)}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white sm:hidden"
        >
          <FaTimes className="w-6 h-6" />
        </button>

        <div className="flex flex-col justify-between h-full">
          <div>
            <div className="text-3xl font-bold text-teal-400 mb-10 text-center">
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
                        ${isActive ? 'bg-teal-600 text-white font-semibold' : 'hover:bg-gray-700 text-gray-300'}`}
                    >
                      <item.icon className="w-5 h-5 mr-4" />
                      <span>{item.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
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
    <div className="p-8 text-center text-gray-400">
      <h1 className="text-3xl font-bold mb-4">Welcome to the Dashboard!</h1>
      <p>This is the homepage of your stock market application.</p>
    </div>
  );
}

function Insight() {
  return (
    <div className="p-8 text-center text-gray-400">
      <h1 className="text-3xl font-bold mb-4">Market Insights</h1>
      <p>This section will provide valuable insights and analysis.</p>
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
