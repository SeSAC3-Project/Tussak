import { useApp } from '../AppContext'
import StockList from './StockList';
import SearchBar from '../components/SearchBar';
import { useState } from 'react';

export default function Market({ initialSearchTerm = '' }) {
    const { navigateToStockDetail } = useApp();
    const [searchTerm, setSearchTerm] = useState(initialSearchTerm);

    const handleSearchChange = (value) => {
        setSearchTerm(value);
        console.log('Market에서 검색어 변경:', value)
    };

    const handleDirectSearch = (value) => {
        console.log('Market 직접 검색:', value);
        setSearchTerm(value);
    }

    return (

        <div className="p-4 sm:p-6 lg:p-8 max-w-full mx-auto">
            {/* 검색 입력 */}
            <div className="flex justify-end items-center">
                <div className="w-full lg:w-1/2">
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
    );
};
