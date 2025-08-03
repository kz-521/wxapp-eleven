// pages/home/home.js
const { api } = require('../../utils/api.js')

Page({
    data: {
        isLogin: false,
        drinks: [
            {
                name: '清照竹影茶',
                price: '20',
                image: '/imgs/home/drink-item.png'
            },
            {
                name: '清照竹影茶',
                price: '20',
                image: '/imgs/home/drink-item.png'
            },
            {
                name: '清照竹影茶',
                price: '20',
                image: '/imgs/home/drink-item.png'
            }
        ],
        bannerList: [] // banner数据
    },

    onLoad() {
        // 获取banner数据
        this.getBannerData()
    },

    /**
     * 获取banner数据
     */
    getBannerData() {
        api.getBannerByName('b1').then(res => {
            if (res.code === 200 && res.result && res.result.items) {
                console.log('获取banner成功:', res.result.items)
                this.setData({
                    bannerList: res.result.items
                })
            }
        }).catch(err => {
            console.error('获取banner失败:', err)
        })
    },

    // 跳转到登录页面
    goToLogin() {
        wx.navigateTo({
            url: '/pages/login/login'
        })
    },

    // 跳转到购物车页面
    goToCart() {
        wx.switchTab({
            url: '/pages/cart/cart'
        })
    },

    // 跳转到测试体质页面
    goToTest() {
        wx.navigateTo({
            url: '/pages/test/test'
        })
    },

    // 跳转到活动页面
    goToActivity() {
        wx.navigateTo({
            url: '/pages/activity/activity'
        })
    }
})


