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
        // 获取购物车数据
        this.loadCartData()
        // 获取默认地址
        this.getDefaultAddress()
    },

    /**
     * 加载购物车数据
     */
    loadCartData() {
        const cartItems = wx.getStorageSync('cartItems') || []
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

        this.setData({
            orderProducts: cartItems,
            totalAmount: totalAmount.toFixed(2),
            payAmount: totalAmount.toFixed(2)
        })
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
     * 备注输入
     */
    onRemarkInput(e) {
        this.setData({
            remark: e.detail.value
        })
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
                wx.setStorageSync('cartItems', [])
                
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