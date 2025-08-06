// pages/coupon-select/index.js
Page({
    data: {
        activeTab: 'available', // 当前选中的标签
        couponList: [
            {
                id: 1,
                title: '新人减免券',
                description: '新用户专享优惠，全场通用',
                amount: 30,
                condition: 50,
                expireDate: '2025.12.30',
                status: 'available',
                statusText: ''
            },
            {
                id: 2,
                title: '满减优惠券',
                description: '满100减20，仅限茶饮类商品',
                amount: 20,
                condition: 100,
                expireDate: '2025.11.30',
                status: 'used',
                statusText: '已使用'
            },
            {
                id: 3,
                title: '生日特惠券',
                description: '生日当月专享，全场8折优惠',
                amount: 50,
                condition: 200,
                expireDate: '2025.10.30',
                status: 'expired',
                statusText: '已过期'
            },
            {
                id: 4,
                title: '周末特惠券',
                description: '周末专享，满80减15',
                amount: 15,
                condition: 80,
                expireDate: '2025.12.15',
                status: 'available',
                statusText: ''
            }
        ]
    },

    onLoad(options) {
        console.log('优惠券页面加载')
        // 根据传入的参数设置默认选中的标签
        if (options.tab) {
            this.setData({
                activeTab: options.tab
            })
        }
        this.filterCoupons()
    },

    /**
     * 切换标签
     */
    switchTab(e) {
        const tab = e.currentTarget.dataset.tab
        this.setData({
            activeTab: tab
        })
        this.filterCoupons()
    },

    /**
     * 根据标签筛选优惠券
     */
    filterCoupons() {
        // 这里可以根据activeTab筛选不同状态的优惠券
        // 目前使用静态数据，实际项目中应该从API获取
        console.log('当前选中标签:', this.data.activeTab)
    },

    /**
     * 选择优惠券
     */
    selectCoupon(e) {
        const coupon = e.currentTarget.dataset.coupon
        
        // 只有可用状态的优惠券才能选择
        if (coupon.status !== 'available') {
            wx.showToast({
                title: '该优惠券不可使用',
                icon: 'none'
            })
            return
        }

        // 将选中的优惠券信息传递回上一页
        const pages = getCurrentPages()
        const prevPage = pages[pages.length - 2]
        
        if (prevPage) {
            // 更新上一页的优惠券信息
            prevPage.setData({
                selectedCoupon: coupon
            })
            
            // 重新计算支付金额
            prevPage.calculatePayAmount()
        }

        wx.showToast({
            title: '优惠券已选择',
            icon: 'success'
        })

        // 返回上一页
        setTimeout(() => {
            wx.navigateBack()
        }, 1000)
    }
})