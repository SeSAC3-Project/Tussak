import { useState } from 'react';

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
            <div className="flex items-center bg-white rounded-[10px] h-[46px] px-5 focus-within:shadow-lg transition-shadow duration-200">
                <img src="/icon/search.png" alt="Search icon" className="w-3 h-3 mr-3" style={{filter: 'brightness(0) saturate(100%) invert(54%) sepia(0%) saturate(0%) hue-rotate(225deg) brightness(94%) contrast(87%)'}}/>
                <input 
                    type="text" 
                    value={value}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder={placeholder} 
                    className="flex-1 bg-transparent focus:outline-none placeholder-[#8A8A8A] text-gray-800 text-sm font-regular"
                    style={{fontFamily: 'DM Sans'}}
                />
                {(variant === 'home' || showClearButton) && value && (
                     <button
                        onClick={clearSearch}
                        className="text-[#8A8A8A] hover:text-gray-600 ml-2"
                        aria-label="Clear search"
                    >
                        ✕
                    </button>
                )}
            </div>
        </div>
    );
}
