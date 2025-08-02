/**
 * @作者 7七月
 * @创建时间 2019-10-21 17:45
 */
import {Http} from "../utils/http";

class Spu {

    static isNoSpec(spu) {
        if (spu.sku_list.length === 1 && spu.sku_list[0].specs.length === 0) {
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
}

export {
    Spu
}
