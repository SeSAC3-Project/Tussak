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
      <div className="min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">거래 내역</h1>
            <p className="text-gray-600">로그인이 필요한 서비스입니다.</p>
          </div>
        </div>
      </div>
    );
  }

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
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">거래 내역을 불러오는 중...</div>
            </div>
          )}
          
          {error && (
            <div className="flex items-center justify-center py-12">
              <div className="text-red-500">{error}</div>
            </div>
          )}

          {!loading && !error && transactions.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">거래 내역이 없습니다.</div>
            </div>
          )}

          {!loading && !error && transactions.length > 0 && (
            <>
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
                    {transactions.map((item) => (
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
                    전체 <span className="font-medium">{totalCount}</span>건 중{' '}
                    <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span>-
                    <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalCount)}</span>건 표시
                  </div>
                </div>
                <div>
                  <div className="flex-1 flex justify-center">
                    <Pagination 
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
