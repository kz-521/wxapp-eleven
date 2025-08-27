import {Coupon} from "../../models/coupon";
import {User} from "../../models/user";

Page({
    data: {
        couponCount: 0,
        balance: 188.50 // 设置默认余额
    },

    onLoad: async function (options) {

    },
    onShow: async function () {
        try {
            // 使用新的API接口获取优惠券数据
            const response = await Coupon.getUserCoupons()
            const user = await User.getUserInfo();

            wx.setStorageSync("userInfo", user.result);

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
                user: user.result
            })

        } catch (error) {
            console.error('获取优惠券数据失败:', error)
            // 设置默认值
            this.setData({
                couponCount: 0,
                balance: wx.getStorageSync('userBalance') || 188.50 // 从本地存储获取余额
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
      console.log('用户信息更新事件:', event.detail)
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
    }
})
