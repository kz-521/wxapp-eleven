// pages/pay-success/pay-success.js
import {Order} from "../../models/order";
import {User} from "../../models/user";

Page({

    /**
     * 页面的初始数据
     */
    data: {
        oid:null
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        this.data.oid = options.oid

        this.initAllData(options.oid)


    },
    async initAllData(oid) {

        let that = this
        const  orderItems = await Order.getDetail(oid)
        that.setData({
            orderItems
        })
    },
    onGotoOrderDetail(event) {
        wx.redirectTo({
            url:`/pages/order-detail/order-detail?oid=${this.data.oid}`
        })
    }

})
