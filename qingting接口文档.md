# 青藤（Qingting）模块接口文档

## 接口概述

青藤模块是基于ThinkPHP 6的微信小程序电商API，主要提供茶饮商品的展示、购买、支付和中医体质测评功能。

**基础路径：** `/api/v1/`

**响应格式：** 
```json
{
    "code": 0,         // 错误码，0为成功
    "msg": "success",  // 消息
    "result": {}       // 数据内容
}
```

---

## 1. 测试接口

### 1.1 测试页面
- **接口路径：** `GET|POST /api/v1/test`
- **功能说明：** 打印机测试接口
- **参数：** 无
- **返回示例：** 打印机操作结果

---

## 2. 轮播图接口

### 2.1 根据名称获取轮播图
- **接口路径：** `GET /api/v1/banner/banner_name/{name}`
- **功能说明：** 根据轮播图名称获取轮播图数据
- **路径参数：**
  - `name` (string): 轮播图名称
- **返回示例：**
```json
{
    "code": 0,
    "msg": "获取成功",
    "result": {
        "id": 1,
        "name": "首页轮播",
        "items": [...]
    }
}
```

### 2.2 获取轮播图列表
- **接口路径：** `GET /api/v1/banner/list`
- **功能说明：** 获取所有激活状态的轮播图列表
- **参数：** 无
- **返回示例：**
```json
{
    "code": 0,
    "msg": "获取成功",
    "result": {
        "list": [...],
        "total": 5
    }
}
```

---

## 3. 商品(SPU)接口

### 3.1 获取商品详情
- **接口路径：** `GET /api/v1/spu/detail`
- **功能说明：** 获取指定商品的详细信息
- **查询参数：**
  - `id` (int): 商品ID
- **返回示例：**
```json
{
    "code": 0,
    "msg": "获取成功",
    "result": {
        "id": 1,
        "title": "佛手映月",
        "subtitle": "清香淡雅",
        "img": "https://...",
        "price": 18.00,
        "sku_list": [...]
    }
}
```

### 3.2 获取首页推荐商品
- **接口路径：** `GET /api/v1/spu/recommend`
- **功能说明：** 获取首页推荐商品，优先根据用户体质推荐
- **查询参数：**
  - `page` (int, 可选): 页码，默认1
  - `size` (int, 可选): 每页数量，默认15
- **权限：** 需要登录（获取体质推荐）
- **返回示例：**
```json
{
    "code": 0,
    "msg": "获取成功", 
    "result": {
        "list": [
            {
                "id": 1,
                "title": "佛手映月",
                "recommend_reason": "适合您的木行体质",
                "order_count": 999,
                "sku_list": [...]
            }
        ],
        "total": 50,
        "current_page": 1,
        "last_page": 4
    }
}
```

### 3.3 根据分类获取商品
- **接口路径：** `GET /api/v1/spu/category/{id}`
- **功能说明：** 根据分类ID获取商品列表
- **路径参数：**
  - `id` (int): 分类ID（1为推荐商品）
- **查询参数：**
  - `page` (int, 可选): 页码，默认1
  - `size` (int, 可选): 每页数量，默认15
- **返回示例：**
```json
{
    "code": 0,
    "msg": "获取成功",
    "result": {
        "list": [...],
        "total": 30,
        "current_page": 1,
        "last_page": 2
    }
}
```

### 3.4 获取商品列表
- **接口路径：** `GET /api/v1/spu/list`
- **功能说明：** 获取所有商品列表（按创建时间倒序）
- **查询参数：**
  - `page` (int, 可选): 页码，默认1
  - `size` (int, 可选): 每页数量，默认15
- **返回示例：**
```json
{
    "code": 0,
    "msg": "获取成功",
    "result": {
        "list": [...],
        "total": 100,
        "current_page": 1,
        "last_page": 7
    }
}
```

### 3.5 搜索商品
- **接口路径：** `GET /api/v1/spu/search`
- **功能说明：** 根据关键词搜索商品标题
- **查询参数：**
  - `q` (string): 搜索关键词
  - `page` (int, 可选): 页码，默认1
  - `size` (int, 可选): 每页数量，默认15
- **返回示例：**
```json
{
    "code": 0,
    "msg": "搜索成功",
    "result": {
        "list": [...],
        "total": 5,
        "current_page": 1,
        "last_page": 1,
        "keyword": "佛手"
    }
}
```

---

## 4. 支付接口

### 4.1 创建预订单
- **接口路径：** `POST /api/v1/pay/preorder`
- **功能说明：** 创建微信支付预订单
- **请求参数：**
  - `order_id` (int): 订单ID
- **权限：** 需要登录
- **返回示例：**
```json
{
    "code": 0,
    "msg": "预订单创建成功",
    "result": {
        "timeStamp": "1640995200",
        "nonceStr": "abc123",
        "package": "prepay_id=...",
        "signType": "RSA",
        "paySign": "..."
    }
}
```

### 4.2 支付回调通知
- **接口路径：** `POST /api/v1/pay/notify`
- **功能说明：** 微信支付回调通知处理
- **说明：** 该接口由微信支付系统自动调用

### 4.3 查询支付结果
- **接口路径：** `GET /api/v1/pay/query/{orderNo}`
- **功能说明：** 查询订单支付状态
- **路径参数：**
  - `orderNo` (string): 订单号
- **返回示例：**
```json
{
    "code": 0,
    "msg": "查询成功",
    "result": {
        "trade_state": "SUCCESS",
        "trade_state_desc": "支付成功"
    }
}
```

### 4.4 申请退款
- **接口路径：** `POST /api/v1/pay/refund`
- **功能说明：** 申请订单退款
- **请求参数：**
  - `orderNo` (string): 订单号
  - `refundAmount` (float): 退款金额
- **返回示例：**
```json
{
    "code": 0,
    "msg": "退款申请成功",
    "result": {
        "refund_id": "...",
        "status": "SUCCESS"
    }
}
```

---

## 5. 订单接口

### 5.1 下单接口
- **接口路径：** `POST /api/v1/order/place`
- **功能说明：** 创建订单
- **权限：** 需要登录
- **请求参数：**
```json
{
    "sku_info_list": [
        {
            "id": 1,      // SKU ID
            "count": 2    // 购买数量
        }
    ],
    "remark": "少糖不要冰"  // 备注（可选）
}
```
- **返回示例：**
```json
{
    "code": 0,
    "msg": "订单创建成功",
    "result": {
        "order_id": 123,
        "order_no": "QD20250731001",
        "total_price": 36.00,
        "total_count": 2
    }
}
```

### 5.2 获取订单列表
- **接口路径：** `GET /api/v1/order/list`
- **功能说明：** 获取用户订单列表
- **权限：** 需要登录
- **查询参数：**
  - `status` (int, 可选): 订单状态（0:全部, 1:待支付, 2:已支付, 3:已完成, 4:已取消）
  - `page` (int, 可选): 页码，默认1
  - `limit` (int, 可选): 每页数量，默认10
- **返回示例：**
```json
{
    "code": 0,
    "msg": "获取成功",
    "result": {
        "list": [
            {
                "id": 123,
                "order_no": "QD20250731001",
                "total_price": 36.00,
                "status": 1,
                "status_text": "待支付",
                "placed_time_text": "2025-07-31 10:30:00"
            }
        ],
        "total": 15,
        "current_page": 1,
        "last_page": 2
    }
}
```

### 5.3 获取订单详情
- **接口路径：** `GET /api/v1/order/detail/{id}`
- **功能说明：** 获取指定订单的详细信息
- **权限：** 需要登录
- **路径参数：**
  - `id` (int): 订单ID
- **返回示例：**
```json
{
    "code": 0,
    "msg": "获取成功",
    "result": {
        "id": 123,
        "order_no": "QD20250731001",
        "total_price": 36.00,
        "snap_items": "[...]",
        "status": 1,
        "placed_time": 1640995200,
        "remark": "少糖不要冰"
    }
}
```

---

## 6. 用户令牌接口

### 6.1 获取用户令牌（登录）
- **接口路径：** `POST /api/v1/token`
- **功能说明：** 微信小程序登录获取令牌
- **请求参数：**
  - `code` (string): 微信登录code
  - `type` (string, 可选): 类型
  - `nano` (string, 可选): 额外参数
- **返回示例：**
```json
{
    "code": 0,
    "msg": "success",
    "result": {
        "token": "eyJ0eXAiOiJKV1Q...",
        "user_info": {
            "id": 1,
            "nickname": "微信用户",
            "mobile": "138****8000",
            "openid": "oX1234567890"
        }
    }
}
```

### 6.2 校验令牌
- **接口路径：** `POST /api/v1/token/verify`
- **功能说明：** 校验令牌有效性
- **请求参数：**
  - `token` (string): 用户令牌
- **返回示例：**
```json
{
    "code": 0,
    "msg": "success",
    "result": {
        "isValid": true
    }
}
```

### 6.3 获取七牛云令牌
- **接口路径：** `GET /api/v1/token/qn`
- **功能说明：** 获取七牛云上传令牌
- **返回示例：**
```json
{
    "code": 0,
    "msg": "success",
    "result": {
        "token": "七牛云上传token"
    }
}
```

---

## 7. 用户信息接口

### 7.1 获取用户信息
- **接口路径：** `GET /api/v1/user/detail`
- **功能说明：** 获取当前用户详细信息
- **权限：** 需要登录
- **返回示例：**
```json
{
    "code": 0,
    "msg": "success",
    "result": {
        "id": 1,
        "nickname": "微信用户",
        "mobile": "138****8000",
        "avatar": "https://...",
        "create_time": "2024-01-01 00:00:00"
    }
}
```

### 7.2 更新用户信息
- **接口路径：** `POST /api/v1/user/update`
- **功能说明：** 更新当前用户信息
- **权限：** 需要登录
- **请求参数：**
  - `nickname` (string, 可选): 昵称
  - `avatar` (string, 可选): 头像URL
  - `mobile` (string, 可选): 手机号
- **返回示例：**
```json
{
    "code": 0,
    "msg": "更新成功",
    "result": []
}
```

---

## 8. 体质测评接口

### 8.1 获取体质问题
- **接口路径：** `GET /api/v1/constitution/questions`
- **功能说明：** 获取所有体质测评问题
- **返回示例：**
```json
{
    "code": 0,
    "msg": "获取成功",
    "result": {
        "questions": [
            {
                "id": 1,
                "question": "您平时的精神状态如何？",
                "options": ["A. 精力充沛", "B. 容易疲劳", "..."],
                "question_type": "single",
                "order": 1
            }
        ],
        "total": 25
    }
}
```

### 8.2 提交体质测试
- **接口路径：** `POST /api/v1/constitution/submit`
- **功能说明：** 提交体质测试答案并获取结果
- **权限：** 需要登录
- **请求参数：**
```json
{
    "answers": [
        {"question_id": 1, "answer": "A"},
        {"question_id": 2, "answer": "B"}
    ]
}
```
- **返回示例：**
```json
{
    "code": 0,
    "msg": "测试完成",
    "result": {
        "result_id": 123,
        "primary_constitution": {
            "type": "木行",
            "features": "肝气旺盛，追求效率",
            "problems": "偏头痛、月经不调",
            "keywords": "疏肝理气，晨起拉伸"
        },
        "secondary_constitution": null,
        "scores": {"木": 8, "火": 6, "土": 4, "金": 3, "水": 2}
    }
}
```

### 8.3 获取体质测试结果
- **接口路径：** `GET /api/v1/constitution/result`
- **功能说明：** 获取用户最新的体质测试结果
- **权限：** 需要登录
- **查询参数：**
  - `token` (string): 用户令牌
- **返回示例：**
```json
{
    "code": 0,
    "msg": "获取成功",
    "result": {
        "id": 123,
        "primary_constitution": "木行",
        "secondary_constitution": "",
        "primary_features": "肝气旺盛，追求效率",
        "create_time": 1640995200
    }
}
```

---

## 9. 中医体质测评接口

### 9.1 创建测评记录
- **接口路径：** `POST /api/v1/tcm/assessment`
- **功能说明：** 创建中医体质测评记录
- **权限：** 需要登录
- **请求参数：**
```json
{
    "name": "张三",
    "gender": 1,           // 性别：1男，2女
    "age": 30,
    "phone": "13800138000",
    "height": 170,         // 可选
    "weight": 65,          // 可选
    "occupation": "程序员", // 可选
    "lifestyle": "久坐",    // 可选
    "medical_history": ""   // 可选
}
```
- **返回示例：**
```json
{
    "code": 0,
    "msg": "测评记录创建成功",
    "result": {
        "assessment_id": 456,
        "assessment_code": "TCM20250731001"
    }
}
```

### 9.2 获取测评题目
- **接口路径：** `GET /api/v1/tcm/questions`
- **功能说明：** 获取中医体质测评题目
- **返回示例：**
```json
{
    "code": 0,
    "msg": "获取成功",
    "result": {
        "questions": [...],
        "total": 60
    }
}
```

### 9.3 提交测评答案
- **接口路径：** `POST /api/v1/tcm/answers`
- **功能说明：** 提交中医体质测评答案
- **请求参数：**
```json
{
    "assessment_id": 456,
    "answers": [
        {"question_id": 1, "option_id": 1},
        {"question_id": 2, "option_id": 3}
    ]
}
```
- **返回示例：**
```json
{
    "code": 0,
    "msg": "答案提交成功",
    "result": {
        "assessment_id": 456,
        "next_step": "analysis"
    }
}
```

### 9.4 开始AI分析
- **接口路径：** `POST /api/v1/tcm/analysis`
- **功能说明：** 开始AI分析测评结果
- **请求参数：**
  - `assessment_id` (int): 测评ID
- **返回示例：**
```json
{
    "code": 0,
    "msg": "AI分析完成",
    "result": {
        "constitution_type": "气虚质",
        "analysis": "...",
        "advice": "..."
    }
}
```

### 9.5 获取测评结果
- **接口路径：** `GET /api/v1/tcm/result/{assessment_id}`
- **功能说明：** 获取中医体质测评结果
- **路径参数：**
  - `assessment_id` (int): 测评ID
- **返回示例：**
```json
{
    "code": 0,
    "msg": "获取成功",
    "result": {
        "assessment_code": "TCM20250731001",
        "constitution_type": "气虚质",
        "constitution_score": 85,
        "secondary_constitutions": ["湿热质"],
        "ai_analysis": "您属于气虚质...",
        "health_advice": "建议多吃补气食物...",
        "diet_plan": "早餐：小米粥...",
        "lifestyle_advice": "规律作息...",
        "tea_recommendations": [...],
        "report_url": "https://..."
    }
}
```

### 9.6 获取测评历史
- **接口路径：** `GET /api/v1/tcm/history`
- **功能说明：** 获取用户测评历史记录
- **权限：** 需要登录
- **查询参数：**
  - `page` (int, 可选): 页码，默认1
  - `limit` (int, 可选): 每页数量，默认10
- **返回示例：**
```json
{
    "code": 0,
    "msg": "获取成功",
    "result": {
        "list": [...],
        "total": 5,
        "current_page": 1,
        "last_page": 1
    }
}
```

### 9.7 获取茶饮推荐
- **接口路径：** `GET /api/v1/tcm/tea-recommendations`
- **功能说明：** 根据体质类型获取茶饮推荐
- **查询参数：**
  - `constitution_type` (string): 体质类型
  - `limit` (int, 可选): 返回数量，默认10
- **返回示例：**
```json
{
    "code": 0,
    "msg": "获取成功",
    "result": {
        "constitution_type": "气虚质",
        "recommendations": [...]
    }
}
```

### 9.8 生成测评报告
- **接口路径：** `POST /api/v1/tcm/report`
- **功能说明：** 生成PDF测评报告
- **请求参数：**
  - `assessment_id` (int): 测评ID
- **返回示例：**
```json
{
    "code": 0,
    "msg": "报告生成成功",
    "result": {
        "report_url": "https://...",
        "download_url": "https://..."
    }
}
```

---

## 10. 优惠券接口

### 10.1 获取用户优惠券列表
- **接口路径：** `GET /api/v1/self/coupons`
- **功能说明：** 获取当前用户的优惠券列表，支持状态筛选
- **权限：** 需要登录
- **查询参数：**
  - `status` (int, 可选): 优惠券状态筛选（0:全部, 1:未使用, 2:已使用, 3:已过期），默认0
  - `page` (int, 可选): 页码，默认1
  - `limit` (int, 可选): 每页数量，默认10
- **返回示例：**
```json
{
    "code": 0,
    "msg": "获取成功",
    "result": {
        "list": [
            {
                "id": 1,
                "coupon_id": 10,
                "status": 1,
                "actual_status": 1,
                "status_text": "未使用",
                "create_time": "2025-08-01 10:00:00",
                "coupon": {
                    "id": 10,
                    "title": "新用户优惠券",
                    "description": "新用户专享优惠",
                    "type": 1,
                    "type_text": "满减券",
                    "display_title": "满50减10",
                    "full_money": 50.00,
                    "minus": 10.00,
                    "start_time": "2025-08-01 00:00:00",
                    "end_time": "2025-08-31 23:59:59",
                    "is_valid": true
                }
            }
        ],
        "total": 15,
        "current_page": 1,
        "last_page": 2,
        "per_page": 10
    }
}
```

### 10.2 获取可用优惠券数量
- **接口路径：** `GET /api/v1/self/coupon/count`
- **功能说明：** 获取当前用户可用优惠券数量
- **权限：** 需要登录
- **返回示例：**
```json
{
    "code": 0,
    "msg": "获取成功",
    "result": {
        "count": 5
    }
}
```

### 10.3 获取即将过期的优惠券
- **接口路径：** `GET /api/v1/self/coupon/expiring`
- **功能说明：** 获取7天内即将过期的优惠券列表
- **权限：** 需要登录
- **返回示例：**
```json
{
    "code": 0,
    "msg": "获取成功",
    "result": [
        {
            "id": 2,
            "coupon_id": 11,
            "status": 1,
            "remain_days": 3,
            "coupon": {
                "id": 11,
                "display_title": "满100减20",
                "type_text": "满减券",
                "end_time": "2025-08-07 23:59:59"
            }
        }
    ]
}
```

### 10.4 获取优惠券详情
- **接口路径：** `GET /api/v1/self/coupon/detail/{id}`
- **功能说明：** 获取指定用户优惠券的详情
- **权限：** 需要登录
- **路径参数：**
  - `id` (int): 用户优惠券ID
- **返回示例：**
```json
{
    "code": 0,
    "msg": "获取成功",
    "result": {
        "id": 1,
        "coupon_id": 10,
        "user_id": 123,
        "status": 2,
        "status_text": "已使用",
        "order_id": 456,
        "create_time": "2025-08-01 10:00:00",
        "coupon": {
            "id": 10,
            "title": "新用户优惠券",
            "description": "新用户专享优惠",
            "type": 1,
            "type_text": "满减券",
            "display_title": "满50减10",
            "full_money": 50.00,
            "minus": 10.00,
            "start_time": "2025-08-01 00:00:00",
            "end_time": "2025-08-31 23:59:59",
            "is_valid": false
        },
        "order": {
            "id": 456,
            "order_no": "QD20250801001",
            "total_price": 55.00
        }
    }
}
```

### 10.5 获取订单可用优惠券
- **接口路径：** `GET /api/v1/self/coupon/usable`
- **功能说明：** 获取指定订单金额可使用的优惠券列表（按优惠金额降序排列）
- **权限：** 需要登录
- **查询参数：**
  - `order_amount` (float): 订单金额
- **返回示例：**
```json
{
    "code": 0,
    "msg": "获取成功",
    "result": [
        {
            "id": 1,
            "coupon_id": 10,
            "discount_amount": 20.00,
            "coupon": {
                "id": 10,
                "display_title": "满100减20",
                "type_text": "满减券",
                "full_money": 100.00,
                "minus": 20.00
            }
        },
        {
            "id": 2,
            "coupon_id": 11,
            "discount_amount": 10.00,
            "coupon": {
                "id": 11,
                "display_title": "满50减10",
                "type_text": "满减券",
                "full_money": 50.00,
                "minus": 10.00
            }
        }
    ]
}
```

### 10.6 获取可领取优惠券列表
- **接口路径：** `GET /api/v1/coupon/list`
- **功能说明：** 获取当前可以领取的优惠券列表
- **查询参数：**
  - `page` (int, 可选): 页码，默认1
  - `limit` (int, 可选): 每页数量，默认10
- **返回示例：**
```json
{
    "code": 0,
    "msg": "获取成功",
    "result": {
        "list": [
            {
                "id": 10,
                "title": "新用户优惠券",
                "description": "新用户专享优惠",
                "type": 1,
                "type_text": "满减券",
                "display_title": "满50减10",
                "full_money": 50.00,
                "minus": 10.00,
                "start_time": "2025-08-01 00:00:00",
                "end_time": "2025-08-31 23:59:59",
                "is_valid": true,
                "can_receive": true
            },
            {
                "id": 11,
                "title": "折扣优惠券",
                "description": "全场8折优惠",
                "type": 2,
                "type_text": "折扣券",
                "display_title": "8.0折券",
                "rate": 0.80,
                "start_time": "2025-08-01 00:00:00",
                "end_time": "2025-08-15 23:59:59",
                "is_valid": true,
                "can_receive": false
            }
        ],
        "total": 10,
        "current_page": 1,
        "last_page": 1,
        "per_page": 10
    }
}
```

### 10.7 领取优惠券
- **接口路径：** `POST /api/v1/coupon/receive`
- **功能说明：** 领取指定的优惠券
- **权限：** 需要登录
- **请求参数：**
  - `coupon_id` (int): 优惠券ID
- **返回示例：**
```json
{
    "code": 0,
    "msg": "领取成功",
    "result": []
}
```
- **错误示例：**
```json
{
    "code": 40000,
    "msg": "无法领取该优惠券",
    "result": []
}
```

---

## 11. 通用接口

### 10.1 获取微信手机号
- **接口路径：** `POST /api/v1/common/wx_phone`
- **功能说明：** 通过微信授权获取用户手机号
- **请求参数：**
  - `code` (string): 微信获取手机号的code
- **返回示例：**
```json
{
    "code": 0,
    "msg": "success",
    "result": {
        "errcode": 0,
        "errmsg": "ok",
        "phone_info": {
            "phoneNumber": "13800138000",
            "purePhoneNumber": "13800138000",
            "countryCode": "86"
        }
    }
}
```

---

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未登录或令牌无效 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |
| 40000 | 业务逻辑错误 |

### 优惠券相关错误码

| 场景 | 错误信息 | 说明 |
|------|----------|------|
| 重复领取 | "无法领取该优惠券" | 用户已领取过该优惠券 |
| 优惠券过期 | "无法领取该优惠券" | 优惠券已过期或未到使用时间 |
| 优惠券不存在 | "优惠券不存在" | 指定的优惠券ID不存在 |
| 订单金额不足 | "订单金额不足" | 订单金额不满足优惠券使用条件 |

---

## 认证说明

大部分接口需要在请求头中携带用户令牌：

```
Authorization: Bearer {token}
```

或在请求参数中传递：

```
token: {token}
```

---

## 注意事项

1. 所有金额字段均以元为单位，小数点后保留2位
2. 时间字段统一使用时间戳格式
3. 图片URL已包含CDN域名，可直接使用
4. 分页查询的页码从1开始
5. 体质推荐功能需要用户先完成体质测评
6. 微信支付相关接口需要配置微信支付V3参数
7. 部分接口需要微信小程序授权（如获取手机号）

### 优惠券相关注意事项

8. 优惠券状态会根据有效期自动判断是否过期
9. 满减券需要订单金额达到门槛才能使用
10. 折扣券按比例计算优惠金额
11. 每张优惠券每个用户只能领取一次
12. 已使用的优惠券会关联到具体订单
13. 订单可用优惠券接口会按优惠金额降序排列
14. 即将过期优惠券指7天内到期的优惠券

---

**文档更新时间：** 2025-08-04  
**接口版本：** v1  
**模块版本：** 基于ThinkPHP 6.x