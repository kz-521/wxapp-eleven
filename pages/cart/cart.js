// pages/cart/cart.js

Page({
    /**
     * 页面的初始数据
     */
    data: {
        currentCategory: 0,
        showPopup: false,
        showCartDetail: false,
        products: [
            {
                name: '清照竹影茶',
                tag1: '土形体质',
                tag2: '阴虚体质专属',
                price: '20',
                image: '/imgs/home/drink-item.png'
            },
            {
                name: '清照竹影茶',
                tag1: '土形体质',
                tag2: '阴虚体质专属',
                price: '20',
                image: '/imgs/home/drink-item.png'
            },
            {
                name: '清照竹影茶',
                tag1: '土形体质',
                tag2: '阴虚体质专属',
                price: '20',
                image: '/imgs/home/drink-item.png'
            },
            {
                name: '清照竹影茶',
                tag1: '土形体质',
                tag2: '阴虚体质专属',
                price: '20',
                image: '/imgs/home/drink-item.png'
            },
            {
                name: '清照竹影茶',
                tag1: '土形体质',
                tag2: '阴虚体质专属',
                price: '20',
                image: '/imgs/home/drink-item.png'
            }
        ],
        cartItems: [],
        cartCount: 0,
        totalPrice: 0
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        // 隐藏tabbar
        wx.hideTabBar()
        this.loadCartData()
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {
        // 隐藏tabbar
        wx.hideTabBar()
        this.loadCartData()
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide() {
        // 页面隐藏时显示tabbar
        wx.showTabBar()
    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload() {
        // 页面卸载时显示tabbar
        wx.showTabBar()
    },

    // 加载购物车数据
    loadCartData() {
        const cartItems = wx.getStorageSync('cartItems') || []
        const cartCount = cartItems.reduce((total, item) => total + item.count, 0)
        const totalPrice = cartItems.reduce((total, item) => total + (parseFloat(item.price) * item.count), 0)
        
        this.setData({
            cartItems,
            cartCount,
            totalPrice: totalPrice.toFixed(2)
        })
    },

    // 添加到购物车
    addToCart(event) {
        const index = event.currentTarget.dataset.index
        const product = this.data.products[index]
        
        let cartItems = wx.getStorageSync('cartItems') || []
        const existingItem = cartItems.find(item => item.name === product.name)
        
        if (existingItem) {
            existingItem.count += 1
        } else {
            cartItems.push({
                ...product,
                count: 1
            })
        }
        
        wx.setStorageSync('cartItems', cartItems)
        this.loadCartData()
        
        wx.showToast({
            title: '已添加到购物车',
            icon: 'success'
        })
    },

    // 增加商品数量
    increaseQuantity(event) {
        const index = event.currentTarget.dataset.index
        let cartItems = wx.getStorageSync('cartItems') || []
        
        if (cartItems[index]) {
            cartItems[index].count += 1
            wx.setStorageSync('cartItems', cartItems)
            this.loadCartData()
        }
    },

    // 减少商品数量
    decreaseQuantity(event) {
        const index = event.currentTarget.dataset.index
        let cartItems = wx.getStorageSync('cartItems') || []
        
        if (cartItems[index] && cartItems[index].count > 1) {
            cartItems[index].count -= 1
            wx.setStorageSync('cartItems', cartItems)
            this.loadCartData()
        } else if (cartItems[index] && cartItems[index].count === 1) {
            // 如果数量为1，则移除商品
            cartItems.splice(index, 1)
            wx.setStorageSync('cartItems', cartItems)
            this.loadCartData()
            
            wx.showToast({
                title: '已移除商品',
                icon: 'success'
            })
        }
    },

    // 显示购物车详情
    showCartDetail() {
        this.setData({
            showCartDetail: true
        })
    },

    // 关闭购物车详情
    closeCartDetail() {
        this.setData({
            showCartDetail: false
        })
    },

    // 清空购物车
    clearCart() {
        wx.showModal({
            title: '确认清空',
            content: '确定要清空购物车吗？',
            success: (res) => {
                if (res.confirm) {
                    wx.setStorageSync('cartItems', [])
                    this.loadCartData()
                    this.closeCartDetail()
                    wx.showToast({
                        title: '购物车已清空',
                        icon: 'success'
                    })
                }
            }
        })
    },

    // 去结算
    goToCheckout() {
        if (this.data.cartCount <= 0) {
            wx.showToast({
                title: '购物车为空',
                icon: 'none'
            })
            return
        }
        
        this.setData({
            showPopup: true,
            showCartDetail: false
        })
    },

    // 关闭弹出层
    closePopup() {
        this.setData({
            showPopup: false
        })
    },

    // 阻止事件冒泡
    stopPropagation() {
        // 阻止事件冒泡
    },

    // 确认结算
    confirmCheckout() {
        this.setData({
            showPopup: false
        })
        
        wx.showToast({
            title: '结算成功',
            icon: 'success'
        })
        
        // 清空购物车
        wx.setStorageSync('cartItems', [])
        this.loadCartData()
    },

    // 切换分类
    switchCategory(event) {
        const index = event.currentTarget.dataset.index
        console.log('点击了菜单项，索引:', index)
        console.log('当前currentCategory:', this.data.currentCategory)
        
        this.setData({
            currentCategory: index
        })
        
        console.log('设置后的currentCategory:', this.data.currentCategory)
        console.log('切换到分类:', index)
    }
})
