import {getSystemSize} from "../../utils/system";
import {px2rpx} from "../../miniprogram_npm/lin-ui/utils/util";
import {Categories} from "../../models/categories";
import {SpuPaging} from "../../models/spu-paging";
import { Spu } from "../../models/spu";
import {ShoppingWay} from "../../core/enum";
import {Cart} from "../../models/cart";
import {CartItem} from "../../models/cart-item";
import {Calculator} from "../../models/calculator";
import debounce from '../../utils/debounce'
const cart = new Cart()
Page({

    /**
     * 页面的初始数据
     */
    data: {
        cartItems: [],
        isEmpty: false,
        carPopup:false,
        showRealm:false,
        totalPrice:0,
        orderWay:'cart',
        cart:false,
        categoryId:0,
        paging: null,
        loadingType: 'loading',
        defaultRootId: 1,
        nowCount: 1,
        showCartPopup: true,
        scrollTop: 0,
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: async function (options) {

        const sysInfo = wx.getSystemInfoSync();
        this.setData({
            statusBarHeight:sysInfo.statusBarHeight
        })

        this.initCategoryData()
        this.setDynamicSegmentHeight()

        const cart = new Cart()

        let cartItems = cart.isEmpty();



        console.log(cartItems)

        if (!cartItems){
            this.refreshCartData()
            this.setData({
                cart:true
            })
        }


    },

    async onShow() {
        this.updateCartItemCount()
        this.refreshCartData()
        this.mergeCountToSpuList()

        const cartData = await cart.getAllSkuFromServer()

        if (cartData) {
            this.setData({
                cart: true,
                cartItems: cartData.items
            })
            return
        }

        this.setData({
            cart: false,
        })
    },
    async initCategoryData() {

        const categories = new Categories()
        this.data.categories = categories

        await categories.getAll()

        const roots = categories.getRoots()

        const defaultRoot = this.getDefaultRoot(roots)
        this.data.categoryId = defaultRoot.id;

        this.setData({
            roots,
        })

        this.getList()

    },
    refreshCartData() {
        const cart = new Cart()
        const checkedItems = cart.getCheckedItems()
        const calculator = new Calculator(checkedItems)
        calculator.calc()
        this.setCalcData(calculator)
    },
    setCalcData(calculator) {
        const totalPrice = calculator.getTotalPrice()
        const totalSkuCount = calculator.getTotalSkuCount()
        this.setData({
            totalPrice,
            totalSkuCount
        })
    },
    getDefaultRoot(roots) {
        let defaultRoot = roots.find(r => r.id === this.data.defaultRootId)
        if (!defaultRoot) {
            defaultRoot = roots[0]
        }
        return defaultRoot
    },

    async setDynamicSegmentHeight() {
        const res = await getSystemSize()
        const windowHeightRpx = px2rpx(res.windowHeight)

        const h = windowHeightRpx - 60 - 20 - 2
        this.setData({
            segHeight: h
        })
    },

    onSegChange(event) {

        this.setData({
            loadingType: 'loading'
        })
        this.scrollToTop()

        const rootId = event.detail.activeKey
        const currentRoot = this.data.categories.getRoot(rootId)

        this.data.categoryId = currentRoot.id;

        this.data.defaultRootId = rootId

        this.getList().then(r => {})

    },

    scrollToTop() {
        this.setData({
            scrollTop: 0,
        })
    },


    async getList() {

        let cid = this.data.categoryId;
        const paging = SpuPaging.getLatestPagingByCid(cid)
        this.data.spuPaging = paging
        const data = await paging.getMoreData()

        if (data.empty || !data.moreData){
            this.setData({
                loadingType: 'end'
            })
        }

        if (!data) {
            return
        }

        this.setData({
            list: data.accmulator,
        }, () => {
            this.mergeCountToSpuList()
        })
    },

    onGotoSearch(event) {
        wx.navigateTo({
            url: `/pages/search/search`
        })
    },

    onCart(event) {

        this.changeCarStatus()

    },
    changeCarStatus(){
        let carStatus = this.data.carPopup

        if (carStatus) {
            this.onCloseCartPopup()
            return
        }

        this.setData({
            carPopup: true,
        })
    },

    onCloseCartPopup() {
        this.setData({
            showCartPopup: false,
        })
        setTimeout(() => {
            this.setData({
                carPopup: false,
                showCartPopup: true,
            })
        }, 300)
    },

    onPay(event) {

        this.setData({
            carPopup:false
        });

        if (this.data.totalSkuCount <= 0) {
            return
        }

        wx.navigateTo({
            url: `/pages/order/order?way=${ShoppingWay.CART}`
        })
    },

    async spuscrolltolower(e) {
        const paging = this.data.spuPaging
        const data = await paging.getMoreData()

        if(data){
            this.setData({
                list: data.accmulator,
            }, () => {
                this.mergeCountToSpuList()
            })

        } else {
            this.setData({
                loadingType: 'end'
            })
        }

    },
/*    onTapGridItem(event) {

        let that = this

        if (!that.data.cart){
            that.setData({
                cart:true
            })
        }


        const id = event.detail.key
        this.triggerEvent('itemtap', {
            cid: id
        })

        this.onAddToCart(event)

    },*/

    clearCartData(){
      // 1清空数据

        cart.removeAllItems()

        //2.关闭窗口

        this.setData({
            carPopup:false,
            cart:false
        });
        this.refreshCart()
    },


    async addCart(event) {
        let pid = event.currentTarget.dataset.id
        const spu = await Spu.getDetail(pid)
        this.setData({
            spu,
            showRealm: true
        })
    },

    async onShopping(event) {

        const chosenSku = event.detail.sku
        const skuCount = event.detail.skuCount

        const cartItem = new CartItem(chosenSku, skuCount)
        cart.addItem(cartItem)
        // this.updateCartItemCount()

        this.refreshCart()

        const cartData = await cart.getAllSkuFromServer()
        if (cartData) {
            this.setData({
                cart: true,
            })
        }

        this.mergeCountToSpuList()
    },

    updateCartItemCount() {
        let cartItems = cart.isEmpty();

        if (!cartItems){
            this.setData({
                cartItemCount: cart.getCartItemCount(),
                showRealm: false
            })
            return
        }

        this.setData({
            cartItemCount: 0,
        })


    },
    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {

    },

    onSpecChange(e) {
        this.setNowCount(e)

        this.setData({
            specs: e.detail,
        })
    },

    setNowCount(e) {
        // console.log(e.detail)
        const { noSpec, skuId, skuIntact } = e.detail

        const findItemAndSetCount = (skuId) => {
            const item = cart.findEqualItem(skuId)
            const nowCount = item?.count || 1
            this.setData({
                nowCount,
            })
        }

        if (noSpec) {
            findItemAndSetCount(skuId)
            return
        }

        if (!skuIntact) return

        findItemAndSetCount(skuId)
    },

    onCountFloat(e) {
        this.refreshCart()
        this.mergeCountToSpuList()
    },

    refreshCart() {
        this.refreshCartData()
        this.updateCartItemCount()
        const cartData = cart.getAllCartItemFromLocal()

        if (cartData) {
            this.setData({
                cartItems: cartData.items
            })
        }
        this.mergeCountToSpuList()
    },

    onSingleCheck() {
        this.refreshCart()
    },

    onDeleteItem() {
        this.refreshCart()
    },

    mergeCountToSpuList: debounce(function () {
        const list = this.data.list

        if (!Array.isArray(list)) return

        const data = {}

        function setToData(index, count) {
            data[`list[${index}].cartCount`] = count
        }

        list.forEach((item, index) => {
            if (item.is_have_spec) return
            if (item.sku_list.length === 0) return

            const cartItem = cart.findEqualItem(item.sku_list[0].id)
            if (cartItem) {
                setToData(index, cartItem.count)
                return
            }

            if (item.cartCount) {
                setToData(index, null)
            }
        })

        this.setData(data)
    }, 500),
})
