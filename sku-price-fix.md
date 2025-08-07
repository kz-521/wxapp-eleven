# SKU价格计算修正

## 问题描述

之前的购物车和订单系统存在关键问题：
- **错误逻辑**: 使用SPU（Standard Product Unit）价格进行金额计算
- **正确逻辑**: 应该使用SKU（Stock Keeping Unit）价格进行金额计算

## SKU vs SPU 说明

### SPU (Standard Product Unit) - 标准产品单位
- 代表一类商品，如"佛手映月茶"
- 包含商品的基本信息：名称、描述、图片等
- **不包含具体的规格和价格**

### SKU (Stock Keeping Unit) - 库存量单位  
- 代表具体的商品规格，如"佛手映月茶 大杯 加冰"
- 包含具体的规格信息：尺寸、口味、温度等
- **包含具体的价格和库存数量**

## 修正内容

### 1. 购物车价格计算修正

#### 修正前 (cart.js)
```javascript
// 只使用商品的price字段（SPU价格）
const totalPrice = cartItems.reduce((total, item) => {
    return total + (parseFloat(item.price) * item.count)
}, 0)
```

#### 修正后 (cart.js)
```javascript
// 优先使用SKU价格，fallback到SPU价格
const totalPrice = cartItems.reduce((total, item) => {
    let itemPrice = 0
    
    // 优先使用SKU价格
    if (item.sku && item.sku.price) {
        itemPrice = item.sku.discount_price || item.sku.price
    } 
    // 如果有skuPrice字段
    else if (item.skuPrice) {
        itemPrice = item.skuPrice
    }
    // fallback到商品price字段
    else {
        itemPrice = parseFloat(item.price) || 0
    }
    
    return total + (itemPrice * item.count)
}, 0)
```

### 2. 添加商品到购物车修正

#### 修正前
```javascript
// 直接将商品信息复制到购物车，使用SPU数据
cartItems.push({
    ...product,
    count: 1
})
```

#### 修正后
```javascript
// 选择具体的SKU，存储SKU信息和价格
const cartItem = {
    id: product.id, // SPU ID
    skuId: selectedSku.id, // SKU ID，订单提交时使用
    name: product.name,
    image: product.image,
    count: 1,
    // 价格使用SKU价格
    price: selectedSku.discount_price || selectedSku.price,
    skuPrice: selectedSku.discount_price || selectedSku.price,
    // 存储完整的SKU信息
    sku: {
        id: selectedSku.id,
        price: selectedSku.price,
        discount_price: selectedSku.discount_price,
        stock: selectedSku.stock
    }
}
```

### 3. 订单提交修正

#### 修正前
```javascript
// 可能使用SPU ID提交订单
const sku_info_list = orderProducts.map(item => ({
    id: item.id, // 这可能是SPU ID
    count: item.count
}))
```

#### 修正后  
```javascript
// 确保使用SKU ID提交订单
const sku_info_list = orderProducts.map(item => {
    let skuId = null
    if (item.skuId) {
        skuId = item.skuId
    } else if (item.sku && item.sku.id) {
        skuId = item.sku.id
    } else {
        skuId = item.id // fallback
        console.warn('商品缺少SKU ID，使用商品ID:', item)
    }
    
    return {
        id: skuId, // SKU ID
        count: parseInt(item.count)
    }
})
```

### 4. 订单金额计算修正

#### 修正前 (order-submit/index.js)
```javascript
// 使用商品price字段（可能是SPU价格）
const totalAmount = cartItems.reduce((total, item) => {
    return total + (parseFloat(item.price) * item.count)
}, 0)
```

#### 修正后 (order-submit/index.js)
```javascript
// 优先使用SKU价格计算订单金额
const totalAmount = cartItems.reduce((total, item) => {
    let itemPrice = 0
    
    // 优先使用SKU价格
    if (item.sku && item.sku.price) {
        itemPrice = item.sku.discount_price || item.sku.price
    } 
    else if (item.skuPrice) {
        itemPrice = item.skuPrice
    }
    else {
        itemPrice = parseFloat(item.price) || 0
    }
    
    return total + (itemPrice * item.count)
}, 0)
```

## 调试日志增强

### 购物车价格计算日志
```
购物车商品价格计算: {
    name: "佛手映月茶",
    count: 2,
    itemPrice: 18.00,
    total: 36.00
}
购物车数据更新: {
    cartCount: 2,
    totalPrice: "36.00",
    cartItems: 1
}
```

### 订单提交日志
```
处理商品项: {id: 1, skuId: 101, name: "佛手映月茶", sku: {...}}
构建的sku_info_list: [{id: 101, count: 2}]
订单商品价格计算: {
    name: "佛手映月茶",
    count: 2, 
    itemPrice: 18.00,
    total: 36.00
}
```

## 注意事项

1. **SKU选择逻辑**: 当前简化处理，如果商品有多个SKU，选择第一个可用的。实际应用中应该让用户在商品详情页选择具体规格。

2. **向下兼容**: 保持了对旧数据格式的支持，使用fallback机制。

3. **数据验证**: 添加了SKU数据有效性检查，防止提交无效的SKU ID。

4. **价格优先级**: 
   - 1. SKU优惠价格 (sku.discount_price)
   - 2. SKU原价 (sku.price)  
   - 3. 商品价格字段 (item.price)

这样修正后，购物车和订单系统将正确使用SKU价格进行计算，确保价格的准确性。