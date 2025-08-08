// components/my-banner/index.js
import {User} from "../../models/user";
import {promisic} from "../../utils/util";

Component({
    /**
     * 组件的属性列表
     */
    properties: {
        couponCount: Number,
        balance: {
            type: Number,
            value: 0
        }
    },

    /**
     * 组件的初始数据
     */
    data: {
        showLoginBtn: false,
        couponCount: Number,
        balance: 0
    },

    lifetimes: {
        async attached() {
            // wx.getUserInfo()
            console.log(this.properties.couponCount)
            console.log(this.properties.balance)
            if (!await this.hasAuthUserInfo()) {
                this.setData({
                    showLoginBtn: true
                })
            }
        }
    },

    observers:{
        'couponCount':function (couponCount) {
        },
        'balance':function (balance) {
        }
    },

    /**
     * 组件的方法列表
     */
    methods: {
        async onAuthUserInfo(event) {
            console.log(event.detail)
            if (event.detail.userInfo) {
                const success = await User.updateUserInfo(event.detail.userInfo)
                this.setData({
                    showLoginBtn:false
                })
            }
        },

        async hasAuthUserInfo() {
            const setting = await promisic(wx.getSetting)();
            const userInfo = setting.authSetting['scope.userInfo']
            return !!userInfo;
        },

        onGotoMyCoupon(event) {
            wx.navigateTo({
                url:`/pages/coupon-select/index`
            })
        },

        onGotoBalance(event) {
            wx.showToast({
                title: '余额功能开发中',
                icon: 'none',
                duration: 2000
            })
        }
    }
})
