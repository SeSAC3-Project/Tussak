import React, { useState, useEffect } from 'react';
import StockCard from '../components/StockCard'; 
import { FaSearch } from 'react-icons/fa';

// api 로 받아올 주식 데이터들 임의 설정
const mockStockData = [
    { id: '001201', market: '코스피', name: '상지전자', price: 81300, change: 1200, changePercent: 1.50, direction: 'up' },
    { id: '001202', market: '코스피', name: '지니생명', price: 45750, change: -50, changePercent: -0.11, direction: 'down' },
    { id: '001203', market: '코스피', name: 'Calia솔루션', price: 350000, change: 2000, changePercent: 0.57, direction: 'up' },
    { id: '001204', market: '코스피', name: 'HM캐피털', price: 224000, change: -1500, changePercent: -0.67, direction: 'down' },
]

// 4x7 그리드 채울려고
const initialStocks = [];
for (let groupIndex = 0; groupIndex < 7; groupIndex++) {
    for (let index = 0; index < mockStockData.length; index++) {
        const stock = mockStockData[index];
        initialStocks.push({
            ...stock,
            reactKey: `${stock.id}-${groupIndex}-${index}`,
        });
    }
}

export default function StockList({ onSelectStock }) {
    const [stocks, setStocks] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);


    // 종목 검색을 서버 측 필터링이라고 보면 ... (API에서 검색 지원) 
    // useEffect(() => {
    //  const timeoutId = setTimeout(() => {
    //     fetch(`/api/stocks?q=${searchTerm}`)
    //         .then(response => response.json())
    //         .then(data => setStocks(data));
    //  }, 300);

    //  return () => clearTimeout(timeoutId);
    // }, [searchTerm]);


    // 일단 모의데이터로 화면에 렌더링 시키면 ...
    useEffect(() => { 
        setTimeout(() => { 
            setStocks(initialStocks); 
            setIsLoading(false); 
        }, 1000); }, []);
    
    const filteredStocks = stocks.filter(stock => 
        stock.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            {/* 검색 부분 */}
            <div className="flex justify-end mb-6">
                <div className="flex items-center w-full lg:w-1/2 bg-white rounded-lg p-2 shadow-sm border border-gray-200 focus-within:ring-2 focus-within:ring-green-500">
                    <FaSearch className="w-4 h-4 text-gray-400 mx-2"/>
                    <input 
                        type="text" 
                        placeholder="종목 검색" 
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1 p-1 bg-transparent focus:outline-none placeholder-gray-400 text-gray-800" />
                </div>
            </div>

            {isLoading ? (
                <p className="text-center text-gray-500">주식 종목을 불러오는 중...</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:grid-rows-7 gap-4">
                    {filteredStocks.length > 0 ? (
                        filteredStocks.map((stock) => (
                            <div key={stock.reactKey} onClick={() => onSelectStock(stock)}>
                                <StockCard key={stock.id} stock={stock} />
                            </div>
                        ))
                    ) : (
                        <p className="col-span-4 text-center text-gray-500">검색 결과가 없습니다.</p>
                    )}
                </div>
            )}
        </>
    );
}