// pages/order-submit/order-submit.js
const { api } = require('../../utils/api.js')

Page({
    data: {
        address: null,
        orderProducts: [],
        selectedCoupon: null,
        remark: '',
        totalAmount: 0,
        couponAmount: 0,
        payAmount: 0,
        diningType: 'dine-in' // 默认选择堂食
    },

    onLoad(options) {
        console.log('订单提交页面加载')
        // 从globalData获取购物车数据
        this.loadCartDataFromGlobal()
        // 获取默认地址
        this.getDefaultAddress()
        // 检查是否有缓存的优惠券数据
        this.checkCachedCoupon()
    },

    onShow() {
        // 页面显示时检查是否有选中的优惠券
        this.checkSelectedCoupon()
    },

    /**
     * 从globalData加载购物车数据
     */
    loadCartDataFromGlobal() {
        const app = getApp()
        const cartItems = app.globalData.cartItems || []
        
        console.log('从globalData获取的购物车数据:', cartItems)
        
        if (cartItems.length === 0) {
            wx.showToast({
                title: '购物车为空',
                icon: 'none'
            })
            setTimeout(() => {
                wx.navigateBack()
            }, 1500)
            return
        }

        // 计算总金额
        const totalAmount = cartItems.reduce((total, item) => {
            return total + (parseFloat(item.price) * item.count)
        }, 0)

        console.log('计算的总金额:', totalAmount)

        this.setData({
            orderProducts: cartItems,
            totalAmount: totalAmount.toFixed(2),
            payAmount: totalAmount.toFixed(2)
        })
        
        console.log('设置到页面的数据:', this.data.orderProducts, this.data.totalAmount)
    },

    /**
     * 获取默认地址
     */
    getDefaultAddress() {
        // 这里可以调用API获取用户默认地址
        // 暂时使用模拟数据
        const defaultAddress = wx.getStorageSync('defaultAddress')
        if (defaultAddress) {
            this.setData({
                address: defaultAddress
            })
        }
    },

    /**
     * 选择地址
     */
    selectAddress() {
        wx.navigateTo({
            url: '/pages/address/address'
        })
    },

    /**
     * 选择优惠券
     */
    selectCoupon() {
        wx.navigateTo({
            url: '/pages/coupon-select/index'
        })
    },

    /**
     * 选择用餐类型
     */
    selectDiningType(e) {
        this.setData({
            diningType: e.currentTarget.dataset.type
        })
    },

    /**
     * 提交订单并支付
     */
    goToCheckout() {
        if (this.data.cartCount <= 0) {
            wx.showToast({
                title: '购物车为空',
                icon: 'none'
            })
            return
        }

        wx.showLoading({
            title: '提交中...'
        })

        // 构建sku_info_list参数
        const sku_info_list = (this.data.orderProducts || []).map(item => ({
            id: item.id,
            count: item.count
        }))
        const remark = this.data.remark || ''
        const orderData = {
            sku_info_list,
            remark
        }

        // 调用订单提交接口
        api.submitOrder(orderData).then(res => {
            wx.hideLoading()
            console.log('订单提交响应:', res)
            
            if (res.code === 0 && res.result && res.result.order_id) {
                console.log('订单提交成功，订单ID:', res.result.order_id)
                // 使用返回的order_id调用支付接口
                this.callPayment(res.result.order_id)
            } else {
                wx.showToast({
                    title: res.msg || '订单提交失败',
                    icon: 'none'
                })
            }
        }).catch(err => {
            wx.hideLoading()
            console.error('订单提交失败:', err)
            wx.showToast({
                title: '订单提交失败',
                icon: 'none'
            })
        })
    },

    /**
     * 调用支付接口
     */
    callPayment(orderId) {
        console.log('开始调用支付接口，订单ID:', orderId)
        
        api.payPreorder(orderId).then(res => {
            console.log('支付接口响应:', res)
            
            if (res.code === 0 && res.result) {
                console.log('支付参数:', res.result)
                // 直接使用返回的支付参数
                const data = res.result
                
                // 调用微信支付
                wx.requestPayment({
                    'timeStamp': data.timeStamp,
                    'nonceStr': data.nonceStr,
                    'package': data.package,
                    'signType': data.signType,
                    'paySign': data.paySign,
                    'success': (res) => {
                        console.log('支付成功:', res)
                        let msg = res.errMsg.split(':')[1]
                        if (msg == 'ok') {
                            wx.showToast({
                                title: '支付成功！',
                                icon: 'success',
                                duration: 3000
                            })
                            
                            // 清空购物车
                            const app = getApp()
                            app.globalData.cartItems = []
                            app.globalData.cartCount = 0
                            app.globalData.totalPrice = 0
                            
                            // 清除缓存的优惠券数据
                            wx.removeStorageSync('selectedCoupon')
                            wx.removeStorageSync('couponAmount')
                            wx.removeStorageSync('payAmount')
                            
                            setTimeout(() => {
                                wx.navigateBack({
                                    delta: 1
                                })
                            }, 2000)
                        }
                    },
                    'fail': (res) => {
                        console.info("支付失败:", res)
                        // 支付失败大致分两种情况：
                        // 1.在支付界面，用户取消支付（errMsg为requestPayment:fail cancel）
                        // 2.在支付界面，用户点击支付但失败了（errMsg为requestPayment:fail (detail message)）
                        // 情况1无需弹出报错提示
                        let error = res.errMsg.split(':')[1]
                        if (error !== "fail cancel") {
                            // 情况2
                            wx.showToast({
                                title: error,
                                icon: 'none',
                                duration: 2000
                            })
                        } else {
                            // 情况1
                            console.log("用户取消支付")
                        }
                    }
                })
            } else {
                console.error('支付接口返回错误:', res)
                wx.showToast({
                    title: res.msg || '支付接口调用失败',
                    icon: 'none'
                })
            }
        }).catch(err => {
            console.error('支付接口调用失败:', err)
            wx.showToast({
                title: '支付接口调用失败',
                icon: 'none'
            })
        })
    },

    /**
     * 备注输入
     */
    onRemarkInput(e) {
        this.setData({
            remark: e.detail.value
        })
    },

    /**
     * 检查选中的优惠券
     */
    checkSelectedCoupon() {
        const app = getApp()
        const selectedCoupon = app.globalData.selectedCoupon
        
        if (selectedCoupon) {
            console.log('检测到选中的优惠券:', selectedCoupon)
            
            // 计算优惠后的价格
            const originalAmount = parseFloat(this.data.totalAmount)
            const couponAmount = parseFloat(selectedCoupon.amount)
            let payAmount = Math.max(0, originalAmount - couponAmount)
            
            // 如果金额为0，变成0.01
            if (payAmount === 0) {
                payAmount = 0.01
            }
            
            this.setData({
                selectedCoupon: selectedCoupon,
                couponAmount: couponAmount.toFixed(2),
                payAmount: payAmount.toFixed(2)
            })
            
            // 缓存优惠券数据到本地存储，避免页面刷新后丢失
            wx.setStorageSync('selectedCoupon', selectedCoupon)
            wx.setStorageSync('couponAmount', couponAmount.toFixed(2))
            wx.setStorageSync('payAmount', payAmount.toFixed(2))
            
            // 清空globalData中的优惠券，避免重复使用
            app.globalData.selectedCoupon = null
        } else {
            // 如果没有从globalData获取到优惠券，尝试从本地存储获取
            const cachedCoupon = wx.getStorageSync('selectedCoupon')
            const cachedCouponAmount = wx.getStorageSync('couponAmount')
            const cachedPayAmount = wx.getStorageSync('payAmount')
            
            if (cachedCoupon) {
                console.log('从本地存储获取到缓存的优惠券:', cachedCoupon)
                let payAmount = parseFloat(cachedPayAmount) || parseFloat(this.data.totalAmount)
                
                // 如果金额为0，变成0.01
                if (payAmount === 0) {
                    payAmount = 0.01
                }
                
                this.setData({
                    selectedCoupon: cachedCoupon,
                    couponAmount: cachedCouponAmount || '0.00',
                    payAmount: payAmount.toFixed(2)
                })
            }
        }
    },

    /**
     * 检查缓存的优惠券数据
     */
    checkCachedCoupon() {
        const cachedCoupon = wx.getStorageSync('selectedCoupon')
        const cachedCouponAmount = wx.getStorageSync('couponAmount')
        const cachedPayAmount = wx.getStorageSync('payAmount')

        if (cachedCoupon) {
            console.log('从本地存储获取到缓存的优惠券:', cachedCoupon)
            let payAmount = parseFloat(cachedPayAmount) || parseFloat(this.data.totalAmount)
            
            // 如果金额为0，变成0.01
            if (payAmount === 0) {
                payAmount = 0.01
            }
            
            this.setData({
                selectedCoupon: cachedCoupon,
                couponAmount: cachedCouponAmount || '0.00',
                payAmount: payAmount.toFixed(2)
            })
        }
    },

    /**
     * 提交订单
     */
    submitOrder() {
        if (!this.data.address) {
            wx.showToast({
                title: '请选择收货地址',
                icon: 'none'
            })
            return
        }

        wx.showLoading({
            title: '提交中...'
        })

        // 构建订单数据
        const orderData = {
            address: this.data.address,
            products: this.data.orderProducts,
            coupon: this.data.selectedCoupon,
            remark: this.data.remark,
            totalAmount: this.data.totalAmount,
            couponAmount: this.data.couponAmount,
            payAmount: this.data.payAmount,
            diningType: this.data.diningType
        }

        // 调用提交订单API
        api.submitOrder(orderData).then(res => {
            wx.hideLoading()
            if (res.code === 0) {
                wx.showToast({
                    title: '订单提交成功',
                    icon: 'success'
                })
                
                // 清空购物车
                const app = getApp()
                app.globalData.cartItems = []
                app.globalData.cartCount = 0
                app.globalData.totalPrice = 0
                
                // 跳转到支付页面或订单详情页
                setTimeout(() => {
                    wx.redirectTo({
                        url: `/pages/pay-success/pay-success?orderId=${res.result.orderId}`
                    })
                }, 1500)
            } else {
                wx.showToast({
                    title: res.msg || '提交失败',
                    icon: 'none'
                })
            }
        })
    },
}) 