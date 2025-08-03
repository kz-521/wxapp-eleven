// utils/api.js
const BASE_URL = 'https://api.jixiangjiaoyu.com'

// 请求封装
const request = (options) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        ...options.header
      },
      success: (res) => {
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

  // 支付接口
  payPreorder: (orderData) => {
    return request({
      url: '/qingting/v1/pay/preorder',
      method: 'POST',
      data: orderData
    })
  }
}

module.exports = {
  request,
  api
} 