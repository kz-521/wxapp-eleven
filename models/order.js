/**
 * @作者 7七月
 * @微信公号 林间有风
 * @开源项目 $ http://7yue.pro
 * @免费专栏 $ http://course.7yue.pro
 * @我的课程 $ http://imooc.com/t/4294850
 * @创建时间 2020-04-26 13:47
 */
import {OrderException} from "../core/order-exception";
import {OrderExceptionType, OrderStatus} from "../core/enum";
import {accAdd} from "../utils/number";
import {Http} from "../utils/http";
import {Paging} from "../utils/paging";

class Order {
    orderItems
    localItemCount

    constructor(orderItems, localItemCount) {
        this.orderItems = orderItems
        this.localItemCount = localItemCount
    }

    checkOrderIsOk() {
        this.orderItems.forEach(item => {
            item.isOk()
        })
    }

    // code appid1 wx appid2
    // email

    _orderIsOk() {
        this._emptyOrder()
        this._containNotOnSaleItem()
    }

    static async postOrderToServer(orderPost) {
        return await Http.request({
            url: 'order',
            method: 'POST',
            data: orderPost,
            throwError: true
        })
    }

    getOrderSkuInfoList() {
        return this.orderItems.map(item => {
            return {
                id: item.skuId,
                count: item.count
            }
        })
    }

    getTotalPrice() {
        return this.orderItems.reduce((pre, item) => {
            const price = accAdd(pre, item.finalPrice)
            return price
        }, 0)
    }

    getTotalPriceByCategoryIdList(categoryIdList) {
        if (categoryIdList.length === 0) {
            return 0
        }
        // 衣服、鞋子、书籍
        const price = categoryIdList.reduce((pre, cur) => {
            const eachPrice = this.getTotalPriceEachCategory(cur)
            return accAdd(pre, eachPrice)
        }, 0);
        return price
    }

    getTotalPriceEachCategory(categoryId) {
        const price = this.orderItems.reduce((pre, orderItem) => {
            const itemCategoryId = this._isItemInCategories(orderItem, categoryId)
            if (itemCategoryId) {
                return accAdd(pre, orderItem.finalPrice)
            }
            return pre
        }, 0)
        return price
    }


    _isItemInCategories(orderItem, categoryId) {
        if (orderItem.categoryId === categoryId) {
            return true
        }
        if (orderItem.rootCategoryId === categoryId) {
            return true
        }
        return false
    }

    _containNotOnSaleItem() {
        if (this.orderItems.length !== this.localItemCount) {
            throw new OrderException('服务器返回订单商品数量与实际不相符，可能是有商品已下架', OrderExceptionType.NOT_ON_SALE)
        }
    }

    _emptyOrder() {
        if (this.orderItems.length === 0) {
            throw new OrderException('订单中没有任何商品', OrderExceptionType.EMPTY)
        }
    }

    static async getPaidCount() {
        const orderPage = await Http.request({
            url: `order/by/status/${OrderStatus.PAID}`,
            data:{
                start:0,
                count:1
            }
        })
        return orderPage.total
    }

    static getPagingCanceled() {
        return new Paging({
            url:`order/status/canceled`
        })
    }

    static async getDetail(oid) {
        return Http.request({
            url: `order/detail/${oid}`
        })
    }

    static getPagingByStatus(status) {
        return new Paging({
            url:`order/by/status/${status}`
        })
        // return Http.request({
        // })
    }
    /**
     * 获取订单列表（新API）
     * @param {string} status 订单状态，可选
     */
    static async getOrderList(status = null) {
        let url = `order/list`
        if (status) {
            url += `?status=${status}`
        }

        return await Http.request({
            url: url,
            method: 'GET'
        })
    }

    /**
     * 格式化订单列表数据以适配UI
     * @param {Object} response API响应数据
     */
    static formatOrderListData(response) {
        if (response.code === 0 && response.result && response.result.data) {
            return response.result.data.map(order => ({
                id: order.id,
                order_no: order.order_no,
                status: order.status,
                status_text: order.status_text || Order.getStatusText(order.status),
                total_price: order.total_price,
                created_at: order.created_at || order.create_time,
                items: order.items || [],
                // 格式化创建时间
                formatted_time: Order.formatOrderTime(order.created_at || order.create_time),
                // 订单状态样式类
                status_class: Order.getStatusClass(order.status),
                // 原始数据
                originalData: order
            }))
        }
        return []
    }

    /**
     * 根据订单状态获取状态文本
     * @param {number} status 订单状态
     */
    static getStatusText(status) {
        const statusMap = {
            1: '待付款',
            2: '待取茶',
            3: '已完成',
            4: '已取消',
            5: '已退款'
        }
        return statusMap[status] || '未知状态'
    }

    /**
     * 根据订单状态获取样式类名
     * @param {number} status 订单状态
     */
    static getStatusClass(status) {
        const classMap = {
            1: 'pending-payment',
            2: 'pending-pickup',
            3: 'completed',
            4: 'canceled',
            5: 'refunded'
        }
        return classMap[status] || 'unknown'
    }

    /**
     * 格式化订单时间
     * @param {string} timeString 时间字符串
     */
    static formatOrderTime(timeString) {
        if (!timeString) return ''

        // 如果已经是格式化后的时间，直接返回
        if (timeString.includes('/')) return timeString

        // 转换 "2025-08-04 13:05:00" 格式
        const date = new Date(timeString)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hour = String(date.getHours()).padStart(2, '0')
        const minute = String(date.getMinutes()).padStart(2, '0')

        return `${year}/${month}/${day} ${hour}:${minute}`
    }

    /**
     * 获取默认订单数据（API失败时的备用数据）
     */
    static getDefaultOrderData() {
        return [
            {
                id: 1,
                order_no: 'QT2025080400001',
                status: 2,
                status_text: '待取茶',
                total_price: 40.00,
                formatted_time: '2025/08/04 13:05',
                status_class: 'pending-pickup',
                items: [
                    {
                        name: '清照竹影茶',
                        specs: '大、热、不额外加糖、脱脂牛奶',
                        quantity: 1,
                        image: '/imgs/home/drink-item.png'
                    }
                ]
            }
        ]
    }

}

export {
    Order
}
