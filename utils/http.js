import { config } from "../config/config";
import { promisic } from "../utils/util";
import { codes } from "../config/exception-config";
import { HttpException } from "../core/http-exception";

const UNAUTHORIZED = '401';

class Http {
    static async request({ url, data, method = 'GET', retry = true, throwError = false, preurl = config.apiBaseUrl}) {
        const timestamp = Date.parse(new Date()) / 1000;
        const token = this.getToken();

        let res;
        try {
            res = await promisic(wx.request)({
                url: `${preurl}${url}`,
                data,
                method,
                header: {
                    "Content-Type": "application/json",
                    "platform": config.nano,
                    "datetime": timestamp,
                    "token": token,
                    'authorization': `VDNlbFZ6QmNsM1BUN0VwVEpQU2NhNm1ldmZNSTdxOUUveUVHNGp2SGh6L1I0ZUNra3NMbUx3PT0=`

                }
            });
        } catch (e) {
            if (throwError) {
                throw new HttpException(-1, codes[-1]);
            }
            this.showError(-1);
            return null;
        }

        const code = res.statusCode.toString();
        if (code.startsWith('2')) {
            return res.data;
        } else {
            return this.handleNon200Response(res, throwError, url, data, method, retry);
        }
    }

    static async handleNon200Response(res, throwError, url, data, method, retry) {
        const code = res.statusCode.toString();

        if (code === UNAUTHORIZED) {
            // Handle unauthorized error
            if (retry) {
                return await this.handleUnauthorized(url, data, method);
            } else {
                this.handleLogout();
                return null;
            }
        } else {
            if (throwError) {
                throw new HttpException(res.data.code, res.data.message, code);
            }
            if (code === '404' && res.data.code !== undefined) {
                return null;
            }
            this.showError(res.data.code, res.data);
            return res.data;
        }
    }

    static async handleUnauthorized(url, data, method) {
        const app = getApp()
        // 使用app.js中的ensureToken方法，避免重复获取token
        if (app && app.ensureToken) {
            await app.ensureToken()
        }
        return await this.request({ url, data, method, retry: false });
    }

    static handleLogout() {
        wx.clearStorageSync();
        wx.reLaunch({ url: '/pages/home/home' });
    }

    static showError(error_code, serverError) {
        const tip = !error_code ? codes[9999] : codes[error_code] || serverError.message;

        wx.showToast({
            icon: "none",
            title: tip,
            duration: 3000
        });
    }

    static getToken() {
        // 统一从wechat_token获取token，与其他文件保持一致
        const wechatToken = wx.getStorageSync('wechat_token');
        const accessToken = wx.getStorageSync('access_token');
        const legacyToken = wx.getStorageSync('token');
        
        const token = wechatToken || accessToken || legacyToken || '';
        
        console.log('Http.getToken - Token获取状态:', {
            wechatToken: wechatToken ? '存在' : '不存在',
            accessToken: accessToken ? '存在' : '不存在', 
            legacyToken: legacyToken ? '存在' : '不存在',
            finalToken: token ? '已获取' : '未获取'
        });
        
        return token;
    }
}

export {
    Http
}
