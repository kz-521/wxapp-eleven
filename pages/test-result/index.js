// pages/test-result/test-result.js
const { api } = require('../../utils/api.js')

Page({
  data: {
    result: null,
    recommendProducts: [],
    backgroundImage: '/imgs/test1.png' // 默认背景图片
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const that = this
    
    // 检查是否有result_id参数，表示从体质测评页面跳转过来
    if (options.result_id) {
      // 根据result_id获取体质测评结果
      this.getTestResult(options.result_id)
    } else {
      // 通过 eventChannel 接收数据
      const eventChannel = this.getOpenerEventChannel && this.getOpenerEventChannel()
      if (eventChannel) {
        eventChannel.on('testResult', function(data) {
          // 处理接收到的数据，设置图片
          that.handleTestResultData(data)
        })
      }
    }
    
    // 调用今日推荐接口
    this.getRecommendProducts()
  },

  // 获取体质测评结果
  getTestResult(resultId) {
    // 这里应该调用实际的接口，现在使用模拟数据
    const mockResult = {
      "code": 0,
      "msg": "测试完成",
      "result": {
        "result_id": resultId,
        "primary_constitution": {
          "type": "木行",
          "features": "肝气旺盛，追求效率",
          "problems": "偏头痛、月经不调",
          "keywords": "疏肝理气，晨起拉伸"
        },
        "secondary_constitution": null,
        "scores": {
          "木": 3,
          "火": 1,
          "土": 2,
          "金": 1,
          "水": 1
        }
      }
    }
    
    // 处理返回的数据
    this.handleTestResult(mockResult)
  },

  // 处理体质测评结果数据
  handleTestResult(response) {
    if (response.code === 0 && response.result) {
      const result = response.result
      this.handleTestResultData(result)
    }
  },

  // 处理体质测评结果数据（通用方法）
  handleTestResultData(result) {
    console.log('处理体质测评结果数据:', result)
    
    // 根据体质类型设置背景图片和右侧图片
    const typeImageMap = {
      '木行': '/imgs/test1.png',
      '金行': '/imgs/test2.png', 
      '水行': '/imgs/test4.png',
      '土行': '/imgs/test3.png',
      '火行': '/imgs/test5.png'
    }
    
    const typeRightImageMap = {
      '木行': '/imgs/test3right.png',
      '金行': '/imgs/test2right.png', 
      '水行': '/imgs/test4right.png',
      '土行': '/imgs/test1right.png',
      '火行': '/imgs/test5right.png'
    }
    
    const backgroundImage = typeImageMap[result.primary_constitution.type] || '/imgs/test1.png'
    const rightImage = typeRightImageMap[result.primary_constitution.type] || '/imgs/test1right.png'
    
    console.log('体质类型:', result.primary_constitution.type)
    console.log('背景图片:', backgroundImage)
    console.log('右侧图片:', rightImage)
    
    // 设置体质测评结果数据
    this.setData({
      result: {
        primary_constitution: result.primary_constitution,
        secondary_constitution: result.secondary_constitution,
        scores: result.scores,
        result_id: result.result_id
      },
      backgroundImage: backgroundImage,
      rightImage: rightImage
    })
  },

  // 获取今日推荐商品
  getRecommendProducts() {
    api.getRecommendSpu(3).then(res => {
      console.log('推荐商品接口响应:', res)
      
      if (res.code === 200 && res.result && res.result.list) {
        const recommendProducts = res.result.list.map(item => ({
          id: item.id,
          name: item.title,
          tags: item.tags ? item.tags.split(',').filter(tag => tag.trim()) : [],
          price: item.discount_price || item.price,
          image: item.img,
          subtitle: item.subtitle,
          description: item.description,
          originalPrice: item.price
        }))
        
        console.log('处理后的推荐商品:', recommendProducts)
        
        this.setData({
          recommendProducts: recommendProducts
        })
      } else {
        console.log('推荐商品接口返回错误或数据为空:', res)
      }
    }).catch(err => {
      console.error('获取推荐商品失败:', err)
    })
  },

  // 添加到购物车
  addToCart(event) {
    const index = event.currentTarget.dataset.index
    const product = this.data.recommendProducts[index]
    
    console.log('=== 添加推荐商品到购物车 ===')
    console.log('商品索引:', index)
    console.log('商品信息:', product)
    
    // 直接添加到购物车，使用商品ID
    this.addProductToCartDirectly(product)
  },

  // 直接添加到购物车
  addProductToCartDirectly(product) {
    console.log('直接添加商品到购物车:', product)
    
    // 获取当前购物车数据
    let cartItems = wx.getStorageSync('cartItems') || []
    
    // 查找是否已存在相同的商品
    const existingItemIndex = cartItems.findIndex(item => item.id === product.id)
    
    if (existingItemIndex >= 0) {
      // 已存在，增加数量
      cartItems[existingItemIndex].count += 1
      console.log('商品已存在，增加数量到:', cartItems[existingItemIndex].count)
    } else {
      // 新增商品到购物车
      const cartItem = {
        id: product.id,
        name: product.name,
        image: product.image,
        count: 1,
        price: parseFloat(product.price) || 0,
        originalPrice: parseFloat(product.originalPrice) || 0,
        tags: product.tags || [],
        subtitle: product.subtitle || '',
        description: product.description || ''
      }
      
      cartItems.unshift(cartItem)
      console.log('新增商品到购物车:', cartItem)
    }
    
    // 保存到本地存储
    wx.setStorageSync('cartItems', cartItems)
    
    // 同步到globalData
    const app = getApp()
    app.globalData.cartItems = cartItems
    app.globalData.cartCount = cartItems.reduce((total, item) => total + item.count, 0)
    app.globalData.totalPrice = cartItems.reduce((total, item) => total + (parseFloat(item.price) * item.count), 0)
    
    console.log('购物车数据已更新:', {
      cartItems: cartItems,
      cartCount: app.globalData.cartCount,
      totalPrice: app.globalData.totalPrice
    })
    
    wx.showToast({
      title: '已添加到购物车',
      icon: 'success'
    })
    
    // 跳转到分类页面
    setTimeout(() => {
      wx.switchTab({
        url: '/pages/category/category'
      })
    }, 1500)
  },

  // 添加商品到购物车
  addProductToCart(product, selectedSku) {
    // 获取当前购物车数据
    let cartItems = wx.getStorageSync('cartItems') || []
    
    // 查找是否已存在相同的SKU
    const existingItemIndex = cartItems.findIndex(item => 
      item.skuId === selectedSku.id || (item.id === product.id && item.name === product.name)
    )
    
    if (existingItemIndex >= 0) {
      // 已存在，增加数量
      cartItems[existingItemIndex].count += 1
    } else {
      // 新增商品到购物车
      const cartItem = {
        id: product.id, // SPU ID
        skuId: selectedSku.id, // SKU ID
        name: product.name,
        image: product.image,
        count: 1,
        price: selectedSku.discount_price || selectedSku.price,
        originalPrice: selectedSku.price,
        skuPrice: selectedSku.discount_price || selectedSku.price,
        sku: {
          id: selectedSku.id,
          price: selectedSku.price,
          discount_price: selectedSku.discount_price,
          stock: selectedSku.stock,
          title: selectedSku.title || product.name
        },
        tags: product.tags,
        subtitle: product.subtitle,
        categoryId: product.categoryId
      }
      
      cartItems.unshift(cartItem)
    }
    
    // 保存到本地存储
    wx.setStorageSync('cartItems', cartItems)
    
    // 同步到globalData
    const app = getApp()
    app.globalData.cartItems = cartItems
    app.globalData.cartCount = cartItems.reduce((total, item) => total + item.count, 0)
    app.globalData.totalPrice = cartItems.reduce((total, item) => total + (item.price * item.count), 0)
    
    console.log('购物车数据已更新:', {
      cartItems: cartItems,
      cartCount: app.globalData.cartCount,
      totalPrice: app.globalData.totalPrice
    })
    
    wx.showToast({
      title: '已添加到购物车',
      icon: 'success'
    })
    
    // 跳转到分类页面
    setTimeout(() => {
      wx.switchTab({
        url: '/pages/category/category'
      })
    }, 1500)
  },

  // 跳转到分类页面
  goToCategory() {
    wx.switchTab({
      url: '/pages/category/category'
    })
  },

  // 测试添加商品到购物车
  testAddToCart() {
    console.log('=== 测试添加商品到购物车 ===')
    
    // 模拟一个测试商品
    const testProduct = {
      id: 'test_001',
      name: '测试商品',
      image: '/imgs/test-product.png',
      price: 25.00,
      originalPrice: 30.00,
      tags: ['测试', '推荐'],
      subtitle: '测试商品副标题',
      description: '这是一个测试商品'
    }
    
    console.log('测试商品:', testProduct)
    this.addProductToCartDirectly(testProduct)
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 调试信息：检查当前页面数据
    console.log('=== 测试结果页面数据检查 ===')
    console.log('result:', this.data.result)
    console.log('backgroundImage:', this.data.backgroundImage)
    console.log('rightImage:', this.data.rightImage)
    console.log('recommendProducts:', this.data.recommendProducts)
    
    // 检查当前购物车数据
    const cartItems = wx.getStorageSync('cartItems') || []
    console.log('当前购物车数据:', cartItems)
    
    const app = getApp()
    console.log('globalData购物车数据:', {
      cartItems: app.globalData.cartItems,
      cartCount: app.globalData.cartCount,
      totalPrice: app.globalData.totalPrice
    })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})