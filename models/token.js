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
        // 检查本地是否有token
        const token = wx.getStorageSync('wechat_token') || wx.getStorageSync('access_token')
        if (!token) {
            console.log('Token类 - 本地无token，开始获取')
            await this.getTokenFromServer()
        } else {
            console.log('Token类 - 发现本地token，验证有效性')
            // 验证token是否有效
            try {
                await this._verifyFromServer(token)
            } catch (error) {
                console.log('Token类 - token验证失败，重新获取')
                await this.getTokenFromServer()
            }
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
        
        // 根据不同的响应格式处理token
        if (res.data.code === 0 && res.data.result && res.data.result.token) {
            // 新版API响应格式
            const newToken = res.data.result.token
            wx.setStorageSync('wechat_token', newToken)
            console.log('Token类 - 新版token已保存到本地存储:', newToken)
            return newToken
        } else if (res.data.token) {
            // 旧版API响应格式
            const newToken = res.data.token
            wx.setStorageSync('wechat_token', newToken) 
            console.log('Token类 - 旧版token已保存到本地存储:', newToken)
            return newToken
        } else {
            console.error('Token类 - 无法解析token响应:', res.data)
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