//app.js
import {Cart} from "./models/cart";
import {Token} from "./models/token";

App({
    globalData: {
        cartItems: [], // 购物车商品列表
        cartCount: 0,  // 购物车商品总数
        totalPrice: 0, // 购物车总价格
        selectedCoupon: null, // 选中的优惠券
        tokenPromise: null // token获取的Promise，避免重复获取
    },

    async onLaunch() {
        // 应用启动时最早获取token
        await this.ensureToken()
    },

    async ensureToken() {
        if (this.globalData.tokenPromise) {
            console.log('应用启动 - token获取已在进行中，直接返回')
            return this.globalData.tokenPromise
        }

        // 应用启动时总是调用v1/token接口获取最新token
        console.log('应用启动 - 调用v1/token接口获取最新token')
        this.globalData.tokenPromise = this._getTokenFromServer()
        await this.globalData.tokenPromise
        this.globalData.tokenPromise = null // 获取完成后清空
        console.log('应用启动 - token获取完成')
    },

    async _getTokenFromServer() {
        const tokenInstance = new Token()
        return await tokenInstance.getTokenFromServer()
    }
})
