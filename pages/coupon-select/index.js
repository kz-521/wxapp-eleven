// pages/coupon-select/index.js
Page({
    data: {
        activeTab: 'available', // 当前激活的标签
        availableCoupons: [], // 可用优惠券
        usedCoupons: [], // 已使用优惠券
        expiredCoupons: [] // 已过期优惠券
    },

    onLoad(options) {
        console.log('优惠券页面加载')
        this.loadCoupons()
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
     * 加载优惠券数据
     */
    loadCoupons() {
        // 这里可以调用API获取优惠券数据
        // 暂时使用模拟数据
        const mockAvailableCoupons = [
            {
                id: 1,
                amount: 30,
                condition: '满100可用',
                title: '新人专享券',
                desc: '仅限首次下单使用',
                expireDate: '2024-12-31',
                status: 'available'
            }
        ]

        const mockUsedCoupons = [
            {
                id: 2,
                amount: 20,
                condition: '满80可用',
                title: '满减优惠券',
                desc: '全场通用',
                useDate: '2024-01-15',
                status: 'used'
            }
        ]

        const mockExpiredCoupons = [
            {
                id: 3,
                amount: 15,
                condition: '满60可用',
                title: '周末特惠券',
                desc: '仅限周末使用',
                expireDate: '2024-01-10',
                status: 'expired'
            }
        ]

        this.setData({
            availableCoupons: mockAvailableCoupons,
            usedCoupons: mockUsedCoupons,
            expiredCoupons: mockExpiredCoupons
        })
    },

    /**
     * 使用优惠券
     */
    useCoupon(e) {
        const couponId = e.currentTarget.dataset.id
        console.log('使用优惠券:', couponId)
        
        // 这里可以调用API使用优惠券
        wx.showToast({
            title: '优惠券使用成功',
            icon: 'success'
        })
    }
})