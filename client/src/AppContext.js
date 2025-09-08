import { createContext, useContext, useState, useEffect } from 'react';
import { authApi, kakaoAuth } from './services/authApi';

const AppContext = createContext();

export function AppProvider({ children }) {
    const [activeSection, setActiveSection] = useState('Home');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStock, setSelectedStock] = useState(null);
    const [initialSearchTerm, setInitialSearchTerm] = useState('');
    
    // 로그인 관련 상태
    const [user, setUser] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [authToken, setAuthToken] = useState(localStorage.getItem('authToken'));
    const [isLoading, setIsLoading] = useState(true);

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

    // 카카오 SDK 초기화
    useEffect(() => {
        kakaoAuth.init();
    }, []);

    // 앱 시작 시 토큰 검증
    useEffect(() => {
        const verifyAuthToken = async () => {
            if (authToken) {
                try {
                    const response = await authApi.verifyToken(authToken);
                    if (response.success) {
                        setUser(response.user);
                        setIsLoggedIn(true);
                    } else {
                        localStorage.removeItem('authToken');
                        setAuthToken(null);
                    }
                } catch (error) {
                    console.error('토큰 검증 실패:', error);
                    localStorage.removeItem('authToken');
                    setAuthToken(null);
                }
            }
            setIsLoading(false);
        };

        verifyAuthToken();
    }, [authToken]);

    // 카카오 로그인 함수
    const handleKakaoLogin = async () => {
        try {
            setIsLoading(true);
            
            // 카카오 로그인으로 액세스 토큰 받기
            const kakaoAccessToken = await kakaoAuth.login();
            
            // 서버에 액세스 토큰 전송하여 JWT 토큰 받기
            const response = await authApi.kakaoLogin(kakaoAccessToken);
            
            if (response.success) {
                // JWT 토큰 저장
                const jwtToken = response.token;
                localStorage.setItem('authToken', jwtToken);
                setAuthToken(jwtToken);
                
                // 사용자 정보 가져오기
                const userResponse = await authApi.verifyToken(jwtToken);
                if (userResponse.success) {
                    setUser(userResponse.user);
                    setIsLoggedIn(true);
                }
            }
        } catch (error) {
            console.error('로그인 실패:', error);
            alert('로그인에 실패했습니다. 다시 시도해 주세요.');
        } finally {
            setIsLoading(false);
        }
    };

    // 로그아웃 함수
    const handleLogout = async () => {
        try {
            if (authToken) {
                await authApi.logout(authToken);
            }
            
            // 카카오 로그아웃
            await kakaoAuth.logout();
            
            // 상태 초기화
            localStorage.removeItem('authToken');
            setAuthToken(null);
            setUser(null);
            setIsLoggedIn(false);
        } catch (error) {
            console.error('로그아웃 실패:', error);
            // 에러가 발생해도 로컬 상태는 초기화
            localStorage.removeItem('authToken');
            setAuthToken(null);
            setUser(null);
            setIsLoggedIn(false);
        }
    };

    const contextValue = {
        // 기존 상태값들
        activeSection,
        searchQuery,
        selectedStock,
        initialSearchTerm,
        // 로그인 관련 상태값들
        user,
        isLoggedIn,
        authToken,
        isLoading,
        // 기존 동작함수들
        navigateToHome,
        navigateToMarket,
        navigateToStockDetail,
        navigateToInvestorRankPage,
        goBack,
        setSearchQuery,
        setSelectedStock,
        setActiveSection,
        // 로그인 관련 함수들
        handleKakaoLogin,
        handleLogout
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

