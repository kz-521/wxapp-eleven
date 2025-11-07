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
        pickupNumber: '', // 取茶号
        estimatedTime: '6', // 预计时间（分钟）
        storePhone: '1342137123', // 店铺电话
        // 模拟状态控制
        isMockMode: true, // 是否为模拟模式
        mockStatus: 'pending' // 模拟状态
    },

    onLoad(options) {
        console.log('订单详情页面加载')
        console.log('页面参数:', options)
        console.log('初始数据状态:', this.data)

        // 统一通过 URL 参数或全局变量获取订单ID
        const app = getApp()
        const orderId = options.orderId || app.globalData.lastOrderId

        if (orderId) {
            console.log('获取到订单ID:', orderId, '来源:', options.orderId ? '页面参数' : '全局变量')
            this.setData({ orderId })
            this.getOrderDetail(orderId)
        } else {
            console.log('未获取到订单ID，使用模拟订单数据')
            this.setMockOrderData()
        }

        // 获取门店距离
        this.getStoreDistance()

        // 测试图片路径
        console.log('测试图片路径:')
        console.log('noordered.png:', '/imgs/noordered.png')
        console.log('nomaking.png:', '/imgs/nomaking.png')
        console.log('noready.png:', '/imgs/noready.png')
    },

    onShow() {
        // 页面显示时的逻辑
    },

    onUnload() {
        // 页面卸载时清理全局变量的订单ID
        const app = getApp()
        app.globalData.lastOrderId = null
        console.log('页面卸载，已清理全局变量的订单ID')
    },

    /**
     * 获取订单详情
     */
    getOrderDetail(orderId) {
        wx.showLoading({
            title: '加载中...'
        })

        // 调用获取订单详情API（兼容 result 或 result.data 为对象/数组）
        api.getOrderDetail(orderId).then(res => {
            wx.hideLoading()
            console.log('订单详情响应:', res)

            if (res && res.code === 0) {
                const payload = res.result || {}
                const data = Array.isArray(payload?.data) ? payload.data : (Array.isArray(payload) ? payload : payload)

                let orderInfo = null

                if (Array.isArray(data)) {
                    orderInfo = data.find(item => (item && (item.id == orderId || item.order_id == orderId))) || data[0]
                } else if (data && typeof data === 'object') {
                    orderInfo = data
                }

                if (orderInfo) {
                    console.log('解析得到的订单详情:', orderInfo)
                    this.setOrderDetailData(orderInfo)
                } else {
                    console.warn('未解析到订单详情，使用模拟数据')
                    this.setMockOrderData()
                }
            } else {
                console.log('API返回错误或数据为空:', res)
                wx.showToast({
                    title: (res && res.msg) || '获取订单详情失败',
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
        
        // 获取最后4位，不足4位在前面补0
        const last4Digits = orderIdStr.slice(-4)
        const pickupNumber = last4Digits.padStart(4, '0')
        
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
     * 规范化订单商品列表
     * 根据实际API返回结构处理数据
     */
    normalizeOrderProducts(orderInfo) {
        if (!orderInfo || typeof orderInfo !== 'object') {
            console.warn('订单信息为空或格式错误')
            return []
        }

        console.log('处理订单商品数据:', orderInfo)

        // 检查是否有snap_items.skus（新的数据结构）
        if (orderInfo.snap_items && orderInfo.snap_items.skus && Array.isArray(orderInfo.snap_items.skus)) {
            console.log('使用snap_items.skus数据结构')
            return this.formatOrderSkusData(orderInfo.snap_items.skus)
        }

        // 检查是否直接有skus字段
        if (orderInfo.skus && Array.isArray(orderInfo.skus)) {
            console.log('使用直接skus数据结构')
            return this.formatOrderSkusData(orderInfo.skus)
        }

        // 兼容其他可能的数据结构
        const candidates = [
            orderInfo.snap_items,
            orderInfo.items,
            orderInfo.order_items,
            orderInfo.orderItemList,
            orderInfo.products
        ]

        const rawList = candidates.find(arr => Array.isArray(arr))

        if (rawList && rawList.length > 0) {
            console.log('使用兼容数据结构:', rawList)
            return this.formatLegacyOrderData(rawList, orderInfo)
        }

        // 如果都没有找到，创建一个汇总商品
        console.warn('未找到商品数据，使用汇总信息')
        return this.createSummaryProduct(orderInfo)
    },

    /**
     * 格式化订单SKU数据
     */
    formatOrderSkusData(skus) {
        if (!Array.isArray(skus) || skus.length === 0) {
            return []
        }

        return skus.map(sku => {
            console.log('处理SKU数据:', sku)

            // 处理规格信息
            let specsText = ''
            if (sku.specs && Array.isArray(sku.specs) && sku.specs.length > 0) {
                specsText = sku.specs.map(spec => `${spec.key}:${spec.value}`).join('、')
            }

            // 处理订单选项（口味选择）
            let orderOptionsText = ''
            if (sku.order_options && Array.isArray(sku.order_options) && sku.order_options.length > 0) {
                orderOptionsText = sku.order_options.map(option => {
                    const extraPrice = parseFloat(option.extra_price || 0)
                    return extraPrice > 0 
                        ? `${option.option_name}:${option.value}(+¥${extraPrice.toFixed(2)})`
                        : `${option.option_name}:${option.value}`
                }).join('、')
            }

            // 组合完整规格描述
            const specsParts = [specsText, orderOptionsText].filter(Boolean)
            const fullSpecsText = specsParts.length > 0 ? specsParts.join('、') : '默认规格'

            // 处理图片URL
            let imageUrl = sku.img || ''
            if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
                imageUrl = 'https://qn.jixiangjiaoyu.com' + (imageUrl.startsWith('/') ? '' : '/') + imageUrl
            } else if (imageUrl && imageUrl.startsWith('/')) {
                imageUrl = 'https://qn.jixiangjiaoyu.com' + imageUrl
            }

            return {
                id: sku.id,
                name: sku.title || '商品',
                image: imageUrl || '/imgs/home/drink-item.png',
                count: parseInt(sku.count) || 1,
                price: parseFloat(sku.final_price || sku.price || 0).toFixed(2),
                totalPrice: parseFloat(sku.total_price || (sku.final_price || sku.price || 0) * sku.count || 0).toFixed(2),
                fullSpecsText: fullSpecsText,
                specsText: specsText,
                orderOptionsText: orderOptionsText,
                specs: sku.specs || [],
                orderOptions: sku.order_options || []
            }
        })
    },

    /**
     * 格式化旧版订单数据（兼容处理）
     */
    formatLegacyOrderData(items, orderInfo) {
        const fallbackImage = orderInfo.snap_img || '/imgs/home/drink-item.png'
        
        return items.map(item => {
            const id = item.id || item.sku_id || item.product_id || 'unknown'
            const name = item.title || item.name || item.product_name || orderInfo.snap_title || '商品'
            const image = item.img || item.image || item.pic || fallbackImage
            const count = parseInt(item.count || item.quantity || 1)
            const unitPrice = item.final_price || item.price || (item.total_price && count ? (parseFloat(item.total_price) / count) : 0)
            const price = parseFloat(unitPrice).toFixed(2)
            const totalPrice = parseFloat(item.total_price || (unitPrice * count)).toFixed(2)
            const specs = item.specs || item.specification || item.options || '默认规格'

            return {
                id,
                name,
                image,
                count,
                price,
                totalPrice,
                fullSpecsText: typeof specs === 'string' ? specs : '默认规格',
                specsText: typeof specs === 'string' ? specs : '',
                orderOptionsText: '',
                specs: specs,
                orderOptions: []
            }
        })
    },

    /**
     * 创建汇总商品（当无法找到具体商品数据时）
     */
    createSummaryProduct(orderInfo) {
        const totalCount = parseInt(orderInfo.total_count) || 0
        const totalPrice = parseFloat(orderInfo.total_price) || 0

        if (totalCount <= 0) {
            return []
        }

        return [{
            id: orderInfo.id || orderInfo.order_id || 'unknown',
            name: orderInfo.snap_title || '商品',
            image: orderInfo.snap_img || '/imgs/home/drink-item.png',
            count: totalCount,
            price: (totalPrice / totalCount).toFixed(2),
            totalPrice: totalPrice.toFixed(2),
            fullSpecsText: '默认规格',
            specsText: '',
            orderOptionsText: '',
            specs: [],
            orderOptions: []
        }]
    },

    /**
     * 设置订单详情数据
     */
    setOrderDetailData(orderInfo) {
        console.log('设置订单详情数据:', orderInfo)
        
        // 处理商品列表（兼容多种返回格式）
        const orderProducts = this.normalizeOrderProducts(orderInfo)
        
        // 获取订单状态
        const orderStatus = this.getOrderStatus(orderInfo.status)
        const orderStatusText = this.getOrderStatusText(orderInfo.status)
        
        // 格式化时间
        const createTime = this.formatTime(orderInfo.create_time || orderInfo.placed_time || orderInfo.createTime || '')
        const payTime = this.formatTime(orderInfo.paid_time || orderInfo.payTime || '')
        
        // 生成取茶号 - 优先使用全局变量中的订单ID
        let pickupNumber = '0000'
        const app = getApp()
        const globalOrderId = app.globalData.lastOrderId
        
        if (orderInfo.pickupNumber) {
            // 如果订单数据中有取茶号，直接使用
            pickupNumber = orderInfo.pickupNumber
        } else if (globalOrderId) {
            // 优先使用全局变量中的订单ID生成取茶号
            pickupNumber = this.generatePickupNumber(globalOrderId)
        } else if (orderInfo.id) {
            // 使用订单数据中的ID生成取茶号
            pickupNumber = this.generatePickupNumber(orderInfo.id)
        } else if (this.data.orderId) {
            // 使用页面参数中的订单ID生成取茶号
            pickupNumber = this.generatePickupNumber(this.data.orderId)
        }
        
        console.log('取茶号生成过程:', {
            orderInfoPickupNumber: orderInfo.pickupNumber,
            globalOrderId: globalOrderId,
            orderInfoId: orderInfo.id,
            pageOrderId: this.data.orderId,
            finalPickupNumber: pickupNumber
        })
        
        this.setData({
            orderInfo: orderInfo,
            orderProducts: orderProducts,
            totalAmount: orderInfo.total_price || orderInfo.totalAmount || '0.00',
            orderStatus: orderStatus,
            orderStatusText: orderStatusText,
            createTime: createTime,
            payTime: payTime,
            remark: orderInfo.remark || '无备注',
            pickupNumber: pickupNumber, // 使用生成的取茶号
            estimatedTime: orderInfo.estimatedTime || '6', // 预计时间（分钟）
            storePhone: orderInfo.storePhone || '1342137123', // 店铺电话
            // 如果是模拟模式，设置初始模拟状态
            mockStatus: this.data.isMockMode ? orderStatus : this.data.mockStatus
        })
        
        console.log('订单详情数据设置完成，取茶号:', pickupNumber)
        
        console.log('订单详情数据设置完成:', {
            orderProducts: orderProducts.length,
            totalAmount: orderInfo.total_price || orderInfo.totalAmount,
            orderStatus: orderStatus,
            orderStatusText: orderStatusText,
            createTime: createTime
        })
    },

    /**
     * 设置模拟订单数据
     */
    setMockOrderData() {
        console.log('设置模拟订单数据')
        
        const mockId = 'mock_' + Date.now()
        const mockOrderData = {
            id: mockId,
            order_no: 'MO' + Math.floor(Math.random() * 1000000),
            total_price: '32.00',
            total_count: 1,
            status: 1, // 默认状态
            create_time: this.formatTime(new Date()), // 使用格式化时间
            remark: '模拟订单数据',
            pickupNumber: this.generatePickupNumber(mockId), // 生成模拟取茶号
            snap_items: [
                {
                    id: 1,
                    title: '佛手映月',
                    img: 'https://qn.jixiangjiaoyu.com/2025/8/6d6421a35c54686e3614123366bf0bb941754456860367.png',
                    count: 1,
                    final_price: '32.00',
                    total_price: '32.00',
                    specs: '大、热、不额外加糖、脱脂牛奶'
                }
            ]
        }
        
        this.setOrderDetailData(mockOrderData)
    },

    /**
     * 获取订单状态
     */
    getOrderStatus(status) {
        const statusMap = {
            1: 'pending',    // 未支付/待支付
            2: 'paid',       // 已支付
            3: 'preparing',  // 制作中
            4: 'ready',      // 待取茶
            5: 'completed',  // 已完成
            6: 'cancelled'   // 已取消
        }
        return statusMap[status] || 'pending'
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
        return statusMap[status] || '待支付'
    },

    /**
     * 切换模拟模式
     */
    toggleMockMode() {
        const newMockMode = !this.data.isMockMode
        this.setData({
            isMockMode: newMockMode
        })
        
        wx.showToast({
            title: newMockMode ? '已开启模拟模式' : '已关闭模拟模式',
            icon: 'success'
        })
    },

    /**
     * 设置模拟状态
     */
    setMockStatus(status) {
        console.log('设置模拟状态:', status)
        const orderStatusText = this.getOrderStatusText(status)
        
        this.setData({
            mockStatus: status,
            orderStatus: status,
            orderStatusText: orderStatusText
        })
        
        wx.showToast({
            title: `已切换到${orderStatusText}状态`,
            icon: 'success'
        })
    },

    /**
     * 切换到未下单状态
     */
    switchToPending() {
        this.setMockStatus('pending')
    },

    /**
     * 切换到已下单状态
     */
    switchToPaid() {
        this.setMockStatus('paid')
    },

    /**
     * 切换到制作中状态
     */
    switchToPreparing() {
        this.setMockStatus('preparing')
    },

    /**
     * 切换到待取茶状态
     */
    switchToReady() {
        this.setMockStatus('ready')
    },

    /**
     * 切换到已完成状态
     */
    switchToCompleted() {
        this.setMockStatus('completed')
    },

    /**
     * 切换到已取消状态
     */
    switchToCancelled() {
        this.setMockStatus('cancelled')
    },

    /**
     * 获取状态对应的图片
     */
    getStatusImage(status) {
        // 使用传入的状态参数，如果没有则使用当前订单状态
        const currentStatus = status || this.data.orderStatus
        
        const imageMap = {
            'pending': '/imgs/noordered.png',    // 未下单
            'paid': '/imgs/ordered.png',         // 已下单
            'preparing': '/imgs/nomaking.png',   // 制作中
            'ready': '/imgs/noready.png',        // 待取茶
            'completed': '/imgs/noready.png',    // 已完成
            'cancelled': '/imgs/noordered.png'   // 已取消
        }
        
        const imagePath = imageMap[currentStatus] || '/imgs/noordered.png'
        console.log('状态图片路径:', currentStatus, imagePath)
        return imagePath
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
                            
                            // 支付成功后清空购物车（全局与本地缓存）
                            const app = getApp()
                            app.globalData.cartItems = []
                            app.globalData.cartCount = 0
                            app.globalData.totalPrice = 0
                            wx.setStorageSync('cartItems', [])

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
