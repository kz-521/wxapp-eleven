// pages/home/home.js
const { api } = require('../../utils/api.js')
import { Spu } from '../../models/spu.js'

Page({
    data: {
        isLogin: false,
        drinks: [], // 改为空数组，从API获取数据
        bannerList: [], // banner数据
        userLocation: null, // 用户位置
        distance: '', // 距离
        storeLocation: {
            latitude: 30.3972, // 杭州市余杭区瓶窑镇的经纬度
            longitude: 120.0183,
            name: '清汀.新养生空间',
            address: '余杭区瓶窑镇南山村横山60号1幢1楼106室'
        }
    },

  async onLoad() {
       
        this.checkLoginStatus()
        
        // 获取今日推荐数据
        await this.getRecommendData()
        
        // 获取banner数据
        await this.getBannerData()
        
        // 获取用户位置和计算距离
        this.findUserLocation()
    },

    onShow() {
        console.log('Home页面显示')
    },

    /**
     * 获取banner数据
     */
    getBannerData() {
        try {
            console.log('开始获取banner数据')
            api.getBannerByName('b1').then(res => {
                console.log('Banner API响应:', res)
                if (res.code === 200 && res.result && res.result.items) {
                    console.log('获取banner成功:', res.result.items)
                    this.setData({
                        bannerList: res.result.items
                    })
                } else {
                    console.log('Banner数据格式不正确:', res)
                }
            }).catch(err => {
                console.error('获取banner失败:', err)
                // 即使API失败也不影响页面显示
            })
        } catch (error) {
            console.error('getBannerData方法执行错误:', error)
        }
    },

    /**
     * 检查登录状态
     */
    checkLoginStatus() {
        const userInfo = wx.getStorageSync('userInfo')
        if (userInfo) {
            this.setData({
                isLogin: true
            })
            console.log('用户已登录:', userInfo)
        } else {
            this.setData({
                isLogin: false
            })
            console.log('用户未登录')
        }
    },

    // 跳转到登录页面
    goToLogin() {
        // 检查是否已经登录
        const userInfo = wx.getStorageSync('userInfo')
        if (userInfo) {
            wx.showToast({ title: '您已登录', icon: 'none' })
            return
        }
        // 直接调用微信授权
        this.getUserProfile()
    },

    /**
     * 获取token和用户信息
     */
    getTokenAndUserInfo(code) {
        console.log('微信登录code:', code)
        
        // 调用正确的token接口
        api.wxLogin(code).then(res => {
          console.log(res, 'resxcxxcxc');
            if (res.code === 200 && res.result && res.result.token) {
                // 保存token
                wx.setStorageSync('wechat_token', res.result.token)
                console.log('Token保存成功:', res.result.token)
                
                // 立即重新获取今日推荐数据（现在有token了）
                this.getRecommendData()
                
                // 立即重新获取banner数据（现在有token了）
                this.getBannerData()
                
                // 获取用户信息
                this.getUserProfile()
            } else {
                console.error('获取token失败:', res)
                wx.showToast({ title: '登录失败', icon: 'none' })
            }
        }).catch(err => {
            console.error('获取token失败:', err)
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
                console.log('获取用户信息成功:', res.userInfo)
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

                // 可以在这里调用后端API，将用户信息发送到服务器
                this.sendUserInfoToServer(res.userInfo)
            },
            fail: (err) => {
                console.error('获取用户信息失败:', err)
                if (err.errMsg.includes('cancel')) {
                    wx.showToast({ title: '用户取消授权', icon: 'none' })
                } else {
                    wx.showToast({ title: '获取用户信息失败', icon: 'none' })
                }
            }
        })
    },

    /**
     * 发送用户信息到服务器
     */
    sendUserInfoToServer(userInfo) {
        console.log('发送用户信息到服务器:', userInfo)
        
        // 这里可以根据需要调用相应的API
        // 如果不需要调用API，可以注释掉下面的代码
        /*
        api.updateUserInfo(userInfo).then(res => {
            console.log('用户信息更新成功:', res)
            if (res.code === 200) {
                // 保存服务器返回的用户ID等信息
                wx.setStorageSync('userId', res.result.userId)
                wx.setStorageSync('token', res.result.token)
            }
        }).catch(err => {
            console.error('用户信息更新失败:', err)
            // 即使API调用失败，本地登录状态仍然有效
        })
        */
        
        // 如果需要使用微信登录的token，可以在这里设置
        // wx.setStorageSync('wechat_token', 'your_wechat_token_here')
    },

    // 跳转到购物车页面
    goToCart() {
        wx.navigateTo({
            url: '/pages/cart/cart'
        })
    },

    // 跳转到测试体质页面
    goToTest() {
        wx.navigateTo({
            url: '/pages/test/index'
        })
    },

    // 跳转到活动页面
    goToActivity() {
        wx.showToast({
            title: '暂无活动',
            icon: 'none'
        })
    },

    /**
     * 退出登录
     */
    logout() {
        wx.showModal({
            title: '提示',
            content: '确定要退出登录吗？',
            success: (res) => {
                if (res.confirm) {
                    // 清除本地存储的用户信息
                    wx.removeStorageSync('userInfo')
                    wx.removeStorageSync('userId')
                    wx.removeStorageSync('token')
                    wx.removeStorageSync('wechat_token')
                    wx.removeStorageSync('access_token')
                    
                    // 清除缓存的优惠券数据
                    wx.removeStorageSync('selectedCoupon')
                    wx.removeStorageSync('couponAmount')
                    wx.removeStorageSync('payAmount')
                    
                    // 更新页面状态
                    this.setData({
                        isLogin: false
                    })
                    
                    wx.showToast({ 
                        title: '已退出登录', 
                        icon: 'success' 
                    })
                }
            }
        })
    },

    /**
     * 获取今日推荐数据
     */
    async getRecommendData() {
        try {
            console.log('开始获取今日推荐数据')
            
            // 检查token是否存在
            const token = wx.getStorageSync('wechat_token') || wx.getStorageSync('access_token')
            console.log('首页 - Token检查:', token ? '存在' : '不存在')
            
            const response = await Spu.getRecommendSpu(3)
            console.log('今日推荐API响应:', response)
            
            const formattedDrinks = Spu.formatRecommendData(response)
            if (formattedDrinks) {
                console.log('获取今日推荐成功:', formattedDrinks)
                this.setData({
                    drinks: formattedDrinks
                })
            } else {
                console.log('今日推荐数据格式不正确:', response)
                // 如果API失败，使用默认数据
                this.setDefaultDrinks()
            }
        } catch (error) {
            console.error('获取今日推荐失败:', error)
            // 如果API失败，使用默认数据
            this.setDefaultDrinks()
        }
    },

    /**
     * 设置默认饮品数据（API失败时的备用数据）
     */
    setDefaultDrinks() {
        const defaultDrinks = Spu.getDefaultRecommendData()
        this.setData({
            drinks: defaultDrinks
        })
    },

    /**
     * 获取用户位置
     */
    findUserLocation() {
        console.log('开始获取用户位置')
        wx.getLocation({
            type: 'gcj02',
            success: (res) => {
                console.log('获取用户位置成功:', res)
                this.setData({
                    userLocation: {
                        latitude: res.latitude,
                        longitude: res.longitude
                    }
                })
                
                // 计算距离
                this.getDistance(res.latitude, res.longitude, this.data.storeLocation.latitude, this.data.storeLocation.longitude)
            },
            fail: (err) => {
                console.error('获取用户位置失败:', err)
                wx.showToast({
                    title: '获取位置失败',
                    icon: 'none'
                })
            }
        })
    },

    /**
     * 计算距离
     */
    getDistance(lat1, lng1, lat2, lng2) {
        const radLat1 = this.Rad(lat1)
        const radLat2 = this.Rad(lat2)
        const a = radLat1 - radLat2
        const b = this.Rad(lng1) - this.Rad(lng2)
        const s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)))
        const distance = s * 6378.137
        const roundedDistance = Math.round(distance * 10000) / 10000
        const distanceText = roundedDistance.toFixed(2) + '公里'
        
        console.log('计算的距离:', distanceText)
        
        this.setData({
            distance: distanceText
        })
        
        return distanceText
    },

    /**
     * 角度转弧度
     */
    Rad(d) {
        return d * Math.PI / 180.0
    }
})


