// pages/coupon-select/index.js
import { Coupon } from '../../models/coupon.js'

Page({
    data: {
        activeTab: 'available',
        availableCoupons: [],
        usedCoupons: [],
        expiredCoupons: [],
        loading: false
    },

    onLoad(options) {
        console.log('优惠券页面加载')
        this.loadCoupons()
    },

    /**
     * 加载优惠券数据
     */
    async loadCoupons() {
        this.setData({ loading: true })
        
        try {
            const response = await Coupon.getUserCoupons()
            console.log('获取到优惠券数据:', response)
            
            if (response && response.code === 0) {
                const processedData = Coupon.processCouponsData(response)
                this.setData({
                    availableCoupons: processedData.availableCoupons,
                    usedCoupons: processedData.usedCoupons,
                    expiredCoupons: processedData.expiredCoupons
                })
            } else {
                wx.showToast({
                    title: response?.msg || '获取优惠券失败',
                    icon: 'error'
                })
            }
        } catch (error) {
            console.error('获取优惠券异常:', error)
            wx.showToast({
                title: '获取优惠券失败',
                icon: 'error'
            })
        } finally {
            this.setData({ loading: false })
        }
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