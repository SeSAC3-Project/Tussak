const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

export const insightApi = {
    // HOT 키워드 조회
    getKeywords: async () => {
        try {
            console.log('키워드 API 호출 시작:', `${API_BASE_URL}/api/insight/keywords`);
            
            const response = await fetch(`${API_BASE_URL}/api/insight/keywords`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            console.log('키워드 API 응답 상태:', response.status, response.statusText);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('키워드 API 응답 데이터:', data);
            
            if (data.success) {
                return {
                    success: true,
                    data: data.data
                };
            } else {
                throw new Error(data.message || 'HOT 키워드 조회에 실패했습니다');
            }
        } catch (error) {
            console.error('HOT 키워드 조회 API 오류:', error);
            console.error('에러 상세:', error.stack);
            return {
                success: false,
                data: [],
                error: error.message
            };
        }
    },

    // 키워드 갱신
    refreshKeywords: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/insight/keywords/refresh`, {
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
                    data: data.data
                };
            } else {
                throw new Error(data.message || '키워드 갱신에 실패했습니다');
            }
        } catch (error) {
            console.error('키워드 갱신 API 오류:', error);
            return {
                success: false,
                data: [],
                error: error.message
            };
        }
    },

    // 뉴스 조회
    getNews: async (keyword = '', display = 5) => {
        try {
            console.log('뉴스 API 호출 시작:', keyword);
            
            const params = new URLSearchParams();
            if (keyword) {
                params.append('keyword', keyword);
            }
            params.append('display', display.toString());

            const url = `${API_BASE_URL}/api/insight/news?${params}`;
            console.log('뉴스 API URL:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            console.log('뉴스 API 응답 상태:', response.status, response.statusText);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('뉴스 API 에러 응답:', errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            
            const data = await response.json();
            console.log('뉴스 API 응답 데이터:', data);
            
            if (data.success) {
                return {
                    success: true,
                    data: data.data,
                    keyword: data.keyword
                };
            } else {
                throw new Error(data.message || '뉴스 조회에 실패했습니다');
            }
        } catch (error) {
            console.error('뉴스 조회 API 오류:', error);
            console.error('에러 상세:', error.stack);
            return {
                success: false,
                data: [],
                error: error.message
            };
        }
    },

    // 뉴스 갱신
    refreshNews: async (keyword = '', display = 5) => {
        try {
            const params = new URLSearchParams();
            if (keyword) params.append('keyword', keyword);
            params.append('display', display.toString());

            const response = await fetch(`${API_BASE_URL}/api/insight/news/refresh?${params}`, {
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
                    keyword: data.keyword
                };
            } else {
                throw new Error(data.message || '뉴스 갱신에 실패했습니다');
            }
        } catch (error) {
            console.error('뉴스 갱신 API 오류:', error);
            return {
                success: false,
                data: [],
                error: error.message
            };
        }
    }
};
