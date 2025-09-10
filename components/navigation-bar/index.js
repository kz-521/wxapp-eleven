Component({
    properties: {
        /**
         * 自定义返回事件处理
         * customBackReturn="{{true}}" bind:customBackReturn="customBackReturn"
         */
        customBackReturn: {
            type: Boolean,
            value: false
        },
        searchOn:{
            type: Boolean,
            value: false
        },
        title:{
            type: String,
            value: ''
        }
    },
    data: {
        searchOn:false,
        customBackReturn:false,
    },
    methods: {
        backClick() {

            if (this.data.customBackReturn) {
                this.triggerEvent("customBackReturn")
            } else {
                if (getCurrentPages().length == 1) {
                    wx.navigateTo({
                        url: '/pages/home/home',
                    })
                } else {
                    wx.navigateBack({
                        delta: 1
                    })
                }
            }
        }
    },
    attached() {
        let self = this;
        wx.getSystemInfo({
            success(res) {
                let isIos = res.system.indexOf('iOS') > -1;
                self.setData({
                    statusHeight: res.statusBarHeight,
                    navHeight: isIos ? 44 : 48
                })
            }
        })
    }
})
