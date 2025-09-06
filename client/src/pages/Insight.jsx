import React, { useState, useEffect } from 'react';

export default function Insight() {
    return (
        <div className="max-w-7xl mx-auto">
            <div className="mt-4 mx-2 mb-7 overflow-visible">
                <HotKeywordSection />
            </div>
            <div className="mx-2 mb-4">
                <NewsSection />
            </div>
        </div>
    );
}

function HotKeywordSection() {
    const [keywordData, setKeywordData] = useState([]);

    // 더미 데이터
    useEffect(() => {
        const keywords = ['조선', '반도체', '엔터', '이차전지', '방산', '화장품', '바이오', '로봇', '증권', '원전'];
        const mockData = keywords.map(keyword => ({
            keyword,
            frequency: Math.floor(Math.random() * 100) + 1  // 랜덤 빈도수
        }));
        setKeywordData(mockData);
    }, []);

    return (
        <div className="bg-white rounded-xl py-5 px-7" style={{ height: '450px' }}>
            <h2 className="font-bold mb-6" style={{ fontFamily: 'DM Sans', fontSize: '20px', color: '#0F250B' }}>HOT 키워드</h2>
            <WordCloud data={keywordData} />
        </div>
    );
}

function WordCloud({ data }) {
    const [visibleCircles, setVisibleCircles] = useState([]);
    const [circleOpacities, setCircleOpacities] = useState([]);
    const sortedData = [...data].sort((a, b) => b.frequency - a.frequency);

    const circles = [
        { size: 150, x: 536, y: 173 },
        { size: 100, x: 460, y: 57 },
        { size: 120, x: 386, y: 165 },
        { size: 70, x: 440, y: 257 },
        { size: 70, x: 512, y: 294 },
        { size: 40, x: 574, y: 274 },
        { size: 120, x: 665, y: 260 },
        { size: 40, x: 644, y: 170 },
        { size: 100, x: 645, y: 88 },
        { size: 70, x: 555, y: 52 },
    ];

    const opacityLevels = [0.3, 0.7];

    useEffect(() => {
        if (data.length > 0 && circleOpacities.length === 0) {
            const opacities = circles.map(() =>
                opacityLevels[Math.floor(Math.random() * opacityLevels.length)]
            );
            setCircleOpacities(opacities);
        }
    }, [data.length]);

    // circles 애니메이션
    useEffect(() => {
        if (data.length === 0) return;

        setVisibleCircles([]); // 초기화

        const timers = [];
        const maxCircles = Math.min(data.length, circles.length);

        for (let index = 0; index < maxCircles; index++) {
            const timer = setTimeout(() => {
                setVisibleCircles(prev => [...prev, index]);
            }, index * 200);
            timers.push(timer);
        }

        return () => {
            timers.forEach(timer => clearTimeout(timer));
        };
    }, [data.length]);

    return (
        <div
            className="relative"
            style={{
                height: '370px',
                transformOrigin: 'center center',
                transform: 'scale(clamp(1., 1.5, 2.0))'
            }}
        >
            <svg width="100%" height="100%" viewBox="0 0 1072 370" className="absolute inset-0" preserveAspectRatio="xMidYMid meet">
                {sortedData.map((item, index) => {
                    if (index >= circles.length || circleOpacities.length === 0) return null;

                    const circle = circles[index];
                    const opacity = circleOpacities[index];
                    const isVisible = visibleCircles.includes(index);

                    return (
                        <g
                            key={item.keyword}
                            style={{
                                opacity: isVisible ? 1 : 0,
                                transform: isVisible ? 'scale(1)' : 'scale(0)',
                                transformOrigin: `${circle.x}px ${circle.y}px`,
                                transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = isVisible ? 'scale(1.1)' : 'scale(0)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = isVisible ? 'scale(1)' : 'scale(0)';
                            }}
                        >
                            <circle
                                cx={circle.x}
                                cy={circle.y}
                                r={circle.size / 2}
                                fill="#e7e76d"
                                fillOpacity={opacity}
                                style={{
                                    transition: 'fill-opacity 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.fillOpacity = '1';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.fillOpacity = opacity;
                                }}
                            />
                            <text
                                x={circle.x}
                                y={circle.y}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="font-medium pointer-events-none select-none"
                                fontSize={Math.max(circle.size / 5, 12)}
                                fill="#4a4a4a"
                                style={{ fontFamily: 'DM Sans' }}
                            >
                                {item.keyword}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

function NewsSection() {
    const newsData = [
        {
            date: '2025-09-06',
            title: '서울 동작구 거주 20대 여성, 기절한 채 발견 ... 원인은 워드클라우드 비율 설정이 가한 극심한 피로',
            timeAgo: '1시간 전'
        },
        {
            date: '2025-09-06',
            title: '상지전자, 금 팔아 부자되는 망상 ... ',
            timeAgo: '2시간 전'
        },
        {
            date: '2025-08-13',
            title: '전문가 의견은 "그것도 시드가 있어야지," ',
            timeAgo: '3시간 전'
        },
        {
            date: '2025-08-12',
            title: 'HD현대중공업, 친환경 선박 수주 계약 체결... 조선업계 주목',
            timeAgo: '5시간 전'
        },
        {
            date: '2025-08-12',
            title: '배고픔,  허기짐,  달디단 닭강정 :D',
            timeAgo: '7시간 전'
        }
    ];

    return (
        <div className="bg-white rounded-xl py-5 px-7">
            <h2 className="font-bold mb-6" style={{ fontFamily: 'DM Sans', fontSize: '20px', color: 'rgb(15, 37, 11)' }}>
                뉴스
            </h2>
        <div>
            {newsData.map((news, index) => (
                <div key={index}>
                    {/* md 이상 */}
                    <div className="hidden md:flex items-center justify-between py-4 px-10">
                        <div className="flex items-center space-x-4 flex-1 min-w-0">
                            <span 
                                className="font-normal flex-shrink-0" 
                                style={{ fontFamily: 'DM Sans', fontSize: '19px', color: '#8A8A8A', minWidth: '80px' }}
                            >
                                {news.date}
                            </span>
                            <span 
                                className="font-normal flex-1 truncate pr-4" 
                                style={{ fontFamily: 'DM Sans', fontSize: '19px', color: '#0F250B' }}
                                title={news.title} // hover시 전체 제목 표시
                            >
                                {news.title}
                            </span>
                        </div>
                        <span 
                            className="font-normal flex-shrink-0 whitespace-nowrap" 
                            style={{ fontFamily: 'DM Sans', fontSize: '19px', color: '#8A8A8A' }}
                        >
                            {news.timeAgo}
                        </span>
                    </div>
                    
                    {/* 세로 레이아웃 */}
                    <div className="md:hidden py-4 px-4">
                        <div className="flex justify-between items-start mb-2">
                            <span 
                                className="font-normal text-sm flex-shrink-0" 
                                style={{ fontFamily: 'DM Sans', color: '#8A8A8A' }}
                            >
                                {news.date}
                            </span>
                            <span 
                                className="font-normal text-sm flex-shrink-0 ml-2" 
                                style={{ fontFamily: 'DM Sans', color: '#8A8A8A' }}
                            >
                                {news.timeAgo}
                            </span>
                        </div>
                        <div className="pr-2">
                            <span 
                                className="font-normal text-base leading-relaxed block"
                                style={{ 
                                    fontFamily: 'DM Sans', 
                                    color: '#0F250B',
                                    display: '-webkit-box',
                                    WebkitLineClamp: '2',
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                }}
                                title={news.title}
                            >
                                {news.title}
                            </span>
                        </div>
                    </div>
                    
                    {index < newsData.length - 1 && (
                        <div className="border-b border-gray-100 mx-1.5"></div>
                    )}
                </div>
            ))}
        </div>
    </div>
    );
}