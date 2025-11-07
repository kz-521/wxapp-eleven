// pages/coupon-receive/index.js
const { request } = require('../../utils/api.js')

Page({
  data: {
    couponId: '',
    couponDetail: null,
    loading: true,
    receiving: false,
    showSuccess: false,
    receivedCoupon: null
  },

  onLoad(options) {
    const { id } = options
    if (id) {
      this.setData({ couponId: id })
      this.loadCouponDetail(id)
    } else {
      wx.showToast({
        title: '优惠券ID不正确',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  // 获取优惠券详情
  async loadCouponDetail(id) {
    try {
      this.setData({ loading: true })

      const response = await request({
        url: `/qingting/v1/coupon/detail/${id}`,
        method: 'GET'
      })

      console.log('优惠券详情响应:', response)

      if (response.code === 0 && response.result) {
        this.setData({
          couponDetail: response.result,
          loading: false
        })
      } else {
        throw new Error(response.msg || '获取优惠券详情失败')
      }
    } catch (error) {
      console.error('获取优惠券详情失败:', error)
      this.setData({ loading: false })

      wx.showToast({
        title: error.message || '获取优惠券详情失败',
        icon: 'none'
      })

      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  // 领取优惠券
  async receiveCoupon() {
    if (this.data.receiving) return

    try {
      this.setData({ receiving: true })

      const response = await request({
        url: '/qingting/v1/coupon/receive_new',
        method: 'POST',
        data: {
          coupon_id: this.data.couponId
        }
      })

      console.log('领取优惠券响应:', response)

      if (response.code === 0) {
        // 领取成功
        this.setData({
          showSuccess: true,
          receivedCoupon: response.result.coupon_info,
          receiving: false
        })

        wx.showToast({
          title: response.msg || '领取成功',
          icon: 'success'
        })


      } else {
        throw new Error(response.msg || '领取失败')
      }
    } catch (error) {
      console.error('领取优惠券失败:', error)
      this.setData({ receiving: false })

      let errorMsg = '领取失败，请重试'
      if (error.message) {
        errorMsg = error.message
      }

      wx.showToast({
        title: errorMsg,
        icon: 'none',
        duration: 2000
      })
    }
  },

  // 返回首页
  goHome() {
    wx.switchTab({
      url: '/pages/home/home'
    })
  },

  // 去我的优惠券
  goMyCoupons() {
    wx.navigateTo({
      url: '/pages/my-coupon/index'
    })
  }
})
