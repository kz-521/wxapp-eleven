//app.js
import {Cart} from "./models/cart";
import {Token} from "./models/token";

App({
    async onLaunch() {
        const r = await wx.login()
        const code = r.code
        console.log(code, 'code')
        const token = new Token()
        token.verify()
    }
})
