// pages/category/category.js
const { api } = require('../../utils/api.js')
import { Category } from '../../models/category.js'

Page({
  /**
   * 页面的初始数据
   */
  data: {
    currentCategory: 0,
    showCartDetail: false,
    userInfo: null, // 用户信息
    allProducts: [], // 所有商品数据
    constitutionQuestions: [], // 体质测试问题
    currentQuestionIndex: 0, // 当前问题索引
    testAnswers: [], // 测试答案
    testResult: null, // 测试结果
    products: [],
    cartItems: [],
    cartCount: 0,
    totalPrice: 0,
    categories: [], // 分类列表
    sectionTitle: '本草滋养茶·9种体质' // 右侧标题
  },

  async onLoad(options) {
    this.loadCartData()
    // 获取分类列表
    await this.loadCategories()
    // 获取所有商品数据
    this.getAllProducts()
    // 初始化加载第一个分类的商品
    this.loadProductsByCategory(1)
  },
  onShow() {
    this.loadCartData()
  },
  onHide() {
    // 移除tabBar相关代码
  },
  onUnload() {
    // 移除tabBar相关代码
  },

  // 加载购物车数据
  loadCartData() {
    // 从globalData和本地存储读取购物车数据
    const app = getApp()
    let cartItems = app.globalData.cartItems || []
    
    // 如果globalData中没有数据，尝试从本地存储读取
    if (cartItems.length === 0) {
      cartItems = wx.getStorageSync('cartItems') || []
      // 同步到globalData
      app.globalData.cartItems = cartItems
    }
    
    const cartCount = cartItems.reduce((total, item) => total + item.count, 0)

    // 价格计算：优先使用SKU价格，fallback到SPU价格
    const totalPrice = cartItems.reduce((total, item) => {
      let itemPrice = 0

      // 优先使用SKU价格
      if (item.sku && item.sku.price) {
        itemPrice = item.sku.discount_price || item.sku.price
      }
      // 如果有skuPrice字段
      else if (item.skuPrice) {
        itemPrice = item.skuPrice
      }
      // fallback到商品price字段
      else {
        itemPrice = parseFloat(item.price) || 0
      }

      console.log('购物车商品价格计算:', {
        name: item.name,
        count: item.count,
        itemPrice: itemPrice,
        total: itemPrice * item.count
      })

      return total + (itemPrice * item.count)
    }, 0)

    this.setData({
      cartItems: cartItems,
      cartCount,
      totalPrice: totalPrice.toFixed(2)
    })

    console.log('购物车数据更新:', {
      cartItems: cartItems,
      cartCount,
      totalPrice: totalPrice.toFixed(2)
    })
  },

  // 添加到购物车
  addToCart(event) {
    const index = event.currentTarget.dataset.index
    const product = this.data.products[index]

    console.log('添加商品到购物车:', product)

    // 检查商品是否有SKU列表
    if (!product.skuList || product.skuList.length === 0) {
      wx.showToast({
        title: '商品暂不可购买',
        icon: 'none'
      })
      return
    }

    // 如果商品只有一个SKU，直接使用
    let selectedSku = null
    if (product.skuList.length === 1) {
      selectedSku = product.skuList[0]
    } else {
      // 多个SKU的情况，应该跳转到商品详情页选择规格
      // 这里暂时使用第一个可用的SKU
      selectedSku = product.skuList.find(sku => sku.stock > 0) || product.skuList[0]
    }

    if (!selectedSku) {
      wx.showToast({
        title: '商品缺少规格信息',
        icon: 'none'
      })
      return
    }

    let cartItems = this.data.cartItems || []

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
        skuId: selectedSku.id, // SKU ID，订单提交时使用
        name: product.name,
        image: product.image,
        count: 1,
        // 价格使用SKU价格
        price: selectedSku.discount_price || selectedSku.price, // 显示价格
        originalPrice: selectedSku.price, // 原价
        skuPrice: selectedSku.discount_price || selectedSku.price, // SKU价格
        // 存储完整的SKU信息
        sku: {
          id: selectedSku.id,
          price: selectedSku.price,
          discount_price: selectedSku.discount_price,
          stock: selectedSku.stock,
          title: selectedSku.title || product.name
        },
        // 其他商品信息
        tags: product.tags,
        subtitle: product.subtitle,
        categoryId: product.categoryId
      }

      console.log('新建购物车项:', cartItem)
      cartItems.unshift(cartItem)
    }

    this.setData({
      cartItems: cartItems
    })
    
    // 同步到globalData和本地存储
    const app = getApp()
    app.globalData.cartItems = cartItems
    app.globalData.cartCount = cartItems.reduce((total, item) => total + item.count, 0)
    app.globalData.totalPrice = cartItems.reduce((total, item) => total + (parseFloat(item.price) * item.count), 0)
    
    // 保存到本地存储
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
    let cartItems = this.data.cartItems || []

    if (cartItems[index]) {
      cartItems[index].count += 1
      this.setData({
        cartItems: cartItems
      })
      
      // 同步到globalData和本地存储
      const app = getApp()
      app.globalData.cartItems = cartItems
      app.globalData.cartCount = cartItems.reduce((total, item) => total + item.count, 0)
      app.globalData.totalPrice = cartItems.reduce((total, item) => total + (parseFloat(item.price) * item.count), 0)
      
      // 保存到本地存储
      wx.setStorageSync('cartItems', cartItems)
      
      this.loadCartData()
    }
  },

  // 减少商品数量
  decreaseQuantity(event) {
    const index = event.currentTarget.dataset.index
    let cartItems = this.data.cartItems || []

    if (cartItems[index] && cartItems[index].count > 1) {
      cartItems[index].count -= 1
      this.setData({
        cartItems: cartItems
      })
      
      // 同步到globalData和本地存储
      const app = getApp()
      app.globalData.cartItems = cartItems
      app.globalData.cartCount = cartItems.reduce((total, item) => total + item.count, 0)
      app.globalData.totalPrice = cartItems.reduce((total, item) => total + (parseFloat(item.price) * item.count), 0)
      
      // 保存到本地存储
      wx.setStorageSync('cartItems', cartItems)
      
      this.loadCartData()
    } else if (cartItems[index] && cartItems[index].count === 1) {
      // 如果数量为1，则移除商品
      cartItems.splice(index, 1)
      this.setData({
        cartItems: cartItems
      })
      
      // 同步到globalData和本地存储
      const app = getApp()
      app.globalData.cartItems = cartItems
      app.globalData.cartCount = cartItems.reduce((total, item) => total + item.count, 0)
      app.globalData.totalPrice = cartItems.reduce((total, item) => total + (parseFloat(item.price) * item.count), 0)
      
      // 保存到本地存储
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
          this.setData({
            cartItems: []
          })
          
          // 同步到globalData和本地存储
          const app = getApp()
          app.globalData.cartItems = []
          app.globalData.cartCount = 0
          app.globalData.totalPrice = 0
          
          // 清空本地存储
          wx.removeStorageSync('cartItems')
          
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

    // 将购物车数据存储到globalData中
    const app = getApp()
    app.globalData.cartItems = this.data.cartItems
    app.globalData.cartCount = this.data.cartCount
    app.globalData.totalPrice = this.data.totalPrice

    console.log('存储到globalData的购物车数据:', app.globalData.cartItems)
    console.log('购物车总数:', app.globalData.cartCount)
    console.log('总价格:', app.globalData.totalPrice)

    // 跳转到提交订单页面，使用navigateTo保留返回按钮
    wx.navigateTo({
      url: '/pages/order-submit/index',
      success: function() {
        // 隐藏底部tabbar
        wx.hideTabBar()
      }
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

    wx.showToast({
      title: '结算成功',
      icon: 'success'
    })

    // 清空购物车
    this.setData({
      cartItems: []
    })
    this.loadCartData()
  },

  /**
   * 加载分类列表
   */
  async loadCategories() {
    try {
      console.log('开始获取分类列表')

      const response = await Category.getCategoryList()
      console.log('分类API响应:', response)

      const formattedData = Category.formatCategoryData(response)
      if (formattedData) {
        console.log('获取分类成功:', formattedData.level1Categories)
        this.setData({
          categories: formattedData.level1Categories
        })

        // 更新右侧标题为第一个分类名称
        if (formattedData.level2Categories.length > 0) {
          this.setData({
            sectionTitle: formattedData.level2Categories[0].name
          })
        }
      } else {
        console.log('分类数据格式不正确，使用默认数据')
        this.setDefaultCategories()
      }
    } catch (error) {
      console.error('获取分类失败:', error)
      this.setDefaultCategories()
    }
  },

  /**
   * 设置默认分类数据
   */
  setDefaultCategories() {
    const defaultCategories = Category.getDefaultCategoryData()
    this.setData({
      categories: defaultCategories,
      sectionTitle: defaultCategories[0]?.name || '本草滋养茶·9种体质'
    })
  },

  // 切换分类
  switchCategory(event) {
    const index = event.currentTarget.dataset.index
    this.setData({
      currentCategory: index
    })

    // 更新右侧标题
    const categories = this.data.categories
    if (categories[index]) {
      this.setData({
        sectionTitle: categories[index].name
      })
    }

    // 根据分类加载商品数据
    const categoryId = categories[index]?.id || (Number(index) + 1) // 使用真实分类ID
    this.loadProductsByCategory(categoryId)
  },

  /**
   * 根据分类加载商品数据
   */
  loadProductsByCategory(categoryId) {
    console.log('开始加载分类商品，categoryId:', categoryId)
    console.log('API调用: /qingting/v1/spu/category/' + categoryId)

    // 检查token是否存在
    const token = wx.getStorageSync('wechat_token') || wx.getStorageSync('access_token')
    console.log('购物车页面 - Token检查:', token ? '存在' : '不存在')

    api.getSpuByCategory(categoryId).then(res => {
      console.log('API响应:', res)
      if (res.code === 200 && res.result && res.result.list) {
        console.log('获取分类商品成功:', res.result.list)
        // 更新商品列表数据
        const categoryProducts = res.result.list.map(item => ({
          id: item.id,
          name: item.title,
          tags: item.tags ? item.tags.split(',').filter(tag => tag.trim()) : [],
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
          tags: item.tags ? item.tags.split(',').filter(tag => tag.trim()) : [],
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
          tags: item.tags ? item.tags.split(',').filter(tag => tag.trim()) : [],
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
