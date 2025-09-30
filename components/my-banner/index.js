// components/my-banner/index.js
import {User} from "../../models/user";
import {promisic} from "../../utils/util";
const { api } = require("../../utils/api.js");

Component({
    /**
     * 组件的属性列表
     */
    properties: {
        couponCount: Number,
        balance: {
            type: Number,
            value: 0
        },
        userInfo: {
            type: Object,
            value: null
        },
        isLoggedIn: {
            type: Boolean,
            value: false
        }
    },

    /**
     * 组件的初始数据
     */
    data: {
        showLoginBtn: true,
        displayUserInfo: null,
        isUploading: false // 头像上传状态
    },

    lifetimes: {
        async attached() {
            console.log('my-banner组件附加，接收到的属性:', {
                isLoggedIn: this.properties.isLoggedIn,
                userInfo: this.properties.userInfo,
                balance: this.properties.balance,
                couponCount: this.properties.couponCount
            })

            // 获取七牛云上传token
            await this.getQiniuUploadToken()

            this.updateDisplayState()
        }
    },

    observers: {
        'isLoggedIn, userInfo': function(isLoggedIn, userInfo) {
            console.log('my-banner组件监听到登录状态或用户信息变化:', { isLoggedIn, userInfo })
            this.updateDisplayState()
        },
        'couponCount': function (couponCount) {
            console.log('my-banner组件接收到优惠券数量更新:', couponCount)
        },
        'balance': function (balance) {
            console.log('my-banner组件接收到余额更新:', balance)
        }
    },

    /**
     * 组件的方法列表
     */
    methods: {
        /**
         * 更新显示状态
         */
        updateDisplayState() {
            const { isLoggedIn, userInfo } = this.properties

            console.log('更新Banner显示状态:', { isLoggedIn, userInfo })

            if (isLoggedIn && userInfo) {
                // 用户已登录且有API返回的用户信息
                // 统一用户信息字段格式
                const formattedUserInfo = {
                    ...userInfo,
                    avatarUrl: userInfo. avatarUrl || userInfo.avatarUrl,
                    nickName: userInfo.nickname || userInfo.nickName
                }

                this.setData({
                    showLoginBtn: false,
                    displayUserInfo: formattedUserInfo
                })
            } else {
                // 用户未登录或没有用户信息
                // 检查本地存储的授权信息（头像和昵称）
                const localUserInfo = wx.getStorageSync('userInfo')
                const hasLocalAuth = localUserInfo && localUserInfo.avatarUrl && (localUserInfo.nickName || localUserInfo.nickname)

                if (hasLocalAuth) {
                    // 有本地授权信息但未登录API，显示授权信息但提示需要登录
                    const formattedLocalUserInfo = {
                        ...localUserInfo,
                        nickName: localUserInfo.nickName || localUserInfo.nickname
                    }
                    this.setData({
                        showLoginBtn: true,
                        displayUserInfo: formattedLocalUserInfo
                    })
                } else {
                    // 完全未授权
                    this.setData({
                        showLoginBtn: true,
                        displayUserInfo: null
                    })
                }
            }
        },

        /**
         * 点击头像事件
         */
        onAvatarTap() {
            const { isLoggedIn } = this.properties

            // 如果已登录，显示已登录信息
            if (isLoggedIn) {
                wx.showToast({
                    title: '用户已登录',
                    icon: 'success',
                    duration: 1500
                })
                return
            }

            // 检查是否有本地授权信息
            const localUserInfo = wx.getStorageSync('userInfo')
            const hasLocalAuth = localUserInfo && localUserInfo.avatarUrl && localUserInfo.nickName

            if (hasLocalAuth) {
                // 有本地授权，提示需要登录
                wx.showModal({
                    title: '登录提示',
                    content: '检测到您已授权头像和昵称，但尚未登录系统。是否现在登录？',
                    success: (res) => {
                        if (res.confirm) {
                            // 跳转到首页执行微信登录
                            this.navigateToLogin()
                        }
                    }
                })
            } else {
                // 没有本地授权，先获取授权
                wx.showModal({
                    title: '授权提示',
                    content: '需要获取您的头像和昵称信息，是否授权？',
                    success: (res) => {
                        if (res.confirm) {
                            this.getUserProfile()
                        } else {
                            wx.showToast({
                                title: '您取消了授权',
                                icon: 'none',
                                duration: 1500
                            })
                        }
                    }
                })
            }
        },

        /**
         * 跳转到登录（首页微信登录）
         */
        navigateToLogin() {
            wx.switchTab({
                url: '/pages/home/home'
            })
        },

        /**
         * 获取七牛云上传token
         */
        async getQiniuUploadToken() {
            try {
                console.log('获取七牛云上传token...')

                const tokenResponse = await api.getQiniuToken()
                console.log('七牛云token响应:', tokenResponse)

                if (tokenResponse && (tokenResponse.code === 0 || tokenResponse.code === 200) && tokenResponse.result) {
                    const token = tokenResponse.result.uptoken || tokenResponse.result
                    wx.setStorageSync('uptoken', token)
                    console.log('七牛云token获取成功')
                } else {
                    console.warn('七牛云token获取失败，使用空token')

                }
            } catch (error) {
                console.error('获取七牛云token失败:', error)
            }
        },

        /**
         * 上传头像到七牛云（直传）
         */
        async uploadAvatarToQiniu(filePath) {
            return new Promise((resolve, reject) => {
                const that = this

                console.log('开始上传头像到七牛云（直传）:', { filePath, token: that.data.upToken })

                // 七牛云直传
                wx.uploadFile({
                    url: 'https://up-z0.qiniup.com', // 七牛云直传地址
                    filePath: filePath,
                    name: 'file',
                    bucket: 'healthzhi',
                    formData: {
                        token: wx.getStorageSync('uptoken') // 上传密钥
                    },
                    success: (res) => {
                        console.log('七牛云直传成功:', res)
                        try {
                            const data = JSON.parse(res.data)
                            console.log('七牛云返回数据:', data)

                            if (data.key) {
                                // 构建完整的图片URL
                                const imageUrl = `https://qn.jixiangjiaoyu.com/${data.key}`
                                console.log('构建的图片URL:', imageUrl)
                                resolve(imageUrl)
                            } else {
                                console.error('七牛云返回数据中没有key字段:', data)
                                reject(new Error('上传响应格式错误'))
                            }
                        } catch (parseError) {
                            console.error('解析七牛云响应失败:', parseError, res.data)
                            reject(parseError)
                        }
                    },
                    fail: (err) => {
                        console.error('七牛云直传失败:', err)
                        reject(err)
                    }
                })
            })
        },

        /**
         * 更新用户头像信息
         */
        async updateUserAvatar(avatarUrl) {
            try {
                console.log('更新用户头像信息:', avatarUrl)

                const updateData = {
                    avatarUrl: avatarUrl // 使用正确的字段名
                }

                const response = await User.updateUserInfo(updateData)
                console.log('用户头像更新响应:', response)

                if (response && (response.code === 0 || response.code === 200)) {
                    console.log('用户头像更新成功')
                    return true
                } else {
                    console.error('用户头像更新失败:', response)
                    return false
                }
            } catch (error) {
                console.error('更新用户头像异常:', error)
                return false
            }
        },

        /**
         * 检查并获取用户信息
         */
        async checkAndGetUserInfo() {
            const userInfo = wx.getStorageSync('userInfo')
            if (userInfo && userInfo.avatarUrl && userInfo.nickName) {
                return
            }

            // 先尝试一次性获取用户信息
            this.getUserProfile()
        },

        /**
         * 一次性获取用户信息
         */
        getUserProfile() {
            wx.getUserProfile({
                desc: '用于完善用户资料',
                success: (res) => {
                    this.handleUserInfoSuccess(res.userInfo)
                },
                fail: (err) => {
                    if (err.errMsg.includes('cancel')) {
                        wx.showToast({ title: '用户取消授权', icon: 'none' })
                    } else {
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
            // 由于wx.chooseAvatar不兼容，直接获取昵称并使用默认头像
            const userInfo = wx.getStorageSync('userInfo') || {}
            userInfo.avatarUrl = '/imgs/logo.png' // 使用默认头像
            wx.setStorageSync('userInfo', userInfo)

            // 直接获取昵称
            this.getNickName()
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
            this.handleUserInfoSuccess(userInfo)
        },

        /**
         * 处理用户信息获取成功
         */
        async handleUserInfoSuccess(userInfo) {
            try {
                // 保存用户信息到本地存储
                wx.setStorageSync('userInfo', userInfo)

                // 更新组件状态
                this.setData({
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
                    // console.log('用户信息更新到服务器成功')
                }

                // 通知父组件用户信息已更新
                this.triggerEvent('userInfoUpdated', { userInfo })

            } catch (error) {
                wx.showToast({
                    title: '获取用户信息失败',
                    icon: 'none'
                })
            }
        },

        /**
         * 刷新用户信息状态（由父页面调用）
         */
        refreshUserInfo(isLoggedIn, userInfo) {
            console.log('my-banner组件接收刷新请求:', { isLoggedIn, userInfo })

            // 更新属性值（模拟属性变化）
            this.setData({
                'properties.isLoggedIn': isLoggedIn,
                'properties.userInfo': userInfo
            })

            // 更新显示状态
            this.updateDisplayState()
        },

        async onAuthUserInfo(event) {
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
            wx.navigateTo({
                url: '/pages/recharge/index'
            })
        },

        /**
         * 选择头像回调（微信开放能力）
         */
        async onChooseAvatar(e) {
            try {
                const avatarUrl = e.detail && e.detail.avatarUrl

                if (!avatarUrl) {
                    wx.showToast({ title: '未选择头像', icon: 'none' })
                    return
                }

                console.log('用户选择了头像:', avatarUrl)

                // 设置上传状态
                this.setData({ isUploading: true })
                wx.showLoading({ title: '上传头像中...' })

                try {
                    // 上传头像到七牛云
                    const qiniuImageUrl = await this.uploadAvatarToQiniu(avatarUrl)
                    console.log('头像上传七牛云成功:', qiniuImageUrl)

                    // 更新本地存储的用户信息
                    const localUserInfo = wx.getStorageSync('userInfo') || {}
                    localUserInfo.avatarUrl = qiniuImageUrl
                    wx.setStorageSync('userInfo', localUserInfo)

                    // 检查用户是否已登录
                    const { isLoggedIn } = this.properties
                    if (isLoggedIn) {
                        // 用户已登录，更新服务器用户信息
                        const updateSuccess = await this.updateUserAvatar(qiniuImageUrl)
                        if (updateSuccess) {
                            wx.showToast({ title: '头像更新成功', icon: 'success' })

                            // 通知父组件刷新用户信息
                            this.triggerEvent('userInfoUpdated', {
                                userInfo: { ...localUserInfo,  avatarUrl: qiniuImageUrl }
                            })
                        } else {
                            wx.showToast({ title: '头像更新失败', icon: 'none' })
                        }
                    } else {
                        // 用户未登录，只更新本地显示
                        wx.showToast({ title: '头像已选择，请登录后同步', icon: 'success' })
                    }

                    // 更新组件显示
                    this.updateDisplayState()

                } catch (uploadError) {
                    console.error('头像上传失败:', uploadError)

                    let errorMsg = '头像上传失败'
                    if (uploadError.message === '上传token为空') {
                        errorMsg = '上传凭证无效，请重试'
                    } else if (uploadError.message) {
                        errorMsg = uploadError.message
                    }

                    wx.showToast({ title: errorMsg, icon: 'none' })
                }

            } catch (err) {
                console.error('选择头像失败:', err)
                wx.showToast({ title: '选择头像失败', icon: 'none' })
            } finally {
                // 清除上传状态和loading
                this.setData({ isUploading: false })
                wx.hideLoading()
            }
        }

    }
})
