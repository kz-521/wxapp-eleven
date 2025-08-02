// pages/home/home.js

import {User} from "../../models/user";

Page({

    /**
     * 页面的初始数据
     */
    data: {
        isLogin:true,
        loadingType: 'loading',
        drinks: [
            {
                name: '西柚牛油果奶昔',
                price: '23',
                image: '/imgs/home/drink-item.png'
            },
            {
                name: '西柚牛油果奶昔',
                price: '23',
                image: '/imgs/home/drink-item.png'
            },
            {
                name: '西柚牛油果奶昔',
                price: '23',
                image: '/imgs/home/drink-item.png'
            }
        ]
    },

    async onLoad(options) {
        wx.hideTabBar({});

        this.initAllData()
        //this.initBottomSpuList()
    },

    async initAllData() {
        let that = this
        const shopInfo = await User.getShopInfo()
        that.setData({
            shopInfo
        })
    },

    // 跳转到登录页面
    goToLogin() {
        wx.showToast({
            title: '跳转到登录页面',
            icon: 'none'
        })
        // 如果有登录页面，可以取消注释下面的代码
        // wx.navigateTo({
        //     url: '/pages/login/login'
        // })
    },

    // 跳转到购物车页面
    goToCart() {
        wx.switchTab({
            url: '/pages/cart/cart'
        })
    },

    // 跳转到测试体质页面
    goToTest() {
        wx.showToast({
            title: '跳转到测试体质页面',
            icon: 'none'
        })
        // 如果有测试页面，可以取消注释下面的代码
        // wx.navigateTo({
        //     url: '/pages/test/test'
        // })
    },

    // 跳转到活动页面
    goToActivity() {
        wx.showToast({
            title: '跳转到活动页面',
            icon: 'none'
        })
        // 如果有活动页面，可以取消注释下面的代码
        // wx.navigateTo({
        //     url: '/pages/activity/activity'
        // })
    },

    onGoToCategory(){
        wx.navigateTo({
            url: `/pages/category/category`
        })
    },

    onGoToMyOrder(){
        wx.navigateTo({
            url: `/pages/my-order/my-order`
        })
    },

    getPhoneNumber (e) {
        console.log(e.detail.errMsg)
        console.log(e.detail.iv)
        console.log(e.detail.encryptedData)

        this.initAllData()
    },

    onPullDownRefresh: function () {

    },

    onShareAppMessage: function () {

    }
})


