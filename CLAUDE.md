# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个名为"青藤"（Qingting）的微信小程序电商应用，专注于中医茶饮订购系统。项目采用微信小程序原生架构，结合自定义组件、业务模型和工具函数。

## 项目架构

### 核心结构
- **入口文件**: `app.js` - 全局应用配置，管理购物车状态
- **配置文件**: `app.json` - 页面路由、tabBar和全局组件注册
- **API层**: 
  - `utils/http.js` - HTTP客户端，处理token管理和错误处理（旧版本）
  - `utils/api.js` - 新版API封装，包含具体业务接口
- **业务模型**: `/models/` 目录下的业务逻辑类，使用单例模式
- **组件系统**: `/components/` 目录下的可复用UI组件，遵循WXML/WXSS/JS/JSON结构
- **页面**: `/pages/` 目录下的应用页面，遵循微信小程序页面结构

### 关键组件架构
- **购物车系统**: `models/cart.js` 单例模式实现，本地存储持久化
- **HTTP客户端**: 
  - 旧版：`utils/http.js` - 自定义wx.request包装，自动token刷新和错误处理
  - 新版：`utils/api.js` - 直接API调用封装，Bearer token认证
- **状态管理**: app.js globalData管理全局购物车状态
- **组件系统**: 使用behaviors共享组件功能

### API配置
- **基础URL**: `https://api.jixiangjiaoyu.com` (配置在`config/config.js`和`utils/api.js`)
- **认证方式**: 
  - 新版：Bearer Token (存储在wechat_token或access_token)
  - 旧版：Header中的token字段
- **错误处理**: 集中式错误码和toast用户反馈

## 接口文档

### 核心API端点（基于 `/qingting/v1/` 前缀）

#### 用户认证
- `POST /token` - 微信登录获取token
- `POST /token/verify` - 验证token有效性

#### 商品管理
- `GET /spu/recommend` - 获取推荐商品（支持体质推荐）
- `GET /spu/list` - 获取商品列表
- `GET /spu/detail` - 获取商品详情
- `GET /spu/category/{id}` - 根据分类获取商品
- `GET /banner/banner_name/{name}` - 根据名称获取轮播图

#### 订单管理
- `POST /order/place` - 创建订单
- `GET /order/list` - 获取订单列表
- `GET /order/detail/{id}` - 获取订单详情

#### 支付系统
- `POST /pay/preorder` - 创建微信支付预订单

#### 体质测评
- `GET /constitution/questions` - 获取体质测试问题
- `POST /constitution/submit` - 提交体质测试答案
- `GET /constitution/result` - 获取体质测试结果

#### 优惠券系统
- `GET /self/coupons` - 获取用户优惠券列表
- `GET /coupon/list` - 获取可领取优惠券
- `POST /coupon/receive` - 领取优惠券

### 响应格式
```json
{
    "code": 0,         // 错误码，0为成功，200也表示成功
    "msg": "success",  // 消息
    "result": {}       // 数据内容
}
```

## 文件结构
```
├── components/          # 可复用UI组件
│   ├── behaviors/      # 共享组件行为
│   └── models/         # 组件特定业务逻辑
├── core/               # 核心异常类
├── models/             # 业务逻辑和数据模型
├── pages/              # 小程序页面
├── utils/              # 工具函数和HTTP客户端
├── config/             # 应用配置
├── wxs/                # 微信脚本文件，用于视图逻辑
└── imgs/               # 静态图片资源
```

## 开发命令

### 微信开发者工具
项目设计为在微信开发者工具中运行，未配置npm构建/测试脚本。

### 关键开发任务
- **预览**: 使用微信开发者工具预览功能
- **上传**: 使用微信开发者工具上传提交
- **调试**: 使用微信开发者工具控制台和网络面板

## 重要模式

### 业务模型模式
- 模型使用单例模式（参见`models/cart.js`）进行全局状态管理
- 应用生命周期内导入并实例化一次
- 主要模型类：
  - `Cart` - 购物车管理
  - `Token` - 认证token管理
  - `Order` - 订单处理
  - `User` - 用户信息管理
  - `Spu` - 商品数据处理

### HTTP请求模式
有两套API调用方式：
1. **新版API** (`utils/api.js`): 推荐使用
   - 直接的接口方法调用
   - Bearer token认证
   - 详细的调试日志
   
2. **旧版HTTP** (`utils/http.js`): 兼容使用
   - 通用HTTP请求封装
   - 自动token刷新
   - 异常处理

### 组件开发
- 组件放置在`/components/`目录
- 遵循微信组件结构：.js、.json、.wxml、.wxss文件
- 在`app.json` usingComponents中注册全局组件
- 使用behaviors共享功能

### 错误处理
- 使用`core/http-exception.js`抛出HTTP错误
- 错误码定义在`config/exception-config.js`
- 通过wx.showToast自动处理用户反馈

## 数据流向
1. 用户交互触发页面/组件方法
2. 业务逻辑由模型类处理
3. 通过API工具类调用接口
4. 状态更新触发UI重新渲染
5. 全局购物车状态在app.js globalData中管理

## 状态管理
- **全局状态**: app.js globalData管理购物车数据
- **页面状态**: 页面级data管理局部状态
- **组件状态**: 组件properties和data管理组件状态
- **本地存储**: wx.getStorageSync/setStorageSync持久化关键数据

## 页面业务流程

### 主要页面流程
1. **首页** (`pages/home/home.js`):
   - 获取用户位置和距离计算
   - 加载轮播图和推荐商品
   - 微信登录流程

2. **购物车** (`pages/cart/cart.js`):
   - 商品分类浏览
   - 购物车商品管理
   - 结算跳转

3. **订单提交** (`pages/order-submit/index.js`):
   - 地址选择
   - 优惠券选择
   - 订单提交和支付

### 关键业务逻辑
- **微信登录**: code -> token -> 用户信息获取
- **商品推荐**: 基于体质测评的个性化推荐
- **购物车管理**: 本地状态 + 全局状态双重管理
- **订单支付**: 订单创建 -> 预支付 -> 微信支付

## 开发注意事项
1. **Token管理**: 优先使用wechat_token，fallback到access_token
2. **API调用**: 新项目推荐使用`utils/api.js`中的方法
3. **错误处理**: API失败时提供降级方案（如默认数据）
4. **状态同步**: 购物车状态需要在页面间同步
5. **图片资源**: 使用相对路径，图片放在`/imgs/`目录下