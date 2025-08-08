// pages/my/my.js
import {Coupon} from "../../models/coupon";
import {promisic} from "../../utils/util";
import {AuthAddress, CouponStatus} from "../../core/enum";

Page({

    /**
     * 页面的初始数据
     */
    data: {
        couponCount: 0,
        balance: 0
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: async function (options) {
        try {
            console.log('开始获取用户优惠券数据')
            
            // 使用新的API接口获取优惠券数据
            const response = await Coupon.getUserCoupons()
            console.log('优惠券接口响应:', response)
            
            let couponCount = 0
            if (response.code === 0 && response.result && response.result.data) {
                // 处理优惠券数据，获取可用优惠券数量
                const processedData = Coupon.processCouponsData(response)
                couponCount = processedData.availableCoupons.length
                console.log('可用优惠券数量:', couponCount)
            } else {
                console.log('优惠券接口返回错误或数据为空:', response)
            }
            
            this.setData({
                couponCount: couponCount,
                balance: 0 // 模拟余额数据
            })
            
        } catch (error) {
            console.error('获取优惠券数据失败:', error)
            // 设置默认值
            this.setData({
                couponCount: 0,
                balance: 0
            })
        }
    },

    onGotoMyCoupon(event) {
        wx.navigateTo({
            url: "/pages/coupon-select/index"
        })
    },

    onGotoMyOrder(event) {
        const status = event.currentTarget.dataset.status || 0
        console.log('跳转到订单页面，状态:', status)
        wx.navigateTo({
            url: `/pages/my-order/index?key=${status}`
        })
    },

    onGotoMyCourse(event) {
        wx.navigateTo({
            url:"/pages/about-course/about-course"
        })
    },

    /**
     * 处理用户信息更新事件
     */
    onUserInfoUpdated(event) {
        console.log('我的页面接收到用户信息更新事件:', event.detail)
        const { userInfo } = event.detail
        
        // 可以在这里处理用户信息更新后的逻辑
        // 比如刷新页面数据、更新显示等
        
        wx.showToast({
            title: '用户信息已更新',
            icon: 'success',
            duration: 1500
        })
    },


    async onMgrAddress(event) {
        wx.showToast({
            title: '收货地址功能暂未开放',
            icon: 'none',
            duration: 2000
        })
        return
        
        // 以下是原有的地址授权逻辑，暂时注释掉
        /*
        const authStatus = await this.hasAuthorizedAddress()
        if (authStatus === AuthAddress.DENY) {
            this.setData({
                showDialog: true
            })
            return
        }
        this.openAddress()
        */
    },

    async hasAuthorizedAddress() {
        const setting = await promisic(wx.getSetting)();
        console.log(setting)
        const addressSetting = setting.authSetting['scope.address']
        if (addressSetting === undefined) {
            return AuthAddress.NOT_AUTH
        }
        if (addressSetting === false) {
            return AuthAddress.DENY
        }
        if (addressSetting === true) {
            return AuthAddress.AUTHORIZED
        }
    },

    async openAddress() {
        let res;
        res = await promisic(wx.chooseAddress)();
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: async function () {
        try {
            console.log('我的页面显示，刷新优惠券数据')
            
            // 刷新优惠券数据
            const response = await Coupon.getUserCoupons()
            console.log('页面显示时优惠券接口响应:', response)
            
            let couponCount = 0
            if (response.code === 0 && response.result && response.result.data) {
                // 处理优惠券数据，获取可用优惠券数量
                const processedData = Coupon.processCouponsData(response)
                couponCount = processedData.availableCoupons.length
                console.log('页面显示时可用优惠券数量:', couponCount)
            }
            
            this.setData({
                couponCount: couponCount
            })
            
        } catch (error) {
            console.error('页面显示时获取优惠券数据失败:', error)
        }
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {

    }
})
