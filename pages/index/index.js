// pages/index/index.js
import imageConfig from '../../config/imageConfig.js'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    images: imageConfig,
    currentPage: 'index' // 当前页面标识
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.checkLoginStatus();

    wx.cloud.init()
    wx.cloud.callFunction({
      name: "chatAI",
      data: {
        a: 1,
        b: 2,
      },
      success: function(res) {
        console.log(res.result.sum)
      },
      fail: console.error
    })
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

  },

  checkLoginStatus() {
    const hasLoggedIn = wx.getStorageSync('hasLoggedIn');
    if (!hasLoggedIn) {
      wx.showModal({
        title: '登录提示',
        content: '是否要登录微信账号以获得更好的体验？',
        confirmText: '登录',
        cancelText: '跳过',
        success: (res) => {
          if (res.confirm) {
            this.wxLogin();
          } else {
            wx.setStorageSync('hasLoggedIn', true);
          }
        }
      });
    }
  },

  wxLogin() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        const userInfo = res.userInfo;
        const accountName = this.generateUniqueAccountName();
        
        // 保存用户信息
        wx.setStorageSync('userAccount', {
          avatarUrl: userInfo.avatarUrl,
          accountName: accountName,
          nickName: userInfo.nickName
        });
        wx.setStorageSync('hasLoggedIn', true);
        
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        });
      },
      fail: (err) => {
        console.error('登录失败', err);
        wx.showToast({
          title: '登录失败',
          icon: 'none'
        });
      }
    });
  },

  generateUniqueAccountName() {
    let accountNumber;
    const existingAccounts = wx.getStorageSync('existingAccounts') || [];
    
    do {
      accountNumber = Math.floor(1000000 + Math.random() * 9000000);
    } while (existingAccounts.includes(accountNumber));
    
    // 保存新的账号号
    existingAccounts.push(accountNumber);
    wx.setStorageSync('existingAccounts', existingAccounts);
    
    return `匿名${accountNumber}`;
  },

  /**
   * 切换到首页
   */
  switchToIndex() {
    //console.log('点击首页按钮');
    if (this.data.currentPage !== 'index') {
      this.setData({
        currentPage: 'index'
      });
      //console.log('已切换到首页');
    } else {
      //console.log('当前已在首页');
    }
  },

  /**
   * 切换到个人中心
   */
  switchToProfile() {
    //console.log('点击我的按钮');
    if (this.data.currentPage !== 'profile') {
      wx.navigateTo({
        url: '/pages/profile/profile'
      });
      //console.log('跳转到个人中心');
    } else {
      //console.log('当前已在个人中心页面');
    }
  }
})