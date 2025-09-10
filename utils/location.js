/**
 * 位置相关工具类
 */

class Location {
  /**
   * 获取用户位置
   * @param {Object} options 配置选项
   * @param {String} options.type 坐标类型，默认 'gcj02'
   * @returns {Promise} 返回位置信息
   */
  static getUserLocation(options = {}) {
    const { type = 'gcj02' } = options
    
    return new Promise((resolve, reject) => {
      wx.getLocation({
        type: type,
        success: (res) => {
          console.log('获取用户位置成功:', res)
          resolve({
            latitude: res.latitude,
            longitude: res.longitude,
            accuracy: res.accuracy,
            altitude: res.altitude,
            verticalAccuracy: res.verticalAccuracy,
            horizontalAccuracy: res.horizontalAccuracy,
            speed: res.speed
          })
        },
        fail: (err) => {
          console.error('获取用户位置失败:', err)
          reject(err)
        }
      })
    })
  }

  /**
   * 计算两点间距离（单位：公里）
   * @param {Number} lat1 起点纬度
   * @param {Number} lng1 起点经度
   * @param {Number} lat2 终点纬度
   * @param {Number} lng2 终点经度
   * @returns {Number} 距离（公里）
   */
  static calculateDistance(lat1, lng1, lat2, lng2) {
    const radLat1 = Location.degreeToRadian(lat1)
    const radLat2 = Location.degreeToRadian(lat2)
    const a = radLat1 - radLat2
    const b = Location.degreeToRadian(lng1) - Location.degreeToRadian(lng2)
    
    const s = 2 * Math.asin(
      Math.sqrt(
        Math.pow(Math.sin(a / 2), 2) + 
        Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)
      )
    )
    
    // 地球半径（公里）
    const earthRadius = 6378.137
    const distance = s * earthRadius
    
    return Math.round(distance * 10000) / 10000
  }

  /**
   * 格式化距离显示
   * @param {Number} distance 距离（公里）
   * @param {Number} precision 小数位数，默认2位
   * @returns {String} 格式化后的距离文本
   */
  static formatDistance(distance, precision = 2) {
    if (distance < 0.01) {
      return '< 10米'
    } else if (distance < 1) {
      return Math.round(distance * 1000) + '米'
    } else {
      return distance.toFixed(precision) + 'km'
    }
  }

  /**
   * 获取用户位置并计算到指定地点的距离
   * @param {Object} targetLocation 目标位置
   * @param {Number} targetLocation.latitude 目标纬度
   * @param {Number} targetLocation.longitude 目标经度
   * @param {Object} options 配置选项
   * @returns {Promise} 返回用户位置和距离信息
   */
  static async getUserLocationAndDistance(targetLocation, options = {}) {
    try {
      const userLocation = await Location.getUserLocation(options)
      const distance = Location.calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        targetLocation.latitude,
        targetLocation.longitude
      )
      
      return {
        userLocation,
        distance,
        distanceText: Location.formatDistance(distance)
      }
    } catch (error) {
      throw error
    }
  }

  /**
   * 角度转弧度
   * @param {Number} degree 角度
   * @returns {Number} 弧度
   */
  static degreeToRadian(degree) {
    return degree * Math.PI / 180.0
  }

  /**
   * 弧度转角度
   * @param {Number} radian 弧度
   * @returns {Number} 角度
   */
  static radianToDegree(radian) {
    return radian * 180.0 / Math.PI
  }

  /**
   * 检查位置权限
   * @returns {Promise} 权限检查结果
   */
  static checkLocationPermission() {
    return new Promise((resolve, reject) => {
      wx.getSetting({
        success: (res) => {
          if (res.authSetting['scope.userLocation'] === undefined) {
            // 用户未授权，需要引导授权
            resolve({ status: 'not_determined', needAuth: true })
          } else if (res.authSetting['scope.userLocation']) {
            // 用户已授权
            resolve({ status: 'authorized', needAuth: false })
          } else {
            // 用户拒绝授权
            resolve({ status: 'denied', needAuth: true })
          }
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  }

  /**
   * 引导用户开启位置权限
   * @returns {Promise}
   */
  static requestLocationPermission() {
    return new Promise((resolve, reject) => {
      wx.showModal({
        title: '位置权限',
        content: '需要获取您的位置信息来计算到店距离，请在设置中开启位置权限',
        confirmText: '去设置',
        success: (res) => {
          if (res.confirm) {
            wx.openSetting({
              success: (settingRes) => {
                if (settingRes.authSetting['scope.userLocation']) {
                  resolve(true)
                } else {
                  reject(new Error('用户未开启位置权限'))
                }
              },
              fail: reject
            })
          } else {
            reject(new Error('用户取消开启位置权限'))
          }
        },
        fail: reject
      })
    })
  }
}

export { Location } 