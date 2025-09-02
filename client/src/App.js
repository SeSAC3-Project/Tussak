// npm install lucide-react
// npm install tailwind-scrollbar

import { AppProvider, useApp } from './AppContext.js';
import Home from './pages/Home.jsx';
import InvestorRankPage from './pages/InvestorRankPage.jsx';
import Market from './pages/Market.jsx';
import Insight from './pages/Insight.jsx';
import Portfolio from './pages/Portfolio.jsx';
import History from './pages/History.jsx';
import Chatbot from './components/Chatbot.jsx';
import NavSidebar from './components/NavigationSidebar.jsx';
import StockDetail from './pages/StockDetail.jsx'

function AppContent() {
  const { activeSection, selectedStock, goBack } = useApp();
  
  return (
    <div className="flex h-screen text-white font-sans">
      <NavSidebar activeSection={activeSection} />
      
      <div className="flex-1 p-8 overflow-y-auto">
        {(activeSection === 'Home' || !activeSection) && <Home />}
        {activeSection === 'Market' && <Market />}
        {activeSection === 'Insight' && <Insight />}
        {activeSection === 'Portfolio' && <Portfolio />}
        {activeSection === 'History' && <History />}
        {activeSection === 'InvestorRankPage' && <InvestorRankPage />}
        {activeSection === 'StockDetail' && <StockDetail />}
      </div>
  
      {activeSection !== 'Home' && <Chatbot />}
    </div>
  );
}
// --- Main App Component ---
export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}