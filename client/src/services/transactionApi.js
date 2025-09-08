const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const transactionApi = {
  // 매수/매도 거래 실행
  createTransaction: async (transactionData, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          stock_code: transactionData.stockCode,
          stock_name: transactionData.stockName,
          type: transactionData.type, // 'BUY' or 'SELL'
          quantity: parseInt(transactionData.quantity),
          price: parseFloat(transactionData.price)
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '거래 처리에 실패했습니다');
      }

      return data;
    } catch (error) {
      console.error('거래 API 오류:', error);
      throw error;
    }
  },

  // 거래 내역 조회
  getTransactions: async (token, page = 1, perPage = 10) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/user/transactions?page=${page}&per_page=${perPage}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '거래 내역 조회에 실패했습니다');
      }

      return data;
    } catch (error) {
      console.error('거래 내역 조회 API 오류:', error);
      throw error;
    }
  }
};

export default transactionApi;
