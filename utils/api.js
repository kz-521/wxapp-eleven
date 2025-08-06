// utils/api.js
const BASE_URL = 'https://api.jixiangjiaoyu.com'

// 获取token
const getToken = () => {
  const wechatToken = wx.getStorageSync('wechat_token')
  const accessToken = wx.getStorageSync('access_token')
  const token = wechatToken || accessToken || ''
  
  console.log('Token获取状态:', {
    wechatToken: wechatToken ? '存在' : '不存在',
    accessToken: accessToken ? '存在' : '不存在',
    finalToken: token ? '已获取' : '未获取'
  })
  
  return token
}

// 请求封装
const request = (options) => {
  const token = getToken()
  console.log('API请求 - URL:', options.url, 'Token:', token ? '已获取' : '未获取')
  
  const headers = {
    'Content-Type': 'application/json',
    "token": token || '',
    ...options.header
  }
  
  // 如果有token，添加到请求头
  if (token) {
    console.log('API请求 - 已添加token header')
  } else {
    console.log('API请求 - 未添加token header，token不存在')
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: headers,
      success: (res) => {
        console.log('API响应 - URL:', options.url, 'Status:', res.statusCode, 'Data:', res.data)
        if (res.statusCode === 200) {
          resolve(res.data)
        } else {
          reject({
            code: res.statusCode,
            message: res.data?.message || '请求失败'
          })
        }
      },
      fail: (err) => {
        console.error('API请求失败 - URL:', options.url, 'Error:', err)
        reject({
          code: -1,
          message: '网络请求失败',
          error: err
        })
      }
    })
  })
}

// API方法封装
const api = {
  // 获取今日推荐商品
  getRecommendSpu: (size = 3) => {
    return request({
      url: `/qingting/v1/spu/recommend?size=${size}`,
      method: 'GET'
    })
  },

  // 获取商品列表
  getSpuList: (params = {}) => {
    const queryString = Object.keys(params)
      .map(key => `${key}=${params[key]}`)
      .join('&')
    return request({
      url: `/qingting/v1/spu/list${queryString ? '?' + queryString : ''}`,
      method: 'GET'
    })
  },

  // 根据分类获取商品
  getSpuByCategory: (categoryId) => {
    return request({
      url: `/qingting/v1/spu/category/${categoryId}`,
      method: 'GET'
    })
  },

  // 根据name获取banner
  getBannerByName: (bannerName) => {
    return request({
      url: `/qingting/v1/banner/banner_name/${bannerName}`,
      method: 'GET'
    })
  },

  // 获取用户信息
  getUserDetail: () => {
    return request({
      url: '/qingting/v1/user/detail',
      method: 'GET'
    })
  },

  // 更新用户信息
  updateUser: (userData) => {
    return request({
      url: '/qingting/v1/user/update',
      method: 'POST',
      data: userData
    })
  },

  // 获取商品详情
  getSpuDetail: (id) => {
    return request({
      url: `/qingting/v1/spu/detail?id=${id}`,
      method: 'GET'
    })
  },

  // 获取体质测试问题
  getConstitutionQuestions: () => {
    return request({
      url: '/qingting/v1/constitution/questions',
      method: 'GET'
    })
  },

  // 提交体质测试
  submitConstitutionTest: (answers) => {
    return request({
      url: '/qingting/v1/constitution/submit',
      method: 'POST',
      data: answers
    })
  },

  // 提交订单
  submitOrder: () => {
    return request({
      url: '/qingting/v1/order/place',
      method: 'POST',
    })
  },

  // 支付接口
  payPreorder: (orderId) => {
    return request({
      url: `/qingting/v1/pay/preorder?XDEBUG_SESSION_START=PHPSTORM`,
      method: 'POST',
      data: { order_id: orderId }
    })
  },

  // 微信登录相关
  wxLogin: (code) => {
    return request({
      url: '/qingting/v1/token',
      method: 'POST',
      data: { code }
    })
  },

  // 更新用户信息
  updateUserInfo: (userInfo) => {
    return request({
      url: '/user/update',
      method: 'POST',
      data: userInfo
    })
  }
}

module.exports = {
  request,
  api
} 