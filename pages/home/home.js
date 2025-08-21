const { api } = require('../../utils/api.js')
import { Spu } from '../../models/spu.js'
import { Location } from '../../utils/location.js'

Page({
    data: {
        isLogin: false,
        drinks: [], // 改为空数组，从API获取数据
        bannerList: [], // banner数据
        userLocation: null, // 用户位置
        distance: '', // 距离
        storeLocation: {
          latitude: 30.384879, // 杭州市余杭区瓶窑镇的经纬度
          longitude: 119.952247,
          name: '清汀.新养生空间',
          address: '余杭区瓶窑镇南山村横山60号1幢1楼106室'
        }
    },

    async onLoad() {
        this.checkLoginStatus()
        
        // 获取今日推荐数据
        this.getRecommendData()
        
        // 获取用户位置和计算距离
        this.initUserLocation()
    },

    onShow() {
        // 检查登录状态是否发生变化
        const userInfo = wx.getStorageSync('userInfo')
        const currentLoginStatus = userInfo ? true : false
        if (this.data.isLogin !== currentLoginStatus) {
            this.checkLoginStatus()
        }
    },

    /**
     * 检查登录状态
     */
    checkLoginStatus() {
      const userInfo = wx.getStorageSync('userInfo')
      this.setData({
          isLogin: userInfo ? true : false
      })
    },

    /**
     * 跳转到登录页面
     */
    goToLogin() {
        // 检查是否已经登录
        const userInfo = wx.getStorageSync('userInfo')
        if (userInfo) {
            wx.showToast({ title: '您已登录', icon: 'none' })
            return
        }
        // 先尝试一次性获取用户信息
        this.getUserProfile()
    },

    /**
     * 获取token和用户信息
     */
    getTokenAndUserInfo(code) {
        // 调用正确的token接口
        api.wxLogin(code).then(res => {
            if (res.code === 200 && res.result && res.result.token) {
                wx.setStorageSync('wechat_token', res.result.token)
                console.log('Token保存成功:', res.result.token)
                
                // 获取用户信息
                this.getUserProfile()
            } else {
                wx.showToast({ title: '登录失败', icon: 'none' })
            }
        }).catch(err => {
            wx.showToast({ title: '登录失败', icon: 'none' })
        })
    },

    /**
     * 获取用户信息
     */
    getUserProfile() {
        wx.getUserProfile({
            desc: '用于完善用户资料',
            success: (res) => {
                // 保存用户信息到本地存储
                wx.setStorageSync('userInfo', res.userInfo)
                
                // 更新页面状态
                this.setData({
                    isLogin: true
                })

                wx.showToast({ 
                    title: '登录成功', 
                    icon: 'success' 
                })
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
                    console.log('用户输入昵称:', res.content)
                    const userInfo = wx.getStorageSync('userInfo') || {}
                    userInfo.nickName = res.content
                    // 如果没有头像，使用默认头像
                    if (!userInfo.avatarUrl) {
                        userInfo.avatarUrl = '/imgs/logo.png'
                    }
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
        // 更新页面状态
        this.setData({
            isLogin: true
        })

        wx.showToast({ 
            title: '登录成功', 
            icon: 'success' 
        })
    },

    /**
     * 跳转到购物车页面
     */
    goToCart() {
        wx.switchTab({  
            url: '/pages/category/category'
        })
    },

    /**
     * 跳转到测试体质页面
     */
    goToTest() {
        wx.navigateTo({
            url: '/pages/test/index'
        })
    },

    /**
     * 跳转到活动页面
     */
    goToActivity() {
        wx.showToast({
            title: '暂无活动',
            icon: 'none'
        })
    },

    /**
     * 获取今日推荐数据
     */
    async getRecommendData() {
        try {
            const response = await Spu.getRecommendSpu(3)
            
            // 检查response是否有效
            if (!response) return
            const formattedDrinks = Spu.formatRecommendData(response)
            if (formattedDrinks) {
                this.setData({
                    drinks: formattedDrinks
                })
            } else {
            }
        } catch (error) {
        }
    },

    /**
     * 初始化用户位置
     */
    async initUserLocation() {
        try {
            // 先检查位置权限
            const permissionStatus = await Location.checkLocationPermission()
            if (permissionStatus.status === 'denied') {
                try {
                    await Location.requestLocationPermission()
                } catch (err) {
                    this.setData({ distance: '位置权限未开启' })
                    return
                }
            }
            // 获取位置并计算距离
            const result = await Location.getUserLocationAndDistance(this.data.storeLocation)
            this.setData({
                userLocation: result.userLocation,
                distance: result.distanceText
            })
        } catch (error) {
            if (error.errMsg && error.errMsg.includes('auth deny')) {
                this.setData({ distance: '位置权限被拒绝' })
            } else if (error.errMsg && error.errMsg.includes('timeout')) {
                this.setData({ distance: '定位超时' })
            } else {
                this.setData({ distance: '定位失败' })
            }
        }
    }
})


