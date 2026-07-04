// pages/index/index.js
import imageConfig from '../../config/imageConfig.js'
const UserDataManager = require('../../utils/userDataManager.js');

const ELDERLY_MODE_KEY = 'elderlyMode';

Page({

  /**
   * 页面的初始数据
   */
  data: {
    images: imageConfig,
    currentPage: 'index', // 当前页面标识
    isElderlyMode: false // 老年版模式开关
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.checkLoginStatus();
    
    // 读取老年版模式设置
    wx.cloud.init()
    const isElderlyMode = wx.getStorageSync(ELDERLY_MODE_KEY) || false;
    this.setData({ isElderlyMode });
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
    // 检查是否处于游客模式
    const isGuestMode = wx.getStorageSync('isGuestMode') === true;

    // 游客模式允许正常使用首页（不强制跳转认证）
    if (isGuestMode) return;

    // 检查是否已完成首次认证引导
    const hasCompletedAuth = wx.getStorageSync('hasCompletedAuth');

    if (!hasCompletedAuth) {
      // 首次使用：跳转到认证引导页面
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/auth/auth'
        });
      }, 300);
      return;
    }

    // 非首次使用：检查旧版 hasLoggedIn 标记（兼容）
    const hasLoggedIn = wx.getStorageSync('hasLoggedIn');
    if (!hasLoggedIn) {
      wx.setStorageSync('hasLoggedIn', true);
    }
  },

  wxLogin() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        const userInfo = res.userInfo;
        const accountName = this.generateUniqueAccountName();
        
        // 保存用户信息到统一数据管理器
        try {
          const userData = UserDataManager.loadUserData();
          userData.userInfo.name = userInfo.nickName || accountName;
          userData.userInfo.avatarUrl = userInfo.avatarUrl || '';
          userData.userInfo.source = 'wechat';
          UserDataManager.saveUserData(userData);
        } catch (err) {
          console.error('保存用户信息失败:', err);
        }
        
        // 兼容旧存储格式
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
  },

  /**
   * 切换老年版/标准版模式
   */
  toggleElderlyMode() {
    const newMode = !this.data.isElderlyMode;
    this.setData({ isElderlyMode: newMode });
    wx.setStorageSync(ELDERLY_MODE_KEY, newMode);
    
    wx.showToast({
      title: newMode ? '已切换至老年版' : '已切换回标准版',
      icon: 'success',
      duration: 1500
    });
  },

  /**
   * 老年版 - 医院导航
   */
  elderlyNavigateToMap() {
    wx.navigateTo({ url: '/pages/map/map' });
  },

  /**
   * 老年版 - 院内导航
   */
  elderlyNavigateToNavigation() {
    wx.navigateTo({ url: '/pages/navigation/navigation' });
  },

  /**
   * 老年版 - 智能问诊
   */
  elderlyNavigateToAI() {
    wx.navigateTo({ url: '/pages/ai-diagnosis/ai-diagnosis' });
  },

  /**
   * 老年版 - 我的信息
   */
  elderlyNavigateToProfile() {
    wx.navigateTo({ url: '/pages/profile/profile' });
  }
})