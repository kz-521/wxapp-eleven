import {FenceGroup} from "../models/fence-group";
import {Judger} from "../models/judger";
import {Spu} from "../../models/spu";
import {Cell} from "../models/cell";
import {Cart} from "../../models/cart";
import number from "../../miniprogram_npm/lin-ui/common/async-validator/validator/number";

Component({
    properties: {
        nowCount: {
            type: Number,
            value: 1
        },
        spu: Object,
        orderWay: String
    },

    data: {
        judger: Object,
        previewImg: String,
        currentSkuCount: Cart.SKU_MIN_COUNT,
        // 添加order_options相关数据
        selectedOrderOptions: {}, // 已选择的订单选项
        canAddToCart: false // 是否可以加入购物车
    },
// A 提拉米苏 10寸, 无规格
    // B 提拉米苏 草莓味 8寸 10寸

    // sku 概念必须要有 规格

    observers: {


        'spu': function (spu) {
            this.data.judger = {}
            console.log(spu)

            if (!spu) {
                return
            }
            if (Spu.isNoSpec(spu)) {
                this.processNoSpec(spu)
            } else {
                this.processHasSpec(spu)
            }
            this.triggerSpecEvent()

            this.setData({
                currentSkuCount : this.data.nowCount
            })
        },

        'nowCount': function (newData) {
            this.setData({
                currentSkuCount : newData
            })
        },
    },

    methods: {
        processNoSpec(spu) {
            this.setData({
                noSpec: true,
                fences: null,
                // 无规格商品直接可以加入购物车
                canAddToCart: true
            })
            this.bindSkuData(spu.sku_list[0])
            this.setStockStatus(spu.sku_list[0].stock, this.data.currentSkuCount)
            // 直接触发可以加入购物车的事件
            this.triggerSpecEvent()
        },

        processHasSpec(spu) {
            const fenceGroup = new FenceGroup(spu)
            fenceGroup.initFences()
            const judger = new Judger(fenceGroup)
            this.data.judger = judger

            const defaultSku = fenceGroup.getDefaultSku()
            if (defaultSku) {
                this.bindSkuData(defaultSku)
                this.setStockStatus(defaultSku.stock, this.data.currentSkuCount)
            } else {
                this.bindSpuData()
            }
            this.bindTipData()
            this.bindFenceGroupData(fenceGroup)
            
            // 对于单SKU有规格商品，自动选中
            if (spu.sku_list.length === 1 && spu.sku_list[0].specs && spu.sku_list[0].specs.length > 0) {
                // 自动选中所有规格
                fenceGroup.fences.forEach((fence, x) => {
                    if (fence.cells.length > 0) {
                        const cell = fence.cells[0]
                        judger.judge(cell, x, 0, true)
                        fenceGroup.setCelStatusByXY(x, 0, 'selected')
                    }
                })
                this.bindTipData()
            }
        },

        triggerSpecEvent() {
            const noSpec = Spu.isNoSpec(this.properties.spu)
            if (noSpec) {
                this.triggerEvent('specchange', {
                    noSpec,
                    skuId: this.properties.spu.sku_list[0].id,
                    skuIntact: true, // 无规格商品视为完整
                })
                return
            }

            const { judger } = this.data
            if (!judger) {
                return
            }
            
            const skuIntact = judger.isSkuIntact()

            const detail = {
                noSpec: false,
                skuIntact,
                currentValues: judger.getCurrentValues(),
                missingKeys: judger.getMissingKeys(),
            }

            if (skuIntact) {
                const selectedSku = judger.getDeterminateSku()
                if (selectedSku) {
                    detail.skuId = selectedSku.id
                }
            }

            this.triggerEvent('specchange', detail)
        },

        bindSpuData() {
            const spu = this.properties.spu
            this.setData({
                previewImg: spu.img,
                title: spu.title,
                price: spu.price,
                discountPrice: spu.discount_price,
                stock: spu.stock_total || 0 // SPU的总库存
            })
        },

        bindSkuData(sku) {
            // 添加空值检查
            if (!sku) {
                console.warn('bindSkuData: sku is null, using SPU data')
                this.bindSpuData()
                return
            }
            
            this.setData({
                previewImg: sku.img || this.properties.spu.img, // fallback到SPU的图片
                title: sku.title || this.properties.spu.title,
                price: sku.price,
                discountPrice: sku.discount_price,
                stock: sku.stock,
            })
        },

        bindTipData() {
            this.setData({
                skuIntact: this.data.judger.isSkuIntact(),
                currentValues: this.data.judger.getCurrentValues(),
                missingKeys: this.data.judger.getMissingKeys()
            })
        },

        bindFenceGroupData(fenceGroup) {
            this.setData({
                fences: fenceGroup.fences,
            })
        },

        setStockStatus(stock, currentCount) {
            this.setData({
                outStock: this.isOutOfStock(stock, currentCount)
            })
        },

        isOutOfStock(stock, currentCount) {
            return stock < currentCount
        },

        noSpec() {
            const spu = this.properties.spu
            return Spu.isNoSpec(spu)
        },

        onSelectCount(event) {
            const currentCount = event.detail.count
            this.data.currentSkuCount = currentCount

            if (this.noSpec()) {
                this.setStockStatus(this.getNoSpecSku().stock, currentCount)
            } else {
                if (this.data.judger.isSkuIntact()) {
                    const sku = this.data.judger.getDeterminateSku()
                    this.setStockStatus(sku.stock, currentCount)
                }
            }
        }
        ,

        onCellTap(event) {
            const data = event.detail.cell
            const x = event.detail.x
            const y = event.detail.y

            const cell = new Cell(data.spec)
            cell.status = data.status

            const judger = this.data.judger
            judger.judge(cell, x, y)
            console.log('Cell clicked:', cell, x, y)
            
            const skuIntact = judger.isSkuIntact()
            if (skuIntact) {
                const currentSku = judger.getDeterminateSku()
                console.log('Selected SKU:', currentSku)
                if (currentSku) {
                    this.bindSkuData(currentSku)
                    this.setStockStatus(currentSku.stock, this.data.currentSkuCount)
                }
            } else {
                // 规格不完整时，显示SPU信息
                this.bindSpuData()
            }
            
            this.bindTipData()
            this.bindFenceGroupData(judger.fenceGroup)
            this.triggerSpecEvent()
        }
        ,

        onBuyOrCart(event) {
            if (Spu.isNoSpec(this.properties.spu)) {
                this.shoppingNoSpec();
            } else {
                this.shoppingVarious();
            }
        }
        ,

        shoppingVarious() {
            const intact = this.data.judger.isSkuIntact();
            if (!intact) {
                const missKeys = this.data.judger.getMissingKeys()
                wx.showToast({
                    icon: "none",
                    title: `请选择：${missKeys.join('，')}`,
                    duration: 3000
                })
                return
            }
            this._triggerShoppingEvent(this.data.judger.getDeterminateSku())
        }
        ,

        shoppingNoSpec() {
            this._triggerShoppingEvent(this.getNoSpecSku())
        }
        ,

        getNoSpecSku() {
            return this.properties.spu.sku_list[0]
        }
        ,


        _triggerShoppingEvent(sku) {
            this.triggerEvent('shopping', {
                orderWay: this.properties.orderWay,
                spuId: this.properties.spu.id,
                sku: sku,
                skuCount: this.data.currentSkuCount,
            })
        },

        /**
         * 初始化订单选项
         */
        initOrderOptions(spu) {
            const selectedOrderOptions = {}
            if (spu.order_options && spu.order_options.length > 0) {
                spu.order_options.forEach(option => {
                    // 为每个选项组选择第一个选项作为默认值
                    if (option.values && option.values.length > 0) {
                        selectedOrderOptions[option.id] = option.values[0].id
                    }
                })
            }
            this.setData({
                selectedOrderOptions: selectedOrderOptions
            })
        },
        
        /**
         * 选择订单选项
         */
        selectOrderOption(event) {
            const { groupId, optionId } = event.currentTarget.dataset
            const selectedOrderOptions = { ...this.data.selectedOrderOptions }
            selectedOrderOptions[groupId] = optionId
            
            this.setData({
                selectedOrderOptions: selectedOrderOptions
            })
            
            // 触发价格更新事件
            this.triggerOrderOptionsChange()
        },
        
        /**
         * 触发订单选项变化事件
         */
        triggerOrderOptionsChange() {
            const detail = {
                orderOptions: this.data.selectedOrderOptions,
                spu: this.properties.spu
            }
            this.triggerEvent('orderoptionschange', detail)
        }


    }
})
