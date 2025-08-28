/**
 * @作者 7七月
 * @微信公号 林间有风
 * @开源项目 $ http://7yue.pro
 * @免费专栏 $ http://course.7yue.pro
 * @我的课程 $ http://imooc.com/t/4294850
 * @创建时间 2019-08-30 20:56
 */
import {Http} from "../utils/http";


class User{

    static async updateUserInfo(data) {
        return Http.request({
            url:`user/update`,
            data,
            method:'POST'
        })
    }

    static async getUserInfo(data) {
        return Http.request({
            url:`user/detail`
        })
    }

    /**
     * 余额支付接口
     * @param {string} orderId 订单ID
     */
    static async balancePayment(orderId) {
        return Http.request({
            url: `pay/balance`,
            method: 'POST',
            data: {
                order_id: orderId
            }
        })
    }


    static async getShopInfo() {
        return Http.request({
            url:`index`
        })
    }


}

export {
    User
}
