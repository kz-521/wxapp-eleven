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
          that.setData({ result: data })
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
      
      // 根据体质类型设置背景图片
      const typeImageMap = {
        '木行': '/imgs/test1.png',
        '金行': '/imgs/test2.png', 
        '水行': '/imgs/test3.png',
        '土行': '/imgs/test4.png',
        '火行': '/imgs/test5.png'
      }
      
      const backgroundImage = typeImageMap[result.primary_constitution.type] || '/imgs/test1.png'
      
      // 设置体质测评结果数据
      this.setData({
        result: {
          primary_constitution: result.primary_constitution,
          secondary_constitution: result.secondary_constitution,
          scores: result.scores,
          result_id: result.result_id
        },
        backgroundImage: backgroundImage
      })
    }
  },

  // 获取今日推荐商品
  getRecommendProducts() {
    api.getRecommendSpu(3).then(res => {
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
        
        this.setData({
          recommendProducts: recommendProducts
        })
      }
    }).catch(err => {
      console.error('获取推荐商品失败:', err)
    })
  },

  // 添加到购物车
  addToCart(event) {
    const index = event.currentTarget.dataset.index
    const product = this.data.recommendProducts[index]
    
    console.log('添加推荐商品到购物车:', product)
    
    // 获取商品详情，包括SKU信息
    this.getProductDetailAndAddToCart(product.id)
  },

  // 获取商品详情并添加到购物车
  getProductDetailAndAddToCart(spuId) {
    wx.showLoading({ title: '加载中...' })
    
    // 获取商品详情
    api.getSpuDetail(spuId).then(res => {
      wx.hideLoading()
      
      if (res.code === 200 && res.result) {
        const productDetail = res.result
        
        // 检查商品是否有SKU列表
        if (!productDetail.skuList || productDetail.skuList.length === 0) {
          wx.showToast({
            title: '商品暂不可购买',
            icon: 'none'
          })
          return
        }
        
        // 如果商品只有一个SKU，直接添加到购物车
        if (productDetail.skuList.length === 1) {
          this.addProductToCart(productDetail, productDetail.skuList[0])
        } else {
          // 多个SKU的情况，跳转到商品详情页选择规格
          wx.navigateTo({
            url: `/pages/detail/detail?id=${spuId}&from=test-result`
          })
        }
      } else {
        wx.showToast({
          title: '商品信息获取失败',
          icon: 'none'
        })
      }
    }).catch(err => {
      wx.hideLoading()
      console.error('获取商品详情失败:', err)
      wx.showToast({
        title: '商品信息获取失败',
        icon: 'none'
      })
    })
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

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

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