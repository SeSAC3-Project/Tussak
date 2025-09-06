import { useState } from 'react';
import { FaSearch } from 'react-icons/fa';

export default function SearchBar({
    value,
    onSearch,
    onSearchChange,
    placeholder = "종목 검색",
    showClearButton = false,
    variant = "home",
    // home & market 동작 분기하자
    className = "",
}) {
    const handleInputChange = (e) => {
        if (onSearchChange) {
            onSearchChange(e.target.value);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleSearch = () => {
        console.log(`${variant}에서 검색 실행:`, value.trim());

        if (onSearch && value.trim()) {
            onSearch(value.trim());
        }
    };

    const clearSearch = () => {
        if (onSearchChange) {
            onSearchChange('');
        }
    };

    return (
        <div className={`relative ${className}`}>
            <div className={`flex items-center w-full bg-white rounded-lg p-2 shadow-sm border border-gray-200 focus-within:ring-2 focus-within:ring-green-500 ${className}`}>
                <FaSearch className="w-4 h-4 text-gray-400 mx-2"/>
                <input 
                    type="text" 
                    value={value}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder={placeholder} 
                    className="flex-1 p-1 bg-transparent focus:outline-none placeholder-gray-400 text-gray-800" 
                />
                {(variant === 'home' || showClearButton) && value && (
                     <button
                        onClick={clearSearch}
                        className="text-gray-400 hover:text-gray-600 px-2"
                        aria-label="Clear search"
                    >
                        ✕
                    </button>
                )}
            </div>
        </div>
    );
}
