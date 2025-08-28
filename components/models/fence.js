/**
 * @作者 7七月
 * @创建时间 2019-10-21 07:17
 */
import {Cell} from "./cell";


class Fence {

    cells = []
    specs
    title
    id

    constructor(specs) {
        this.specs = specs
        this.title = specs[0].key
        this.id = specs[0].key_id
    }

    init() {
        this._initCells()
    }


    _initCells() {
        this.specs.forEach(s => {
            const existed = this.cells.some(c=>{
                return c.id === s.value_id
            })
            if(existed){
                return
            }
            const cell = new Cell(s)
            this.cells.push(cell)
        })
    }

    setFenceSketch(skuList) {
        this.cells.forEach(c=>{
            this._setCellSkuImg(c, skuList)
        })
    }

    _setCellSkuImg(cell, skuList) {
        const specCode = cell.getCellCode() // 形式为 "1-77"
        console.log('Looking for spec code:', specCode)
        
        // 尝试多种匹配方式
        let matchedSku = skuList.find(s => s.code && s.code.includes(specCode))
        
        if (!matchedSku) {
            // 如果没有code匹配，尝试通过specs匹配
            matchedSku = skuList.find(s => {
                if (s.specs && s.specs.length > 0) {
                    return s.specs.some(spec => 
                        spec.key_id == cell.spec.key_id && 
                        spec.value_id == cell.spec.value_id
                    )
                }
                return false
            })
        }
        
        if (matchedSku) {
            cell.skuImg = matchedSku.img
            console.log('Found matched SKU for cell:', cell.title, matchedSku)
        } else {
            console.log('No matched SKU found for cell:', cell.title, 'spec code:', specCode)
        }
    }

    // pushValueTitle(title) {
    //     this.valueTitles.push(title)
    // }
}

export {
    Fence
}
