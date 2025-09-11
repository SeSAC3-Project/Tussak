const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

export const rankingApi = {
    // 투자 랭킹 조회
    getInvestmentRanking: async (limit = 5) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/ranking/all?limit=${limit}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                return {
                    success: true,
                    data: data.data,
                    total_count: data.total_count
                };
            } else {
                throw new Error(data.message || '투자 랭킹 조회에 실패했습니다');
            }
        } catch (error) {
            console.error('투자 랭킹 조회 API 오류:', error);
            return {
                success: false,
                data: [],
                error: error.message
            };
        }
    },

    // 내 랭킹 조회 (로그인 필요)
    getMyRanking: async (token) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/ranking/my-rank`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                return {
                    success: true,
                    data: data.data
                };
            } else {
                throw new Error(data.message || '내 랭킹 조회에 실패했습니다');
            }
        } catch (error) {
            console.error('내 랭킹 조회 API 오류:', error);
            return {
                success: false,
                data: null,
                error: error.message
            };
        }
    }
};
