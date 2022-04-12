import { instance as axiosInstance } from '../helpers/httpHelper';
import tokenService from './token.service';
import { refreshToken, logout } from '../actions/auth';

const setup = (store) => {
    axiosInstance.interceptors.request.use(
        (config) => {
            const token = tokenService.getLocalToken();
            if (token) {
                config.headers["Authorization"] = 'Bearer ' + token;
            }
            if (config.url.includes('form')) {
                config.headers["Content-Type"] = "multipart/form-data";
            }
            return config;
        }, (error) => {
            return Promise.reject(error);
        }
    );
    const { dispatch } = store;
    axiosInstance.interceptors.response.use(
        (res) => {
            return res;
        },
        async (err) => {
            console.log(err.response);
            const originalConfig = err.config;
            if (err.response.status === 401 && !originalConfig._retry) {
                originalConfig._retry = true;
                try {
                    if (err.response.data.Message === 'USER_NOT_EXIST') {
                        dispatch(logout());
                        return axiosInstance(originalConfig);
                    }
                    const rs = await axiosInstance.post("/Authenticate/RefreshToken", {
                        RefreshToken: tokenService.getLocalRefreshToken(),
                    });

                    const { Token, RefreshToken } = rs.data;

                    dispatch(refreshToken(Token));
                    tokenService.updateLocalToken(Token, RefreshToken);

                    return axiosInstance(originalConfig);
                } catch (_err) {
                    return Promise.reject(_err);
                }
            }
            return Promise.reject(err);
        }
    );
};

export default setup;