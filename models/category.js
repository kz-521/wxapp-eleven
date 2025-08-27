/**
 * @作者 7七月
 * @创建时间 2019-09-26 05:47
 */
import {Http} from "../utils/http";

class Category {

    static async getHomeLocationC() {
        return await Http.request({
            url:`category/grid/all`
        })
    }

    /**
     * 获取分类列表
     */
    static async getCategoryList() {
        return await Http.request({
            url: 'category/list',
            method: 'GET'
        })
    }

    /**
     * 处理分类数据，格式化为UI所需的格式
     * @param {Object} response API响应数据
     */
    static formatCategoryData(response) {
        if (response.code === 0 && response.result) {
            // 按level分组，level 2是二级分类，level 1是一级分类
            const level1Categories = response.result.filter(item => item.level === 1)
            const level2Categories = response.result.filter(item => item.level === 2)

            // 格式化为UI需要的格式
            const formattedCategories = level2Categories.map((item, index) => ({
                id: item.id,
                name: item.name,
                description: item.description,
                sort: item.sort,
                parent_id: item.parent_id,
                displayName: item.name // 用于UI显示
            }))

            return {
                level1Categories,
                level2Categories: formattedCategories,
                allCategories: response.result
            }
        }
        return null
    }

    /**
     * 获取默认分类数据（API失败时的备用数据）
     */
    static getDefaultCategoryData() {
        return [
            {
                id: 1,
                name: '本草滋养茶·9种体质',
                displayName: '本草滋养茶\n9种体质'
            },
            {
                id: 2,
                name: '本草滋养茶·特调',
                displayName: '本草滋养茶\n特调'
            },
            {
                id: 3,
                name: '本草滋养茶·经典',
                displayName: '本草滋养茶\n经典'
            },
            {
                id: 4,
                name: '本草滋养茶·新品',
                displayName: '本草滋养茶\n新品'
            },
            {
                id: 5,
                name: '本草滋养茶·热销',
                displayName: '本草滋养茶\n热销'
            }
        ]
    }
}

export {
    Category
}
