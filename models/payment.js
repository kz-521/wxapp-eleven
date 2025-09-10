
import {Http} from "../utils/http";

class Payment{

    static async getPayParams(orderId) {
        return  await Http.request({
            url: `pay/order/${orderId}`,
            method: 'POST'
        })
    }


}

export {
    Payment
}
