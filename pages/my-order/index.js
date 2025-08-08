// pages/my-order/my-order.js
const { api } = require('../../utils/api.js')

Page({

    /**
     * 页面的初始数据
     */
    data: {
        activeKey: 0, // 当前选中的tab，0=全部, 1=待取茶, 2=已完成, 3=已取消
        activeTab: 0, // 与activeKey同步
        orders: [], // 订单列表
        loading: false,
        page: 1,
        per_page: 10,
        hasMore: true
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: async function (options) {
        // 从参数中获取默认tab
        const activeKey = parseInt(options.key) || 0
        this.setData({ activeKey, activeTab: activeKey })
        await this.loadOrders(true)
    },

    onShow() {
        // 页面显示时重新加载数据
        this.loadOrders(true)
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
                activeKey: this.data.activeKey
            })
            
            // 调用新的API接口
            const response = await api.getOrderList(status, this.data.page, this.data.per_page)
            console.log('订单API响应:', response)
            
            if (response.code === 0 && response.result && response.result.data) {
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
            // 处理商品列表
            const products = order.snap_items.map(item => ({
                id: item.id,
                name: item.title,
                image: item.img,
                count: item.count,
                price: item.final_price,
                specs: item.specs || '默认规格',
                totalPrice: item.total_price
            }))

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
     * 根据activeKey获取状态参数
     */
    getStatusByActiveKey(activeKey) {
        const statusMap = {
            0: '', // 全部
            1: 1,  // 待取茶
            2: 2,  // 已完成
            3: 3   // 已取消
        }
        return statusMap[activeKey] || ''
    },

    /**
     * 获取订单状态文本
     */
    getOrderStatusText(status) {
        const statusMap = {
            1: '待取茶',
            2: '已完成',
            3: '已取消'
        }
        return statusMap[status] || '未知状态'
    },

    /**
     * 切换标签页
     */
    switchTab(event) {
        const tab = parseInt(event.currentTarget.dataset.tab)
        console.log('切换标签页:', tab)
        
        this.setData({
            activeKey: tab,
            activeTab: tab
        })
        
        // 重新加载数据
        this.loadOrders(true)
    },

    /**
     * 下拉刷新
     */
    onPullDownRefresh() {
        this.loadOrders(true).then(() => {
            wx.stopPullDownRefresh()
        })
    },

    /**
     * 上拉加载更多
     */
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
        
        wx.navigateTo({
            url: `/pages/order-detail/index?orderId=${orderId}`
        })
    }
})