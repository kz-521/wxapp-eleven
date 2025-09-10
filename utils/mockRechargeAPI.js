// utils/mockRechargeAPI.js
// 模拟充值相关的API接口

// 模拟用户余额数据
let mockUserBalance = 188.50;

// 模拟充值记录
let mockRechargeHistory = [
  {
    id: 1,
    amount: 500,
    bonus: 0,
    totalAmount: 500,
    status: 'success',
    createTime: '2024-01-15 14:30',
    orderNo: 'RC202401150001'
  },
  {
    id: 2,
    amount: 1000,
    bonus: 100,
    totalAmount: 1100,
    status: 'success',
    createTime: '2024-01-10 09:15',
    orderNo: 'RC202401100001'
  },
  {
    id: 3,
    amount: 200,
    bonus: 0,
    totalAmount: 200,
    status: 'success',
    createTime: '2024-01-05 16:45',
    orderNo: 'RC202401050001'
  }
];

// 模拟网络延迟
const simulateNetworkDelay = (min = 500, max = 2000) => {
  return new Promise(resolve => {
    const delay = Math.random() * (max - min) + min;
    setTimeout(resolve, delay);
  });
};

// 模拟充值API
const mockRechargeAPI = {
  // 获取用户余额
  getUserBalance: async () => {
    await simulateNetworkDelay(300, 800);
    
    // 模拟90%成功率
    if (Math.random() > 0.1) {
      return {
        success: true,
        code: 200,
        message: '获取余额成功',
        data: {
          balance: mockUserBalance,
          currency: 'CNY',
          lastUpdateTime: new Date().toISOString()
        }
      };
    } else {
      throw new Error('网络异常，获取余额失败');
    }
  },

  // 执行充值
  recharge: async (amount) => {
    await simulateNetworkDelay(1000, 3000);
    
    // 验证充值金额
    if (amount < 10) {
      throw new Error('充值金额不能少于10元');
    }
    
    if (amount > 50000) {
      throw new Error('单次充值金额不能超过50000元');
    }
    
    // 模拟95%成功率
    if (Math.random() > 0.05) {
      // 计算赠送金额（充值1000元以上赠送10%）
      const bonus = amount >= 1000 ? Math.floor(amount * 0.1) : 0;
      const totalAmount = amount + bonus;
      
      // 生成充值订单号
      const orderNo = 'RC' + new Date().getTime().toString().slice(-12);
      
      // 更新余额
      mockUserBalance += totalAmount;
      
      // 创建充值记录
      const rechargeRecord = {
        id: Date.now(),
        amount: amount,
        bonus: bonus,
        totalAmount: totalAmount,
        status: 'success',
        createTime: formatTime(new Date()),
        orderNo: orderNo
      };
      
      // 添加到充值记录
      mockRechargeHistory.unshift(rechargeRecord);
      
      return {
        success: true,
        code: 200,
        message: '充值成功',
        data: {
          orderNo: orderNo,
          amount: amount,
          bonus: bonus,
          totalAmount: totalAmount,
          newBalance: mockUserBalance,
          rechargeTime: new Date().toISOString()
        }
      };
    } else {
      throw new Error('网络异常，充值失败，请重试');
    }
  },

  // 获取充值记录
  getRechargeHistory: async (page = 1, size = 10) => {
    await simulateNetworkDelay(200, 600);
    
    const startIndex = (page - 1) * size;
    const endIndex = startIndex + size;
    const paginatedHistory = mockRechargeHistory.slice(startIndex, endIndex);
    
    return {
      success: true,
      code: 200,
      message: '获取充值记录成功',
      data: {
        list: paginatedHistory,
        pagination: {
          page: page,
          size: size,
          total: mockRechargeHistory.length,
          totalPages: Math.ceil(mockRechargeHistory.length / size)
        }
      }
    };
  },

  // 获取充值统计
  getRechargeStats: async () => {
    await simulateNetworkDelay(200, 500);
    
    const totalRecharge = mockRechargeHistory.reduce((sum, record) => sum + record.amount, 0);
    const totalBonus = mockRechargeHistory.reduce((sum, record) => sum + record.bonus, 0);
    const totalAmount = mockRechargeHistory.reduce((sum, record) => sum + record.totalAmount, 0);
    
    return {
      success: true,
      code: 200,
      message: '获取充值统计成功',
      data: {
        totalRecharge: totalRecharge,
        totalBonus: totalBonus,
        totalAmount: totalAmount,
        rechargeCount: mockRechargeHistory.length,
        currentBalance: mockUserBalance
      }
    };
  },

  // 重置模拟数据（用于测试）
  resetMockData: () => {
    mockUserBalance = 188.50;
    mockRechargeHistory = [
      {
        id: 1,
        amount: 500,
        bonus: 0,
        totalAmount: 500,
        status: 'success',
        createTime: '2024-01-15 14:30',
        orderNo: 'RC202401150001'
      },
      {
        id: 2,
        amount: 1000,
        bonus: 100,
        totalAmount: 1100,
        status: 'success',
        createTime: '2024-01-10 09:15',
        orderNo: 'RC202401100001'
      }
    ];
  }
};

// 格式化时间
function formatTime(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

module.exports = {
  mockRechargeAPI
};
