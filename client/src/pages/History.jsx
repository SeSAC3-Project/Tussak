import { useState, useMemo } from 'react';
import Pagination from '../components/Pagination.jsx'

export default function History() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 더미 데이터 생성 (100개 거래 내역)
  const generateDummyData = () => {
    
    const tradeTypes = ['매수', '매도'];
    
    return Array.from({ length: 100 }, (_, index) => {
      const isRecent = index < 20;
      const baseDate = new Date('2025-08-13');
      const randomDays = isRecent ? Math.floor(Math.random() * 7) : Math.floor(Math.random() * 365);
      const tradeDate = new Date(baseDate.getTime() - randomDays * 24 * 60 * 60 * 1000);
      
      const company = '상지전자';
      const tradeType = tradeTypes[Math.floor(Math.random() * tradeTypes.length)];
      const quantity = Math.floor(Math.random() * 50) + 1;
      const price = Math.floor(Math.random() * 100000) + 10000;
      const totalAmount = quantity * price;
      
      const hours = String(Math.floor(Math.random() * 8) + 9).padStart(2, '0');
      const minutes = String(Math.floor(Math.random() * 60)).padStart(2, '0');
      
      return {
        id: index + 1,
        date: tradeDate.toISOString().split('T')[0],
        time: `${hours}:${minutes}`,
        tradeType,
        company,
        quantity,
        price,
        totalAmount,
        timestamp: tradeDate.getTime()
      };
    }).sort((a, b) => b.timestamp - a.timestamp);
  };

  const tradingData = useMemo(() => generateDummyData(), []);

  // 페이지네이션 계산
  const totalPages = Math.ceil(tradingData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = tradingData.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">거래 내역</h1>
          <p className="text-gray-600">전체 거래 내역을 최신순으로 확인하실 수 있습니다.</p>
        </div>

        {/* 거래 내역 테이블 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    거래 일시
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    구분
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    종목명
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    수량(주)
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    거래단가
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    거래금액
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.date}</div>
                      <div className="text-sm text-gray-500">{item.time}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.tradeType === '매수' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {item.tradeType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.company}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-gray-900">{item.quantity.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-gray-900">{item.price.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {item.totalAmount.toLocaleString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* 페이지 정보 및 페이지네이션 */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <div className="flex items-center">
              <div className="flex-1 text-sm text-gray-700">
                전체 <span className="font-medium">{tradingData.length}</span>건 중{' '}
                <span className="font-medium">{startIndex + 1}</span>-
                <span className="font-medium">{Math.min(startIndex + itemsPerPage, tradingData.length)}</span>건 표시
              </div>
            </div>
            <div>
              <div className="flex-1 flex justify-center">
                <Pagination 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};