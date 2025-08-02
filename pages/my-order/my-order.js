// pages/my-order/my-order.js
import {Order} from "../../models/order";
import {OrderStatus} from "../../core/enum";

Page({

    /**
     * 页面的初始数据
     */
    data: {
        activeKey:1,
        items:[],
        loadingType:'loading',
        bottomLoading:true,
        paging:null,
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad:function (options) {
        this.initItems(this.data.activeKey)
    },

    onShow() {
        //this.initItems(this.data.activeKey)
    },

    async initItems(activeKey) {

        this.data.paging = this.getPaging(activeKey)

        const data = await this.data.paging.getMoreData()

        if(!data){
            return
        }
        this.bindItems(data)
    },

    getPaging(activeKey) {
        activeKey = parseInt(activeKey)
        return Order.getPagingByStatus(activeKey)
    },

    empty() {
        wx.lin.showEmpty({
            text:'暂无相关订单',
        })
        this.setData({
            bottomLoading:false
        })
    },

    bindItems(data) {


        console.log(data)


        if(data.empty){
            console.log('empty')
            this.empty()
            this.setData({
                items:[]
            });
            return
        }

        if (data.accmulator.length !== 0){
            wx.lin.hideEmpty()

            this.setData({
                items:data.accmulator,
                bottomLoading:true
            });
        }
        if(!data.moreData){
            this.setData({
                loadingType:'end'
            })
        }
    },

    onSegmentChange(event) {
        const activeKey = event.detail.activeKey
        this.initItems(activeKey)
    },

    async onReachBottom() {
        const data = await this.data.paging.getMoreData()
        this.bindItems(data)
    },

    onPaySuccess(event) {
        const oid = event.detail.oid
        wx.navigateTo({
            url:`/pages/pay-success/pay-success?oid=${oid}`
        })
        // this.initItems(2)
    }
})
