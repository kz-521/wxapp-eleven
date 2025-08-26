/**
 * @作者 7七月
 * @微信公号 林间有风
 * @开源项目 $ http://7yue.pro
 * @免费专栏 $ http://course.7yue.pro
 * @我的课程 $ http://imooc.com/t/4294850
 * @创建时间 2025-08-25 15:11
 */
import {Http} from "../utils/http";

class Balance {
    /**
     * 获取用户余额
     */
    static async getUserBalance() {
        const { api } = require('../utils/api.js')
        return await api.getUserBalance()
    }

    /**
     * 创建余额充值订单
     */
    static async createRecharge(amount) {
        const { api } = require('../utils/api.js')
        return await api.createBalanceRecharge(amount)
    }

    /**
     * 余额充值（旧版API）
     */
    static async recharge(amount) {
        const { api } = require('../utils/api.js')
        return await api.recharge(amount)
    }

    /**
     * 获取充值记录
     */
    static async getRechargeHistory(page = 1, size = 10) {
        const { api } = require('../utils/api.js')
        return await api.getRechargeHistory(page, size)
    }

    /**
     * 格式化余额显示
     */
    static formatBalance(balance) {
        if (typeof balance !== 'number') {
            return '0.00'
        }
        return balance.toFixed(2)
    }

    /**
     * 验证充值金额
     */
    static validateRechargeAmount(amount) {
        const numAmount = parseFloat(amount)
        
        if (isNaN(numAmount)) {
            return {
                valid: false,
                message: '请输入有效的充值金额'
            }
        }
        
        if (numAmount <= 0) {
            return {
                valid: false,
                message: '充值金额必须大于0'
            }
        }
        
        // if (numAmount < 1) {
        //     return {
        //         valid: false,
        //         message: '最小充值金额为1元'
        //     }
        // }
        
        if (numAmount > 10000) {
            return {
                valid: false,
                message: '单次充值金额不能超过10000元'
            }
        }
        
        // 检查小数位数
        const decimalPlaces = (numAmount.toString().split('.')[1] || '').length
        if (decimalPlaces > 2) {
            return {
                valid: false,
                message: '充值金额最多保留2位小数'
            }
        }
        
        return {
            valid: true,
            amount: numAmount
        }
    }

    /**
     * 处理充值记录数据格式化
     */
    static formatRechargeHistory(response) {
        const records = (response && response.result && response.result.data) ? response.result.data : []
        
        return records.map(item => ({
            id: item.id,
            amount: Balance.formatBalance(item.amount),
            status: item.status,
            statusText: Balance.getRechargeStatusText(item.status),
            createTime: Balance.formatDateTime(item.create_time),
            orderNo: item.order_no || '',
            originalData: item
        }))
    }

    /**
     * 获取充值状态文本
     */
    static getRechargeStatusText(status) {
        const statusMap = {
            0: '充值中',
            1: '充值成功',
            2: '充值失败',
            3: '已取消'
        }
        return statusMap[status] || '未知状态'
    }

    /**
     * 格式化日期时间
     */
    static formatDateTime(dateString) {
        if (!dateString) return ''
        
        try {
            const date = new Date(dateString.replace(/T/g, ' ').split('.')[0].replace(/-/g, '/'))
            if (isNaN(date.getTime())) return dateString
            
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            const hours = String(date.getHours()).padStart(2, '0')
            const minutes = String(date.getMinutes()).padStart(2, '0')
            
            return `${year}-${month}-${day} ${hours}:${minutes}`
        } catch (e) {
            return dateString
        }
    }
}

export {
    Balance
}