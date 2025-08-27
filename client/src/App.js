// npm install lucide-react
// npm install tailwind-scrollbar

import React, { useState, useEffect } from 'react';
import Market from './pages/Market.jsx'
import Home from './pages/Home.jsx'
import InvestorRankPage from './pages/InvestorRankPage.jsx'
import Chatbot from './components/Chatbot.jsx';
import NavSidebar from './components/NavigationSidebar.jsx'

// --- Main App Component ---
export default function App() {
  const [activeSection, setActiveSection] = useState('Home');

  return (
    <div className="flex min-h-screen text-white font-sans">
      <NavSidebar activeSection={activeSection} setActiveSection={setActiveSection} />
      
      <div className="flex-1 p-8 overflow-y-auto">
        {activeSection === 'Home' && <Home setActiveSection={setActiveSection} />}
        {activeSection === 'Market' && <Market />}
        {activeSection === 'Insight' && <Insight />}
        {activeSection === 'Portfolio' && <Portfolio />}
        {activeSection === 'History' && <History />}
        {activeSection === 'InvestorRankPage' && <InvestorRankPage />}
      </div>

      {activeSection !== 'Home' && <Chatbot />}
    </div>
  );
}


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
