const ChartControls = ({ chartState, onPeriodChange }) => {
    return (
        <div className="mb-4 space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-700">차트</span>
                <div className="flex items-center space-x-1 sm:space-x-2 text-xs">
                    {['1일', '1주', '1개월', '3개월'].map(period => (
                        <button
                            key={period}
                            onClick={() => onPeriodChange(period)}
                            className={`px-2 sm:px-3 py-1 rounded transition-colors ${
                                chartState.selectedPeriod === period 
                                    ? 'bg-blue-100 text-blue-600' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {period}
                        </button>
                    ))}
                </div>
            </div>

            {/* 이동평균선 범례 */}
            <div className="hidden lg:flex items-center justify-between">
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                        <div className="w-4 h-0.5 bg-blue-500"></div>
                        <span>MA5</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <div className="w-4 h-0.5 bg-amber-500"></div>
                        <span>MA20</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <div className="w-4 h-0.5 bg-violet-500"></div>
                        <span>MA60</span>
                    </div>
                </div>
                <div className="flex items-center space-x-3 text-xs">
                    <div className="text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        💡 마우스 휠: 줌 | 드래그: 이동
                    </div>
                    <div className="text-green-600 bg-green-50 px-2 py-1 rounded">
                        📊 {chartState.selectedPeriod} - {
                            chartState.selectedPeriod === '1일' ? '5분봉' : 
                            chartState.selectedPeriod === '1주' ? '1시간봉' : '일봉'
                        }
                    </div>
                </div>
            </div>

            {/* 모바일 범례 */}
            <div className="lg:hidden">
                <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2 text-gray-500">
                        <span className="text-blue-500">MA5</span>
                        <span className="text-amber-500">MA20</span>
                        <span className="text-violet-500">MA60</span>
                    </div>
                    <div className="text-green-600 bg-green-50 px-2 py-1 rounded">
                        {chartState.selectedPeriod} - {
                            chartState.selectedPeriod === '1일' ? '5분봉' :
                            chartState.selectedPeriod === '1주' ? '1시간봉' : '일봉'
                        }
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChartControls;