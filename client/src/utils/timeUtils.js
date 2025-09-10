// Helper to determine if current time is within market hours (KST / local time assumption)
export const isMarketOpen = () => {
    const now = new Date();
    const day = now.getDay();
    // 주말(토,일) 제외
    if (day === 0 || day === 6) return false;

    const hour = now.getHours();
    const minute = now.getMinutes();
    const currentTime = hour * 100 + minute; // 예: 09:30 => 930

    // 거래 시간: 09:00 ~ 15:30
    return currentTime >= 900 && currentTime <= 1530;
};

export default isMarketOpen;
