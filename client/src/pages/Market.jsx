import React, { useState, useEffect } from 'react';
import StockCard from '../componenets/StockCard';
// 일단 절대경로로 설정햇어요오


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

function Market() {
    const [stocks, setStocks] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setISLoading] = useState(true);

    // API 요청 흉내 ( 1초 뒤에 데이터 세팅하고 로딩 끝낸다고 가정 )

    useEffect(() => {
        setTimeout(() => {
            setStocks(initialStocks);
            setISLoading(false);
        }, 1000);
    }, []);
}