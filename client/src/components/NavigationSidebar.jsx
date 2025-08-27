import { useState } from 'react';
import { FaHome, FaChartLine, FaLightbulb, FaWallet, FaHistory, FaBars, FaTimes } from "react-icons/fa";

export default function NavSidebar({ activeSection, setActiveSection }) {
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
        className="fixed top-4 left-4 z-40 h-screen overflow-y-auto  p-2 text-[#8A8A8A] bg-white rounded-lg sm:hidden"
      >
        <FaBars className="w-6 h-6" />
      </button>

      {/* Mobile-only overlay when the sidebar is open */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-400 overflow-y-auto opacity-50 z-30 sm:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* The navigation sidebar itself */}
      {/* I've added the 'h-screen' class to ensure the sidebar takes up the full viewport height. */}
      <nav 
        className={`fixed inset-y-0 top-0 left-0 w-64 h-screen overflow-y-auto bg-white p-6 shadow-xl flex-col z-50 transition-transform duration-300 ease-in-out
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
                className="w-8 h-8" 
                // Resize image and add right margin
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