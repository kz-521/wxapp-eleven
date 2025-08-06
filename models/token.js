/**
 * @作者 7七月
 * @微信公号 林间有风
 * @开源项目 $ http://7yue.pro
 * @免费专栏 $ http://course.7yue.pro
 * @我的课程 $ http://imooc.com/t/4294850
 * @创建时间 2020-04-26 18:13
 */
import {config} from "../config/config";
import {promisic} from "../utils/util";

class Token {
    // 1. 携带Token
    // server 请求Token
    // 登录 token -> storage
    // token 1. token不存在 2.token 过期时间
    // 静默登录
    constructor() {
        // 使用正确的token URL
        this.tokenUrl = config.apiBaseUrl + "qingting/v1/token"
        this.verifyUrl = config.apiBaseUrl + "qingting/v1/token/verify"
    }

    async verify() {
        // 使用新的token获取方式
        const token = wx.getStorageSync('wechat_token') || wx.getStorageSync('access_token')
        if (!token) {
            await this.getTokenFromServer()
        } else {
            // 暂时跳过token验证，避免重复获取
            // await this._verifyFromServer(token)
            console.log('Token已存在，跳过验证')
        }
    }

    async getTokenFromServer() {
        console.log('Token类 - 开始获取token')
        
        // 获取微信登录凭证
        const r = await wx.login()
        const code = r.code
        console.log('Token类 - 获取到微信登录code:', code)

        // 调用正确的token接口
        const res = await promisic(wx.request)({
            url: this.tokenUrl,
            method: 'POST',
            data: {
                code: code
            },
        })
        
        console.log('Token类 - v1/token接口响应:', res.data)
        
        // 保存新的token
        const newToken = res.data.token || res.data.access_token
        wx.setStorageSync('wechat_token', newToken)
        console.log('Token类 - token已保存到本地存储:', newToken)
        
        return newToken
    }

    async _verifyFromServer(token) {
        const res = await promisic(wx.request)({
            url: this.verifyUrl,
            method: 'POST',
            data: {
                token
            }
        })

        const valid = res.data.is_valid
        if (!valid) {
            return this.getTokenFromServer()
        }
    }

}

export {
    Token
}