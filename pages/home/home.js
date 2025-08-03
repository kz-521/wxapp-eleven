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
        console.log('Home页面加载')
        // 获取banner数据
        this.getBannerData()
    },

    onShow() {
        console.log('Home页面显示')
    },

    /**
     * 获取banner数据
     */
    getBannerData() {
        try {
            console.log('开始获取banner数据')
            api.getBannerByName('b1').then(res => {
                console.log('Banner API响应:', res)
                if (res.code === 200 && res.result && res.result.items) {
                    console.log('获取banner成功:', res.result.items)
                    this.setData({
                        bannerList: res.result.items
                    })
                } else {
                    console.log('Banner数据格式不正确:', res)
                }
            }).catch(err => {
                console.error('获取banner失败:', err)
                // 即使API失败也不影响页面显示
            })
        } catch (error) {
            console.error('getBannerData方法执行错误:', error)
        }
    },

    // 跳转到登录页面
    goToLogin() {
        wx.showToast({
            title: '登录功能开发中',
            icon: 'none'
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
        wx.showToast({
            title: '测试功能开发中',
            icon: 'none'
        })
    },

    // 跳转到活动页面
    goToActivity() {
        wx.showToast({
            title: '活动功能开发中',
            icon: 'none'
        })
    }
})


