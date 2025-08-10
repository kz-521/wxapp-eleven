//app.js

import { Token } from "./models/token";

App({
    globalData: {
        cartItems: [], // 购物车商品列表
        cartCount: 0,  // 购物车商品总数
        totalPrice: 0, // 购物车总价格
        selectedCoupon: null // 选中的优惠券
    },
    
    /**
     * 确保token有效的方法
     */
    async ensureToken() {
        try {
            await (new Token()).verify();
            return true;
        } catch (error) {
            console.error('Token验证失败:', error);
            return false;
        }
    },
    
    async onLaunch() {

        await (new Token()).verify();

        if (wx.canIUse('getUpdateManager')) {
            const updateManager = wx.getUpdateManager()
            updateManager.onCheckForUpdate(function (res) {
                if (res.hasUpdate) {
                    try {} catch (e) {
                        console.log(e)
                    }
                    updateManager.onUpdateReady(function () {
                        updateManager.applyUpdate();
                    })
                    updateManager.onUpdateFailed(function () {
                        wx.showModal({
                            title: '已经有新版本了哟~',
                            content: '新版本已经上线啦~，请您重新打开当前小程序哟~',
                        })
                    })
                }
            })
        } else {
            wx.showModal({
                title: '提示',
                content: '当前微信版本过低，无法完好兼容，请升级到最新微信版本后重试。'
            })
        }
    }
})
