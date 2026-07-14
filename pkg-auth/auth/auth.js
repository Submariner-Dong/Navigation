// pages/auth/auth.js
// 首次登录与手机号绑定合并的认证模块

const UserDataManager = require('../utils/userDataManager.js');
const AvatarManager = require('../utils/avatarManager.js');
import imageConfig from '../config/imageConfig.js';

Page({
  data: {
    // 图片配置
    images: imageConfig,

    // 步骤控制：1=欢迎授权(头像+用户名), 2=已移除, 3=手机号绑定, 4=完成
    currentStep: 1,
    totalSteps: 2, // 实际只有 Step 1 和 Step 3

    // Step 1 - 欢迎授权（头像+用户名合并）
    welcomeAnimating: false,

    avatarUrl: '',
    nickName: '',
    tempNickName: '',
    nickNameSource: '',     // 'wechat' | 'custom' | 'anonymous'
    isEditingNickname: false,

    wechatAvatarUrl: '',
    wechatNickName: '',
    nicknameInputFocus: false,  // 控制隐藏昵称input的聚焦状态（唤起微信昵称弹窗）

    // Step 3 - 手机号绑定
    phone: '',
    phoneFocused: false,
    countdown: 0,
    verifyCode: '',
    actualVerifyCode: '',
    phoneVerified: false,
    canSubmit: false,

    stepTitles: ['完善资料', '完成设置'],
    submitting: false
  },

  onLoad(options) {
    const hasCompletedAuth = wx.getStorageSync('hasCompletedAuth');
    if (hasCompletedAuth) {
      wx.switchTab({ url: '/pages/index/index' });
      return;
    }

    this.initDefaultAvatar();
    this.enterAnimation();
  },

  onUnload() {
    if (this._countdownTimer) {
      clearInterval(this._countdownTimer);
    }
  },

  initDefaultAvatar() {
    const defaultAvatar = AvatarManager.getDefaultUserAvatar();
    this.setData({ avatarUrl: defaultAvatar });
  },

  enterAnimation() {
    setTimeout(() => { this.setData({ welcomeAnimating: true }); }, 100);
  },

  // ==================== 步骤导航 ====================

  goNextStep() {
    switch (this.data.currentStep) {
      case 1:
        this.saveUserProfileAndGoToPhone();
        break;
      case 3:
        this.submitAllData();
        break;
    }
  },

  goPrevStep() {
    if (this.data.currentStep === 3) {
      this.setData({ currentStep: 1 });
    }
  },

  // ==================== Step 1: 头像 + 用户名 ====================

  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    if (avatarUrl) {
      this.setData({ wechatAvatarUrl: avatarUrl, avatarUrl: avatarUrl });
    }
  },

  // 点击"使用微信昵称"按钮 → 聚焦隐藏input → 微信自动弹窗填充昵称
  onChooseNicknameWechat(e) {
    // 先重置（确保每次点击都能触发 focus 事件）
    this.setData({ nicknameInputFocus: false });
    setTimeout(() => {
      // 设置聚焦 → 微信自动弹出昵称选择/确认窗口
      this.setData({ nicknameInputFocus: true, nickNameSourceTarget: 'wechat' });
    }, 50);
  },

  // 微信昵称输入框输入事件（微信自动填充或用户确认时触发）
  onWechatNicknameInput(e) {
    const nickname = e.detail.value || '';
    console.log('微信昵称输入:', nickname);
    if (nickname) {
      this.setData({
        tempNickName: nickname,
        nickName: nickname,
        isEditingNickname: false,
        nickNameSource: 'wechat',
        nicknameInputFocus: false  // 获取成功，关闭聚焦状态
      });
      wx.showToast({ title: `已获取昵称：${nickname}`, icon: 'none', duration: 1500 });
    }
  },

  // 微信昵称输入框失焦
  onWechatNicknameBlur(e) {
    const nickname = e.detail.value || '';
    if (!nickname && !this.data.nickName) {
      console.log('微信昵称未获取，用户可手动输入');
    }
  },

  onInputNickname(e) {
    const nickname = e.detail.value || '';
    this.setData({ nickName: nickname, tempNickName: nickname });
  },

  onNicknameInput(e) {
    this.setData({ tempNickName: e.detail.value });
  },

  toggleEditNickname() {
    if (!this.data.isEditingNickname) {
      this.setData({
        isEditingNickname: true,
        tempNickName: this.data.nickName
      });
    }
  },

  cancelEditNickname() {
    this.setData({
      isEditingNickname: false,
      tempNickName: this.data.nickName
    });
  },

  confirmEditNickname() {
    const name = this.data.tempNickName.trim();
    if (!name) {
      wx.showToast({ title: '用户名不能为空', icon: 'none' });
      return;
    }
    this.setData({
      isEditingNickname: false,
      nickName: name,
      nickNameSource: 'custom'
    });
  },

  // 跳过 → 匿名身份 + 直接到手机号步骤
  skipWechatAuth() {
    const anonymousName = this.generateAnonymousName();

    this.setData({
      nickName: anonymousName,
      tempNickName: anonymousName,
      nickNameSource: 'anonymous',
      isEditingNickname: false
    });

    wx.showToast({
      title: `已生成：${anonymousName}`,
      icon: 'none',
      duration: 1500
    });

    setTimeout(() => { this.saveUserProfileAndGoToPhone(); }, 500);
  },

  generateAnonymousName() {
    const num = String(Math.floor(1000000 + Math.random() * 9000000));
    return `匿名${num}`;
  },

  saveUserProfileAndGoToPhone() {
    const { avatarUrl, nickName, nickNameSource } = this.data;

    if (!nickName.trim()) {
      wx.showToast({ title: '请先设置用户名', icon: 'none' });
      return;
    }

    try {
      const userData = UserDataManager.loadUserData();
      userData.userInfo.name = nickName.trim();
      userData.userInfo.avatarUrl = avatarUrl;
      userData.userInfo.source = nickNameSource || (avatarUrl === this.data.wechatAvatarUrl ? 'wechat' : 'custom');
      UserDataManager.saveUserData(userData);

      AvatarManager.setUserAvatar(avatarUrl);
      wx.setStorageSync('userAccount', { avatarUrl, nickName: nickName.trim() });

      // 跳过原 Step 2，直接进入手机号步骤
      this.setData({ currentStep: 3 });
    } catch (error) {
      console.error('保存用户资料失败:', error);
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  // ==================== Step 3: 手机号绑定 ====================

  onPhoneInput(e) {
    const phone = e.detail.value.replace(/\D/g, '').slice(0, 11);
    this.setData({ phone });
    this.checkPhoneCanVerify();
  },

  onPhoneFocus() { this.setData({ phoneFocused: true }); },
  onPhoneBlur() { this.setData({ phoneFocused: false }); },

  checkPhoneCanVerify() {
    const valid = /^1[3-9]\d{9}$/.test(this.data.phone);
    this.setData({ canSubmit: valid && this.data.phoneVerified });
    return valid;
  },

  sendVerifyCode() {
    if (this.data.countdown > 0) return;
    if (!this.checkPhoneCanVerify()) {
      wx.showToast({ title: '请输入正确的11位手机号', icon: 'none' });
      return;
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    this.setData({ actualVerifyCode: code });
    console.log(`【调试】验证码: ${code}`);
    wx.showToast({ title: '验证码已发送', icon: 'success' });

    this.setData({ countdown: 60 });
    this._countdownTimer = setInterval(() => {
      let cd = this.data.countdown - 1;
      if (cd <= 0) { cd = 0; clearInterval(this._countdownTimer); this._countdownTimer = null; }
      this.setData({ countdown: cd });
    }, 1000);

    setTimeout(() => {
      this.setData({ verifyCode: code, phoneVerified: true, canSubmit: true });
    }, 1500);
  },

  onVerifyCodeInput(e) {
    const code = e.detail.value.replace(/\D/g, '').slice(0, 6);
    this.setData({ verifyCode: code });

    if (code.length === 6) {
      if (code === this.data.actualVerifyCode) {
        this.setData({ phoneVerified: true, canSubmit: true });
        wx.showToast({ title: '验证成功', icon: 'success' });
      } else {
        this.setData({ phoneVerified: false, canSubmit: false });
        wx.showToast({ title: '验证码错误', icon: 'none' });
      }
    } else {
      this.setData({ phoneVerified: false, canSubmit: false });
    }
  },

  skipPhoneBind() {
    wx.showModal({
      title: '跳过绑定',
      content: '手机号绑定可用于找回账号和接收就诊提醒，确定要跳过吗？',
      confirmText: '仍要跳过',
      confirmColor: '#999',
      success: (res) => {
        if (res.confirm) this.submitAllData(true);
      }
    });
  },

  // 微信一键获取手机号 — 增加权限错误优雅处理
  onGetPhoneNumber(e) {
    console.log('getPhoneNumber:', e.detail);

    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      wx.showLoading({ title: '正在获取' });
      setTimeout(() => {
        wx.hideLoading();
        wx.showToast({
          title: '演示模式：请手动输入手机号',
          icon: 'none',
          duration: 2000
        });
      }, 800);
    } else if (e.detail.errMsg && e.detail.errMsg.includes('no permission')) {
      // 权限未配置或被拒绝，友好提示并引导手动输入
      console.warn('微信手机号权限不可用:', e.detail.errMsg);
      wx.showToast({
        title: '暂不支持快捷绑定，请手动输入手机号',
        icon: 'none',
        duration: 2500
      });
    } else {
      // 其他拒绝情况（用户主动取消）
      console.log('用户取消了微信手机号授权');
    }
  },

  // ==================== 提交与完成 ====================

  submitAllData(skippedPhone = false) {
    if (this.data.submitting) return;
    this.setData({ submitting: true });

    try {
      const userData = UserDataManager.loadUserData();

      if (!skippedPhone && this.data.phone && this.data.phoneVerified) {
        userData.userInfo.phone = this.data.phone;
      }

      UserDataManager.saveUserData(userData);

      wx.setStorageSync('hasCompletedAuth', true);
      wx.setStorageSync('hasLoggedIn', true);

      // 清除游客模式标记
      wx.removeStorageSync('isGuestMode');

      this.setData({ currentStep: 4 });

      setTimeout(() => {
        wx.reLaunch({ url: '/pages/index/index' });
      }, 1800);

    } catch (error) {
      console.error('提交数据失败:', error);
      this.setData({ submitting: false });
      wx.showToast({ title: '设置失败，请重试', icon: 'none' });
    }
  }
});
