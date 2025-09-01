// 백엔드 API 연결
// fetchTopStocks() : 백엔드에서 모든 종목 가져와 거래대금 순으로 정렬 후 상위 28개 표시
// searchStocks() : 검색 API 호출해서 KTS 전체 데이터에서 검색

import { useState, useEffect, useCallback } from 'react';
import StockCard from '../components/StockCard'; 
import SearchBar from '../components/SearchBar';


export default function StockList({ onSelectStock, initialSearchTerm = '' }) {
    const [stocks, setStocks] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
    const [isLoading, setIsLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState(null);

    // 초기 로딩: 거래대금 상위 28개 종목 가져오기
    useEffect(() => {
        fetchTopStocks();
    }, []);

    useEffect(() => {
        if (initialSearchTerm) {
            setSearchTerm(initialSearchTerm)
        }
    }, [initialSearchTerm]);

    // 거래대금 상위 28개 종목 조회
    const fetchTopStocks = async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            const response = await fetch('/api/stock/all');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || '데이터를 불러오는데 실패했습니다.');
            }

            if (data.success) {
                // 거래대금 순으로 정렬하고 상위 28개만 선택
                const topStocks = data.data
                    .sort((a, b) => (b.trading_value || 0) - (a.trading_value || 0))
                    .slice(0, 28);
                
                setStocks(topStocks);
            } else {
                throw new Error(data.message || '데이터 처리 중 오류가 발생했습니다.');
            }
        } catch (error) {
            console.error('종목 데이터 로딩 실패:', error);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // 검색 기능 (디바운스 적용)
    const searchStocks = useCallback(async (keyword) => {
        if (!keyword.trim()) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        try {
            setIsSearching(true);
            setError(null);

            const response = await fetch(`/api/stock/search?q=${encodeURIComponent(keyword)}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || '검색에 실패했습니다.');
            }

            if (data.success) {
                setSearchResults(data.data);
            } else {
                throw new Error(data.message || '검색 중 오류가 발생했습니다.');
            }
        } catch (error) {
            console.error('검색 실패:', error);
            setError(error.message);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    // 검색어 변경 시 디바운스 적용
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            searchStocks(searchTerm);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, searchStocks]);

    // SearchBar에서 호출할 검색어 핸들러
    const handleSearchChange = (value) => {
        setSearchTerm(value);
    };

    // 표시할 종목 목록 결정
    const displayStocks = searchTerm.trim() ? searchResults : stocks;
    const showingSearchResults = searchTerm.trim() && searchResults.length > 0;

    // 에러 상태
    if (error && !searchTerm) {
        return (
            <div className="flex flex-col items-center justify-center p-8">
                <div className="text-red-500 mb-4">⚠️ {error}</div>
                <button
                    onClick={fetchTopStocks}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    다시 시도
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-full mx-auto">
            {/* 검색 입력 */}
            <div className="flex justify-end items-center">
                <div className="w-full lg:w-1/2">
                    <SearchBar 
                        onSearchChange={handleSearchChange}
                        placeholder="종목 검색"
                        variant = "market"
                        showClearButton={true}
                    />
                </div>
            </div>
            
            {/* 상태 표시 */}
            {isLoading && (
                <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
            )}

            {isSearching && searchTerm && (
                <div className="text-center p-4 text-gray-500">
                    검색 중...
                </div>
            )}

            {/* 검색 결과 정보 */}
            {showingSearchResults && (
                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                    "{searchTerm}"에 대한 검색 결과 {searchResults.length}개
                </div>
            )}

            {/* 검색 결과가 없을 때 */}
            {searchTerm && !isSearching && searchResults.length === 0 && (
                <div className="text-center p-8 text-gray-500">
                    "{searchTerm}"에 대한 검색 결과가 없습니다.
                </div>
            )}

            {/* 검색 중 발생한 에러에 대한 메시지 */}
            {error && searchTerm && (
                <div className="text-red-500 text-center p-4 bg-red-50 rounded">
                    {error}
                </div>
            )}

            {/* 종목 그리드 */}
            {!isLoading && displayStocks.length > 0 && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 overflow-y-autoscrollbar-thin scrollbar-thumb-gray-400 mt-8">
                        {displayStocks.map((stock, index) => (
                            <StockCard
                                key={stock.stock_code || stock.id || `stock-${index}`}
                                stock={stock}
                                navigateToStockDetail={() => onSelectStock(stock)}
                            />
                        ))}
                    </div>
                    
                    {/* 기본 28개 종목 표시 안내 */}
                    {!searchTerm && stocks.length === 28 && (
                        <div className="text-center text-sm text-gray-500 mt-4">
                            28개 종목만을 표시하고 있습니다. 
                            다른 종목을 찾으시려면 검색을 이용해주세요.
                        </div>
                    )}
                </>
            )}
        </div>
    );
}