import {Coupon} from "../../models/coupon";
import {User} from "../../models/user";

Page({
    data: {
        couponCount: 0,
        balance: 0,
        userInfo: null,
        isLoggedIn: false
    },

    onLoad: async function (options) {
        // 页面加载时检查登录状态
        await this.checkLoginStatus()
    },
    
    onShow: async function () {
        // 页面显示时刷新用户信息
        await this.refreshUserData()
    },

    /**
     * 检查用户登录状态
     */
    async checkLoginStatus() {
        try {
            console.log('检查用户登录状态...')
            
            // 先检查token是否存在
            const token = wx.getStorageSync('wechat_token') || wx.getStorageSync('access_token')
            if (!token) {
                console.log('未找到token，用户未登录')
                this.setData({
                    isLoggedIn: false,
                    userInfo: null,
                    balance: 0,
                    couponCount: 0
                })
                return false
            }

            // 调用用户信息接口验证登录状态
            const userResponse = await User.getUserInfo()
            console.log('用户信息API响应:', userResponse)

            if (userResponse && (userResponse.code === 0 || userResponse.code === 200) && userResponse.result) {
                // 用户已登录且有授权
                const userInfo = userResponse.result
                console.log('用户已登录，用户信息:', userInfo)
                
                // 保存用户信息到本地存储
                wx.setStorageSync('userInfo', userInfo)
                
                this.setData({
                    isLoggedIn: true,
                    userInfo: userInfo,
                    balance: parseFloat(userInfo.balance || 0)
                })
                
                return true
            } else {
                console.log('用户信息获取失败，可能未登录或token过期')
                this.setData({
                    isLoggedIn: false,
                    userInfo: null,
                    balance: 0,
                    couponCount: 0
                })
                return false
            }
        } catch (error) {
            console.error('检查登录状态失败:', error)
            this.setData({
                isLoggedIn: false,
                userInfo: null,
                balance: 0,
                couponCount: 0
            })
            return false
        }
    },

    /**
     * 刷新用户数据
     */
    async refreshUserData() {
        try {
            // 先检查登录状态
            const isLoggedIn = await this.checkLoginStatus()
            
            if (!isLoggedIn) {
                console.log('用户未登录，跳过数据加载')
                return
            }

            console.log('用户已登录，开始加载数据...')
            
            // 获取优惠券数据
            let couponCount = 0
            try {
                const couponResponse = await Coupon.getUserCoupons()
                if (couponResponse.code === 0 && couponResponse.result && couponResponse.result.data) {
                    const processedData = Coupon.processCouponsData(couponResponse)
                    couponCount = processedData.availableCoupons.length
                    console.log('获取到优惠券数量:', couponCount)
                }
            } catch (couponError) {
                console.error('获取优惠券数据失败:', couponError)
            }

            this.setData({
                couponCount
            })

        } catch (error) {
            console.error('刷新用户数据失败:', error)
        }
    },

    onGotoMyCoupon(event) {
        wx.navigateTo({
            url: "/pages/coupon-select/index"
        })
    },

    onGotoMyOrder(event) {
        const status = event.currentTarget.dataset.status || 0
        console.log('跳转到订单页面，状态:', status)
        wx.navigateTo({
            url: `/pages/my-order/index?key=${status}`
        })
    },

    onGotoMyCourse(event) {
        wx.navigateTo({
            url:"/pages/about-course/about-course"
        })
    },

    onUserInfoUpdated(event) {
        console.log('用户信息更新事件:', event.detail)
        
        // 刷新页面数据
        this.refreshUserData()
        
        wx.showToast({
            title: '用户信息已更新',
            icon: 'success',
            duration: 1500
        })
    },
    
    /**
     * 刷新banner组件的用户信息
     */
    refreshUserInfo() {
        console.log('我的页面：通知banner组件刷新用户信息')
        // 通过selectComponent获取组件实例并调用其方法
        const bannerComponent = this.selectComponent('#my-banner')
        if (bannerComponent) {
            bannerComponent.refreshUserInfo(this.data.isLoggedIn, this.data.userInfo)
        }
    },

    async onMgrAddress(event) {
      wx.showToast({
          title: '收货地址功能暂未开放',
          icon: 'none',
          duration: 2000
      })
    }
})
