import { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
    const [activeSection, setActiveSection] = useState('home');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStock, setSelectedStock] = useState(null);

    const navigateToHome = () => {
        setActiveSection('home');
        setSearchQuery('');
        setSelectedStock(null);
    };

    const navigateToMarket = (searchTerm = '') =>{
        setActiveSection('market');
        setSelectedStock(null);
    };

    const navigateToStockDetail = (stock) => {
        setActiveSection('detail');
        setSelectedStock(stock);
    }

    const goBack = () => {
        if (activeSection === 'detail') {
            setActiveSection('market');
            setSelectedStock(null);
        } else if (activeSection === 'market') {
            setActiveSection('home');
            setSearchQuery('');
        }
    };

    const contextValue = {
        // 상태값들
        activeSection,
        searchQuery,
        selectedStock,
        // 동작함수들
        navigateToHome,
        navigateToMarket,
        navigateToStockDetail,
        goBack,
        setSearchQuery,
        setSelectedStock
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

