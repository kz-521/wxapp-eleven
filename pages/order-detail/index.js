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
        orderStatus: 'pending', // 订单状态：pending(待支付), paid(已支付), preparing(制作中), ready(待取茶), completed(已完成), cancelled(已取消)
        orderStatusText: '待支付',
        createTime: '',
        payTime: '',
        completeTime: '',
        pickupNumber: '8195', // 取茶号
        estimatedTime: '6', // 预计时间（分钟）
        storePhone: '1342137123' // 店铺电话
    },

    onLoad(options) {
        console.log('订单详情页面加载')
        console.log('页面参数:', options)
        
        // 通过eventChannel接收从订单提交页面传递的订单数据
        try {
            const eventChannel = this.getOpenerEventChannel()
            if (eventChannel && typeof eventChannel.on === 'function') {
                console.log('找到eventChannel，等待接收订单数据')
                eventChannel.on('orderData', (orderData) => {
                    console.log('接收到订单数据:', orderData)
                    console.log('订单商品数量:', orderData.products ? orderData.products.length : 0)
                    console.log('订单总金额:', orderData.totalAmount)
                    console.log('创建时间:', orderData.createTime)
                    this.setOrderDetailData(orderData)
                })
            } else {
                console.log('没有找到eventChannel或eventChannel.on不是函数')
            }
        } catch (error) {
            console.error('eventChannel错误:', error)
        }
        
        // 获取订单ID
        if (options.orderId) {
            console.log('通过orderId获取订单详情:', options.orderId)
            this.setData({
                orderId: options.orderId
            })
            // 获取订单详情
            this.getOrderDetail(options.orderId)
        } else {
            // 如果没有orderId，使用模拟数据
            console.log('使用模拟订单数据')
            this.setMockOrderData()
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
        
        // 处理订单商品数据 - 支持两种数据格式
        let orderProducts = []
        if (orderInfo.products && Array.isArray(orderInfo.products)) {
            // 从订单提交页面传递的数据格式
            orderProducts = orderInfo.products
            console.log('处理从订单提交页面传递的商品数据:', orderProducts)
        } else if (orderInfo.sku_list && Array.isArray(orderInfo.sku_list)) {
            // 从API返回的数据格式
            orderProducts = orderInfo.sku_list
            console.log('处理从API返回的商品数据:', orderProducts)
        } else {
            orderProducts = []
            console.log('没有找到商品数据')
        }
        
        // 计算总金额
        const totalAmount = orderProducts.reduce((total, item) => {
            const itemPrice = parseFloat(item.price) || parseFloat(item.sku_price) || 0
            const count = parseInt(item.count) || 1
            const itemTotal = itemPrice * count
            console.log('商品价格计算:', {
                name: item.name,
                price: itemPrice,
                count: count,
                total: itemTotal
            })
            return total + itemTotal
        }, 0)

        console.log('计算的总金额:', totalAmount)

        // 设置页面数据
        const pageData = {
            orderInfo: orderInfo,
            orderProducts: orderProducts,
            totalAmount: parseFloat(orderInfo.totalAmount || totalAmount).toFixed(2),
            payAmount: parseFloat(orderInfo.payAmount || totalAmount).toFixed(2),
            couponAmount: parseFloat(orderInfo.couponAmount || 0).toFixed(2),
            remark: orderInfo.remark || '',
            diningType: orderInfo.diningType || 'dine-in',
            orderStatus: orderInfo.status || 'pending',
            orderStatusText: this.getOrderStatusText(orderInfo.status || 'pending'),
            createTime: orderInfo.createTime || orderInfo.create_time || '',
            payTime: orderInfo.payTime || orderInfo.pay_time || '',
            completeTime: orderInfo.completeTime || orderInfo.complete_time || '',
            pickupNumber: orderInfo.pickupNumber || orderInfo.pickup_number || '8195',
            estimatedTime: orderInfo.estimatedTime || orderInfo.estimated_time || '6',
            storePhone: orderInfo.storePhone || orderInfo.store_phone || '1342137123'
        }

        console.log('设置的页面数据:', pageData)

        this.setData(pageData, () => {
            console.log('数据设置完成，当前页面数据:')
            console.log('orderProducts:', this.data.orderProducts)
            console.log('createTime:', this.data.createTime)
            console.log('remark:', this.data.remark)
            console.log('totalAmount:', this.data.totalAmount)
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
            order_id: this.data.orderId || 'TEST001',
            status: 'preparing',
            create_time: new Date().toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            }).replace(/\//g, '/'),
            pay_time: new Date().toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            }).replace(/\//g, '/'),
            complete_time: '',
            dining_type: 'dine-in',
            remark: '少糖，谢谢',
            total_amount: 68.00,
            coupon_amount: 10.00,
            pay_amount: 58.00,
            pickup_number: '8195',
            estimated_time: '6',
            store_phone: '1342137123',
            products: [
                {
                    id: '1',
                    name: '清汀养生茶',
                    price: 28.00,
                    count: 2,
                    image: '/imgs/home/drink-item.png',
                    tags: ['养生', '推荐'],
                    specs: '大、热、不额外加糖、脱脂牛奶'
                },
                {
                    id: '2',
                    name: '桂花乌龙茶',
                    price: 32.00,
                    count: 1,
                    image: '/imgs/home/drink-item.png',
                    tags: ['清香', '热销'],
                    specs: '中、温、微糖、全脂牛奶'
                }
            ],
            coupon: {
                id: 1,
                name: '满50减10券',
                amount: 10,
                type: 1
            }
        }

        console.log('模拟订单数据:', mockOrderInfo)
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
     * 获取状态对应的图片
     */
    getStatusImage(status) {
        const imageMap = {
            'pending': '/imgs/order/ordered.png',
            'paid': '/imgs/order/ordered.png',
            'preparing': '/imgs/order/making.png',
            'ready': '/imgs/order/ready.png',
            'completed': '/imgs/order/ready.png'
        }
        return imageMap[status] || '/imgs/order/ordered.png'
    },

    /**
     * 获取状态对应的样式类
     */
    getStatusClass(status) {
        const classMap = {
            'pending': 'status-active',
            'paid': 'status-active',
            'preparing': 'status-active',
            'ready': 'status-active',
            'completed': 'status-active',
            'cancelled': 'status-inactive'
        }
        return classMap[status] || 'status-inactive'
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
