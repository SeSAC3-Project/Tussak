import { createContext, useContext, useState, useEffect } from 'react';
import { authApi, kakaoAuth } from './services/authApi';
import { bookmarkApi } from './services/bookmarkApi';

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
    
    // 관심종목 관련 상태
    const [userBookmarks, setUserBookmarks] = useState(new Set());
    const [bookmarksLoading, setBookmarksLoading] = useState(false);
    const [bookmarkDetails, setBookmarkDetails] = useState([]);

    const navigateToHome = () => {
        setActiveSection('Home');
        setSearchQuery('');
        setSelectedStock(null);
    };

    const navigateToMarket = (searchTerm = '') =>{
        setActiveSection('Market');
        setInitialSearchTerm(searchTerm || ''); // 빈 문자열이면 빈 문자열로 설정
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
                        
                        // 관심종목 목록 로드
                        await loadUserBookmarks(authToken);
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
                    
                    // 관심종목 목록 로드
                    await loadUserBookmarks(jwtToken);
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
            console.log('로그아웃 시작');
            
            // 1단계: 서버 로그아웃
            if (authToken) {
                await authApi.logout(authToken);
                console.log('서버 로그아웃 완료');
            }
            
            // 2단계: 카카오 완전 해제
            if (window.Kakao && window.Kakao.Auth) {
                try {
                    // 카카오 앱 연결 해제
                    if (window.Kakao.API && window.Kakao.Auth.getAccessToken()) {
                        await new Promise((resolve) => {
                            window.Kakao.API.request({
                                url: '/v1/user/unlink',
                                success: () => {
                                    console.log('카카오 앱 연결 해제 완료');
                                    resolve();
                                },
                                fail: () => {
                                    console.log('앱 연결 해제 실패 (계속 진행)');
                                    resolve();
                                }
                            });
                        });
                    }
                    
                    // 카카오 로그아웃
                    await kakaoAuth.logout();
                    console.log('카카오 세션 해제 완료');
                } catch (kakaoError) {
                    console.log('카카오 로그아웃 중 에러 (무시):', kakaoError);
                }
            }
            
            // 3단계: 모든 브라우저 데이터 클리어
            try {
                // 로컬/세션 스토리지 완전 클리어
                localStorage.clear();
                sessionStorage.clear();
                
                // 모든 쿠키 삭제 (더 광범위하게)
                document.cookie.split(";").forEach(cookie => {
                    const eqPos = cookie.indexOf("=");
                    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
                    
                    // 여러 도메인/경로에서 삭제
                    const domains = ['', '.kakao.com', '.daum.net', '.localhost', 'localhost'];
                    const paths = ['/', '/auth'];
                    
                    domains.forEach(domain => {
                        paths.forEach(path => {
                            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain};`;
                        });
                    });
                });
                
                console.log('브라우저 데이터 완전 클리어');
            } catch (cleanupError) {
                console.log('브라우저 정리 중 에러 (무시):', cleanupError);
            }
            
            // 4단계: React 상태 초기화
            setAuthToken(null);
            setUser(null);
            setIsLoggedIn(false);
            setIsLoading(false);
            setUserBookmarks(new Set()); // 관심종목 상태 초기화
            setBookmarkDetails([]); // 관심종목 상세 정보 초기화
            
            // 5단계: 홈화면으로 이동
            navigateToHome();
            console.log('로그아웃 완료 - 홈화면으로 이동');
            
        } catch (error) {
            console.error('로그아웃 실패:', error);
            
            // 에러 발생 시에도 강제로 상태 초기화
            localStorage.clear();
            sessionStorage.clear();
            setAuthToken(null);
            setUser(null);
            setIsLoggedIn(false);
            setIsLoading(false);
            setUserBookmarks(new Set()); // 관심종목 상태 초기화
            setBookmarkDetails([]); // 관심종목 상세 정보 초기화
            
            // 에러 발생 시에도 홈화면으로 이동
            navigateToHome();
        }
    };

    // 사용자 관심종목 목록 로드
    const loadUserBookmarks = async (token) => {
        if (!token) return;
        
        try {
            setBookmarksLoading(true);
            
            // 관심종목 상세 정보 로드
            const detailsResponse = await bookmarkApi.getUserBookmarksWithDetails(token);
            
            if (detailsResponse.success && detailsResponse.data) {
                // 종목 코드들을 Set으로 저장
                const bookmarkCodes = new Set(
                    detailsResponse.data.map(stock => stock.stock_code)
                );
                setUserBookmarks(bookmarkCodes);
                setBookmarkDetails(detailsResponse.data);
            } else {
                setUserBookmarks(new Set());
                setBookmarkDetails([]);
            }
        } catch (error) {
            console.error('관심종목 목록 로드 실패:', error);
            setUserBookmarks(new Set());
            setBookmarkDetails([]);
        } finally {
            setBookmarksLoading(false);
        }
    };

    // 관심종목 토글 (추가/삭제)
    const toggleBookmark = async (stockCode) => {
        if (!isLoggedIn || !authToken) {
            alert('로그인이 필요한 서비스입니다');
            return false;
        }

        try {
            const isCurrentlyBookmarked = userBookmarks.has(stockCode);
            
            if (isCurrentlyBookmarked) {
                // 관심종목 삭제
                await bookmarkApi.removeBookmark(stockCode, authToken);
                setUserBookmarks(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(stockCode);
                    return newSet;
                });
                // 상세 정보에서도 제거
                setBookmarkDetails(prev => prev.filter(stock => stock.stock_code !== stockCode));
            } else {
                // 관심종목 추가 전 개수 확인
                if (userBookmarks.size >= 4) {
                    alert('관심종목은 최대 4개까지만 등록할 수 있습니다.');
                    return false;
                }
                
                // 관심종목 추가
                await bookmarkApi.addBookmark(stockCode, authToken);
                setUserBookmarks(prev => new Set([...prev, stockCode]));
                
                // 상세 정보 다시 로드 (새로 추가된 종목 정보 포함)
                await loadUserBookmarks(authToken);
            }
            
            return true;
        } catch (error) {
            console.error('관심종목 토글 실패:', error);
            
            // 서버에서 제한 에러가 온 경우 더 친화적인 메시지 표시
            if (error.message && error.message.includes('최대 4개')) {
                alert('관심종목는 최대 4개까지만 등록할 수 있습니다.');
            } else {
                alert(error.message || '관심종목 처리에 실패했습니다');
            }
            return false;
        }
    };

    // 특정 종목의 관심종목 상태 확인
    const isBookmarked = (stockCode) => {
        return userBookmarks.has(stockCode);
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
        // 관심종목 관련 상태값들
        userBookmarks,
        bookmarksLoading,
        bookmarkDetails,
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
        handleLogout,
        // 관심종목 관련 함수들
        toggleBookmark,
        isBookmarked,
        loadUserBookmarks
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

