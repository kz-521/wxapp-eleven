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
        const r = await wx.login()
        const code = r.code
        console.log(code, 'code')
        const token = new Token()
        token.verify()
    }
})
