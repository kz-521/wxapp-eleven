// pages/cart/cart.js
const { api } = require('../../utils/api.js')

Page({
    /**
     * 页面的初始数据
     */
    data: {
        currentCategory: 0,
        showPopup: false,
        showCartDetail: false,
        bannerList: [], // banner数据
        userInfo: null, // 用户信息
        allProducts: [], // 所有商品数据
        constitutionQuestions: [], // 体质测试问题
        currentQuestionIndex: 0, // 当前问题索引
        testAnswers: [], // 测试答案
        testResult: null, // 测试结果
        products: [],
        cartItems: [],
        cartCount: 0,
        totalPrice: 0
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        // 隐藏tabbar
        wx.hideTabBar()
        this.loadCartData()
        // 获取推荐商品数据
        this.getRecommendData()
        // 获取banner数据
        this.getBannerData()
        // 获取用户信息
        this.getUserInfo()
        // 获取所有商品数据
        this.getAllProducts()
        // 初始化加载第一个分类的商品
        this.loadProductsByCategory(1)
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {
        // 隐藏tabbar
        wx.hideTabBar()
        this.loadCartData()
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide() {
        // 页面隐藏时显示tabbar
        wx.showTabBar()
    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload() {
        // 页面卸载时显示tabbar
        wx.showTabBar()
    },

    // 加载购物车数据
    loadCartData() {
        const cartItems = wx.getStorageSync('cartItems') || []
        const cartCount = cartItems.reduce((total, item) => total + item.count, 0)
        const totalPrice = cartItems.reduce((total, item) => total + (parseFloat(item.price) * item.count), 0)
        
        this.setData({
            cartItems,
            cartCount,
            totalPrice: totalPrice.toFixed(2)
        })
    },

    // 添加到购物车
    addToCart(event) {
        const index = event.currentTarget.dataset.index
        const product = this.data.products[index]
        
        let cartItems = wx.getStorageSync('cartItems') || []
        const existingItem = cartItems.find(item => item.name === product.name)
        
        if (existingItem) {
            existingItem.count += 1
        } else {
            cartItems.push({
                ...product,
                count: 1
            })
        }
        
        wx.setStorageSync('cartItems', cartItems)
        this.loadCartData()
        
        wx.showToast({
            title: '已添加到购物车',
            icon: 'success'
        })
    },

    // 增加商品数量
    increaseQuantity(event) {
        const index = event.currentTarget.dataset.index
        let cartItems = wx.getStorageSync('cartItems') || []
        
        if (cartItems[index]) {
            cartItems[index].count += 1
            wx.setStorageSync('cartItems', cartItems)
            this.loadCartData()
        }
    },

    // 减少商品数量
    decreaseQuantity(event) {
        const index = event.currentTarget.dataset.index
        let cartItems = wx.getStorageSync('cartItems') || []
        
        if (cartItems[index] && cartItems[index].count > 1) {
            cartItems[index].count -= 1
            wx.setStorageSync('cartItems', cartItems)
            this.loadCartData()
        } else if (cartItems[index] && cartItems[index].count === 1) {
            // 如果数量为1，则移除商品
            cartItems.splice(index, 1)
            wx.setStorageSync('cartItems', cartItems)
            this.loadCartData()
            
            wx.showToast({
                title: '已移除商品',
                icon: 'success'
            })
        }
    },

    // 显示购物车详情
    showCartDetail() {
        this.setData({
            showCartDetail: true
        })
    },

    // 关闭购物车详情
    closeCartDetail() {
        this.setData({
            showCartDetail: false
        })
    },

    // 清空购物车
    clearCart() {
        wx.showModal({
            title: '确认清空',
            content: '确定要清空购物车吗？',
            success: (res) => {
                if (res.confirm) {
                    wx.setStorageSync('cartItems', [])
                    this.loadCartData()
                    this.closeCartDetail()
                    wx.showToast({
                        title: '购物车已清空',
                        icon: 'success'
                    })
                }
            }
        })
    },

    // 去结算
    goToCheckout() {
        if (this.data.cartCount <= 0) {
            wx.showToast({
                title: '购物车为空',
                icon: 'none'
            })
            return
        }
        
        // 直接跳转到提交订单页面
        wx.navigateTo({
            url: '/pages/order-submit/index'
        })
    },

    // 关闭弹出层
    closePopup() {
        this.setData({
            showPopup: false
        })
    },

    // 阻止事件冒泡
    stopPropagation() {
        // 阻止事件冒泡
    },

    // 确认结算
    confirmCheckout() {
        this.setData({
            showPopup: false
        })
        
        wx.showToast({
            title: '结算成功',
            icon: 'success'
        })
        
        // 清空购物车
        wx.setStorageSync('cartItems', [])
        this.loadCartData()
    },

    // 切换分类
    switchCategory(event) {
        const index = event.currentTarget.dataset.index
        
        this.setData({
            currentCategory: index
        })
        // 根据分类加载商品数据
        const categoryId = Number(index) + 1 // 分类ID从1开始
        this.loadProductsByCategory(categoryId)
    },

    /**
     * 根据分类加载商品数据
     */
    loadProductsByCategory(categoryId) {
        console.log('开始加载分类商品，categoryId:', categoryId)
        console.log('API调用: /qingting/v1/spu/category/' + categoryId)
        
        api.getSpuByCategory(categoryId).then(res => {
            console.log('API响应:', res)
            if (res.code === 200 && res.result && res.result.list) {
                console.log('获取分类商品成功:', res.result.list)
                // 更新商品列表数据
                const categoryProducts = res.result.list.map(item => ({
                    id: item.id,
                    name: item.title,
                    tag1: item.tags ? item.tags.split(',')[0] : '',
                    tag2: item.tags ? item.tags.split(',')[1] : '',
                    price: item.discount_price || item.price,
                    image: item.img,
                    subtitle: item.subtitle,
                    description: item.description,
                    originalPrice: item.price,
                    skuList: item.skuList || item.sku_list || [],
                    categoryId: item.category_id
                }))
                
                this.setData({
                    products: categoryProducts
                })
            }
        }).catch(err => {
            console.error('获取分类商品失败:', err)
        })
    },

    /**
     * 获取所有商品列表
     */
    getAllProducts() {
        api.getSpuList().then(res => {
            if (res.code === 200 && res.result && res.result.list) {
                console.log('获取所有商品成功:', res.result.list)
                const allProducts = res.result.list.map(item => ({
                    id: item.id,
                    name: item.title,
                    tag1: item.tags ? item.tags.split(',')[0] : '',
                    tag2: item.tags ? item.tags.split(',')[1] : '',
                    price: item.discount_price || item.price,
                    image: item.img,
                    subtitle: item.subtitle,
                    description: item.description,
                    originalPrice: item.price,
                    categoryId: item.category_id
                }))
                
                this.setData({
                    allProducts: allProducts
                })
            }
        }).catch(err => {
            console.error('获取所有商品失败:', err)
        })
    },

    /**
     * 获取推荐商品数据
     */
    getRecommendData() {
        api.getRecommendSpu(3).then(res => {
            if (res.code === 200 && res.result && res.result.list) {
                console.log('获取推荐商品成功:', res.result.list)
                // 更新商品列表数据
                const recommendProducts = res.result.list.map(item => ({
                    id: item.id,
                    name: item.title,
                    tag1: item.tags ? item.tags.split(',')[0] : '',
                    tag2: item.tags ? item.tags.split(',')[1] : '',
                    price: item.discount_price || item.price,
                    image: item.img,
                    subtitle: item.subtitle,
                    description: item.description,
                    originalPrice: item.price,
                    skuList: item.skuList || []
                }))
                
                this.setData({
                    products: recommendProducts
                })
            }
        }).catch(err => {
            console.error('获取推荐商品失败:', err)
        })
    },

    /**
     * 获取banner数据
     */
    getBannerData() {
        api.getBannerByName('b1').then(res => {
            if (res.code === 200 && res.result && res.result.items) {
                console.log('获取banner成功:', res.result.items)
        this.setData({
                    bannerList: res.result.items
                })
            }
        }).catch(err => {
            console.error('获取banner失败:', err)
        })
    },

    /**
     * 获取用户信息
     */
    getUserInfo() {
        api.getUserDetail().then(res => {
            if (res.code === 0 && res.result) {
                console.log('获取用户信息成功:', res.result)
        this.setData({
                    userInfo: res.result
                })
            }
        }).catch(err => {
            console.error('获取用户信息失败:', err)
        })
    },

    /**
     * 更新用户信息
     */
    updateUserInfo(userData) {
        api.updateUser(userData).then(res => {
            if (res.code === 0) {
                console.log('更新用户信息成功:', res)
                wx.showToast({
                    title: '更新成功',
                    icon: 'success'
                })
            }
        }).catch(err => {
            console.error('更新用户信息失败:', err)
        })
    },

    /**
     * 获取商品详情
     */
    getSpuDetail(spuId) {
        api.getSpuDetail(spuId).then(res => {
            if (res.code === 200 && res.result) {
                console.log('获取商品详情成功:', res.result)
                return res.result
            }
        }).catch(err => {
            console.error('获取商品详情失败:', err)
        })
    },

    /**
     * 点击商品项
     */
    onProductClick(event) {
        const index = event.currentTarget.dataset.index
        const product = this.data.products[index]
        console.log('点击商品:', product)
        
        // 获取商品详情
        this.getSpuDetail(product.id).then(detail => {
            if (detail) {
                // 这里可以跳转到商品详情页或显示详情弹窗
                wx.showToast({
                    title: '商品详情功能开发中',
                    icon: 'none'
                })
            }
        })
    },

    /**
     * 获取体质测试问题
     */
    getConstitutionQuestions() {
        api.getConstitutionQuestions().then(res => {
            if (res.code === 0 && res.result && res.result.questions) {
                console.log('获取体质测试问题成功:', res.result.questions)
                this.setData({
                    constitutionQuestions: res.result.questions,
                    currentQuestionIndex: 0,
                    testAnswers: []
                })
            }
        }).catch(err => {
            console.error('获取体质测试问题失败:', err)
        })
    },

    /**
     * 提交体质测试
     */
    submitConstitutionTest(answers) {
        api.submitConstitutionTest(answers).then(res => {
            if (res.code === 0 && res.result) {
                console.log('体质测试提交成功:', res.result)
        this.setData({
                    testResult: res.result
                })
                
                wx.showToast({
                    title: '测试完成',
                    icon: 'success'
                })
                
                // 这里可以跳转到结果页面或显示结果
                this.showTestResult(res.result)
            }
        }).catch(err => {
            console.error('体质测试提交失败:', err)
        })
    },

    /**
     * 显示测试结果
     */
    showTestResult(result) {
        const { primary_constitution, scores } = result.result
        
        wx.showModal({
            title: '体质测试结果',
            content: `主要体质：${primary_constitution.type}\n特征：${primary_constitution.features}\n建议：${primary_constitution.keywords}`,
            showCancel: false,
            confirmText: '确定'
        })
    },

    /**
     * 支付功能
     */
    payOrder(orderData) {
        api.payPreorder(orderData).then(res => {
            console.log('支付请求成功:', res)
            // 处理支付结果
            if (res.code === 0) {
                wx.showToast({
                    title: '支付成功',
                    icon: 'success'
                })
            } else {
                wx.showToast({
                    title: res.msg || '支付失败',
                    icon: 'none'
                })
            }
        }).catch(err => {
            console.error('支付失败:', err)
            wx.showToast({
                title: '支付失败',
                icon: 'none'
            })
        })
    }
})
