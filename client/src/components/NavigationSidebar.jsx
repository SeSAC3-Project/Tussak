import { useApp } from '../AppContext';
import { useState } from 'react';
import { FaBars, FaTimes } from "react-icons/fa";

function LoginButton() {
  const { isLoggedIn, user, handleKakaoLogin, handleLogout, isLoading } = useApp();

  if (isLoggedIn) {
    return (
      <button
        onClick={handleLogout}
        className="flex items-center text-sm text-gray-500 w-full justify-center p-[10px] cursor-pointer hover:bg-red-100 rounded-md transition-colors duration-200"
        disabled={isLoading}
      >
        <img src="/icon/login.png" alt="Logout icon" className="w-6 h-6 mr-[14px]" />
        <p className="font-normal" style={{fontFamily: 'DM Sans'}}>
          {isLoading ? '로그아웃 중...' : 'Log Out'}
        </p>
      </button>
    );
  }

  return (
    <button
      onClick={handleKakaoLogin}
      className="flex items-center text-sm text-gray-500 w-full justify-center p-[10px] cursor-pointer hover:bg-lime-100 rounded-md transition-colors duration-200"
      disabled={isLoading}
    >
      <img src="/icon/login.png" alt="Login icon" className="w-6 h-6 mr-[14px]" />
      <p className="font-normal" style={{fontFamily: 'DM Sans'}}>
        {isLoading ? '로그인 중...' : 'Log In'}
      </p>
    </button>
  );
}

export default function NavSidebar({ activeSection }) {

  const {
    navigateToHome,
    navigateToMarket,
    navigateToInsight,
    navigateToPortfolio,
    navigateToHistory,
    setActiveSection,
    isLoggedIn
  } = useApp();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 로그인이 필요한 페이지 체크 함수
  const handleNavigationClick = (item) => {
    if ((item.name === 'Portfolio' || item.name === 'History') && !isLoggedIn) {
      alert('로그인이 필요한 서비스입니다');
      return;
    }
    setActiveSection(item.name);
    setIsSidebarOpen(false);
  };

  const navItems = [
    { name: 'Home', icon: '/icon/home.png', onClick: navigateToHome },
    { name: 'Market', icon: '/icon/market.png', onClick: navigateToMarket },
    { name: 'Insight', icon: '/icon/insight.png', onClick: navigateToInsight },
    { name: 'Portfolio', icon: '/icon/portfolio.png', onClick: navigateToPortfolio },
    { name: 'History', icon: '/icon/history.png', onClick: navigateToHistory }
  ];

  return (
    <>
      {/* Mobile-only hamburger menu button */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="fixed top-4 left-4 z-40 max-h-screen overflow-y-auto  p-2 text-[#8A8A8A] bg-white rounded-lg sm:hidden"
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
        className={`fixed inset-y-0 top-0 left-0 w-[290px]  h-screen overflow-y-auto bg-white flex-col z-50 transition-transform duration-300 ease-in-out
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
            <div className="h-[115px] flex items-center pl-[38px]">
              <div className="text-[26px] font-regular text-[#0F250B] flex items-center" style={{ fontFamily: 'DM Sans' }}>
                <img
                  src="/icon/sprout.png"
                  alt="Description of Image"
                  className="w-[38px] h-[27px] mr-1"
                  style={{ filter: 'brightness(0) saturate(100%) invert(4%) sepia(18%) saturate(1467%) hue-rotate(83deg) brightness(96%) contrast(95%)' }}
                />
                투싹증권
              </div>
            </div>
            {/* 구분선 */}
            <div className="h-[1px] bg-[#F2F8E9] mb-6"></div>
            <ul>
              {navItems.map((item) => {
                const isActive = activeSection === item.name;
                return (
                  <li key={item.name} className="mb-[15px]">
                    <button
                      onClick={() => handleNavigationClick(item)}
                      className={`group flex items-center w-[214px] py-3 px-4 rounded-[5px] mx-auto transition-colors duration-200 
                        ${isActive ? 'bg-[#A4E480] text-white font-normal' : 'hover:bg-gray-100 text-[#8A8A8A]'}`}
                    >
                      <img
                        src={item.icon}
                        alt={`${item.name} icon`}
                        className={`w-5 h-5 mr-4 ${isActive ? 'filter brightness-0 invert' : ''}`}
                      />
                      <span className="font-normal text-base" style={{ fontFamily: 'DM Sans' }}>{item.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="text-base text-[#8A8A8A] mb-[50px] mx-[38px]">
            <LoginButton />
          </div>
        </div>
      </nav>
    </>
  );
}