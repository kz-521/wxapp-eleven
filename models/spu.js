/**
 * @作者 7七月
 * @创建时间 2019-10-21 17:45
 */
import {Http} from "../utils/http";

class Spu {

    static isNoSpec(spu) {
        console.log("Spu", spu)
        if (spu.skuList.length === 1 && spu.skuList[0].specs.length === 0) {
            return true
        }
        return false
    }

    static getDetail(id) {
        return Http.request({
            url: `spu/detail?id=${id}`
        });
    }

    static async getSpuByCategory(id,page) {
        return await Http.request({
            url: `spu/by_category?id=${id}&page=${page}`
        });
    }

    /**
     * 获取今日推荐商品
     * @param {number} size 推荐商品数量，默认3个
     */
    static async getRecommendSpu(size = 3) {
        return await Http.request({
            url: `spu/recommend?size=${size}`,
            method: 'GET'
        });
    }

    /**
     * 处理推荐商品数据格式，适配首页UI
     * @param {Object} response API响应数据
     */
    static formatRecommendData(response) {
        // 检查response是否存在且有效
        if (!response || typeof response !== 'object') {
            console.warn('formatRecommendData: response is null or invalid:', response)
            return null
        }

        if (response.code === 200 && response.result && response.result.list) {
            return response.result.list.map(item => ({
                id: item.id,
                name: item.title,
                price: item.discount_price || item.price,
                image: item.img
            }))
        }
        return null
    }
}

export {
    Spu
}
