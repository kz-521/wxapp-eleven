// pages/order-detail/order-detail.js
const { api } = require('../../utils/api.js')

Page({
    data: {
        orderId: '',
        orderInfo: null,
        orderProducts: [],
        selectedCoupon: null,
        remark: '',
        totalAmount: 0,
        couponAmount: 0,
        payAmount: 0,
        diningType: 'dine-in',
        storeLocation: {
          latitude: 30.3972,
          longitude: 120.0183,
          name: '清汀.新养生空间',
          address: '浙江省杭州市余杭区瓶窑镇南山村横山60号1幢1楼106室'
        },
        distance: '',
        orderStatus: 'pending', // 订单状态：pending(待支付), paid(已支付), completed(已完成), cancelled(已取消)
        orderStatusText: '待支付',
        createTime: '',
        payTime: '',
        completeTime: ''
    },

    onLoad(options) {
        console.log('订单详情页面加载')
        
        // 获取订单ID
        if (options.orderId) {
            this.setData({
                orderId: options.orderId
            })
            // 获取订单详情
            this.getOrderDetail(options.orderId)
        } else {
            wx.showToast({
                title: '订单ID不存在',
                icon: 'none'
            })
            setTimeout(() => {
                wx.navigateBack()
            }, 1500)
        }
        
        // 获取门店距离
        this.getStoreDistance()
    },

    onShow() {
        // 页面显示时的逻辑
    },

    /**
     * 获取订单详情
     */
    getOrderDetail(orderId) {
        wx.showLoading({
            title: '加载中...'
        })

        // 调用获取订单详情API
        api.getOrderDetail(orderId).then(res => {
            wx.hideLoading()
            console.log('订单详情响应:', res)
            
            if (res.code === 0 && res.result) {
                const orderInfo = res.result
                this.setOrderDetailData(orderInfo)
            } else {
                wx.showToast({
                    title: res.msg || '获取订单详情失败',
                    icon: 'none'
                })
            }
        }).catch(err => {
            wx.hideLoading()
            console.error('获取订单详情失败:', err)
            wx.showToast({
                title: '获取订单详情失败',
                icon: 'none'
            })
            
            // 如果API调用失败，使用模拟数据
            this.setMockOrderData()
        })
    },

    /**
     * 设置订单详情数据
     */
    setOrderDetailData(orderInfo) {
        console.log('设置订单详情数据:', orderInfo)
        
        // 处理订单商品数据
        const orderProducts = orderInfo.products || orderInfo.sku_list || []
        
        // 计算总金额
        const totalAmount = orderProducts.reduce((total, item) => {
            const itemPrice = parseFloat(item.price) || parseFloat(item.sku_price) || 0
            const count = parseInt(item.count) || 1
            return total + (itemPrice * count)
        }, 0)

        // 设置页面数据
        this.setData({
            orderInfo: orderInfo,
            orderProducts: orderProducts,
            totalAmount: totalAmount.toFixed(2),
            payAmount: parseFloat(orderInfo.pay_amount || totalAmount).toFixed(2),
            couponAmount: parseFloat(orderInfo.coupon_amount || 0).toFixed(2),
            remark: orderInfo.remark || '',
            diningType: orderInfo.dining_type || 'dine-in',
            orderStatus: orderInfo.status || 'pending',
            orderStatusText: this.getOrderStatusText(orderInfo.status),
            createTime: orderInfo.create_time || '',
            payTime: orderInfo.pay_time || '',
            completeTime: orderInfo.complete_time || ''
        })

        // 如果有优惠券信息，设置优惠券数据
        if (orderInfo.coupon) {
            this.setData({
                selectedCoupon: orderInfo.coupon
            })
        }
    },

    /**
     * 设置模拟订单数据（用于测试）
     */
    setMockOrderData() {
        console.log('使用模拟订单数据')
        
        const mockOrderInfo = {
            order_id: this.data.orderId,
            status: 'pending',
            create_time: '2024-01-15 14:30:00',
            pay_time: '',
            complete_time: '',
            dining_type: 'dine-in',
            remark: '少糖，谢谢',
            total_amount: 68.00,
            coupon_amount: 10.00,
            pay_amount: 58.00,
            products: [
                {
                    id: '1',
                    name: '清汀养生茶',
                    price: 28.00,
                    count: 2,
                    image: '/imgs/home/drink-item.png',
                    tags: ['养生', '推荐']
                },
                {
                    id: '2',
                    name: '桂花乌龙茶',
                    price: 32.00,
                    count: 1,
                    image: '/imgs/home/drink-item.png',
                    tags: ['清香', '热销']
                }
            ],
            coupon: {
                id: 1,
                name: '满50减10券',
                amount: 10,
                type: 1
            }
        }

        this.setOrderDetailData(mockOrderInfo)
    },

    /**
     * 获取订单状态文本
     */
    getOrderStatusText(status) {
        const statusMap = {
            'pending': '待支付',
            'paid': '已支付',
            'preparing': '制作中',
            'ready': '待取茶',
            'completed': '已完成',
            'cancelled': '已取消'
        }
        return statusMap[status] || '未知状态'
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
     * 继续支付
     */
    continuePay() {
        if (this.data.orderStatus !== 'pending') {
            wx.showToast({
                title: '订单状态不允许支付',
                icon: 'none'
            })
            return
        }

        wx.showLoading({
            title: '支付中...'
        })

        // 调用支付接口
        api.payPreorder(this.data.orderId).then(res => {
            wx.hideLoading()
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
                            
                            // 刷新订单详情
                            setTimeout(() => {
                                this.getOrderDetail(this.data.orderId)
                            }, 2000)
                        }
                    },
                    'fail': (res) => {
                        console.info("支付失败:", res)
                        let error = res.errMsg.split(':')[1]
                        if (error !== "fail cancel") {
                            wx.showToast({
                                title: error,
                                icon: 'none',
                                duration: 2000
                            })
                        } else {
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
            wx.hideLoading()
            console.error('支付接口调用失败:', err)
            wx.showToast({
                title: '支付接口调用失败',
                icon: 'none'
            })
        })
    },

    /**
     * 取消订单
     */
    cancelOrder() {
        wx.showModal({
            title: '确认取消',
            content: '确定要取消这个订单吗？',
            success: (res) => {
                if (res.confirm) {
                    wx.showLoading({
                        title: '取消中...'
                    })

                    // 调用取消订单API
                    api.cancelOrder(this.data.orderId).then(res => {
                        wx.hideLoading()
                        console.log('取消订单响应:', res)
                        
                        if (res.code === 0) {
                            wx.showToast({
                                title: '订单已取消',
                                icon: 'success'
                            })
                            
                            // 刷新订单详情
                            setTimeout(() => {
                                this.getOrderDetail(this.data.orderId)
                            }, 1500)
                        } else {
                            wx.showToast({
                                title: res.msg || '取消订单失败',
                                icon: 'none'
                            })
                        }
                    }).catch(err => {
                        wx.hideLoading()
                        console.error('取消订单失败:', err)
                        wx.showToast({
                            title: '取消订单失败',
                            icon: 'none'
                        })
                    })
                }
            }
        })
    },

    /**
     * 确认取茶
     */
    confirmPickup() {
        wx.showModal({
            title: '确认取茶',
            content: '确认已取到茶品吗？',
            success: (res) => {
                if (res.confirm) {
                    wx.showLoading({
                        title: '确认中...'
                    })

                    // 调用确认取茶API
                    api.confirmPickup(this.data.orderId).then(res => {
                        wx.hideLoading()
                        console.log('确认取茶响应:', res)
                        
                        if (res.code === 0) {
                            wx.showToast({
                                title: '取茶成功',
                                icon: 'success'
                            })
                            
                            // 刷新订单详情
                            setTimeout(() => {
                                this.getOrderDetail(this.data.orderId)
                            }, 1500)
                        } else {
                            wx.showToast({
                                title: res.msg || '确认取茶失败',
                                icon: 'none'
                            })
                        }
                    }).catch(err => {
                        wx.hideLoading()
                        console.error('确认取茶失败:', err)
                        wx.showToast({
                            title: '确认取茶失败',
                            icon: 'none'
                        })
                    })
                }
            }
        })
    },

    /**
     * 重新下单
     */
    reorder() {
        wx.showModal({
            title: '重新下单',
            content: '是否要重新下单相同的商品？',
            success: (res) => {
                if (res.confirm) {
                    // 将订单商品添加到购物车
                    const app = getApp()
                    let cartItems = app.globalData.cartItems || []
                    
                    this.data.orderProducts.forEach(product => {
                        const existingItemIndex = cartItems.findIndex(item => item.id === product.id)
                        
                        if (existingItemIndex >= 0) {
                            cartItems[existingItemIndex].count += parseInt(product.count)
                        } else {
                            cartItems.unshift({
                                id: product.id,
                                name: product.name,
                                image: product.image,
                                count: parseInt(product.count),
                                price: parseFloat(product.price),
                                tags: product.tags || []
                            })
                        }
                    })
                    
                    // 更新购物车数据
                    app.globalData.cartItems = cartItems
                    app.globalData.cartCount = cartItems.reduce((total, item) => total + item.count, 0)
                    app.globalData.totalPrice = cartItems.reduce((total, item) => total + (parseFloat(item.price) * item.count), 0)
                    
                    wx.setStorageSync('cartItems', cartItems)
                    
                    wx.showToast({
                        title: '已添加到购物车',
                        icon: 'success'
                    })
                    
                    // 跳转到分类页面
                    setTimeout(() => {
                        wx.switchTab({
                            url: '/pages/category/category'
                        })
                    }, 1500)
                }
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
    }
})
