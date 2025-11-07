const { api } = require('../../utils/api.js')

Page({
    data: {
        coupons: [],
        selectedCoupon: null,
        orderAmount: 0, // 订单金额，从上级页面传递
        loading: true
    },

    onLoad(options) {
        console.log('我的优惠券页面加载')
        
        // 获取订单金额，用于计算优惠
        const app = getApp()
        const orderAmount = (app && app.globalData && app.globalData.orderAmount) || 0
        
        this.setData({
            orderAmount: orderAmount
        })
        
        console.log('订单金额:', orderAmount)
        
        // 加载用户优惠券
        this.loadUserCoupons()
    },

    /**
     * 加载用户优惠券
     */
    async loadUserCoupons() {
        try {
            wx.showLoading({
                title: '加载中...'
            })

            // 调用用户优惠券接口
            const response = await api.getUserCoupons()
            
            console.log('用户优惠券接口响应:', response)

            if (response.code === 0 && response.result) {
                // 接口返回的是分页数据，优惠券列表在result.data中
                const coupons = response.result.data || []
                
                console.log('接口返回的优惠券列表:', coupons)
                
                // 过滤出可用的优惠券（status: 1表示未使用）
                const availableCoupons = coupons.filter(item => item.status === 1)
                
                // 格式化优惠券数据
                const formattedCoupons = availableCoupons.map(item => {
                    const coupon = item.coupon
                    
                    // 计算优惠券是否可用
                    const canUse = this.canUseCoupon(coupon, this.data.orderAmount)
                    
                    // 计算折扣显示值
                    let discountDisplay = ''
                    if (coupon.type === 2) {
                        const discountValue = parseFloat(coupon.rate) * 10
                        discountDisplay = discountValue.toFixed(1)
                    }
                    
                    return {
                        id: item.id, // 用户优惠券ID
                        coupon_id: item.coupon_id,
                        user_id: item.user_id,
                        status: item.status,
                        create_time: item.create_time,
                        coupon: {
                            id: coupon.id,
                            title: coupon.title,
                            description: coupon.description,
                            type: coupon.type, // 1:满减券 2:折扣券
                            full_money: coupon.full_money, // 满减券的满额条件
                            minus: coupon.minus, // 满减券的减免金额
                            rate: coupon.rate, // 折扣券的折扣率
                            start_time: coupon.start_time,
                            end_time: coupon.end_time
                        },
                        discountDisplay: discountDisplay, // 折扣显示值
                        canUse: canUse.canUse,
                        reason: canUse.reason
                    }
                })

                console.log('格式化后的优惠券数据:', formattedCoupons)

                this.setData({
                    coupons: formattedCoupons,
                    loading: false
                })
            } else {
                console.error('获取用户优惠券失败:', response.msg)
                this.setData({
                    coupons: [],
                    loading: false
                })
                
                wx.showToast({
                    title: response.msg || '获取优惠券失败',
                    icon: 'none'
                })
            }

        } catch (error) {
            console.error('加载用户优惠券异常:', error)
            this.setData({
                coupons: [],
                loading: false
            })
            
            wx.showToast({
                title: '网络异常',
                icon: 'none'
            })
        } finally {
            wx.hideLoading()
        }
    },

    /**
     * 判断优惠券是否可用
     */
    canUseCoupon(coupon, orderAmount) {
        const now = new Date()
        const startTime = new Date(coupon.start_time)
        const endTime = new Date(coupon.end_time)

        // 检查时间有效性
        if (now < startTime) {
            return {
                canUse: false,
                reason: '优惠券未到使用时间'
            }
        }

        if (now > endTime) {
            return {
                canUse: false,
                reason: '优惠券已过期'
            }
        }

        // 检查满减券条件
        if (coupon.type === 1 && coupon.full_money) {
            if (orderAmount < coupon.full_money) {
                return {
                    canUse: false,
                    reason: `订单满${coupon.full_money}元可用`
                }
            }
        }

        return {
            canUse: true,
            reason: ''
        }
    },

    /**
     * 选择优惠券
     */
    selectCoupon(e) {
        const index = e.currentTarget.dataset.index
        const coupon = this.data.coupons[index]

        console.log('选择优惠券:', coupon)

        if (!coupon.canUse) {
            wx.showToast({
                title: coupon.reason,
                icon: 'none'
            })
            return
        }

        // 计算优惠金额
        const discountResult = this.calculateDiscount(coupon.coupon, this.data.orderAmount)

        if (!discountResult.success) {
            wx.showToast({
                title: discountResult.message,
                icon: 'none'
            })
            return
        }

        // 将选中的优惠券传递给全局变量
        const app = getApp()
        if (app && app.globalData) {
            app.globalData.selectedCoupon = coupon
            app.globalData.couponAmount = discountResult.discountAmount
            app.globalData.payAmount = discountResult.payAmount
        }

        console.log('优惠券选择完成，优惠金额:', discountResult.discountAmount, '应付金额:', discountResult.payAmount)

        wx.showToast({
            title: '优惠券选择成功',
            icon: 'success'
        })

        // 返回上级页面
        setTimeout(() => {
            wx.navigateBack()
        }, 1000)
    },

    /**
     * 计算优惠金额
     */
    calculateDiscount(coupon, orderAmount) {
        if (coupon.type === 1) {
            // 满减券
            if (coupon.full_money && orderAmount < coupon.full_money) {
                return {
                    success: false,
                    message: `订单金额不足${coupon.full_money}元`
                }
            }

            const discountAmount = Math.min(coupon.minus, orderAmount)
            const payAmount = orderAmount - discountAmount

            return {
                success: true,
                discountAmount: discountAmount,
                payAmount: payAmount
            }
        } else if (coupon.type === 2) {
            // 折扣券
            const discountRate = parseFloat(coupon.rate)
            const payAmount = orderAmount * discountRate
            const discountAmount = orderAmount - payAmount

            return {
                success: true,
                discountAmount: discountAmount,
                payAmount: payAmount
            }
        }

        return {
            success: false,
            message: '不支持的优惠券类型'
        }
    },

    /**
     * 不使用优惠券
     */
    noUseCoupon() {
        // 清空全局优惠券选择
        const app = getApp()
        if (app && app.globalData) {
            app.globalData.selectedCoupon = null
            app.globalData.couponAmount = 0
            app.globalData.payAmount = app.globalData.orderAmount || 0
        }

        wx.showToast({
            title: '已取消优惠券选择',
            icon: 'success'
        })

        // 返回上级页面
        setTimeout(() => {
            wx.navigateBack()
        }, 1000)
    }
})