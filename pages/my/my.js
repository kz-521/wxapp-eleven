import {Coupon} from "../../models/coupon";

Page({
    data: {
        couponCount: 0,
        balance: 0
    },

    onLoad: async function (options) {
        try {
            // 使用新的API接口获取优惠券数据
            const response = await Coupon.getUserCoupons()
            let couponCount = 0
            if (response.code === 0 && response.result && response.result.data) {
                // 处理优惠券数据，获取可用优惠券数量
                const processedData = Coupon.processCouponsData(response)
                couponCount = processedData.availableCoupons.length
            } else {
                console.log('优惠券接口返回错误或数据为空:', response)
            }
            this.setData({
                couponCount,
                balance: 0 // 模拟余额数据
            })
            
        } catch (error) {
            console.error('获取优惠券数据失败:', error)
            // 设置默认值
            this.setData({
                couponCount: 0,
                balance: 0
            })
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
      wx.showToast({
          title: '用户信息已更新',
          icon: 'success',
          duration: 1500
      })
    },
    refreshUserInfo() {
        console.log('我的页面：通知banner组件刷新用户信息')
        // 通过selectComponent获取组件实例并调用其方法
        const bannerComponent = this.selectComponent('#my-banner')
        if (bannerComponent) {
            bannerComponent.refreshUserInfo()
        }
    },

    async onMgrAddress(event) {
      wx.showToast({
          title: '收货地址功能暂未开放',
          icon: 'none',
          duration: 2000
      })
    },

    onShow: async function () {
        try {
            // 刷新用户信息显示
            this.refreshUserInfo()
            
            // 避免频繁调用API，只在必要时刷新优惠券数据
            const currentTime = Date.now()
            const lastUpdateTime = this.lastCouponUpdateTime || 0
            
            // 如果距离上次更新超过30秒，才重新获取优惠券数据
            if (currentTime - lastUpdateTime > 30000) {
                const response = await Coupon.getUserCoupons()
                let couponCount = 0
                if (response.code === 0 && response.result && response.result.data) {
                    // 处理优惠券数据，获取可用优惠券数量
                    const processedData = Coupon.processCouponsData(response)
                    couponCount = processedData.availableCoupons.length
                }
                this.setData({
                    couponCount: couponCount
                })
                this.lastCouponUpdateTime = currentTime
            }
        } catch (error) {
            console.error('页面显示时获取优惠券数据失败:', error)
        }
    },
})
