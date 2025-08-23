/**
 * @作者 7七月
 * @创建时间 2019-09-28 01:03
 */
import {Http} from "../utils/http";

class Activity {
    static locationD = 'a-2'

    static async getHomeLocationD() {
        return await Http.request({
            url: `activity/name/${Activity.locationD}`
        })
    }

    static async getActivityWithCoupon(activityName) {
        return Http.request({
            url: `activity/name/${activityName}/with_coupon`
        })
    }
}

export {
    Activity
}