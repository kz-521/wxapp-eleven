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
        
        // 测试优惠券逻辑
        setTimeout(() => {
            this.testCouponLogic()
        }, 1000)
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
     * 测试优惠券逻辑
     */
    testCouponLogic() {
        console.log('=== 测试优惠券逻辑 ===')
        console.log('当前订单总金额:', this.data.totalAmount)
        
        // 测试满减优惠券
        const testCoupon1 = {
            id: 1,
            name: '测试满减券',
            amount: 10,
            full_money: 50,
            type: 1
        }
        
        console.log('测试满减券:', testCoupon1)
        const result1 = this.calculateCouponDiscount(testCoupon1)
        console.log('满减券结果:', result1)
        
        // 测试折扣优惠券
        const testCoupon2 = {
            id: 2,
            name: '测试折扣券',
            rate: 0.85,
            type: 2
        }
        
        console.log('测试折扣券:', testCoupon2)
        const result2 = this.calculateCouponDiscount(testCoupon2)
        console.log('折扣券结果:', result2)
        
        // 测试另一个折扣券
        const testCoupon3 = {
            id: 3,
            name: '测试9折券',
            rate: 0.9,
            type: 2
        }
        
        console.log('测试9折券:', testCoupon3)
        const result3 = this.calculateCouponDiscount(testCoupon3)
        console.log('9折券结果:', result3)
        
        // 测试3折券（模拟您遇到的问题）
        const testCoupon4 = {
            id: 4,
            name: '测试3折券',
            rate: 3, // 错误的数据：应该是0.3
            type: 2
        }
        
        console.log('测试3折券（错误数据）:', testCoupon4)
        const result4 = this.calculateCouponDiscount(testCoupon4)
        console.log('3折券结果（错误数据）:', result4)
        
        // 测试正确的3折券
        const testCoupon5 = {
            id: 5,
            name: '测试3折券',
            rate: 0.3, // 正确的数据
            type: 2
        }
        
        console.log('测试3折券（正确数据）:', testCoupon5)
        const result5 = this.calculateCouponDiscount(testCoupon5)
        console.log('3折券结果（正确数据）:', result5)
    },

    /**
     * 选择用餐类型
     */
    selectDiningType(e) {
        const type = e.currentTarget.dataset.type
        console.log('选择用餐类型:', type)
        this.setData({
            diningType: type
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
     * 提交订单并支付
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

        wx.showLoading({
            title: '提交中...'
        })

        // 构建sku_info_list参数 - 确保使用正确的SKU ID和数量
        const sku_info_list = this.data.orderProducts.map(item => {
            console.log('处理商品项:', item)
            
            // 优先使用SKU ID，这是订单接口需要的
            let skuId = null
            if (item.skuId) {
                skuId = item.skuId
            } else if (item.sku && item.sku.id) {
                skuId = item.sku.id
            } else {
                // fallback到商品ID（可能不准确，应该有SKU ID）
                skuId = item.id
                console.warn('商品缺少SKU ID，使用商品ID:', item)
            }
            
            return {
                id: skuId, // 这里应该是SKU ID，不是SPU ID
                count: parseInt(item.count) || 1
            }
        })
        
        console.log('构建的sku_info_list:', sku_info_list)
        
        // 构建完整的订单数据
        const orderData = {
            sku_info_list: sku_info_list,
            remark: this.data.remark || '', // 备注
            dining_type: this.data.diningType, // 用餐类型：dine-in(堂食) 或 take-out(外带)
            total_amount: parseFloat(this.data.totalAmount), // 商品总金额
            coupon_amount: parseFloat(this.data.couponAmount) || 0, // 优惠券优惠金额
            pay_amount: parseFloat(this.data.payAmount), // 实际支付金额
            coupon_id: this.data.selectedCoupon ? this.data.selectedCoupon.id : null // 优惠券ID
        }

        // 如果有地址信息，添加到订单数据中
        if (this.data.address) {
            orderData.address = {
                name: this.data.address.name,
                phone: this.data.address.phone,
                detail: this.data.address.detail,
                province: this.data.address.province,
                city: this.data.address.city,
                district: this.data.address.district
            }
        }

        console.log('完整的订单数据:', orderData)

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
                    title: res.msg || res.message || '订单提交失败',
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
        }
    },

    /**
     * 计算优惠券折扣
     */
    calculateCouponDiscount(coupon) {
        const originalAmount = parseFloat(this.data.totalAmount)
        
        console.log('=== 优惠券计算开始 ===')
        console.log('优惠券信息:', coupon)
        console.log('订单原价:', originalAmount)
        
        // 检查优惠券类型
        if (coupon.type === 1) {
            // 满减优惠券
            const fullMoney = parseFloat(coupon.full_money) || 0
            const discountAmount = parseFloat(coupon.amount) || 0
            
            // 检查是否满足满减条件
            if (originalAmount < fullMoney) {
                return {
                    success: false,
                    message: `满${fullMoney}元可用，当前订单${originalAmount}元`
                }
            }
            
            // 计算优惠后价格
            let payAmount = Math.max(0.01, originalAmount - discountAmount)
            
            return {
                success: true,
                couponAmount: discountAmount,
                payAmount: payAmount
            }
        } else if (coupon.type === 2) {
            // 折扣优惠券
            const discountRate = parseFloat(coupon.rate) || 0
            
            console.log('折扣券计算详情:', {
                discountRate: discountRate,
                originalAmount: originalAmount,
                discountRateValid: discountRate > 0 && discountRate < 1
            })
            
            if (discountRate <= 0 || discountRate >= 1) {
                console.log('折扣券数据异常，折扣率:', discountRate)
                return {
                    success: false,
                    message: '折扣券数据异常'
                }
            }
            
            // 计算折扣金额
            const discountAmount = originalAmount * (1 - discountRate)
            let payAmount = Math.max(0.01, originalAmount - discountAmount)
            
            console.log('折扣券计算结果:', {
                discountAmount: discountAmount,
                payAmount: payAmount,
                discountPercentage: (1 - discountRate) * 100 + '%'
            })
            
            return {
                success: true,
                couponAmount: discountAmount,
                payAmount: payAmount
            }
        } else {
            // 默认满减逻辑（兼容旧数据）
            const couponAmount = parseFloat(coupon.amount) || 0
            let payAmount = Math.max(0.01, originalAmount - couponAmount)
            
            return {
                success: true,
                couponAmount: couponAmount,
                payAmount: payAmount
            }
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

    getStoreDistance() {
        const that = this
        wx.getLocation({
          type: 'gcj02',
          success(res) {
            const distance = that.getDistance(
              res.latitude, res.longitude,
              that.data.storeLocation.latitude, that.data.storeLocation.longitude
            )
            that.setData({ distance })
          },
          fail() {
            that.setData({ distance: '定位失败' })
          }
        })
    },
    Rad(d) {
      return d * Math.PI / 180.0
    },
    getDistance(lat1, lng1, lat2, lng2) {
      var radLat1 = this.Rad(lat1)
      var radLat2 = this.Rad(lat2)
      var a = radLat1 - radLat2
      var b = this.Rad(lng1) - this.Rad(lng2)
      var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) +
        Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)))
      s = s * 6378.137
      s = Math.round(s * 10000) / 10000
      s = s.toFixed(2) + '公里'
      return s
    },
}) 