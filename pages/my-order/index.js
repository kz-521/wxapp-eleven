const { api } = require('../../utils/api.js')

Page({
    data: {
        activeKey: 0, // 当前选中的tab，0=全部, 1=待取茶, 2=已完成, 3=已取消
        activeTab: 0, // 当前选中的tab索引
        orders: [], // 订单列表
        loading: false,
        page: 1,
        per_page: 10,
        hasMore: true
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
    }
})