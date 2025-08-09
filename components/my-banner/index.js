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
        balance: 0,
        userInfo: null
    },

    lifetimes: {
        async attached() {
            console.log('my-banner组件初始化')
            console.log('优惠券数量:', this.properties.couponCount)
            console.log('余额:', this.properties.balance)
            
            // 检查用户信息状态
            const userInfo = wx.getStorageSync('userInfo')
            const hasAuth = await this.hasAuthUserInfo()
            
            console.log('用户信息:', userInfo)
            console.log('授权状态:', hasAuth)
            
            // 设置用户信息到组件数据
            this.setData({
                userInfo: userInfo
            })
            
            // 如果用户信息完整或已授权，隐藏登录按钮
            if ((userInfo && userInfo.avatarUrl && userInfo.nickName) || hasAuth) {
                this.setData({
                    showLoginBtn: false,
                    userInfo: userInfo
                })
                console.log('用户信息完整，隐藏登录按钮')
            } else {
                this.setData({
                    showLoginBtn: true,
                    userInfo: null
                })
                console.log('用户信息不完整，显示登录按钮')
            }
        }
    },

    observers:{
        'couponCount':function (couponCount) {
            console.log('my-banner组件接收到优惠券数量更新:', couponCount)
        },
        'balance':function (balance) {
            console.log('my-banner组件接收到余额更新:', balance)
        }
    },

    /**
     * 组件的方法列表
     */
    methods: {
        /**
         * 点击头像事件
         */
        onAvatarTap() {
            console.log('点击头像，开始用户信息授权流程')
            
            // 检查是否已经有完整的用户信息
            const userInfo = wx.getStorageSync('userInfo')
            console.log('当前存储的用户信息:', userInfo)
            console.log('当前组件状态:', this.data)
            
            if (userInfo && userInfo.avatarUrl && userInfo.nickName) {
                console.log('用户信息已完整，显示用户信息')
                wx.showToast({
                    title: '用户信息已授权',
                    icon: 'success',
                    duration: 1500
                })
                return
            }

            console.log('用户信息不完整，开始授权流程')
            
            // 显示授权提示
            wx.showModal({
                title: '授权提示',
                content: '需要获取您的头像和昵称信息，是否授权？',
                success: (res) => {
                    if (res.confirm) {
                        // 用户确认授权，开始获取用户信息
                        this.getUserProfile()
                    } else {
                        console.log('用户取消授权')
                        wx.showToast({
                            title: '您取消了授权',
                            icon: 'none',
                            duration: 1500
                        })
                    }
                }
            })
        },

        /**
         * 检查并获取用户信息
         */
        async checkAndGetUserInfo() {
            const userInfo = wx.getStorageSync('userInfo')
            if (userInfo && userInfo.avatarUrl && userInfo.nickName) {
                console.log('用户信息已完整，无需重新授权')
                return
            }

            console.log('用户信息不完整，开始授权流程')
            // 先尝试一次性获取用户信息
            this.getUserProfile()
        },

        /**
         * 一次性获取用户信息
         */
        getUserProfile() {
            console.log('尝试一次性获取用户信息')
            wx.getUserProfile({
                desc: '用于完善用户资料',
                success: (res) => {
                    console.log('一次性获取用户信息成功:', res.userInfo)
                    this.handleUserInfoSuccess(res.userInfo)
                },
                fail: (err) => {
                    console.error('一次性获取用户信息失败:', err)
                    if (err.errMsg.includes('cancel')) {
                        wx.showToast({ title: '用户取消授权', icon: 'none' })
                    } else {
                        console.log('尝试分别授权获取用户信息')
                        // 如果一次性获取失败，尝试分别授权
                        this.getUserInfoSeparately()
                    }
                }
            })
        },

        /**
         * 分别授权获取用户信息
         */
        getUserInfoSeparately() {
            console.log('开始分别授权获取用户信息')
            
            // 先获取头像
            wx.chooseAvatar({
                success: (res) => {
                    console.log('获取头像成功:', res.avatarUrl)
                    const userInfo = wx.getStorageSync('userInfo') || {}
                    userInfo.avatarUrl = res.avatarUrl
                    wx.setStorageSync('userInfo', userInfo)
                    
                    // 获取头像成功后，再获取昵称
                    this.getNickName()
                },
                fail: (err) => {
                    console.error('获取头像失败:', err)
                    if (err.errMsg.includes('cancel')) {
                        wx.showToast({ title: '用户取消头像授权', icon: 'none' })
                    } else {
                        wx.showToast({ title: '获取头像失败', icon: 'none' })
                    }
                }
            })
        },

        /**
         * 获取用户昵称
         */
        getNickName() {
            wx.showModal({
                title: '获取昵称',
                content: '请输入您的昵称',
                editable: true,
                placeholderText: '请输入昵称',
                success: (res) => {
                    if (res.confirm && res.content) {
                        console.log('用户输入昵称:', res.content)
                        const userInfo = wx.getStorageSync('userInfo') || {}
                        userInfo.nickName = res.content
                        wx.setStorageSync('userInfo', userInfo)
                        
                        // 完成用户信息获取
                        this.completeUserInfo(userInfo)
                    } else {
                        wx.showToast({ title: '请输入昵称', icon: 'none' })
                    }
                }
            })
        },

        /**
         * 完成用户信息获取
         */
        completeUserInfo(userInfo) {
            console.log('完成用户信息获取:', userInfo)
            this.handleUserInfoSuccess(userInfo)
        },

        /**
         * 处理用户信息获取成功
         */
        async handleUserInfoSuccess(userInfo) {
            try {
                console.log('处理用户信息成功:', userInfo)
                
                // 保存用户信息到本地存储
                wx.setStorageSync('userInfo', userInfo)
                
                // 更新组件状态
                this.setData({
                    showLoginBtn: false,
                    userInfo: userInfo
                })

                console.log('组件状态已更新:', {
                    showLoginBtn: false,
                    userInfo: userInfo
                })

                wx.showToast({ 
                    title: '获取用户信息成功', 
                    icon: 'success' 
                })

                // 调用User模型更新用户信息
                const success = await User.updateUserInfo(userInfo)
                if (success) {
                    console.log('用户信息更新到服务器成功')
                }
                
                // 通知父组件用户信息已更新
                this.triggerEvent('userInfoUpdated', { userInfo })
                
            } catch (error) {
                console.error('处理用户信息失败:', error)
                wx.showToast({ 
                    title: '获取用户信息失败', 
                    icon: 'none' 
                })
            }
        },

        /**
         * 刷新用户信息状态
         */
        refreshUserInfo() {
            console.log('刷新用户信息状态')
            const userInfo = wx.getStorageSync('userInfo')
            console.log('从本地存储获取的用户信息:', userInfo)
            
            if (userInfo && userInfo.avatarUrl && userInfo.nickName) {
                this.setData({
                    showLoginBtn: false,
                    userInfo: userInfo
                })
                console.log('用户信息完整，隐藏登录按钮，更新用户信息')
            } else {
                this.setData({
                    showLoginBtn: true,
                    userInfo: null
                })
                console.log('用户信息不完整，显示登录按钮，清空用户信息')
            }
        },

        async onAuthUserInfo(event) {
            console.log(event.detail)
            if (event.detail.userInfo) {
                this.handleUserInfoSuccess(event.detail.userInfo)
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
