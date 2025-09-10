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
        // 检查本地是否有token
        const token = wx.getStorageSync('wechat_token') || wx.getStorageSync('access_token')
        if (!token) {
            await this.getTokenFromServer()
        } else {
            // 验证token是否有效
            try {
                await this._verifyFromServer(token)
            } catch (error) {
                await this.getTokenFromServer()
            }
        }
    }

    async getTokenFromServer() {
        // 获取微信登录凭证
        const r = await wx.login()
        const code = r.code
        // 调用正确的token接口
        const res = await promisic(wx.request)({
            url: this.tokenUrl,
            method: 'POST',
            data: {
                code: code
            },
        })
        // 根据不同的响应格式处理token
        if (res.data.code === 0 && res.data.result && res.data.result.token) {
            // 新版API响应格式
            const newToken = res.data.result.token
            wx.setStorageSync('wechat_token', newToken)
            return newToken
        } else if (res.data.token) {
            // 旧版API响应格式
            const newToken = res.data.token
            wx.setStorageSync('wechat_token', newToken) 
            return newToken
        } else {
            throw new Error('获取token失败')
        }
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