//app.js
import {Cart} from "./models/cart";
import {Token} from "./models/token";

App({
    globalData: {
        cartItems: [], // 购物车商品列表
        cartCount: 0,  // 购物车商品总数
        totalPrice: 0, // 购物车总价格
        selectedCoupon: null // 选中的优惠券
    },

    async onLaunch() {
        // 应用启动时获取token
        await this.ensureToken()
    },

    async ensureToken() {
        // 检查本地是否已有token
        const existingToken = wx.getStorageSync('wechat_token') || wx.getStorageSync('access_token')
        
        if (existingToken) {
            console.log('应用启动 - 发现本地已有token，跳过获取')
            return existingToken
        }

        // 本地没有token时才获取新token
        console.log('应用启动 - 本地无token，开始获取新token')
        const tokenInstance = new Token()
        await tokenInstance.verify() // 这会自动获取并存储token
        console.log('应用启动 - token获取完成')
    }
})
