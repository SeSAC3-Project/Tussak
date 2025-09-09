// 즐겨찾기 관련 API 서비스

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

export const bookmarkApi = {
    // 사용자의 모든 즐겨찾기 목록 조회
    getUserBookmarks: async (token) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/bookmarks/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || '즐겨찾기 목록 조회에 실패했습니다');
            }

            return data;
        } catch (error) {
            console.error('즐겨찾기 목록 조회 API 오류:', error);
            throw error;
        }
    },

    // 특정 종목의 즐겨찾기 상태 확인
    checkBookmarkStatus: async (stockCode, token) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/bookmarks/${stockCode}/status`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || '즐겨찾기 상태 확인에 실패했습니다');
            }

            return data;
        } catch (error) {
            console.error('즐겨찾기 상태 확인 API 오류:', error);
            throw error;
        }
    },

    // 즐겨찾기 추가
    addBookmark: async (stockCode, token) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/bookmarks/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    stock_code: stockCode
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || '관심종목 추가에 실패했습니다');
            }

            return data;
        } catch (error) {
            console.error('즐겨찾기 추가 API 오류:', error);
            throw error;
        }
    },

    // 즐겨찾기 삭제
    removeBookmark: async (stockCode, token) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/bookmarks/${stockCode}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || '관심종목 삭제에 실패했습니다');
            }

            return data;
        } catch (error) {
            console.error('즐겨찾기 삭제 API 오류:', error);
            throw error;
        }
    },

    // 사용자의 즐겨찾기 목록과 상세 정보 조회
    getUserBookmarksWithDetails: async (token) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/bookmarks/details`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || '관심종목 상세 정보 조회에 실패했습니다');
            }

            return data;
        } catch (error) {
            console.error('즐겨찾기 상세 정보 조회 API 오류:', error);
            throw error;
        }
    }
};
