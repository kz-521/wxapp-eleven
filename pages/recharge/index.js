Page({
  data: {
    balance: 0, // 用户当前余额
    selectedAmount: null, // 选中的充值金额
    rechargeAmounts: [100, 200, 500, 1000, 2000, 5000] // 固定充值金额选项
  },

  onLoad(options) {
    this.getUserBalance();
  },

  // 获取用户余额
  getUserBalance() {
    // 从本地存储获取余额
    const balance = wx.getStorageSync('userBalance') || 188.50;
    this.setData({
      balance: balance
    });
  },

  // 选择充值金额
  selectAmount(e) {
    const amount = e.currentTarget.dataset.amount;
    this.setData({
      selectedAmount: amount
    });
  },

  // 执行充值
  doRecharge() {
    if (!this.data.selectedAmount) {
      wx.showToast({
        title: '请选择充值金额',
        icon: 'none'
      });
      return;
    }

    wx.showModal({
      title: '确认充值',
      content: `确定要充值 ¥${this.data.selectedAmount} 吗？`,
      success: (res) => {
        if (res.confirm) {
          this.processRecharge();
        }
      }
    });
  },

  // 处理充值
  processRecharge() {
    wx.showLoading({
      title: '充值中...'
    });

    // TODO: 调用充值API
    setTimeout(() => {
      wx.hideLoading();
      
      // 计算新余额
      const newBalance = this.data.balance + this.data.selectedAmount;
      
      // 更新本地存储
      wx.setStorageSync('userBalance', newBalance);
      
      // 更新页面数据
      this.setData({
        balance: newBalance,
        selectedAmount: null
      });
      
      wx.showToast({
        title: '充值成功',
        icon: 'success'
      });
      
      // 1.5秒后返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }, 2000);
  }
});