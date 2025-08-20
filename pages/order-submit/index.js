// pages/order-submit/order-submit.js
const { api } = require('../../utils/api.js')
import { Location } from '../../utils/location.js'

Page({
    data: {
        address: null,
        orderProducts: [],
        selectedCoupon: null,
        remark: '',
        totalAmount: 0,
        couponAmount: 0,
        payAmount: 0,
        diningType: 'dine-in', // 默认选择堂食
        storeLocation: {
          latitude: 30.3972,
          longitude: 120.0183,
          name: '清汀.新养生空间',
          address: '浙江省杭州市余杭区瓶窑镇南山村横山60号1幢1楼106室'
        },
        distance: ''
    },

    onLoad(options) {
        console.log('订单提交页面加载')
        // 从globalData获取购物车数据
        this.loadCartDataFromGlobal()
        // 获取默认地址
        this.getDefaultAddress()
        // 检查是否有缓存的优惠券数据
        this.checkCachedCoupon()
        // 获取门店距离
        this.getStoreDistance()
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

        // 计算总金额 - 使用SKU价格计算
        const totalAmount = cartItems.reduce((total, item) => {
            let itemPrice = 0
            
            // 优先使用SKU价格
            if (item.sku && item.sku.price) {
                itemPrice = item.sku.discount_price || item.sku.price
            } 
            // 如果有skuPrice字段
            else if (item.skuPrice) {
                itemPrice = item.skuPrice
            }
            // fallback到商品price字段
            else {
                itemPrice = parseFloat(item.price) || 0
            }
            
            console.log('订单商品价格计算:', {
                name: item.name,
                count: item.count,
                itemPrice: itemPrice,
                total: itemPrice * item.count
            })
            
            return total + (itemPrice * item.count)
        }, 0)

        console.log('订单计算的总金额:', totalAmount)

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
        const app = getApp()
        const defaultAddress = app.globalData.defaultAddress
        
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
            url: '/pages/address-select/index'
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
     * 测试优惠券逻辑
     */
    testCouponLogic() {
        console.log('=== 测试优惠券逻辑开始 ===')
        
        // 模拟优惠券数据
        const testCoupon = {
            id: 'test_coupon_001',
            name: '满30减5元',
            type: 'discount',
            discount_amount: 5,
            min_amount: 30,
            max_discount: 5
        }
        
        console.log('测试优惠券:', testCoupon)
        console.log('当前订单金额:', this.data.totalAmount)
        
        // 计算优惠
        const result = this.calculateCouponDiscount(testCoupon)
        console.log('优惠券计算结果:', result)
        
        if (result.success) {
            console.log('优惠券可用，应用优惠')
            this.setData({
                selectedCoupon: testCoupon,
                couponAmount: result.couponAmount.toFixed(2),
                payAmount: result.payAmount.toFixed(2)
            })
        } else {
            console.log('优惠券不可用:', result.message)
        }
        
        console.log('=== 测试优惠券逻辑结束 ===')
    },

    /**
     * 选择用餐类型
     */
    selectDiningType(e) {
        const type = e.currentTarget.dataset.type
        this.setData({
            diningType: type
        })
        console.log('选择用餐类型:', type)
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
     * 去结算
     */
    goToCheckout() {
        // 检查购物车数据
        if (!this.data.orderProducts || this.data.orderProducts.length === 0) {
            wx.showToast({
                title: '购物车为空',
                icon: 'none'
            })
            return
        }

        // 验证用餐类型
        if (!this.data.diningType) {
            wx.showToast({
                title: '请选择用餐类型',
                icon: 'none'
            })
            return
        }

        // 验证购物车商品数据格式
        const invalidItems = this.data.orderProducts.filter(item => !item.id || !item.count)
        if (invalidItems.length > 0) {
            console.error('购物车中存在无效商品数据:', invalidItems)
            wx.showToast({
                title: '商品数据异常，请重新添加',
                icon: 'none'
            })
            return
        }

        // 验证价格数据
        if (!this.data.totalAmount || parseFloat(this.data.totalAmount) <= 0) {
            wx.showToast({
                title: '订单金额异常',
                icon: 'none'
            })
            return
        }

        // 直接调用submitOrder方法
        this.submitOrder()
    },

    /**
     * 跳转到订单详情页的辅助方法
     */
    navigateToOrderDetail() {
        // 从全局变量获取最后提交的订单ID
        const app = getApp()
        const lastOrderId = app.globalData.lastOrderId

        // 统一通过 URL 参数跳转，避免依赖 eventChannel
        const url = lastOrderId
            ? `/pages/order-detail/index?orderId=${lastOrderId}`
            : '/pages/order-detail/index'

        setTimeout(() => {
            wx.navigateTo({ url })
        }, 2000)
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
                            wx.setStorageSync('cartItems', [])
                            
                            // 清除缓存的优惠券数据
                            wx.removeStorageSync('selectedCoupon')
                            wx.removeStorageSync('couponAmount')
                            wx.removeStorageSync('payAmount')
                            
                            setTimeout(() => {
                                wx.redirectTo({
                                    url: `/pages/order-detail/index?orderId=${orderId}`
                                })
                            }, 2000)
                        }
                    },
                    'fail': (res) => {
                        console.info("支付失败:", res)
                        // 支付失败大致分两种情况：
                        // 1.在支付界面，用户取消支付（errMsg为requestPayment:fail cancel）
                        // 2.在支付界面，用户点击支付但失败了（errMsg为requestPayment:fail (detail message)）
                        let error = res.errMsg.split(':')[1]
                        if (error !== "fail cancel") {
                            // 支付失败，显示错误信息
                            wx.showToast({
                                title: error,
                                icon: 'none',
                                duration: 2000
                            })
                        } else {
                            // 用户取消支付，静默处理
                            console.log("用户取消支付")
                        }
                    }
                })
            } else {
                console.error('支付接口返回错误:', res)
                wx.showToast({
                    title: res.msg || '支付接口调用失败',
                    icon: 'none',
                    duration: 2000
                })
                
                // 支付接口失败，跳转到订单详情页
                setTimeout(() => {
                    this.navigateToOrderDetail()
                }, 2000)
            }
        }).catch(err => {
            console.error('支付接口调用失败:', err)
            wx.showToast({
                title: '支付接口调用失败',
                icon: 'none',
                duration: 2000
            })
            
            // 支付接口调用失败，跳转到订单详情页
            setTimeout(() => {
                this.navigateToOrderDetail()
            }, 2000)
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
        
        console.log('=== 优惠券检查开始 ===')
        console.log('当前订单总金额:', this.data.totalAmount)
        console.log('globalData中的优惠券:', selectedCoupon)
        
        if (selectedCoupon) {
            console.log('检测到选中的优惠券:', selectedCoupon)
            
            // 计算优惠后的价格
            const result = this.calculateCouponDiscount(selectedCoupon)
            console.log('优惠券计算结果:', result)
            
            if (result.success) {
                this.setData({
                    selectedCoupon: selectedCoupon,
                    couponAmount: result.couponAmount.toFixed(2),
                    payAmount: result.payAmount.toFixed(2)
                })
                
                console.log('优惠券应用成功，设置数据:', {
                    couponAmount: result.couponAmount.toFixed(2),
                    payAmount: result.payAmount.toFixed(2)
                })
                
                // 缓存优惠券数据到本地存储，避免页面刷新后丢失
                wx.setStorageSync('selectedCoupon', selectedCoupon)
                wx.setStorageSync('couponAmount', result.couponAmount.toFixed(2))
                wx.setStorageSync('payAmount', result.payAmount.toFixed(2))
                
                // 清空globalData中的优惠券，避免重复使用
                app.globalData.selectedCoupon = null
            } else {
                // 优惠券不满足条件，清空选择
                wx.showToast({
                    title: result.message,
                    icon: 'none'
                })
                this.clearSelectedCoupon()
            }
        } else {
            // 如果没有从globalData获取到优惠券，尝试从本地存储获取
            const cachedCoupon = wx.getStorageSync('selectedCoupon')
            const cachedCouponAmount = wx.getStorageSync('couponAmount')
            const cachedPayAmount = wx.getStorageSync('payAmount')
            
            if (cachedCoupon) {
                console.log('从本地存储获取到缓存的优惠券:', cachedCoupon)
                
                // 重新验证优惠券是否仍然有效
                const result = this.calculateCouponDiscount(cachedCoupon)
                
                if (result.success) {
                    this.setData({
                        selectedCoupon: cachedCoupon,
                        couponAmount: cachedCouponAmount || '0.00',
                        payAmount: cachedPayAmount || this.data.totalAmount
                    })
                    
                    console.log('从缓存恢复优惠券数据:', {
                        couponAmount: cachedCouponAmount,
                        payAmount: cachedPayAmount
                    })
                } else {
                    // 优惠券不再有效，清空缓存
                    this.clearSelectedCoupon()
                }
            }
        }
        
        console.log('=== 优惠券检查结束 ===')
    },

    /**
     * 计算优惠券折扣
     */
    calculateCouponDiscount(coupon) {
        if (!coupon) {
            return {
                success: false,
                message: '优惠券数据无效'
            }
        }

        const orderAmount = parseFloat(this.data.totalAmount)
        
        // 检查优惠券类型和条件
        if (coupon.type === 'discount') {
            // 满减券
            if (coupon.min_amount && orderAmount < coupon.min_amount) {
                return {
                    success: false,
                    message: `订单金额不足${coupon.min_amount}元`
                }
            }
            
            const discountAmount = Math.min(coupon.discount_amount, orderAmount)
            const payAmount = orderAmount - discountAmount
            
            return {
                success: true,
                couponAmount: discountAmount,
                payAmount: payAmount
            }
        } else if (coupon.type === 'percentage') {
            // 折扣券
            if (coupon.min_amount && orderAmount < coupon.min_amount) {
                return {
                    success: false,
                    message: `订单金额不足${coupon.min_amount}元`
                }
            }
            
            const discountAmount = orderAmount * (1 - coupon.discount_rate / 100)
            const payAmount = Math.max(discountAmount, 0)
            
            return {
                success: true,
                couponAmount: orderAmount - payAmount,
                payAmount: payAmount
            }
        }
        
        return {
            success: false,
            message: '不支持的优惠券类型'
        }
    },

    /**
     * 清空选中的优惠券
     */
    clearSelectedCoupon() {
        this.setData({
            selectedCoupon: null,
            couponAmount: '0.00',
            payAmount: this.data.totalAmount
        })
        
        // 清空缓存
        wx.removeStorageSync('selectedCoupon')
        wx.removeStorageSync('couponAmount')
        wx.removeStorageSync('payAmount')
        
        // 清空globalData
        const app = getApp()
        app.globalData.selectedCoupon = null
    },

    /**
     * 检查缓存的优惠券数据
     */
    checkCachedCoupon() {
        const cachedCoupon = wx.getStorageSync('selectedCoupon')

        if (cachedCoupon) {
            console.log('从本地存储获取到缓存的优惠券:', cachedCoupon)
            
            // 重新验证优惠券是否仍然有效
            const result = this.calculateCouponDiscount(cachedCoupon)
            
            if (result.success) {
                this.setData({
                    selectedCoupon: cachedCoupon,
                    couponAmount: result.couponAmount.toFixed(2),
                    payAmount: result.payAmount.toFixed(2)
                })
                
                // 更新缓存
                wx.setStorageSync('couponAmount', result.couponAmount.toFixed(2))
                wx.setStorageSync('payAmount', result.payAmount.toFixed(2))
            } else {
                // 优惠券不再有效，清空缓存
                this.clearSelectedCoupon()
            }
        }
    },

    /**
     * 提交订单
     */
    submitOrder() {
        wx.showLoading({
            title: '提交中...'
        })

        // 格式化当前时间作为下单时间
        const now = new Date()
        const createTime = now.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).replace(/\//g, '/')

        console.log('生成的下单时间:', createTime)

        // 构建API期望的订单数据格式
        const apiOrderData = {
            sku_info_list: this.data.orderProducts.map(item => ({
                id: item.id,
                count: parseInt(item.count) || 1,
                order_options: item.order_options || [] // 添加口味选择数据
            })),
            remark: this.data.remark || '',
            dining_type: this.data.diningType,
            total_amount: parseFloat(this.data.totalAmount),
            coupon_amount: parseFloat(this.data.couponAmount) || 0,
            pay_amount: parseFloat(this.data.payAmount),
            coupon_id: this.data.selectedCoupon ? this.data.selectedCoupon.id : null
        }

        console.log('发送给API的订单数据:', apiOrderData)

        // 调用提交订单API
        api.submitOrder(apiOrderData).then(res => {
            wx.hideLoading()
            console.log('API响应:', res)
            
            if (res.code === 0) {
                wx.showToast({
                    title: '订单提交成功',
                    icon: 'success'
                })
                
                // 获取订单ID，用于支付
                const orderId = res.result?.id || res.result?.order_id
                
                if (orderId) {
                    console.log('订单提交成功，开始调用支付接口，订单ID:', orderId)
                    
                    // 存储order_id到全局变量，用于取茶号生成
                    const app = getApp()
                    app.globalData.lastOrderId = orderId
                    console.log('已存储订单ID到全局变量:', orderId)
                    
                    // 调用支付接口
                    this.callPayment(orderId)
                } else {
                    console.error('订单提交成功但未获取到订单ID:', res)
                    wx.showToast({
                        title: '订单提交成功，但支付失败',
                        icon: 'none'
                    })
                    
                    // 使用辅助方法跳转到订单详情页
                    this.navigateToOrderDetail()
                }
            } else {
                wx.showToast({
                    title: res.msg || '提交失败',
                    icon: 'none'
                })
            }
        }).catch(err => {
            wx.hideLoading()
            console.error('提交订单失败:', err)
            wx.showToast({
                title: '提交失败',
                icon: 'none'
            })
        })
    },

    /**
     * 生成取茶号
     * @param {string|number} orderId 订单ID
     * @returns {string} 取茶号（4位数字，不足补0）
     */
    generatePickupNumber(orderId) {
        if (!orderId) return '0000'
        
        // 将订单ID转换为字符串
        const orderIdStr = String(orderId)
        
        // 获取最后4位，不足4位在末尾补0
        const last4Digits = orderIdStr.slice(-4)
        const pickupNumber = last4Digits.padEnd(4, '0')
        
        console.log('生成取茶号:', { orderId, orderIdStr, last4Digits, pickupNumber })
        return pickupNumber
    },

    /**
     * 格式化时间
     * @param {string|Date} time 时间字符串或Date对象
     * @returns {string} 格式化后的时间字符串
     */
    formatTime(time) {
        if (!time) return ''
        
        try {
            let date
            if (typeof time === 'string') {
                // 如果是字符串，尝试解析
                date = new Date(time)
            } else if (time instanceof Date) {
                date = time
            } else {
                return String(time)
            }
            
            // 检查日期是否有效
            if (isNaN(date.getTime())) {
                return String(time)
            }
            
            // 格式化为 yyyy/mm/dd hh:mm:ss
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            const hours = String(date.getHours()).padStart(2, '0')
            const minutes = String(date.getMinutes()).padStart(2, '0')
            const seconds = String(date.getSeconds()).padStart(2, '0')
            
            return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`
        } catch (error) {
            console.error('时间格式化失败:', error, time)
            return String(time)
        }
    },

    /**
     * 获取门店距离
     */
    async getStoreDistance() {
        try {
            console.log('开始获取门店距离')
            
            // 先检查位置权限
            const permissionStatus = await Location.checkLocationPermission()
            
            if (permissionStatus.status === 'denied') {
                // 用户之前拒绝了权限，引导开启
                try {
                    await Location.requestLocationPermission()
                } catch (err) {
                    console.log('用户拒绝开启位置权限')
                    this.setData({ distance: '位置权限未开启' })
                    return
                }
            }
            
            // 获取位置并计算距离
            const result = await Location.getUserLocationAndDistance(this.data.storeLocation)
            
            this.setData({
                distance: result.distanceText
            })
            
            console.log('门店距离获取成功:', result.distanceText)
            
        } catch (error) {
            console.error('获取门店距离失败:', error)
            
            // 根据错误类型显示不同的提示
            if (error.errMsg && error.errMsg.includes('auth deny')) {
                this.setData({ distance: '位置权限被拒绝' })
            } else if (error.errMsg && error.errMsg.includes('timeout')) {
                this.setData({ distance: '定位超时' })
            } else {
                this.setData({ distance: '定位失败' })
            }
        }
    },
}) 