import {
    Http
} from "./http";

export class Paging {
    req
    url
    page
    locker = false
    moreDate = true
    accmulator = []
    constructor(req, page = 1) {
        this.req = req
        this.page = page
        this.url = req.url
    }

    async getMoreData() {

        if (!this._getLocker()) {
            return
        }

        if (!this.moreDate) {
            return
        }

        const data = await this._actualGetData()
        this._releaseLocker()

        return data
    }

    async _actualGetData() {
        const req = this._getCurrentReq()
        let paging = await Http.request(req)
        if (!paging) {
            return null
        }
        if (paging.total === 0) {
            return {
                empty: true,
                moreData: false,
                items: [],
                accmulator: []
            }
        }

        let that = this;
        that.moreDate = Paging._moreData(paging.current_page, paging.last_page)
        if (this.moreDate) {
            this.page = this.page + 1
        }
        this._accmulate(paging.data)
        return {
            empty: false,
            moreData: that.moreDate,
            items: paging.data,
            accmulator: this.accmulator
        }
    }

    _accmulate(items) {
        this.accmulator = this.accmulator.concat(items)
    }

    static _moreData(current_page, last_page) {

        return current_page < last_page
    }

    _getCurrentReq() {
        let url = this.url
        const params = `page=${this.page}`
        if (url.includes('?')) {
            url += '&' + params
        } else {
            url += '?' + params
        }

        this.req.url = url
        return this.req
    }

    _getLocker() {
        if (this.locker) {
            return false
        }
        this.locker = true
        return true
    }

    _releaseLocker() {
        this.locker = false;
    }



}
