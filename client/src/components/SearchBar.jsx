import { useState, useEffect } from 'react';
import { FaSearch } from 'react-icons/fa';

export defualt function SearchBar({
    onSearch,
    onSearchChange,
    placeholder = "종목 검색",
    showClearButton = false,
    variant = "home",
    // home & market 동작 분기하자
    className = "",
}) {
    const [searchTerm, setSearchTerm] = useState('');

    const handleInputChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);

        //  Market에서 사용
        if (onSearchChange) {
            onSearchChange(value);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleSearch = () => {
        if (onSearch && searchTerm.trim()) {
            onSearch(searchTerm.trim());
        }
    };

    const clearSearch = () => {
        setSearchTerm('');
        if (onSearchChange) {
            onSearchChange('');
        }
    };

    // Home 스타일
    if (variant === "home") {
        return (
            <div className={`flex items-center w-full bg-white rounded-lg p-2 shadow-sm border border-gray-200 focus-within:ring-2 focus-within:ring-green-500 ${className}`}>
                <FaSearch className="w-4 h-4 text-gray-400 mx-2"/>
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder={placeholder} 
                    className="flex-1 p-1 bg-transparent focus:outline-none placeholder-gray-400 text-gray-800" 
                />
                {searchTerm && (
                    <button
                        onClick={clearSearch}
                        className="text-gray-400 hover:text-gray-600 px-2"
                    >
                        ✕
                    </button>
                )}
            </div>
        );
    };

    // Market
    return (
        <div className={`relative ${className}`}>
            <div className={`flex items-center w-full bg-white rounded-lg p-2 shadow-sm border border-gray-200 focus-within:ring-2 focus-within:ring-green-500 ${className}`}>
                <FaSearch className="w-4 h-4 text-gray-400 mx-2"/>
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder={placeholder} 
                    className="flex-1 p-1 bg-transparent focus:outline-none placeholder-gray-400 text-gray-800" 
                />
                {showClearButton && searchTerm && (
                    <button
                        onClick={clearSearch}
                        className="text-gray-400 hover:text-gray-600 px-2"
                    >
                        ✕
                    </button>
                )}
            </div>
        </div>
    );


}