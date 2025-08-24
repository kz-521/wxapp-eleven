const { api } = require('../../utils/api.js');
const { mockRechargeAPI } = require('../../utils/mockRechargeAPI.js');

Page({
  data: {
    balance: 0, // 用户当前余额
    selectedAmount: null, // 选中的充值金额
    rechargeAmount: 0, // 实际充值金额
    canRecharge: false, // 是否可以充值
    rechargeAmounts: [100, 200, 500, 1000, 2000, 5000], // 固定充值金额选项
    rechargeHistory: [], // 充值记录
    isLoading: false // 加载状态
  },

  onLoad(options) {
    this.getUserBalance();
    this.getRechargeHistory();
  },

  // 获取用户余额
  async getUserBalance() {
    this.setData({ isLoading: true });
    wx.showLoading({ title: '加载中...' });
    
    try {
      // 使用模拟API获取余额
      const response = await mockRechargeAPI.getUserBalance();
      if (response.success) {
        const balance = response.data.balance;
        this.setData({ balance: balance });
        
        // 更新本地存储
        wx.setStorageSync('userBalance', balance);
      }
    } catch (error) {
      console.error('获取余额失败:', error);
      // 如果API失败，使用本地存储的余额
      const localBalance = wx.getStorageSync('userBalance') || 188.50;
      this.setData({ balance: localBalance });
      
      wx.showToast({
        title: '获取余额失败，使用本地数据',
        icon: 'none'
      });
    } finally {
      this.setData({ isLoading: false });
      wx.hideLoading();
    }
    
    // 实际项目中应该调用真实API
    // try {
    //   const response = await api.getUserBalance();
    //   this.setData({ balance: response.data.balance });
    // } catch (error) {
    //   console.error('获取余额失败:', error);
    // }
  },

  // 选择充值金额
  selectAmount(e) {
    const amount = e.currentTarget.dataset.amount;
    this.setData({
      selectedAmount: amount,
      rechargeAmount: amount,
      canRecharge: true
    });
  },

  // 执行充值
  doRecharge() {
    if (!this.data.canRecharge) {
      wx.showToast({
        title: '请选择充值金额',
        icon: 'none'
      });
      return;
    }

    const amount = this.data.rechargeAmount;
    if (amount < 10) {
      wx.showToast({
        title: '充值金额不能少于10元',
        icon: 'none'
      });
      return;
    }

    wx.showModal({
      title: '确认充值',
      content: `确定要充值 ¥${amount} 吗？`,
      success: (res) => {
        if (res.confirm) {
          this.processRecharge(amount);
        }
      }
    });
  },

  // 处理充值
  async processRecharge(amount) {
    if (this.data.isLoading) return;
    
    this.setData({ isLoading: true });
    wx.showLoading({
      title: '充值中...'
    });

    try {
      // 使用模拟充值API
      const response = await mockRechargeAPI.recharge(amount);
      if (response.success) {
        this.handleRechargeSuccess(response.data);
      }
    } catch (error) {
      console.error('充值失败:', error);
      this.handleRechargeFailure(error);
    } finally {
      this.setData({ isLoading: false });
    }
    
    // 实际项目中应该调用真实API
    // try {
    //   const response = await api.recharge(amount);
    //   this.handleRechargeSuccess(response.data);
    // } catch (error) {
    //   this.handleRechargeFailure(error);
    // }
  },

  // 处理充值成功
  handleRechargeSuccess(data) {
    wx.hideLoading();
    
    const { amount, bonus, totalAmount, newBalance, orderNo } = data;
    
    // 更新本地存储
    wx.setStorageSync('userBalance', newBalance);
    
    // 添加充值记录
    const rechargeRecord = {
      id: Date.now(),
      amount: amount,
      bonus: bonus,
      totalAmount: totalAmount,
      status: 'success',
      createTime: this.formatTime(new Date()),
      orderNo: orderNo
    };
    
    // 更新页面数据
    this.setData({
      balance: newBalance,
      selectedAmount: null,
      rechargeAmount: 0,
      canRecharge: false,
      rechargeHistory: [rechargeRecord, ...this.data.rechargeHistory]
    });
    
    // 显示成功提示
    wx.showModal({
      title: '充值成功',
      content: `充值金额：¥${amount}\n赠送金额：¥${bonus}\n到账金额：¥${totalAmount}\n订单号：${orderNo}`,
      showCancel: false,
      success: () => {
        // 1秒后返回上一页
        setTimeout(() => {
          wx.navigateBack();
        }, 1000);
      }
    });
  },

  // 处理充值失败
  handleRechargeFailure(error) {
    wx.hideLoading();
    wx.showToast({
      title: error.message || '充值失败，请重试',
      icon: 'none',
      duration: 3000
    });
  },

  // 获取充值记录
  async getRechargeHistory() {
    try {
      // 使用模拟API获取充值记录
      const response = await mockRechargeAPI.getRechargeHistory(1, 10);
      if (response.success) {
        this.setData({
          rechargeHistory: response.data.list
        });
      }
    } catch (error) {
      console.error('获取充值记录失败:', error);
      // 如果API失败，使用模拟数据
      const mockHistory = [
        {
          id: 1,
          amount: 500,
          bonus: 0,
          status: 'success',
          createTime: '2024-01-15 14:30'
        },
        {
          id: 2,
          amount: 1000,
          bonus: 100,
          status: 'success',
          createTime: '2024-01-10 09:15'
        }
      ];
      
      this.setData({
        rechargeHistory: mockHistory
      });
    }
    
    // 实际项目中应该调用真实API
    // try {
    //   const response = await api.getRechargeHistory(1, 10);
    //   this.setData({ rechargeHistory: response.data.list });
    // } catch (error) {
    //   console.error('获取充值记录失败:', error);
    // }
  },

  // 格式化时间
  formatTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hour}:${minute}`;
  }
});