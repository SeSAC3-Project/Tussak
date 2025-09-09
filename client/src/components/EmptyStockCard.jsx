import React from 'react';

const EmptyStockCard = ({ message }) => {
    return (
        <div 
            className="bg-white py-3 px-4 sm:py-[15px] sm:px-[19px] rounded-[20px] flex items-center justify-center"
            style={{
                fontFamily: 'DM Sans',
                minHeight: '105px', // 스톡카드의 기본 높이
                height: '105px'     // 고정 높이 설정
            }}
        >
            <p className="text-[#8A8A8A] text-xs md:text-[15px] font-regular whitespace-pre-line text-center leading-relaxed">
                {message}
            </p>
        </div>
    );
};

export default EmptyStockCard;
