import {User} from "../../models/user";

const { api } = require('../../utils/api.js');
import { Balance } from '../../models/balance.js';

Page({
  data: {
    balance: 0, // 用户当前余额
    selectedAmount: null, // 选中的充值金额
    rechargeAmount: 0, // 实际充值金额
    canRecharge: false, // 是否可以充值
    rechargeAmounts: [0.01, 200, 500, 1000, 2000, 5000], // 固定充值金额选项
    rechargeHistory: [], // 充值记录
    isLoading: false // 加载状态
  },

  onLoad(options) {
    this.getUserBalance();
    //this.getRechargeHistory();
  },

  // 获取用户余额
  async getUserBalance() {
    this.setData({ isLoading: true });
    wx.showLoading({ title: '加载中...' });

    try {
      const response = await User.getUserInfo();

      if (response && (response.code === 0 || response.code === 200)) {
        const balance = response.result?.balance || response.data?.balance || 0;
        this.setData({ balance: balance });

        // 更新本地存储
        wx.setStorageSync('userBalance', balance);
      } else {
        throw new Error(response?.msg || '获取余额失败');
      }
    } catch (error) {
      console.error('获取余额失败:', error);
      // 如果API失败，使用本地存储的余额
      const localBalance = wx.getStorageSync('userBalance') || 0.00;
      this.setData({ balance: localBalance });

      wx.showToast({
        title: '获取余额失败',
        icon: 'none'
      });
    } finally {
      this.setData({ isLoading: false });
      wx.hideLoading();
    }
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

    // 使用Balance模型验证充值金额
    const validation = Balance.validateRechargeAmount(amount);
    if (!validation.valid) {
      wx.showToast({
        title: validation.message,
        icon: 'none'
      });
      return;
    }

    wx.showModal({
      title: '确认充值',
      content: `确定要充值 ¥${Balance.formatBalance(amount)} 吗？`,
      success: (res) => {
        if (res.confirm) {
          this.processRecharge(validation.amount);
        }
      }
    });
  },

  // 处理充值
  async processRecharge(amount) {
    if (this.data.isLoading) return;

    this.setData({ isLoading: true });
    wx.showLoading({
      title: '创建订单中...'
    });

    try {
      // 创建充值订单
      const response = await Balance.createRecharge(amount);
      if (response && (response.code === 0 || response.code === 200)) {
        const { recharge_id, order_no, pay_params } = response.result || response.data;

        // 更新加载状态
        wx.showLoading({
          title: '拉起支付中...'
        });

        // 拉起微信支付
        await this.initiateWechatPay({
          amount,
          recharge_id,
          order_no,
          pay_params
        });
      } else {
        throw new Error(response?.msg || '订单创建失败');
      }
    } catch (error) {
      console.error('充值失败:', error);
      this.handleRechargeFailure(error);
    } finally {
      this.setData({ isLoading: false });
      wx.hideLoading();
    }
  },

  // 拉起微信支付
  async initiateWechatPay(paymentData) {
    const { amount, recharge_id, order_no, pay_params } = paymentData;

    return new Promise((resolve, reject) => {
      wx.requestPayment({
        timeStamp: pay_params.timeStamp,
        nonceStr: pay_params.nonceStr,
        package: pay_params.package,
        signType: pay_params.signType || 'RSA',
        paySign: pay_params.paySign,
        success: (res) => {
          console.log('微信支付成功:', res);
          // 支付成功后处理
          this.handlePaymentSuccess({
            amount,
            recharge_id,
            order_no
          });
          resolve(res);
        },
        fail: (err) => {
          console.log('微信支付失败:', err);
          // 支付失败处理
          this.handlePaymentFailure({
            amount,
            recharge_id,
            order_no,
            error: err
          });
          reject(err);
        }
      });
    });
  },

  // 处理支付成功
  async handlePaymentSuccess(data) {
    const { amount, recharge_id, order_no } = data;

    wx.showLoading({
      title: '充值完成中...'
    });

    try {
      // 重新获取用户余额
      await this.getUserBalance();

      // 添加充值记录到本地显示
      const rechargeRecord = {
        id: recharge_id || Date.now(),
        amount: Balance.formatBalance(amount),
        status: 'success',
        statusText: '充值成功',
        createTime: Balance.formatDateTime(new Date()),
        orderNo: order_no
      };

      // 更新页面数据
      this.setData({
        selectedAmount: null,
        rechargeAmount: 0,
        canRecharge: false,
        rechargeHistory: [rechargeRecord, ...this.data.rechargeHistory]
      });

      wx.hideLoading();

      // 显示成功提示
      wx.showModal({
        title: '充值成功',
        content: `充值金额：¥${Balance.formatBalance(amount)}\n订单号：${order_no}\n余额已实时更新`,
        showCancel: false,
        confirmText: '确定',
        success: () => {
          // 刷新充值记录
          this.getRechargeHistory();
        }
      });
    } catch (error) {
      wx.hideLoading();
      console.error('获取余额失败:', error);

      // 即使获取余额失败，也显示充值成功
      wx.showModal({
        title: '充值成功',
        content: `充值金额：¥${Balance.formatBalance(amount)}\n订单号：${order_no}\n请刷新页面查看最新余额`,
        showCancel: false,
        confirmText: '确定'
      });
    }
  },

  // 处理支付失败
  handlePaymentFailure(data) {
    const { amount, order_no, error } = data;

    wx.hideLoading();

    let title = '支付失败';
    let content = '支付已取消或失败';

    // 根据错误类型显示不同信息
    if (error.errMsg) {
      if (error.errMsg.includes('cancel')) {
        title = '支付已取消';
        content = '您已取消支付，订单未完成';
      } else if (error.errMsg.includes('fail')) {
        title = '支付失败';
        content = '支付过程中出现错误，请重试';
      }
    }

    wx.showModal({
      title: title,
      content: `${content}\n充值金额：¥${Balance.formatBalance(amount)}\n订单号：${order_no}`,
      showCancel: true,
      confirmText: '重试',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 用户选择重试，重新发起充值
          setTimeout(() => {
            this.processRecharge(amount);
          }, 500);
        }
      }
    });
  },

  // 处理充值失败（订单创建失败）
  handleRechargeFailure(error) {
    wx.hideLoading();

    wx.showModal({
      title: '订单创建失败',
      content: error.message || '创建充值订单失败，请检查网络后重试',
      showCancel: true,
      confirmText: '重试',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 用户选择重试
          setTimeout(() => {
            this.doRecharge();
          }, 500);
        }
      }
    });
  },

  // 获取充值记录
  async getRechargeHistory() {
    try {
      const response = await Balance.getRechargeHistory(1, 10);
      if (response && (response.code === 0 || response.code === 200)) {
        const records = Balance.formatRechargeHistory(response);
        this.setData({
          rechargeHistory: records
        });
      }
    } catch (error) {
      console.error('获取充值记录失败:', error);
      // 如果API失败，显示空列表
      this.setData({
        rechargeHistory: []
      });
    }
  },

  // 自定义输入金额
  onAmountInput(e) {
    const value = e.detail.value;
    const amount = parseFloat(value) || 0;

    this.setData({
      selectedAmount: null, // 清除预设选项选中状态
      rechargeAmount: amount,
      canRecharge: amount > 0
    });
  },

  // 刷新页面数据
  onPullDownRefresh() {
    Promise.all([
      this.getUserBalance(),
      this.getRechargeHistory()
    ]).finally(() => {
      wx.stopPullDownRefresh();
    });
  }
});
