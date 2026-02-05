Page({
  data: {
    userAccount: null,
    userInfo: {
      name: '',
      gender: '',
      age: '',
      phone: ''
    },
    medicalRecords: [],
    
    // 新增健康管理相关数据
    healthStatus: {
      theme: 'primary',
      text: '保持良好',
      desc: '您的口腔健康状况良好，继续保持！'
    },
    latestDiagnosis: '',
    aiRecordsCount: 0,
    aiDiagnosisList: [],
    showAllDiagnosis: false,
    selfCheckCount: 0,
    favoriteArticles: 0,
    watchedVideos: 0,
    recommendedArticle: '',
    commonDepartmentsCount: 0,
    favoriteHospitals: 0,
    latestAppointment: '',
    notificationEnabled: true
  },

  onLoad() {
    this.loadUserData();
    this.loadUserAccount();
    this.loadHealthData();
  },

  loadUserData() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    const medicalRecords = wx.getStorageSync('medicalRecords') || [];
    this.setData({ userInfo, medicalRecords });
  },

  saveUserInfo(e) {
    const { field } = e.currentTarget.dataset;
    const value = e.detail.value;
    const userInfo = { ...this.data.userInfo, [field]: value };
    this.setData({ userInfo });
    wx.setStorageSync('userInfo', userInfo);
  },

  onGenderChange(e) {
    const index = e.detail.value;
    const genderOptions = ['男', '女'];
    const selectedGender = genderOptions[index];
    const userInfo = { ...this.data.userInfo, gender: selectedGender };
    this.setData({ userInfo });
    wx.setStorageSync('userInfo', userInfo);
  },

  addMedicalRecord() {
    wx.navigateTo({
      url: '/pages/profile/medical-record/medical-record'
    });
  },

  deleteRecord(e) {
    const { index } = e.currentTarget.dataset;
    const medicalRecords = this.data.medicalRecords.filter((_, i) => i !== index);
    this.setData({ medicalRecords });
    wx.setStorageSync('medicalRecords', medicalRecords);
  },

  loadUserAccount() {
    const userAccount = wx.getStorageSync('userAccount');
    if (userAccount) {
      this.setData({ userAccount });
    }
  },

  loadHealthData() {
    // 加载AI诊断历史
    const aiDiagnosisHistory = wx.getStorageSync('aiDiagnosisHistory') || [];
    const selfCheckRecords = wx.getStorageSync('selfCheckRecords') || [];
    const favoriteArticles = wx.getStorageSync('favoriteArticles') || [];
    const watchedVideos = wx.getStorageSync('watchedVideos') || [];
    const commonDepartments = wx.getStorageSync('commonDepartments') || [];
    const favoriteHospitals = wx.getStorageSync('favoriteHospitals') || [];
    
    // 处理AI诊断列表
    const aiDiagnosisList = this.processDiagnosisList(aiDiagnosisHistory);
    
    // 计算最新诊断（使用关键词而非完整结果）
    const latestDiagnosis = aiDiagnosisHistory.length > 0 ? 
      this.extractKeywords(aiDiagnosisHistory[aiDiagnosisHistory.length - 1].symptoms) : '';
    
    // 根据诊断历史更新健康状态
    const healthStatus = this.calculateHealthStatus(aiDiagnosisHistory);
    
    this.setData({
      aiRecordsCount: aiDiagnosisHistory.length,
      aiDiagnosisList: aiDiagnosisList,
      selfCheckCount: selfCheckRecords.length,
      latestDiagnosis: latestDiagnosis,
      healthStatus: healthStatus,
      favoriteArticles: favoriteArticles.length,
      watchedVideos: watchedVideos.length,
      commonDepartmentsCount: commonDepartments.length,
      favoriteHospitals: favoriteHospitals.length,
      recommendedArticle: this.getRecommendedArticle(aiDiagnosisHistory)
    });
  },

  processDiagnosisList(history) {
    return history.map(record => ({
      id: record.timestamp || Date.now(),
      symptoms: this.extractKeywords(record.symptoms),
      department: record.department,
      severity: record.severity,
      timestamp: record.timestamp,
      fullRecord: record
    })).reverse().slice(0, 3); // 最新的在前，默认只显示前3条
  },

  extractKeywords(symptoms) {
    if (!symptoms) return '未知症状';
    
    // 提取关键词：去除助词和标点，保留核心症状词
    const keywords = symptoms.replace(/[，。、！？；：,.!?;:]/g, ' ')
      .split(/\s+/)
      .filter(word => {
        const stopWords = ['的', '了', '在', '有', '是', '和', '与', '或', '可能', '感觉', '觉得'];
        return word.length > 1 && !stopWords.includes(word);
      })
      .slice(0, 3); // 最多显示3个关键词
    
    return keywords.length > 0 ? keywords.join('、') : symptoms.substring(0, 10) + '...';
  },

  calculateHealthStatus(diagnosisHistory) {
    if (diagnosisHistory.length === 0) {
      return {
        theme: 'default',
        text: '待评估',
        desc: '尚未进行AI诊断，建议尝试AI分诊功能'
      };
    }
    
    const latest = diagnosisHistory[diagnosisHistory.length - 1];
    const severity = latest.severity || 'mild';
    
    switch (severity) {
      case 'severe':
        return {
          theme: 'danger',
          text: '建议就医',
          desc: '您的症状较为严重，建议尽快就医检查'
        };
      case 'moderate':
        return {
          theme: 'warning',
          text: '需要关注',
          desc: '建议加强口腔护理，定期复查'
        };
      default:
        return {
          theme: 'primary',
          text: '保持良好',
          desc: '您的口腔健康状况良好，继续保持！'
        };
    }
  },

  getRecommendedArticle(diagnosisHistory) {
    if (diagnosisHistory.length === 0) return '';
    
    const latest = diagnosisHistory[diagnosisHistory.length - 1];
    const department = latest.department || '';
    
    const recommendations = {
      '牙周科': '牙周炎预防与治疗',
      '牙体牙髓病科': '蛀牙防治与根管治疗',
      '正畸科': '牙齿矫正注意事项',
      '儿童口腔科': '儿童牙齿保健指南',
      '口腔颌面外科': '智齿拔除与术后护理'
    };
    
    return recommendations[department] || '口腔健康日常护理';
  },

  // 新增功能方法
  changeAvatar() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        const userAccount = { ...this.data.userAccount, avatarUrl: tempFilePath };
        this.setData({ userAccount });
        wx.setStorageSync('userAccount', userAccount);
      }
    });
  },

  toggleDiagnosisList() {
    this.setData({
      showAllDiagnosis: !this.data.showAllDiagnosis
    });
  },

  viewAiDiagnosisDetail(e) {
    const { index } = e.currentTarget.dataset;
    const record = this.data.aiDiagnosisList[index].fullRecord;
    
    // 将诊断记录传递到AI问诊页面
    wx.navigateTo({
      url: `/pages/ai-diagnosis/ai-diagnosis?diagnosisRecord=${encodeURIComponent(JSON.stringify(record))}`
    });
  },

  viewAiDiagnosisHistory() {
    // 如果只有一条记录，直接跳转到详情页
    if (this.data.aiDiagnosisList.length === 1) {
      this.viewAiDiagnosisDetail({ currentTarget: { dataset: { index: 0 } } });
      return;
    }
    
    // 多条记录时，展开/收起列表
    this.toggleDiagnosisList();
  },

  viewSelfCheckRecords() {
    wx.showModal({
      title: '自查记录',
      content: '此功能正在开发中，将展示您的口腔自查记录',
      showCancel: false
    });
  },

  viewFavorites() {
    wx.showModal({
      title: '收藏的文章',
      content: '此功能正在开发中，将展示您收藏的科普文章',
      showCancel: false
    });
  },

  viewWatchedVideos() {
    wx.showModal({
      title: '看过的视频',
      content: '此功能正在开发中，将展示您观看过的视频',
      showCancel: false
    });
  },

  viewRecommendedArticle() {
    wx.showModal({
      title: '推荐阅读',
      content: `根据您的健康记录，推荐您阅读：${this.data.recommendedArticle}`,
      showCancel: false
    });
  },

  viewCommonDepartments() {
    wx.showModal({
      title: '常用科室',
      content: '此功能正在开发中，将展示您常用的科室列表',
      showCancel: false
    });
  },

  viewFavoriteHospitals() {
    wx.showModal({
      title: '关注的医院',
      content: '此功能正在开发中，将展示您关注的医院信息',
      showCancel: false
    });
  },

  viewAppointments() {
    wx.showModal({
      title: '预约记录',
      content: '此功能正在开发中，将展示您的预约信息',
      showCancel: false
    });
  },

  // 设置相关方法
  bindPhone() {
    wx.showModal({
      title: '绑定手机',
      content: '此功能正在开发中，将用于绑定您的手机号码',
      showCancel: false
    });
  },

  privacySettings() {
    wx.showModal({
      title: '隐私设置',
      content: '此功能正在开发中，将用于管理您的隐私设置',
      showCancel: false
    });
  },

  toggleNotification(e) {
    const enabled = e.detail.value;
    this.setData({ notificationEnabled: enabled });
    wx.setStorageSync('notificationEnabled', enabled);
    wx.showToast({
      title: enabled ? '通知已开启' : '通知已关闭',
      icon: 'success'
    });
  },

  dataManagement() {
    wx.showModal({
      title: '数据管理',
      content: '此功能正在开发中，将用于管理您的健康数据',
      showCancel: false
    });
  },

  clearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除所有缓存数据吗？此操作不可逆。',
      confirmText: '清除',
      confirmColor: '#fa5151',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync();
          wx.showToast({
            title: '缓存已清除',
            icon: 'success'
          });
          this.loadUserData();
          this.loadHealthData();
        }
      }
    });
  },

  aboutApp() {
    wx.showModal({
      title: '关于青芽智医',
      content: '青芽智医是一款专注于口腔健康的智能医疗助手，提供AI分诊、科普知识、院内导航等服务。',
      showCancel: false
    });
  },

  viewPrivacyPolicy() {
    wx.showModal({
      title: '隐私政策',
      content: '我们高度重视您的隐私安全，所有健康数据都将严格保密，仅用于为您提供更好的服务。',
      showCancel: false
    });
  },

  contactSupport() {
    wx.showModal({
      title: '联系客服',
      content: '如有问题，请通过微信公众号或客服热线联系我们。',
      showCancel: false
    });
  },

  logout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      confirmText: '退出',
      confirmColor: '#fa5151',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('userAccount');
          wx.removeStorageSync('hasLoggedIn');
          this.setData({ userAccount: null });
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
        }
      }
    });
  },

  goToLogin() {
    wx.navigateBack();
  }
})