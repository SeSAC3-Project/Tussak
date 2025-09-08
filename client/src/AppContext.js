import { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
    const [activeSection, setActiveSection] = useState('Home');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStock, setSelectedStock] = useState(null);
    const [initialSearchTerm, setInitialSearchTerm] = useState('')

    const navigateToHome = () => {
        setActiveSection('Home');
        setSearchQuery('');
        setSelectedStock(null);
    };

    const navigateToMarket = (searchTerm) =>{
        setActiveSection('Market');
        setInitialSearchTerm(searchTerm);
        setSelectedStock(null);
    };

    const navigateToStockDetail = (stock) => {
        setActiveSection('StockDetail');
        setSelectedStock(stock);
    };

    const navigateToInvestorRankPage = () => {
        setActiveSection('InvestorRankPage');
        setSelectedStock(null);
    }

    const goBack = () => {
        if (activeSection === 'StockDetail') {
            setActiveSection('Market');
            setSelectedStock(null);
        } else if (activeSection === 'Market') {
            setActiveSection('Home');
            setSearchQuery('');
        } else if (activeSection === 'InvestorRankPage') {
            setActiveSection('Home');
        }
    };

    const contextValue = {
        // 상태값들
        activeSection,
        searchQuery,
        selectedStock,
        initialSearchTerm,
        // 동작함수들
        navigateToHome,
        navigateToMarket,
        navigateToStockDetail,
        navigateToInvestorRankPage,
        goBack,
        setSearchQuery,
        setSelectedStock,
        setActiveSection
    };

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp 이 AppProvider 안에 포함되어 있는지 확인하세요')
    }
    return context;
}

