// pages/test/index.js
const { api } = require('../../utils/api.js')

Page({
  data: {},

  onLoad(options) {},

  toSuccess() {
    wx.navigateTo({
      url: `/pages/test-result/index`
    })
  },

  submitTest() {
    // 模拟答案
    const answers = [
      { question_id: 1, answer: 'A' },
      { question_id: 2, answer: 'C' },
      { question_id: 3, answer: 'E' },
      { question_id: 4, answer: 'B' },
      { question_id: 5, answer: 'D' },
      { question_id: 6, answer: 'A' },
      { question_id: 7, answer: 'F' },
      { question_id: 8, answer: 'G' }
    ]
    wx.showLoading({ title: '提交中...' })
    api.submitConstitutionTest({ answers }).then(res => {
      wx.hideLoading()
      if (res.code === 0) {
        wx.navigateTo({
          url: '/pages/test-result/index',
          success: function (navRes) {
            // 通过eventChannel传递数据
            if (navRes.eventChannel) {
              navRes.eventChannel.emit('testResult', res.result)
            }
          }
        })
      } else {
        wx.showToast({ title: res.msg || '提交失败', icon: 'none' })
      }
    }).catch(() => {
      wx.hideLoading()
      wx.showToast({ title: '提交失败', icon: 'none' })
    })
  }
})