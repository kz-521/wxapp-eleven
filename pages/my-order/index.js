// pages/my-order/my-order.js
import {Order} from "../../models/order";
import {OrderStatus} from "../../core/enum";

Page({

    /**
     * 页面的初始数据
     */
    data: {
        activeKey: 0, // 当前选中的tab，0=全部, 1=待付款, 2=待取茶, 3=已完成, 4=已取消
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
            
            const response = await Order.getOrderList(this.data.page, this.data.per_page, status)
            console.log('订单API响应:', response)
            
            const formattedOrders = Order.formatOrderListData(response)
            
            if (formattedOrders.length > 0) {
                const newOrders = refresh ? formattedOrders : [...this.data.orders, ...formattedOrders]
                
                this.setData({
                    orders: newOrders,
                    page: this.data.page + 1,
                    hasMore: response.result?.current_page < response.result?.last_page
                })
            } else if (refresh) {
                // 刷新时没有数据，使用默认数据或显示空状态
                this.setData({
                    orders: [],
                    hasMore: false
                })
            }
            
        } catch (error) {
            console.error('获取订单失败:', error)
            if (refresh) {
                // API失败时使用默认数据
                const defaultOrders = Order.getDefaultOrderData()
                this.setData({
                    orders: defaultOrders,
                    hasMore: false
                })
            }
            wx.showToast({
                title: '获取订单失败',
                icon: 'error'
            })
        } finally {
            this.setData({ loading: false })
        }
    },

    /**
     * 根据activeKey获取订单状态参数
     * @param {number} activeKey tab索引
     */
    getStatusByActiveKey(activeKey) {
        const statusMap = {
            0: null,    // 全部
            1: 1,       // 待付款
            2: 2,       // 待取茶
            3: 3,       // 已完成
            4: 4        // 已取消
        }
        return statusMap[activeKey]
    },

    /**
     * 切换tab
     */
    switchTab(event) {
        const activeKey = parseInt(event.currentTarget.dataset.tab)
        this.setData({ 
            activeKey, 
            activeTab: activeKey 
        })
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
    }
})