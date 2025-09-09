const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

const portfolioApi = {
  // 전체 포트폴리오 조회
  getPortfolio: async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/portfolio`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '포트폴리오 조회에 실패했습니다');
      }

      return data;
    } catch (error) {
      console.error('포트폴리오 API 오류:', error);
      throw error;
    }
  },

  // 포트폴리오 요약 정보 조회
  getPortfolioSummary: async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/portfolio/summary`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '포트폴리오 요약 조회에 실패했습니다');
      }

      return data;
    } catch (error) {
      console.error('포트폴리오 요약 API 오류:', error);
      throw error;
    }
  }
};

export default portfolioApi;
