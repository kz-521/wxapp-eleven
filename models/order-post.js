
class OrderPost {
    total_price
    final_total_price
    coupon_id
    sku_info_list = []
    remark
    dining_way
    address = {}

    constructor(totalPrice, finalTotalPrice, couponId, skuInfoList, dining_way, remark) {
        this.total_price = totalPrice
        this.final_total_price = finalTotalPrice
        this.coupon_id = couponId
        this.sku_info_list = skuInfoList
        this.dining_way = dining_way
        this.remark = remark
    }

    _fillAddress(address) {
        this.address.user_name = address.userName
        this.address.national_code = address.nationalCode
        this.address.postal_code = address.postalCode
        this.address.city = address.cityName
        this.address.province = address.provinceName
        this.address.county = address.countyName
        this.address.detail = address.detailInfo
        this.address.mobile = address.telNumber
    }
}

export {
    OrderPost
}
