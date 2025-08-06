import {config} from "../config/config";
import {promisic} from "./util";
import {Token} from "../models/token";
import {codes} from "../config/exception-config";
import {HttpException} from "../core/http-exception";

/**
 * @作者 7七月
 * @微信公号 林间有风
 * @开源项目 $ http://7yue.pro
 * @免费专栏 $ http://course.7yue.pro
 * @我的课程 $ http://imooc.com/t/4294850
 * @创建时间 2019-09-22 05:30
 */

class Http {
    static async request({
                             url,
                             data,
                             method = 'GET',
                             refetch = true,
                             throwError = false
                         }) {
        let res;
        try {
            res = await promisic(wx.request)({
                url: `${config.apiBaseUrl}${url}`,
                data,
                method,
                header: {
                    'content-type': 'application/json',
                    'version': 'v1',
                    appkey: config.appkey,
                    'token': wx.getStorageSync('wechat_token') || wx.getStorageSync('access_token') || ''
                }
            })
        } catch (e) {
            if (throwError) {
                throw new HttpException(-1, codes[-1])
            }
            Http.showError(-1)
            return null
        }
        const code = res.statusCode.toString()
        if (code.startsWith('2')) {
            return res.data
        } else {
            if (code === '401') {
                // 二次重发
                if (data.refetch) {
                    Http._refetch({
                        url,
                        data,
                        method
                    })
                }
            } else {
                if (throwError) {
                    throw new HttpException(res.data.code, res.data.message, code)
                }
                if (code === '404') {
                    if (res.data.code !== undefined) {
                        return null
                    }
                    return res.data
                }
                const error_code = res.data.code;
                Http.showError(error_code, res.data)
            }
            // 403 404 500
        }
        return res.data
    }

    static async _refetch(data) {
        const app = getApp()
        // 使用app.js中的ensureToken方法，避免重复获取token
        if (app && app.ensureToken) {
            await app.ensureToken()
        }
        data.refetch = false
        return await Http.request(data)
    }

    static showError(error_code, serverError) {
        let tip
        console.log(error_code)

        if (!error_code) {
            tip = codes[9999]
        } else {
            if (codes[error_code] === undefined) {
                tip = serverError.message
            } else {
                tip = codes[error_code]
            }
        }

        wx.showToast({
            icon: "none",
            title: tip,
            duration: 3000
        })
    }
}


export {
    Http
}
