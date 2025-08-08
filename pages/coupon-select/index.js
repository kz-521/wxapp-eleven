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
                // 使用模拟数据，包含type字段
                this.setMockCoupons()
            }
        } catch (error) {
            console.error('获取优惠券异常:', error)
            // 使用模拟数据，包含type字段
            this.setMockCoupons()
        } finally {
            this.setData({ loading: false })
        }
    },

    /**
     * 设置模拟优惠券数据
     */
    setMockCoupons() {
        const mockAvailableCoupons = [
            {
                id: 1,
                name: '新用户专享券',
                amount: 10,
                full_money: 50, // 满减条件
                type: 1, // 满减优惠券
                condition: '满50可用',
                validDate: '有效期至：2024-12-31',
                status: 'available'
            },
            {
                id: 2,
                name: '满减优惠券',
                amount: 20,
                full_money: 100, // 满减条件
                type: 1, // 满减优惠券
                condition: '满100减20',
                validDate: '有效期至：2024-11-30',
                status: 'available'
            },
            {
                id: 3,
                name: '折扣优惠券',
                rate: 0.85, // 折扣率：0.85表示8.5折
                type: 2, // 折扣优惠券
                condition: '全场8.5折',
                validDate: '有效期至：2024-10-31',
                status: 'available'
            },
            {
                id: 6,
                name: '3折优惠券',
                rate: 0.3, // 折扣率：0.3表示3折
                type: 2, // 折扣优惠券
                condition: '全场3折',
                validDate: '有效期至：2024-12-31',
                status: 'available'
            }
        ]
        
        const mockUsedCoupons = [
            {
                id: 4,
                name: '生日特惠券',
                amount: 15,
                full_money: 80, // 满减条件
                type: 1, // 满减优惠券
                condition: '满80减15',
                validDate: '有效期至：2024-09-30',
                status: 'used'
            }
        ]
        
        const mockExpiredCoupons = [
            {
                id: 5,
                name: '限时折扣券',
                rate: 0.9, // 折扣率：0.9表示9折
                type: 2, // 折扣优惠券
                condition: '全场9折',
                validDate: '有效期至：2024-08-31',
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
        console.log('=== 选择优惠券 ===')
        console.log('优惠券数据:', coupon)
        console.log('优惠券类型:', coupon.type)
        if (coupon.type === 1) {
            console.log('满减券金额:', coupon.amount)
        } else if (coupon.type === 2) {
            console.log('折扣券折扣率:', coupon.rate)
        }
        
        // 将优惠券信息存储到globalData
        const app = getApp()
        app.globalData.selectedCoupon = coupon
        
        console.log('已存储到globalData:', app.globalData.selectedCoupon)
        
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