import React, { useState, useEffect } from 'react';
import { insightApi } from '../services/insightApi';

export default function Insight() {
    const [selectedKeyword, setSelectedKeyword] = useState('');
    const [keywordData, setKeywordData] = useState([]);

    // 키워드 선택 핸들러
    const handleKeywordSelect = (keyword) => {
        setSelectedKeyword(keyword);
    };

    return (
        <div className="pt-[15px] pb-[20px] px-[39px] max-w-full mx-auto">
            <div className="flex flex-col gap-[16px]">
                <HotKeywordSection 
                    onKeywordSelect={handleKeywordSelect}
                    selectedKeyword={selectedKeyword}
                    onKeywordDataLoad={setKeywordData}
                />
                <NewsSection 
                    selectedKeyword={selectedKeyword}
                    keywordData={keywordData}
                />
            </div>
        </div>
    );
}

function HotKeywordSection({ onKeywordSelect, selectedKeyword, onKeywordDataLoad }) {
    const [keywordData, setKeywordData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // 실제 키워드 데이터 로드
    useEffect(() => {
        const fetchKeywords = async () => {
            try {
                setIsLoading(true);
                const response = await insightApi.getKeywords();
                
                if (response.success && response.data) {
                    setKeywordData(response.data);
                    onKeywordDataLoad(response.data);
                } else {
                    console.error('키워드 조회 실패:', response.error);
                    setKeywordData([]);
                    onKeywordDataLoad([]);
                }
            } catch (error) {
                console.error('키워드 로드 오류:', error);
                setKeywordData([]);
                onKeywordDataLoad([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchKeywords();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // 키워드 데이터가 로드되면 초기 키워드 선택
    useEffect(() => {
        if (keywordData.length > 0 && !selectedKeyword) {
            onKeywordSelect(keywordData[0].keyword);
        }
    }, [keywordData, selectedKeyword, onKeywordSelect]);

    return (
        <div className="bg-white rounded-xl py-5 px-7" style={{ height: '450px' }}>
            <h2 className="font-bold mb-6" style={{ fontFamily: 'DM Sans', fontSize: '20px', color: '#0F250B' }}>HOT 키워드</h2>
            {isLoading ? (
                <div className="flex justify-center items-center h-[350px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-gray-500">키워드를 불러오는 중...</span>
                </div>
            ) : keywordData.length === 0 ? (
                <div className="flex justify-center items-center h-[350px]">
                    <span className="text-gray-500">키워드 데이터를 불러올 수 없습니다</span>
                </div>
            ) : (
                <WordCloud 
                    data={keywordData} 
                    onKeywordClick={onKeywordSelect}
                    selectedKeyword={selectedKeyword}
                />
            )}
        </div>
    );
}

function WordCloud({ data, onKeywordClick, selectedKeyword }) {
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
                    const isSelected = selectedKeyword === item.keyword;

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
                            onClick={() => onKeywordClick(item.keyword)}
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

function NewsSection({ selectedKeyword, keywordData }) {
    const [newsData, setNewsData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentKeyword, setCurrentKeyword] = useState('');
    const [error, setError] = useState(null);

    // 키워드에 따른 뉴스 데이터 로드
    useEffect(() => {
        const fetchNews = async () => {
            if (!selectedKeyword) return;
            
            try {
                setIsLoading(true);
                setError(null);
                setCurrentKeyword(selectedKeyword);
                const response = await insightApi.getNews(selectedKeyword, 5);
                
                if (response.success) {
                    setNewsData(response.data || []);
                    setError(null);
                } else {
                    console.error('뉴스 조회 실패:', response.error);
                    setNewsData([]);
                    setError(response.error || '뉴스를 불러올 수 없습니다');
                }
            } catch (error) {
                console.error('뉴스 로드 오류:', error);
                setNewsData([]);
                setError('네트워크 오류가 발생했습니다');
            } finally {
                setIsLoading(false);
            }
        };

        fetchNews();
    }, [selectedKeyword]);

    return (
        <div className="bg-white rounded-xl py-5 px-7">
            <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold" style={{ fontFamily: 'DM Sans', fontSize: '20px', color: 'rgb(15, 37, 11)' }}>
                    뉴스
                </h2>
                {currentKeyword && (
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                        {currentKeyword}
                    </span>
                )}
            </div>
            {isLoading ? (
                <div className="flex justify-center items-center h-[200px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-gray-500">뉴스를 불러오는 중...</span>
                </div>
            ) : error ? (
                <div className="flex justify-center items-center h-[200px]">
                    <div className="text-center">
                        <span className="text-red-500 block">뉴스 로드 오류</span>
                        <span className="text-sm text-gray-400 mt-1 block">{error}</span>
                    </div>
                </div>
            ) : newsData.length === 0 ? (
                <div className="flex justify-center items-center h-[200px]">
                    <div className="text-center">
                        <span className="text-gray-500 block">해당 키워드의 최신 뉴스가 없습니다</span>
                        {currentKeyword && (
                            <span className="text-sm text-gray-400 mt-1 block">
                                "{currentKeyword}" 관련 뉴스를 찾을 수 없어요
                            </span>
                        )}
                    </div>
                </div>
            ) : (
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
                                        {news.pub_date}
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
                                    {news.time_ago}
                                </span>
                            </div>
                            
                            {/* 세로 레이아웃 */}
                            <div className="md:hidden py-4 px-4">
                                <div className="flex justify-between items-start mb-2">
                                    <span 
                                        className="font-normal text-sm flex-shrink-0" 
                                        style={{ fontFamily: 'DM Sans', color: '#8A8A8A' }}
                                    >
                                        {news.pub_date}
                                    </span>
                                    <span 
                                        className="font-normal text-sm flex-shrink-0 ml-2" 
                                        style={{ fontFamily: 'DM Sans', color: '#8A8A8A' }}
                                    >
                                        {news.time_ago}
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
            )}
        </div>
    );
}