# Token机制优化说明

## 问题解决

### 1. 统一Token存储位置
- **主要存储**: `wechat_token` (优先)
- **备用存储**: `access_token` 
- **兼容存储**: `token` (向下兼容)

### 2. Token获取逻辑优化

#### app.js
```javascript
async ensureToken() {
    // 检查本地是否已有token
    const existingToken = wx.getStorageSync('wechat_token') || wx.getStorageSync('access_token')
    
    if (existingToken) {
        console.log('应用启动 - 发现本地已有token，跳过获取')
        return existingToken
    }

    // 本地没有token时才获取新token
    console.log('应用启动 - 本地无token，开始获取新token')
    const tokenInstance = new Token()
    await tokenInstance.verify() // 这会自动获取并存储token
}
```

#### utils/http.js
```javascript
static getToken() {
    // 统一从wechat_token获取token，与其他文件保持一致
    const wechatToken = wx.getStorageSync('wechat_token');
    const accessToken = wx.getStorageSync('access_token');
    const legacyToken = wx.getStorageSync('token');
    
    const token = wechatToken || accessToken || legacyToken || '';
    return token;
}
```

#### models/token.js
```javascript
async verify() {
    // 检查本地是否有token
    const token = wx.getStorageSync('wechat_token') || wx.getStorageSync('access_token')
    if (!token) {
        console.log('Token类 - 本地无token，开始获取')
        await this.getTokenFromServer()
    } else {
        console.log('Token类 - 发现本地token，验证有效性')
        try {
            await this._verifyFromServer(token)
        } catch (error) {
            console.log('Token类 - token验证失败，重新获取')
            await this.getTokenFromServer()
        }
    }
}
```

### 3. 避免重复获取Token
- 应用启动时在`app.js`中统一获取token
- 页面级别不再单独获取token
- HTTP请求时从缓存读取token
- 401错误时通过`app.ensureToken()`统一刷新

### 4. Token验证流程
1. 应用启动 -> 检查本地token -> 没有则获取新token
2. HTTP请求 -> 从本地读取token -> 添加到请求头
3. 401错误 -> 调用app.ensureToken() -> 重新发送请求
4. 页面显示 -> 直接从缓存读取token，无需重新获取

## 测试验证

### 检查点
1. 应用启动时是否正确获取token
2. HTTP请求是否正确携带token
3. 401错误时是否正确刷新token
4. 多个页面间token是否一致
5. 页面刷新后token是否仍然有效

### 调试日志
- `应用启动 - 发现本地已有token，跳过获取`
- `Http.getToken - Token获取状态`
- `API请求 - 已添加token header`
- `Token类 - token已保存到本地存储`

## 优势
1. **避免重复获取**: 统一的token管理，避免多处重复获取
2. **兼容性好**: 支持多种token存储方式
3. **自动刷新**: 401错误时自动刷新token
4. **调试友好**: 详细的日志输出便于调试