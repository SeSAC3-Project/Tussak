// 백엔드 API 연결
// fetchTopStocks() : 백엔드에서 모든 종목 가져와 거래대금 순으로 정렬 후 상위 28개 표시
// searchStocks() : 검색 API 호출해서 KTS 전체 데이터에서 검색

import React, { useState, useEffect, useCallback } from 'react';
import StockCard from '../components/StockCard'; 


export default function StockList({ onSelectStock }) {
    const [stocks, setStocks] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState(null);

    // 초기 로딩: 거래대금 상위 28개 종목 가져오기
    useEffect(() => {
        fetchTopStocks();
    }, []);

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

    // 검색어 입력 핸들러
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // 검색 초기화
    const clearSearch = () => {
        setSearchTerm('');
        setSearchResults([]);
        setError(null);
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
        <div className="space-y-4">
            {/* 검색 입력 */}
            <div className="relative">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="종목명 검색..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {searchTerm && (
                    <button
                        onClick={clearSearch}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        ✕
                    </button>
                )}
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

            {/* 에러 메시지 (검색 중 발생한 에러) */}
            {error && searchTerm && (
                <div className="text-red-500 text-center p-4 bg-red-50 rounded">
                    {error}
                </div>
            )}

            {/* 종목 그리드 */}
            {!isLoading && displayStocks.length > 0 && (
                <>
                    <div className="grid grid-cols-4 gap-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400">
                        {displayStocks.map((stock, index) => (
                            <StockCard
                                key={stock.stock_code || stock.id || `stock-${index}`}
                                stock={stock}
                                onSelect={() => onSelectStock(stock)}
                            />
                        ))}
                    </div>
                    
                    {/* 기본 28개 종목 표시 중일 때의 안내 */}
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