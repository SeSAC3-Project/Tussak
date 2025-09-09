// API에서 받아온 데이터 구조에 맞게 stock 필드명 설정하기
import { useState, useEffect } from 'react';
import { useApp } from '../AppContext'


const HeartIcon = ({ active }) => (
    <img 
        src={active ? '/icon/heart-filled.png' : '/icon/heart-unfilled.png'}
        alt="Heart icon"
        className="w-5 h-5 cursor-pointer"
    />
);

const StockCard = ({ stock, realtimeData, navigateToStockDetail }) => {
    const { isLoggedIn, toggleBookmark, isBookmarked } = useApp();
    const [currentRealtimeData, setCurrentRealtimeData] = useState(null);

    // StockCard에서 home, market에서 필드 차이 발생 (home 더미데이터 market에 맞게 ... 수정해야겠다 )
    const stockCode = stock.stock_code || '000000'; 
    //  '' 에서 '000000'로 수정
    const stockName = stock.stock_name || '종목명 없음';
    const market = stock.market || '';
    const price = stock.current_price || '';
    const changeAmount = stock.change_amount || '';
    const changeRate = stock.change_rate || '';

    // 실시간 데이터 업데이트 (2초마다)
    useEffect(() => {
        const fetchRealtimeData = async () => {
            try {
                const response = await fetch(`/api/stock/realtime/${stockCode}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.data) {
                        setCurrentRealtimeData(data.data);
                    }
                }
            } catch (error) {
                console.log('실시간 데이터 업데이트 실패:', error);
            }
        };

        // 초기 로드
        fetchRealtimeData();

        // 2초마다 실시간 데이터 가져오기
        const interval = setInterval(fetchRealtimeData, 2000);

        return () => clearInterval(interval);
    }, [stockCode]);

    // const sector = stock.sector || '';
    // const per = stock.per || null;
    // const pbr = stock.pbr || null;

    // const stockCode = stock.id || '000000';
    // const stockName = stock.name || '';
    // const market = stock.market || '';
    // const price = stock.price || '';
    // const changeAmount = stock.change || '';
    // const changeRate = stock.changePercent || '';

    // 실시간 데이터 우선 사용 (없으면 기본 정보 사용)
    const displayPrice = currentRealtimeData?.current_price || price;
    const displayChangeAmount = currentRealtimeData?.change_amount || changeAmount;
    const displayChangeRate = currentRealtimeData?.change_rate || changeRate;
    
    // 가격 변동에 따라 화살표, 색상 결정
    const isUp = displayChangeAmount > 0;
    const isDown = displayChangeAmount < 0;
    const textColor = isUp ? 'text-red-500' : isDown ? 'text-blue-500' : 'text-gray-600';
    const changeIcon = isUp ? '▲' : isDown ? '▼' : '';
    
    // 관심종목 상태 확인 (로그인 안 했으면 false)
    const bookmarkStatus = isLoggedIn ? isBookmarked(stockCode) : false;


    return (
        <div 
            className="bg-white py-3 px-4 sm:py-[15px] sm:px-[19px] rounded-[20px] flex flex-col justify-between h-full cursor-pointer hover:shadow-md transition-shadow" style={{fontFamily: 'DM Sans'}}
            onClick={navigateToStockDetail}
        >
            {/* 상단 요소들: 종목코드, 시장, 좋아요*/}
            <div className="flex justify-between items-center text-[#8A8A8A] text-xs md:text-[15px] font-regular">
                <div className="flex items-center gap-1">
                    <span>{stockCode}</span>
                    <span className="hidden md:inline">{market}</span>
                </div>
                <button 
                    className="hover:text-red-500" 
                    onClick={async (e) => {
                        e.stopPropagation();
                        if (!isLoggedIn) {
                            alert('로그인이 필요한 서비스입니다');
                            return;
                        }
                        
                        // 관심종목 토글 실행
                        await toggleBookmark(stockCode);
                    }}
                >
                    <HeartIcon active={bookmarkStatus} />
                </button>
            </div>

            {/* 중간 요소: 종목명 */}
            <div>
                <h3 className="text-lg font-normal text-[#0F250B] truncate" style={{letterSpacing: '0.02em'}}>{stockName}</h3>
            </div>

            {/* 하단 요소들: 현재가, 변동(화살표, 1주당얼마, 비율) */}
            <div className="mt-auto">
                <div className={`flex items-center justify-between text-[18px] font-regular ${textColor}`} style={{letterSpacing: '0.02em'}}>
                    <div>
                        {typeof displayPrice === 'number' ? displayPrice.toLocaleString() : (parseFloat(displayPrice) || 0).toLocaleString()}원
                    </div>
                    <div className="flex items-center">
                        <span className="text-xs sm:text-sm">{changeIcon}</span>
                        <span className="sm:ml-1">
                            {Math.abs(parseFloat(displayChangeRate) || 0).toFixed(2)}%
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
};

export default StockCard;
