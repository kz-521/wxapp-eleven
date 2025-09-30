const { api } = require('../../utils/api.js')
import {User} from "../../models/user";

Page({
    data: {
        activeKey: 0, // 当前选中的tab，0=全部, 1=待取茶, 2=已完成, 3=已取消
        activeTab: 0, // 当前选中的tab索引
        orders: [], // 订单列表
        loading: false,
        page: 1,
        per_page: 10,
        hasMore: true,
        // 支付方式相关
        showPaymentModal: false, // 显示支付方式弹窗
        selectedPaymentMethod: 'wechat', // 默认选择微信支付
        paymentMethods: [
            {
                id: 'wechat',
                name: '微信支付',
                description: '使用微信快捷支付',
                icon: '/imgs/weixin.png',
                selected: true
            },
            {
                id: 'balance',
                name: '余额支付',
                description: '使用钱包余额支付',
                icon: '/imgs/balance.png',
                selected: false
            }
        ],
        currentOrderId: null, // 当前要支付的订单ID
        currentOrder: null // 当前要支付的订单信息
    },
    onLoad: async function (options) {
        console.log('订单列表页面加载，参数:', options)

        // 从参数中获取默认tab
        const activeKey = parseInt(options.key) || 0
        console.log('解析后的activeKey:', activeKey)

        // 确保activeTab值正确设置
        this.setData({
            activeKey: activeKey,
            activeTab: activeKey
        })
        console.log('设置页面状态:', { activeKey, activeTab: activeKey })

        // 验证activeTab设置
        setTimeout(() => {
            console.log('验证activeTab设置:', this.data.activeTab)
        }, 100)

        // 测试API调用（可选，用于调试）
        // await this.testOrderListAPI()

        await this.loadOrders(true)
    },

    onShow() {
        // 页面显示时重新加载数据，但避免重复加载
        if (!this.data.loading) {
            this.loadOrders(true)
        }
    },

    /**
     * 加载订单数据
     * @param {boolean} refresh 是否刷新数据
     */
    async loadOrders(refresh = false) {
        if (this.data.loading) return

        this.setData({ loading: true })

        try {
            // 如果是刷新，重置页码
            if (refresh) {
                this.setData({
                    orders: [],
                    page: 1,
                    hasMore: true
                })
            }

            // 根据activeKey确定状态参数
            const status = this.getStatusByActiveKey(this.data.activeKey)

            console.log('开始加载订单数据:', {
                page: this.data.page,
                status: status,
                statusType: typeof status,
                activeKey: this.data.activeKey,
                per_page: this.data.per_page
            })

            // 调用新的API接口
            const response = await api.getOrderList(status)
            console.log('订单API响应:', response)

            if (response.code === 0 && response.result && response.result.data) {
                console.log('API返回的订单数据:', response.result.data)
                console.log('订单数据长度:', response.result.data.length)

                // 检查第一个订单的数据结构
                if (response.result.data.length > 0) {
                    const firstOrder = response.result.data[0]
                    console.log('第一个订单数据结构:', {
                        id: firstOrder.id,
                        snap_items: firstOrder.snap_items,
                        snap_items_type: typeof firstOrder.snap_items,
                        is_array: Array.isArray(firstOrder.snap_items)
                    })
                }
                console.log(response.result.data , 'rd');
                const formattedOrders = this.formatOrderData(response.result.data)

                if (formattedOrders.length > 0) {
                    const newOrders = refresh ? formattedOrders : [...this.data.orders, ...formattedOrders]

                    this.setData({
                        orders: newOrders,
                        page: this.data.page + 1,
                        hasMore: response.result.current_page < response.result.last_page
                    })
                } else if (refresh) {
                    this.setData({
                        orders: [],
                        hasMore: false
                    })
                }
            } else {
                console.log('API返回错误或数据为空:', response)
                if (refresh) {
                    this.setData({
                        orders: [],
                        hasMore: false
                    })
                }
            }

        } catch (error) {
            console.error('获取订单失败:', error)
            if (refresh) {
                this.setData({
                    orders: [],
                    hasMore: false
                })
            }
            wx.showToast({
                title: '获取订单失败',
                icon: 'none'
            })
        } finally {
            this.setData({ loading: false })
        }
    },

    /**
     * 格式化订单数据
     */
    formatOrderData(orderList) {
        return orderList.map(order => {
            // 处理商品列表 - 添加安全检查
            let products = []
            if (order.snap_items && Array.isArray(order.snap_items)) {
                products = order.snap_items.map(item => ({
                    id: item.id,
                    name: item.title,
                    image: order.snap_img,
                    count: item.count,
                    price: item.final_price,
                    specs: item.specs || '默认规格',
                    totalPrice: item.total_price
                }))
            } else {
                console.warn('订单商品数据异常:', order.id, order.snap_items)
                // 如果没有商品数据，创建一个默认商品
                products = [{
                    id: order.id || 'default',
                    name: order.snap_title || '未知商品',
                    image: order.snap_img || '/imgs/home/drink-item.png',
                    count: order.total_count || 1,
                    price: order.total_price || '0.00',
                    specs: '默认规格',
                    totalPrice: order.total_price || '0.00'
                }]
            }

            // 获取订单状态文本
            const statusText = this.getOrderStatusText(order.status)

            return {
                id: order.id,
                orderNo: order.order_no,
                totalPrice: order.total_price,
                totalCount: order.total_count,
                products: products,
                status: order.status,
                statusText: statusText,
                createTime: order.create_time,
                placedTime: order.placed_time,
                paidTime: order.paid_time,
                remark: order.remark,
                snapImg: order.snap_img,
                snapTitle: order.snap_title
            }
        })
    },

    /**
     * 测试不同status参数的API调用
     */
    async testOrderListAPI() {
        console.log('开始测试订单列表API...')

        const testStatuses = [1, 2, 3] // 只测试实际存在的状态

        for (const status of testStatuses) {
            try {
                console.log(`测试status=${status}的API调用`)
                const response = await api.getOrderList(status)
                console.log(`status=${status}的响应:`, response)
            } catch (error) {
                console.error(`status=${status}的API调用失败:`, error)
            }
        }
    },

    /**
     * 根据activeKey获取状态参数
     */
    getStatusByActiveKey(activeKey) {
        const statusMap = {
            0: '', // 全部 - 不传status参数
            1: 1,  // 待取茶 - status=1
            2: 2,  // 已完成 - status=2
            3: 3   // 已取消 - status=3
        }
        console.log('Tab映射关系:', { activeKey, status: statusMap[activeKey] })
        return statusMap[activeKey] || ''
    },

    /**
     * 获取订单状态文本
     */
    getOrderStatusText(status) {
        const statusMap = {
            1: '未支付',
            2: '已付款',
            3: '已取消'
        }
        return statusMap[status] || '未知状态'
    },

    /**
     * 切换标签页
     */
    switchTab(event) {
        const tab = parseInt(event.currentTarget.dataset.tab)
        console.log('切换到标签页:', tab)

        this.setData({
            activeKey: tab,
            activeTab: tab
        })

        // 重新加载数据
        this.loadOrders(true)
    },

    onPullDownRefresh() {
        this.loadOrders(true).then(() => {
            wx.stopPullDownRefresh()
        })
    },


    onReachBottom() {
        if (this.data.hasMore && !this.data.loading) {
            this.loadOrders(false)
        }
    },

    /**
     * 跳转到订单详情
     */
    goToOrderDetail(event) {
        const orderId = event.currentTarget.dataset.orderId
        console.log('跳转到订单详情:', orderId)

        // 存储order_id到全局变量，用于取茶号生成
        const app = getApp()
        app.globalData.lastOrderId = orderId
        console.log('已存储订单ID到全局变量:', orderId)

        wx.navigateTo({
            url: `/pages/order-detail/index?orderId=${orderId}`
        })
    },

    /**
     * 点击去支付按钮
     */
    goToPay(event) {
        console.log('=== 支付按钮被点击 ===')
        console.log('event:', event)

        // 阻止事件冒泡和默认行为
        if (event && event.stopPropagation) {
            event.stopPropagation()
        }
        if (event && event.preventDefault) {
            event.preventDefault()
        }

        const orderId = event.currentTarget.dataset.id
        const totalPrice = event.currentTarget.dataset.totalPrice

        console.log('点击去支付，订单ID:', orderId, '订单金额:', totalPrice)

        // 检查数据是否正确
        if (!orderId) {
            console.error('订单ID为空')
            wx.showToast({
                title: '订单信息错误',
                icon: 'none'
            })
            return
        }

        // 构造简化的订单信息
        const orderInfo = {
            id: orderId,
            totalPrice: totalPrice
        }

        // 设置当前要支付的订单信息
        this.setData({
            currentOrderId: orderId,
            currentOrder: orderInfo,
            showPaymentModal: true
        }, () => {
            // 在setData回调中确认数据已更新
            console.log('setData完成后的状态检查:', {
                currentOrderId: this.data.currentOrderId,
                currentOrder: this.data.currentOrder,
                showPaymentModal: this.data.showPaymentModal
            })
        })

        console.log('支付弹窗应该显示，showPaymentModal:', this.data.showPaymentModal)
        console.log('当前数据状态:', {
            currentOrderId: this.data.currentOrderId,
            currentOrder: this.data.currentOrder,
            showPaymentModal: this.data.showPaymentModal
        })
    },

    /**
     * 隐藏支付方式弹窗
     */
    hidePaymentModal() {
        console.log('隐藏支付弹窗')
        this.setData({
            showPaymentModal: false,
            currentOrderId: null,
            currentOrder: null
        })
    },

    /**
     * 测试支付弹窗显示（用于调试）
     */
    testShowPaymentModal() {
        console.log('测试显示支付弹窗')
        this.setData({
            showPaymentModal: true,
            currentOrderId: 'test123',
            currentOrder: { id: 'test123', totalPrice: '88.88' }
        })
    },

    /**
     * 阻止事件冒泡
     */
    stopPropagation() {
        // 空方法，用于阻止事件冒泡
    },

    /**
     * 选择支付方式
     */
    selectPaymentMethod(e) {
        const methodId = e.currentTarget.dataset.method;
        console.log('选择支付方式:', methodId);

        // 更新支付方式选择状态
        const updatedMethods = this.data.paymentMethods.map(method => ({
            ...method,
            selected: method.id === methodId
        }));

        this.setData({
            selectedPaymentMethod: methodId,
            paymentMethods: updatedMethods
        });

        console.log('支付方式已更新:', methodId);
    },

    /**
     * 确认支付
     */
    confirmPayment() {
        if (!this.data.currentOrderId) {
            wx.showToast({
                title: '订单信息异常',
                icon: 'none'
            })
            return
        }

        // 保存订单ID和订单信息到局部变量，避免在hidePaymentModal中被清空
        const orderId = this.data.currentOrderId
        const orderInfo = this.data.currentOrder

        // 隐藏弹窗
        this.hidePaymentModal()

        // 根据选择的支付方式执行不同的支付流程
        if (this.data.selectedPaymentMethod === 'balance') {
            // 余额支付 - 传递订单信息
            this.processBalancePayment(orderId, orderInfo)
        } else {
            // 微信支付
            this.callPayment(orderId)
        }
    },

    /**
     * 调用支付接口
     */
    callPayment(orderId) {
        console.log('开始调用支付接口，订单ID:', orderId, '支付方式:', this.data.selectedPaymentMethod)

        // 根据支付方式设置pay_way字段
        const payWay = this.data.selectedPaymentMethod === 'balance' ? 2 : 1

        api.payPreorder(orderId, { pay_way: payWay }).then(res => {
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
                        //console.log('支付成功:', res)
                        let msg = res.errMsg.split(':')[1]

                        if (msg == 'ok') {
                            wx.showToast({
                                title: '支付成功！',
                                icon: 'success',
                                duration: 3000
                            })

                            // 支付成功后刷新订单列表
                            this.loadOrders(true)

                            setTimeout(() => {
                                wx.navigateTo({
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
            }
        }).catch(err => {
            console.error('支付接口调用失败:', err)
            wx.showToast({
                title: '支付接口调用失败',
                icon: 'none',
                duration: 2000
            })
        })
    },

    /**
     * 处理余额支付
     */
    async processBalancePayment(orderId, orderInfo) {
        console.log('开始处理余额支付，订单ID:', orderId, '支付方式: 余额支付')

        try {
            // 获取用户信息检查余额
            wx.showLoading({
                title: '检查余额中...'
            })

            const userInfoResponse = await User.getUserInfo()
            let userBalance = 0

            // 检查响应格式并获取余额
            if (userInfoResponse && (userInfoResponse.code === 0 || userInfoResponse.code === 200)) {
                userBalance = parseFloat(userInfoResponse.result.balance || 0)
            } else {
                wx.hideLoading()
                wx.showToast({
                    title: '获取用户信息失败',
                    icon: 'none'
                })
                return
            }

            // 获取订单金额 - 使用传入的订单信息
            const payAmount = parseFloat(orderInfo?.totalPrice || 0)
            wx.hideLoading()

            if (payAmount <= 0) {
                wx.showToast({
                    title: '订单金额异常',
                    icon: 'none'
                })
                return
            }

            // 检查余额是否足够
            if (userBalance < payAmount) {
                wx.showModal({
                    title: '余额不足',
                    content: `当前余额：¥${userBalance.toFixed(2)}\n需要支付：¥${payAmount.toFixed(2)}\n是否前往充值？`,
                    confirmText: '去充值',
                    cancelText: '取消',
                    success: (res) => {
                        if (res.confirm) {
                            // 跳转到充值页面
                            wx.navigateTo({
                                url: '/pages/recharge/index'
                            })
                        }
                    }
                })
                return
            }

            // 余额足够，执行支付
            wx.showLoading({
                title: '余额支付中...'
            })

            // 调用后台余额支付接口
            const paymentResponse = await User.balancePayment(orderId)
            wx.hideLoading()

            // 检查支付结果
            if (paymentResponse && (paymentResponse.code === 0 || paymentResponse.code === 200)) {
                // 支付成功
                wx.showToast({
                    title: '余额支付成功！',
                    icon: 'success',
                    duration: 2000
                })

                // 支付成功后刷新订单列表
                this.loadOrders(true)

                // 跳转到订单详情页
                setTimeout(() => {
                    wx.navigateTo({
                        url: `/pages/order-detail/index?orderId=${orderId}`
                    })
                }, 1500)
            } else {
                // 支付失败
                const errorMsg = paymentResponse.msg || '余额支付失败'
                wx.showToast({
                    title: errorMsg,
                    icon: 'none',
                    duration: 3000
                })
            }

        } catch (error) {
            wx.hideLoading()
            console.error('余额支付异常:', error)

            let errorMsg = '余额支付失败'
            if (error.message) {
                errorMsg = error.message
            }

            wx.showToast({
                title: errorMsg,
                icon: 'none',
                duration: 3000
            })
        }
    }
})
