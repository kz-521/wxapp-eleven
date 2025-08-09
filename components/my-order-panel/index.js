// components/my-order-panel/index.js
import {Order} from "../../models/order";

Component({
    /**
     * 组件的属性列表
     */
    properties: {},

    /**
     * 组件的初始数据
     */
    data: {
    },

    lifetimes: {
        async attached() {
        }
    },

    pageLifetimes: {
        async show() {
        }
    },

    /**
     * 组件的方法列表
     */
    methods: {
        onGotoMyOrder(event) {
            const key = event.currentTarget.dataset.key
            wx.navigateTo({
                url: `/pages/my-order/index?key=${key}`
            })
        }
    }
})
