// pages/my-coupon/my-coupon.js
const { api } = require('../../utils/api.js')

Page({
  /**
   * 页面的初始数据
   */
  data: {
    coupons: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.getCoupons()
  },

  /**
   * 获取优惠券列表
   */
  getCoupons() {
    wx.showLoading({ title: '加载中...' })
    
    api.getUserCoupons().then(res => {
      wx.hideLoading()
      
      if (res.code === 200 && res.result) {
        const coupons = res.result.map(item => ({
          id: item.id,
          name: item.name || '优惠券',
          amount: item.amount || 0,
          minAmount: item.min_amount || 0,
          description: item.description || '全场通用',
          expireDate: item.expire_date || '2024-12-31',
          status: item.status || 'available'
        }))
        
        this.setData({
          coupons: coupons
        })
      } else {
        // 使用模拟数据
        this.setMockCoupons()
      }
    }).catch(err => {
      wx.hideLoading()
      console.error('获取优惠券失败:', err)
      // 使用模拟数据
      this.setMockCoupons()
    })
  },

  /**
   * 设置模拟优惠券数据
   */
  setMockCoupons() {
    const mockCoupons = [
      {
        id: 1,
        name: '新用户专享券',
        amount: 10,
        minAmount: 50,
        description: '新用户专享，全场通用',
        expireDate: '2024-12-31',
        status: 'available'
      },
      {
        id: 2,
        name: '满减优惠券',
        amount: 20,
        minAmount: 100,
        description: '满100减20，限时优惠',
        expireDate: '2024-11-30',
        status: 'available'
      },
      {
        id: 3,
        name: '生日特惠券',
        amount: 15,
        minAmount: 80,
        description: '生日当月专享优惠',
        expireDate: '2024-10-31',
        status: 'used'
      }
    ]
    
    this.setData({
      coupons: mockCoupons
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
    this.getCoupons()
    wx.stopPullDownRefresh()
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