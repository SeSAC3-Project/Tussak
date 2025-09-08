import { createContext, useCallback, useContext, useState } from 'react';

const AppContext = createContext();


export function AppProvider({ children }) {
    const [activeSection, setActiveSection] = useState('Home');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStock, setSelectedStock] = useState(null);
    const [initialSearchTerm, setInitialSearchTerm] = useState('')
    // 브라우저 저장소 토큰 유무 확인 코드 필요하면 추가
    const [isLoggedIn, setIsLoggedIn] = useState(false);

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

    const login = useCallback(()  => {
        console.log("로그인 상태");
        setIsLoggedIn(true);
    }, []);

    const logout = useCallback(() => {
        console.log("로그아웃 상태")
        setIsLoggedIn(false);
    }, []);

    const contextValue = {
        // 상태값들
        activeSection,
        searchQuery,
        selectedStock,
        initialSearchTerm,
        isLoggedIn,
        // 동작함수들
        navigateToHome,
        navigateToMarket,
        navigateToStockDetail,
        navigateToInvestorRankPage,
        goBack,
        setSearchQuery,
        setSelectedStock,
        setActiveSection,
        login,
        logout
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

