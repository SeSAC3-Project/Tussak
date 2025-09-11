import { useApp } from '../AppContext'
import StockList from './StockList';
import SearchBar from '../components/SearchBar';
import { useState, useEffect } from 'react';

export default function Market({ initialSearchTerm = '' }) {
    const { navigateToStockDetail } = useApp();
    const [searchTerm, setSearchTerm] = useState('');

    // initialSearchTerm이 변경될 때마다 searchTerm 업데이트
    useEffect(() => {
        setSearchTerm(initialSearchTerm);
    }, [initialSearchTerm]);

    const handleSearchChange = (value) => {
        setSearchTerm(value);
        console.log('Market에서 검색어 변경:', value)
    };

    const handleDirectSearch = (value) => {
        console.log('Market 직접 검색:', value);
        setSearchTerm(value);
    }

    return (
        <div className="max-w-7xl mx-auto">
            <div className="pt-[15px] pb-[20px] mx-2 flex flex-col gap-[16px]">
                <div className="flex justify-end items-center">
                    <div className="w-full lg:w-[calc(50%-6px)]">
                        <SearchBar
                            value={searchTerm}
                            onSearch={handleDirectSearch}
                            onSearchChange={handleSearchChange}
                            placeholder="종목 검색"
                            variant="market"
                            showClearButton={true}
                        />
                    </div>
                </div>
                <StockList
                    onSelectStock={navigateToStockDetail}
                    searchTerm={searchTerm}
                />
            </div>
        </div>
    );
};
