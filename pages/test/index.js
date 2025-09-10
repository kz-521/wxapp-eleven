// pages/test/index.js
const { api } = require('../../utils/api.js')
const { Token } = require('../../models/token.js')

Page({
  data: {
    gender: '',
    // 体质问题相关数据
    questions: [], // 所有问题
    answers: {}, // 用户答案
    displayTexts: {}, // 显示文本，用于WXML直接绑定
    showQuestionPopup: false, // 问题选择弹窗
    currentQuestion: null, // 当前问题
    currentOptions: [], // 当前问题选项
    currentSelected: [], // 当前问题已选择的选项（多选）
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    await this.refreshToken()
    await this.getConstitutionQuestions()
  },

  /**
   * 获取体质问题
   */
  async getConstitutionQuestions() {
    try {
      wx.showLoading({ title: '加载中...' })
      
      const response = await api.getConstitutionQuestions()
      
      if (response.code === 0 && response.result && response.result.questions) {
        this.setData({
          questions: response.result.questions
        })
        
        // 初始化答案对象
        const answers = {}
        const displayTexts = {}
        response.result.questions.forEach(question => {
          if (question.question_type === 1) {
            answers[question.id] = ''
            displayTexts[question.id] = '请选择'
          } else {
            answers[question.id] = []
            displayTexts[question.id] = '请选择'
          }
        })
        
        this.setData({ answers, displayTexts })
        
        wx.hideLoading()
      } else {
        wx.hideLoading()
        wx.showToast({
          title: '获取问题失败',
          icon: 'none'
        })
      }
    } catch (error) {
      wx.hideLoading()
      wx.showToast({
        title: '获取问题失败',
        icon: 'none'
      })
    }
  },

  /**
   * 显示问题选择弹窗
   */
  showQuestionPopup(e) {
    const questionIndex = e.currentTarget.dataset.questionIndex
    const question = this.data.questions[questionIndex]
    if (!question) return
    
    const isMultiSelect = question.question_type === 2
    const options = Array.isArray(question.options) ? question.options : []

    // 读取已选答案
    const savedValue = this.data.answers[question.id]

    let currentSelected = []
    if (isMultiSelect) {
      // 将已保存的答案（可能是字符串label数组或对象数组）统一转换为选项对象数组
      const savedArray = Array.isArray(savedValue) ? savedValue : []
      currentSelected = savedArray
        .map(item => {
          if (typeof item === 'string') {
            return options.find(o => o.label === item)
          }
          if (item && typeof item === 'object' && 'label' in item) {
            return options.find(o => o.label === item.label) || item
          }
          return null
        })
        .filter(Boolean)
    }

    // 为多选问题预先计算每个选项的选中状态
    let optionsWithStatus = options
    if (isMultiSelect) {
      optionsWithStatus = options.map(option => ({
        ...option,
        isSelected: currentSelected.some(sel => sel && sel.label === option.label)
      }))
    }
    
    this.setData({
      showQuestionPopup: true,
      currentQuestion: question,
      currentOptions: optionsWithStatus,
      currentSelected: currentSelected
    })
  },

  /**
   * 关闭问题选择弹窗
   */
  closeQuestionPopup() {
    this.setData({
      showQuestionPopup: false
    })
  },

  /**
   * 选择问题选项（单选）
   */
  onSingleOptionSelect(e) {
    const { index } = e.currentTarget.dataset
    const option = this.data.currentOptions[index]
    if (!option) return
    const questionId = this.data.currentQuestion.id
    
    // 更新答案和显示文本
    const answers = { ...this.data.answers }
    const displayTexts = { ...this.data.displayTexts }
    
    answers[questionId] = option.label
    displayTexts[questionId] = option.text
    
    this.setData({
      answers,
      displayTexts,
      showQuestionPopup: false
    })
    
    wx.showToast({
      title: '选择成功',
      icon: 'success',
      duration: 1000
    })
  },

  /**
   * 选择问题选项（多选）
   */
  onMultiOptionSelect(e) {
    const { index } = e.currentTarget.dataset
    const option = this.data.currentOptions[index]
    if (!option) return
    const currentSelected = [...this.data.currentSelected]
    
    // 切换选择状态（兼容字符串或对象）
    const optionIndex = currentSelected.findIndex(item => {
      if (!item) return false
      return typeof item === 'string' ? item === option.label : item.label === option.label
    })
    if (optionIndex > -1) {
      currentSelected.splice(optionIndex, 1)
    } else {
      currentSelected.push(option)
    }
    
    // 更新选项的选中状态
    const currentOptions = this.data.currentOptions.map(opt => ({
      ...opt,
      isSelected: currentSelected.some(selected => {
        if (!selected) return false
        return typeof selected === 'string' ? selected === opt.label : selected.label === opt.label
      })
    }))
    
    this.setData({
      currentSelected,
      currentOptions
    })
  },

  /**
   * 确认多选
   */
  confirmMultiSelect() {
    const questionId = this.data.currentQuestion.id
    const selectedLabels = this.data.currentSelected.map(item => item.label)
    const selectedTexts = this.data.currentSelected.map(item => item.text)
    
    // 更新答案和显示文本
    const answers = { ...this.data.answers }
    const displayTexts = { ...this.data.displayTexts }
    
    answers[questionId] = selectedLabels
    displayTexts[questionId] = selectedTexts.length > 0 ? selectedTexts.join('、') : '请选择'
    
    this.setData({
      answers,
      displayTexts,
      showQuestionPopup: false
    })
    
    wx.showToast({
      title: '选择成功',
      icon: 'success',
      duration: 1000
    })
  },

  /**
   * 获取问题类型标题
   */
  getQuestionTypeTitle(questionType) {
    if (questionType === 1) {
      return '第一部分：基础特征（单选）'
    } else if (questionType === 2) {
      return '第二部分：性格倾向（多选）'
    }
    return ''
  },

  /**
   * 检查是否应该显示问题类型标题
   */
  shouldShowTypeTitle(index) {
    if (index === 0) return true
    
    const currentQuestion = this.data.questions[index]
    const previousQuestion = this.data.questions[index - 1]
    
    return currentQuestion.question_type !== previousQuestion.question_type
  },

  /**
   * 检查是否所有问题都已回答
   */
  checkAllQuestionsAnswered() {
    for (const question of this.data.questions) {
      const answer = this.data.answers[question.id]
      if (question.question_type === 1) {
        if (!answer) return false
      } else {
        if (!answer || answer.length === 0) return false
      }
    }
    return true
  },

  /**
   * 刷新token
   */
  async refreshToken() {
    try {
      const tokenInstance = new Token()
      await tokenInstance.getTokenFromServer()
    } catch (error) {
      wx.showToast({
        title: 'Token获取失败',
        icon: 'none',
        duration: 2000
      })
    }
  },

  /**
   * 性别选择
   */
  onGenderSelect(e) {
    const gender = e.currentTarget.dataset.gender
    this.setData({ gender })
  },

  /**
   * 提交测评
   */
  submitTest() {
    // 检查基本信息
    if (!this.data.gender) {
      wx.showToast({
        title: '请选择性别',
        icon: 'none'
      })
      return
    }
    
    // 检查是否所有问题都已回答
    if (!this.checkAllQuestionsAnswered()) {
      wx.showToast({
        title: '请回答所有问题',
        icon: 'none'
      })
      return
    }
    
    // 格式化答案数据
    const answers = []
    for (const question of this.data.questions) {
      const answer = this.data.answers[question.id]
      
      if (question.question_type === 1) {
        answers.push({
          question_id: question.id,
          answer: answer
        })
      } else if (question.question_type === 2) {
        answers.push({
          question_id: question.id,
          answer: answer.join(',')
        })
      }
    }
    
    wx.showLoading({ title: '提交中...' })
    api.submitConstitutionTest({ answers }).then(res => {
      wx.hideLoading()
      if (res.code === 0) {
        wx.navigateTo({
          url: '/pages/test-result/index',
          success: function (navRes) {
            if (navRes.eventChannel) {
              navRes.eventChannel.emit('testResult', res.result)
            }
          }
        })
      } else {
        wx.showToast({ title: res.msg || '提交失败', icon: 'none' })
      }
    }).catch((error) => {
      wx.hideLoading()
      wx.showToast({ title: '提交失败', icon: 'none' })
    })
  }
})