// pages/coupon-select/index.js
Page({
    data: {
        activeTab: 'available', // 当前激活的标签
        availableCoupons: [
            {
                id: 1,
                name: '新人专享券',
                amount: '30',
                condition: '满100可用',
                validDate: '2025.12.30 - 2026.12.30'
            },
            {
                id: 2,
                name: '满减优惠券',
                amount: '20',
                condition: '满80可用',
                validDate: '2025.12.30 - 2026.12.30'
            }
        ],
        usedCoupons: [
            {
                id: 3,
                name: '周末特惠券',
                amount: '15',
                condition: '满60可用',
                validDate: '2025.12.30 - 2026.12.30'
            }
        ],
        expiredCoupons: [
            {
                id: 4,
                name: '限时优惠券',
                amount: '25',
                condition: '满120可用',
                validDate: '2025.11.30 - 2025.12.30'
            }
        ]
    },

    onLoad(options) {
        console.log('优惠券页面加载')
    },

    /**
     * 切换标签
     */
    switchTab(e) {
        const tab = e.currentTarget.dataset.tab
        this.setData({
            activeTab: tab
        })
    },

    /**
     * 使用优惠券
     */
    useCoupon(e) {
        const coupon = e.currentTarget.dataset.coupon
        console.log('使用优惠券:', coupon)
        
        // 将优惠券信息存储到globalData
        const app = getApp()
        app.globalData.selectedCoupon = coupon
        
        // 跳转回订单提交页面
        wx.navigateBack({
            success: () => {
                wx.showToast({
                    title: '优惠券已选择',
                    icon: 'success'
                })
            }
        })
    }
})