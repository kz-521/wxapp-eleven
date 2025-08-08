/**
 * @作者 7七月
 * @微信公号 林间有风
 * @开源项目 $ http://7yue.pro
 * @免费专栏 $ http://course.7yue.pro
 * @我的课程 $ http://imooc.com/t/4294850
 * @创建时间 2020-04-29 15:11
 */
import {Http} from "../utils/http";

class Coupon {
    static async collectCoupon(cid) {
        return await Http.request({
            method: 'POST',
            url: `coupon/collect/${cid}`,
            throwError: true
        })
        // return await Http
    }

    static getMyCoupons(status) {
        return Http.request({
            url: `coupon/myself/by/status/${status}`
        })
    }

    /**
     * 获取用户优惠券列表（新API）
     */
    static async getUserCoupons() {
        return await Http.request({
            url: 'qingting/v1/self/coupons',
            method: 'GET'
        })
    }

    /**
     * 处理优惠券数据，按状态分类
     */
    static processCouponsData(response) {
        const availableCoupons = []
        const usedCoupons = []
        const expiredCoupons = []

        // 检查响应数据结构
        const coupons = response?.result?.data || []
        
        coupons.forEach(item => {
            const couponData = Coupon.formatCouponData(item)
            
            // 根据status分类，由于缺少actual_status字段，使用status字段
            if (item.status === 1) {
                // 未使用 - 还需要检查是否过期
                const now = new Date()
                const endTime = new Date(item.coupon.end_time)
                
                if (now <= endTime) {
                    availableCoupons.push(couponData)
                } else {
                    expiredCoupons.push(couponData)
                }
            } else {
                // 已使用或其他状态
                usedCoupons.push(couponData)
            }
        })

        return {
            availableCoupons,
            usedCoupons,
            expiredCoupons
        }
    }

    /**
     * 格式化优惠券数据以适配UI
     */
    static formatCouponData(item) {
        const coupon = item.coupon
        let amount = ''
        let condition = ''

        if (coupon.type === 1) {
            // 满减券
            amount = coupon.minus
            condition = `满${coupon.full_money}可用`
        } else if (coupon.type === 2) {
            // 折扣券
            if (coupon.rate) {
                const discount = Math.round((1 - parseFloat(coupon.rate)) * 10)
                amount = `${discount}折`
            } else {
                amount = '折扣券'
            }
            condition = '全场通用'
        }

        return {
            id: item.id,
            coupon_id: coupon.id,
            name: coupon.title,
            amount: amount,
            condition: condition,
            validDate: `${coupon.start_time.split(' ')[0]} - ${coupon.end_time.split(' ')[0]}`,
            status: item.status,
            type: coupon.type,
            rate: coupon.rate,
            full_money: coupon.full_money,
            minus: coupon.minus,
            originalData: item
        }
    }

    static async getCouponsByCategory(cid) {
        return await Http.request({
            url: `coupon/by/category/${cid}`,
        })
    }

    static async getMySelfWithCategory() {
        return Http.request({
            url: `coupon/myself/available/with_category`
        })
    }

    static async getTop2CouponsByCategory(cid) {
        let coupons = await Http.request({
            url: `coupon/by/category/${cid}`,
        })
        if (coupons.length === 0) {
            const otherCoupons = await Coupon.getWholeStoreCoupons()
            return Coupon.getTop2(otherCoupons)
        }
        if (coupons.length >= 2) {
            return coupons.slice(0, 2)
        }
        if (coupons.length === 1) {
            const otherCoupons = await Coupon.getWholeStoreCoupons()
            coupons = coupons.concat(otherCoupons)
            return Coupon.getTop2(coupons)
        }
    }

    static getTop2(coupons) {
        if (coupons.length === 0) {
            return []
        }
        if (coupons.length >= 2) {
            return coupons.slice(0, 2)
        }
        if (coupons.length === 1) {
            return coupons
        }
        return []
    }


    static async getWholeStoreCoupons() {
        return Http.request({
            url: `coupon/whole_store`
        })
    }
}

export {
    Coupon
}