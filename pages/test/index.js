// pages/test/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    birthday: '',
    showBirthdayPicker: false,
    birthdayPickerValue: [1990, 0, 0],
    birthdayColumns: [[], [], []],
    showPopup: false,
    popupOption: '',
    optionPickerValue: [0],
    optionColumns: [],
    featureValue: '',
    dailyValue: '',
    pressureValue: '',
    socialValue: '',
    showMultiPopup: false,
    multiPopupTitle: '',
    multiOptions: [],
    multiSelected: [],
    pressureMultiValue: [],
    socialMultiValue: [],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  },
  toSuccess() {
  //   wx.navigateTo({
  //     url:`/pages/test-result/index`
  // })
  },
  onShowBirthdayPicker() {
    // 初始化年月日列
    const years = [];
    const months = [];
    const days = [];
    for (let i = 1900; i <= 2099; i++) years.push(i + '年');
    for (let i = 1; i <= 12; i++) months.push(i + '月');
    for (let i = 1; i <= 31; i++) days.push(i + '日');
    this.setData({
      birthdayColumns: [years, months, days],
      showBirthdayPicker: true
    });
  },
  onCloseBirthdayPicker() {
    this.setData({ showBirthdayPicker: false });
  },
  onBirthdayConfirm(e) {
    const [yearIdx, monthIdx, dayIdx] = e.detail.value;
    const year = this.data.birthdayColumns[0][yearIdx].replace('年', '');
    const month = this.data.birthdayColumns[1][monthIdx].replace('月', '');
    const day = this.data.birthdayColumns[2][dayIdx].replace('日', '');
    this.setData({
      birthday: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`,
      showBirthdayPicker: false
    });
  },
  onOptionTap(e) {
    const option = e.currentTarget.dataset.option;
    if (option === 'pressure' || option === 'social') {
      // 多选弹窗
      let options = [];
      let title = '';
      let selected = [];
      if (option === 'pressure') {
        options = ['运动', '倾诉', '独处', '美食'];
        title = '遇到压力时你会怎么做？（多选）';
        selected = this.data.pressureMultiValue.slice();
      } else if (option === 'social') {
        options = ['喜欢热闹', '喜欢安静', '随意'];
        title = '社交场合你通常喜欢？（多选）';
        selected = this.data.socialMultiValue.slice();
      }
      // 生成布尔数组
      const boolArr = options.map(opt => selected.includes(opt));
      this.setData({
        showMultiPopup: true,
        multiPopupTitle: title,
        multiOptions: options,
        multiSelected: boolArr,
        multiOptionType: option
      });
      return;
    }
    // 单选逻辑
    let columns = [];
    if (option === 'feature') {
      columns = ['瘦', '正常', '偏胖'];
    } else if (option === 'daily') {
      columns = ['精力充沛', '容易疲劳', '睡眠好', '睡眠差'];
    }
    this.setData({
      showPopup: true,
      popupOption: option,
      optionColumns: columns,
      optionPickerValue: [0]
    });
  },
  onMultiOptionTap(e) {
    const idx = e.currentTarget.dataset.index;
    const arr = this.data.multiSelected.slice();
    arr[idx] = !arr[idx];
    this.setData({ multiSelected: arr });
  },
  onMultiConfirm() {
    const selectedArr = this.data.multiOptions.filter((item, idx) => this.data.multiSelected[idx]);
    let update = { showMultiPopup: false };
    if (this.data.multiOptionType === 'pressure') {
      update.pressureMultiValue = selectedArr;
      update.pressureValue = selectedArr.join('，');
    } else if (this.data.multiOptionType === 'social') {
      update.socialMultiValue = selectedArr;
      update.socialValue = selectedArr.join('，');
    }
    this.setData(update);
  },
  onCloseMultiPopup() {
    this.setData({ showMultiPopup: false });
  },
  onOptionConfirm(e) {
    const value = e.detail.value;
    const option = this.data.popupOption;
    let update = { showPopup: false };
    if (option === 'feature') {
      update.featureValue = value;
    } else if (option === 'daily') {
      update.dailyValue = value;
    } else if (option === 'pressure') {
      update.pressureValue = value;
    } else if (option === 'social') {
      update.socialValue = value;
    }
    this.setData(update);
  },
  onClosePopup() {
    this.setData({ showPopup: false });
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})