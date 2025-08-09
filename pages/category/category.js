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
    sectionTitle: '本草滋养茶·9种体质', // 右侧标题
    
    // 商品详情弹出层相关数据
    showProductDetail: false, // 是否显示商品详情弹出层
    currentProduct: null, // 当前选中的商品详情
    selectedOptions: {}, // 用户选择的规格选项
    currentQuantity: 1, // 当前选择的数量
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
    
    if (!product) {
      console.error('商品数据不存在')
      return
    }
    
    // 获取商品详情并显示弹出层
    this.getProductDetailAndShow(product.id)
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

  /**
   * 增加商品详情数量
   */
  increaseProductQuantity() {
    const currentQuantity = this.data.currentQuantity
    this.setData({
      currentQuantity: currentQuantity + 1
    }, () => {
      // 重新计算价格
      this.calculateProductPrice()
    })
  },

  /**
   * 减少商品详情数量
   */
  decreaseProductQuantity() {
    const currentQuantity = this.data.currentQuantity
    if (currentQuantity > 1) {
      this.setData({
        currentQuantity: currentQuantity - 1
      }, () => {
        // 重新计算价格
        this.calculateProductPrice()
      })
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
    console.log('显示购物车详情')
    console.log('当前购物车数据:', this.data.cartItems)
    console.log('购物车数量:', this.data.cartCount)
    console.log('当前showCartDetail状态:', this.data.showCartDetail)
    console.log('当前showProductDetail状态:', this.data.showProductDetail)
    
    // 确保先关闭商品详情弹出层
    this.setData({
      showProductDetail: false,
      showCartDetail: true
    }, () => {
      console.log('购物车弹出层已显示')
      console.log('showCartDetail新状态:', this.data.showCartDetail)
    })
  },

  // 关闭购物车详情
  closeCartDetail() {
    console.log('关闭购物车详情')
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
    // 获取当前购物车数据
    const cartItems = this.data.cartItems
    const totalPrice = this.data.totalPrice
    
    // 格式化当前时间
    const now = new Date()
    const createTime = now.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
    
    // 创建订单数据
    const orderData = {
      products: cartItems.map(item => ({
        id: item.id,
        name: item.name,
        image: item.image,
        price: parseFloat(item.price),
        count: item.count,
        tags: item.tags || [],
        specs: item.specs || item.description || '大、热、不额外加糖、脱脂牛奶',
        originalPrice: parseFloat(item.originalPrice) || parseFloat(item.price),
        sku: item.sku || null
      })),
      totalAmount: totalPrice,
      payAmount: totalPrice,
      couponAmount: 0,
      remark: '',
      diningType: 'dine-in',
      createTime: createTime,
      payTime: createTime, // 支付时间与创建时间相同
      storePhone: '1342137123',
      pickupNumber: Math.floor(Math.random() * 9000) + 1000, // 生成随机取茶号
      estimatedTime: '6',
      status: 'paid', // 设置为已支付状态
      orderStatusText: '已支付'
    }

    console.log('创建的订单数据:', orderData)

    wx.showToast({
      title: '结算成功',
      icon: 'success'
    })

    // 清空购物车
    this.setData({
      cartItems: []
    })
    this.loadCartData()

    // 跳转到订单详情页面，携带订单数据
    setTimeout(() => {
      wx.navigateTo({
        url: '/pages/order-detail/index',
        success: (res) => {
          // 通过eventChannel向被打开页面传送数据
          res.eventChannel.emit('orderData', orderData)
        }
      })
    }, 1500)
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
      sectionTitle: (defaultCategories && defaultCategories[0] && defaultCategories[0].name) ? defaultCategories[0].name : '本草滋养茶·9种体质'
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
    const categoryId = (categories && categories[index] && categories[index].id) ? categories[index].id : (Number(index) + 1) // 使用真实分类ID
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
  async getSpuDetail(spuId) {
    try {
      wx.showLoading({ title: '加载中...' })
      const response = await api.getSpuDetail(spuId)
      wx.hideLoading()
      
      if (response.code === 200 && response.result) {
        console.log('商品详情:', response.result)
        return response.result
      } else {
        console.error('获取商品详情失败:', response)
        wx.showToast({
          title: response.msg || '获取商品详情失败',
          icon: 'none'
        })
        return null
      }
    } catch (error) {
      wx.hideLoading()
      console.error('获取商品详情异常:', error)
      wx.showToast({
        title: '获取商品详情失败',
        icon: 'none'
      })
      return null
    }
  },

  /**
   * 获取商品详情并显示弹出层
   */
  async getProductDetailAndShow(spuId) {
    const detail = await this.getSpuDetail(spuId)
    if (detail) {
      // 设置默认选中的选项
      const selectedOptions = {}
      if (detail.order_options && detail.order_options.length > 0) {
        detail.order_options.forEach(option => {
          // 为每个选项组选择第一个选项作为默认值
          if (option.values && option.values.length > 0) {
            selectedOptions[option.id] = option.values[0].id
          }
        })
      }
      
      // 计算初始价格（包含默认选项的额外费用）
      // let initialPrice = parseFloat(detail.discount_price || detail.price)

      let initialPrice = parseFloat(detail.skuList[0].price || detail.price)
      if (detail.order_options && detail.order_options.length > 0) {
        detail.order_options.forEach(option => {
          const selectedValue = option.values.find(value => value.id === selectedOptions[option.id])
          if (selectedValue && selectedValue.extra_price) {
            initialPrice += parseFloat(selectedValue.extra_price)
          }
        })
      }
      
      this.setData({
        showProductDetail: true,
        currentProduct: {
          ...detail,
          price: initialPrice.toFixed(2),
          originalPrice: detail.price
        },
        selectedOptions: selectedOptions,
        currentQuantity: 1
      })
    }
  },

  /**
   * 关闭商品详情弹出层
   */
  closeProductDetail() {
    this.setData({
      showProductDetail: false,
      currentProduct: null
    })
  },

  /**
   * 选择规格选项
   */
  selectOption(event) {
    const { index, option } = event.currentTarget.dataset
    const selectedOptions = { ...this.data.selectedOptions }
    
    selectedOptions[index] = option
    this.setData({
      selectedOptions: selectedOptions
    })
    
    // 重新计算价格
    this.calculateProductPrice()
  },

  /**
   * 计算商品价格（包含选项额外费用）
   */
  calculateProductPrice() {
    const product = this.data.currentProduct
    const selectedOptions = this.data.selectedOptions
    const currentQuantity = this.data.currentQuantity
    
    if (!product) return
    
    // 基础价格
    // let basePrice = parseFloat(product.discount_price || product.originalPrice)

    let basePrice = parseFloat(product.skuList[0].price || product.originalPrice)
    
    // 加上选项的额外费用
    if (product.order_options && product.order_options.length > 0) {
      product.order_options.forEach(option => {
        const selectedValue = option.values.find(value => value.id === selectedOptions[option.id])
        if (selectedValue && selectedValue.extra_price) {
          basePrice += parseFloat(selectedValue.extra_price)
        }
      })
    }
    
    // 计算总价格（价格 × 数量）
    const totalPrice = basePrice * currentQuantity
    
    this.setData({
      'currentProduct.price': totalPrice.toFixed(2)
    })
  },

  /**
   * 确定选择并添加到购物车
   */
  confirmSelection() {
    const product = this.data.currentProduct
    const selectedOptions = this.data.selectedOptions
    const currentQuantity = this.data.currentQuantity

    if (!product) {
      wx.showToast({
        title: '商品信息错误',
        icon: 'none'
      })
      return
    }

    // 检查必选项是否已选择
    const requiredOptions = product.order_options ? product.order_options.filter(option => option.type === 1) : []
    const missingRequired = requiredOptions.filter(option => !selectedOptions[option.id])
    
    if (missingRequired.length > 0) {
      wx.showToast({
        title: `请选择${missingRequired[0].name}`,
        icon: 'none'
      })
      return
    }

    // 构建规格描述
    let specsDescription = ''
    if (product.order_options && product.order_options.length > 0) {
      const selectedSpecs = product.order_options.map(option => {
        const selectedValue = option.values.find(value => value.id === selectedOptions[option.id])
        return selectedValue ? selectedValue.value : ''
      }).filter(spec => spec)
      specsDescription = selectedSpecs.join('、')
    }

    // 计算单价（不包含数量）
    // let unitPrice = parseFloat(product.discount_price || product.originalPrice)
    let unitPrice = parseFloat(product.skuList[0].price || product.originalPrice)
   
    if (product.order_options && product.order_options.length > 0) {
      product.order_options.forEach(option => {
        const selectedValue = option.values.find(value => value.id === selectedOptions[option.id])
        if (selectedValue && selectedValue.extra_price) {
          unitPrice += parseFloat(selectedValue.extra_price)
        }
      })
    }

    // 添加到购物车
    let cartItems = this.data.cartItems || []
    
    // 查找是否已存在相同的商品和规格
    const existingItemIndex = cartItems.findIndex(item => 
      item.id === product.id && item.specs === specsDescription
    )

    if (existingItemIndex >= 0) {
      // 已存在，增加数量
      cartItems[existingItemIndex].count += currentQuantity
    } else {
      // 新增商品到购物车
      const cartItem = {
        id: product.id,
        name: product.title,
        image: product.img,
        count: currentQuantity,
        price: unitPrice.toFixed(2), // 单价
        originalPrice: product.originalPrice,
        specs: specsDescription,
        tags: product.tags ? product.tags.split(',') : [],
        subtitle: product.subtitle,
        description: product.description,
        selectedOptions: selectedOptions
      }

      cartItems.unshift(cartItem)
    }

    this.setData({
      cartItems: cartItems,
      showProductDetail: false,
      currentProduct: null,
      selectedOptions: {},
      currentQuantity: 1
    })
    
    // 同步到globalData和本地存储
    const app = getApp()
    app.globalData.cartItems = cartItems
    wx.setStorageSync('cartItems', cartItems)
    
    this.loadCartData()

    wx.showToast({
      title: '已添加到购物车',
      icon: 'success'
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
  },

  /**
   * 测试商品详情弹出层
   */
  testProductDetail() {
    // 模拟商品详情数据
    const mockProduct = {
      id: 1,
      title: "佛手映月",
      subtitle: "大乔木白茶，五行属金，对应肺，可止咳平喘，清热解毒",
      price: "38",
      discount_price: "32",
      description: "清热解毒、止咳平喘，适合肺热咳嗽、咽喉不适人群",
      img: "https://qn.jixiangjiaoyu.com/2025/8/6d6421a35c54686e3614123366bf0bb941754456860367.png",
      category_id: 1,
      tags: "白茶,肺,金",
      recommend_for_constitution: "金",
      is_package: 0,
      status: 1,
      sort: 0,
      sales_count: 0,
      stock_total: 0,
      create_time: "2025-07-22 07:07:08",
      update_time: "2025-08-06 15:09:36",
      order_options: [
        {
          id: 1,
          name: "冷热",
          type: 1,
          type_text: "单选",
          values: [
            {
              id: 1,
              value: "冰",
              extra_price: 0,
              formatted_price: "",
              full_text: "冰"
            },
            {
              id: 2,
              value: "热",
              extra_price: 0,
              formatted_price: "",
              full_text: "热"
            }
          ]
        },
        {
          id: 2,
          name: "糖度",
          type: 1,
          type_text: "单选",
          values: [
            {
              id: 3,
              value: "无糖",
              extra_price: 0,
              formatted_price: "",
              full_text: "无糖"
            },
            {
              id: 4,
              value: "三分糖",
              extra_price: 0,
              formatted_price: "",
              full_text: "三分糖"
            },
            {
              id: 5,
              value: "五分糖",
              extra_price: 0,
              formatted_price: "",
              full_text: "五分糖"
            },
            {
              id: 6,
              value: "七分糖",
              extra_price: 0,
              formatted_price: "",
              full_text: "七分糖"
            },
            {
              id: 7,
              value: "全糖",
              extra_price: 0,
              formatted_price: "",
              full_text: "全糖"
            }
          ]
        },
        {
          id: 3,
          name: "口味",
          type: 1,
          type_text: "单选",
          values: [
            {
              id: 8,
              value: "原味",
              extra_price: 0,
              formatted_price: "",
              full_text: "原味"
            },
            {
              id: 9,
              value: "柠檬",
              extra_price: 1,
              formatted_price: "+￥1.00",
              full_text: "柠檬 (+￥1.00)"
            },
            {
              id: 10,
              value: "蜂蜜",
              extra_price: 2,
              formatted_price: "+￥2.00",
              full_text: "蜂蜜 (+￥2.00)"
            }
          ]
        }
      ],
      has_order_options: true,
      skuList: [
        {
          id: 1,
          spu_id: 1,
          price: "0.01",
          stock: 976,
          img: "/img/spu/foshou.jpg",
          title: "佛手映月",
          specs: null,
          status: 1,
          sales_count: 0,
          create_time: "2025-07-22 07:07:08"
        }
      ]
    }

    // 设置默认选中的选项
    const selectedOptions = {}
    if (mockProduct.order_options && mockProduct.order_options.length > 0) {
      mockProduct.order_options.forEach(option => {
        if (option.values && option.values.length > 0) {
          selectedOptions[option.id] = option.values[0].id
        }
      })
    }
    
    this.setData({
      showProductDetail: true,
      currentProduct: mockProduct,
      selectedOptions: selectedOptions,
      currentQuantity: 1
    })
  }
})
