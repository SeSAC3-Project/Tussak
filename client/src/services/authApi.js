// 카카오 로그인 관련 API 서비스 - 기존 서버 API 활용

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:5000';

export const authApi = {
    // 카카오 로그인 - 서버의 /api/auth/kakao/login 사용
    kakaoLogin: async (accessToken) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/kakao/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    access_token: accessToken
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || '로그인에 실패했습니다');
            }

            return data;
        } catch (error) {
            console.error('카카오 로그인 API 오류:', error);
            throw error;
        }
    },

    // JWT 토큰 검증 - 서버의 /api/auth/verify 사용
    verifyToken: async (token) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || '토큰 검증에 실패했습니다');
            }

            return data;
        } catch (error) {
            console.error('토큰 검증 API 오류:', error);
            throw error;
        }
    },

    // 로그아웃 - 서버의 /api/auth/logout 사용
    logout: async (token) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || '로그아웃에 실패했습니다');
            }

            return data;
        } catch (error) {
            console.error('로그아웃 API 오류:', error);
            throw error;
        }
    }
};

// 카카오 SDK 초기화 및 로그인 처리
export const kakaoAuth = {
    // 카카오 SDK 초기화
    init: () => {
        if (window.Kakao && !window.Kakao.isInitialized()) {
            window.Kakao.init(process.env.REACT_APP_KAKAO_APP_KEY);
        }
    },

    // 카카오 로그인 실행
    login: () => {
        return new Promise((resolve, reject) => {
            if (!window.Kakao) {
                reject(new Error('카카오 SDK가 로드되지 않았습니다'));
                return;
            }

            if (!window.Kakao.isInitialized()) {
                reject(new Error('카카오 SDK가 초기화되지 않았습니다'));
                return;
            }

            console.log('사용 가능한 Kakao.Auth 메소드들:', Object.keys(window.Kakao.Auth));

            // 구버전 SDK에서 login 함수 사용
            window.Kakao.Auth.login({
                success: (authObj) => {
                    console.log('카카오 로그인 성공:', authObj);
                    resolve(authObj.access_token);
                },
                fail: (err) => {
                    console.error('카카오 로그인 실패:', err);
                    reject(new Error('카카오 로그인에 실패했습니다'));
                }
            });
        });
    },

    // 카카오 로그아웃
    logout: () => {
        return new Promise((resolve, reject) => {
            if (!window.Kakao) {
                resolve(); // SDK가 없어도 로그아웃 처리
                return;
            }

            try {
                // 최신 SDK에서는 logout 함수 사용
                if (window.Kakao.Auth.getAccessToken()) {
                    window.Kakao.Auth.logout(() => {
                        console.log('카카오 로그아웃 완료');
                        resolve();
                    });
                } else {
                    resolve();
                }
            } catch (error) {
                console.log('카카오 로그아웃 중 에러 (무시):', error);
                resolve(); // 에러가 발생해도 로그아웃 처리
            }
        });
    }
};
