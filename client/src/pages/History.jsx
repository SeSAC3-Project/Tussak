import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../AppContext';
import transactionApi from '../services/transactionApi';
import Pagination from '../components/Pagination.jsx'

export default function History() {
  const { isLoggedIn, authToken } = useApp();
  const [currentPage, setCurrentPage] = useState(1);
  const [transactions, setTransactions] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const itemsPerPage = 10;

  // 거래 내역 조회 함수
  const fetchTransactions = async (page = 1) => {
    if (!isLoggedIn || !authToken) {
      setTransactions([]);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await transactionApi.getTransactions(authToken, page, itemsPerPage);
      
      // API 응답 데이터를 UI 형식에 맞게 변환
      const formattedTransactions = result.transactions.map(transaction => ({
        id: transaction.id,
        date: new Date(transaction.created_at).toISOString().split('T')[0],
        time: new Date(transaction.created_at).toLocaleTimeString('ko-KR', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }),
        tradeType: transaction.type === 'BUY' ? '매수' : '매도',
        company: transaction.stock_name,
        quantity: transaction.quantity,
        price: transaction.price,
        totalAmount: transaction.total_amount,
        timestamp: new Date(transaction.created_at).getTime()
      }));

      setTransactions(formattedTransactions);
      setTotalPages(result.pages);
      setTotalCount(result.total);
    } catch (error) {
      console.error('거래 내역 조회 실패:', error);
      setError('거래 내역을 불러오는데 실패했습니다');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 및 로그인 상태 변경 시 거래 내역 조회
  useEffect(() => {
    fetchTransactions(currentPage);
  }, [isLoggedIn, authToken, currentPage]);

  // 페이지 변경 핸들러
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // 로그인하지 않은 경우
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="pt-[15px] pb-[20px] mx-2">
            <div className="bg-white rounded-xl py-[19px] px-[28px]" style={{ fontFamily: 'DM Sans' }}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-[20px] font-bold text-[#0F250B]">주식 거래 내역</h2>
              </div>
              <div className="flex justify-center items-center h-[250px]">
                <span className="text-gray-500">로그인이 필요한 서비스입니다.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="pt-[15px] pb-[20px] mx-2">
          {/* 거래 내역 */}
          <div className="bg-white rounded-xl py-[19px] px-[28px]" style={{ fontFamily: 'DM Sans' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[20px] font-bold text-[#0F250B]">주식 거래 내역</h2>
            </div>
            {loading ? (
              <div className="flex justify-center items-center h-[250px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-500">거래 내역을 불러오는 중...</span>
              </div>
            ) : error ? (
              <div className="flex justify-center items-center h-[250px]">
                <span className="text-red-500">{error}</span>
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex justify-center items-center h-[250px]">
                <span className="text-gray-500">거래 내역이 없습니다.</span>
              </div>
            ) : (
              <ul className="space-y-0">
                {transactions.map((item) => (
                  <li key={item.id} className="flex items-center h-[60px] border-b border-[#E9E9E9] last:border-b-0 px-4">
                    <div className="w-[22%] min-w-0">
                      <div className="text-sm lg:text-lg text-[#0F250B] font-normal truncate">{item.date} {item.time}</div>
                    </div>
                    <div className="w-[6%] flex justify-center">
                      <span className={`text-sm lg:text-lg font-normal ${
                        item.tradeType === '매수' 
                          ? 'text-[#FF383C]' 
                          : 'text-[#0088FF]'
                      }`}>
                        {item.tradeType}
                      </span>
                    </div>
                    <div className="w-[6%]"></div>
                    <div className="w-[14%] min-w-0">
                      <span className="font-normal text-sm lg:text-lg text-[#0F250B] truncate block">{item.company}</span>
                    </div>
                    <div className="w-[12%] text-sm lg:text-lg font-normal text-[#0F250B] text-center">
                        <span className="truncate block">{item.quantity.toLocaleString()}주</span>              
                        </div>
                      <div className="w-[20%] text-right min-w-0">
                        <div className="text-sm lg:text-lg font-normal text-[#8A8A8A] truncate">거래단가&nbsp; <span className="text-[#0F250B]">{item.price.toLocaleString()}</span></div>
                      </div>
                      <div className="w-[20%] text-right min-w-0">
                        <div className="text-sm lg:text-lg font-normal text-[#8A8A8A] truncate">거래금액&nbsp; <span className="text-[#0F250B]">{item.totalAmount.toLocaleString()}</span></div>
                      </div>
                  </li>
                ))}
              </ul>
            )}
            
            {/* 페이지네이션 */}
            {!loading && !error && transactions.length > 0 && (
              <div className="mt-6 flex justify-center">
                <Pagination 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
