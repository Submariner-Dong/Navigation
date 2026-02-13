const UserDataManager = require('../userDataManager.js');

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
    notificationEnabled: true,
    
    // 新增：加载状态
    loading: true
  },

  async onLoad() {
    this.loadUserData();
    this.loadUserAccount();
    await this.loadHealthData();
  },

  loadUserData() {
    const userData = UserDataManager.loadUserData();
    this.setData({ 
      userInfo: userData.userInfo,
      medicalRecords: userData.medicalData.medicalRecords 
    });
  },

  saveUserInfo(e) {
    const { field } = e.currentTarget.dataset;
    const value = e.detail.value;
    const userInfo = { ...this.data.userInfo, [field]: value };
    this.setData({ userInfo });
    UserDataManager.updateUserInfo(userInfo);
  },

  onGenderChange(e) {
    const index = e.detail.value;
    const genderOptions = ['男', '女'];
    const selectedGender = genderOptions[index];
    const userInfo = { ...this.data.userInfo, gender: selectedGender };
    this.setData({ userInfo });
    UserDataManager.updateUserInfo(userInfo);
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
    
    // 更新到统一数据管理
    const userData = UserDataManager.loadUserData();
    userData.medicalData.medicalRecords = medicalRecords;
    UserDataManager.saveUserData(userData);
  },

  loadUserAccount() {
    const userAccount = wx.getStorageSync('userAccount');
    if (userAccount) {
      this.setData({ userAccount });
    }
  },

  async loadHealthData() {
    try {
      // 从统一数据管理模块加载数据
      const userData = UserDataManager.loadUserData();
      
      const aiDiagnosisHistory = userData.medicalData.aiDiagnosisHistory;
      const selfCheckRecords = userData.medicalData.selfCheckRecords;
      const favoriteArticles = userData.preferences.favoriteArticles;
      const watchedVideos = userData.preferences.watchedVideos;
      const commonDepartments = userData.preferences.commonDepartments;
      const favoriteHospitals = userData.preferences.favoriteHospitals;
      
      console.log('加载的诊断历史:', aiDiagnosisHistory);
      
      // 处理AI诊断列表（异步）
      const aiDiagnosisList = await this.processDiagnosisList(aiDiagnosisHistory);
      
      console.log('处理后的诊断列表:', aiDiagnosisList);
      
      // 在JS中预先切分数组
      const displayedDiagnosisList = aiDiagnosisList.slice(0, 3);
      const remainingDiagnosisList = aiDiagnosisList.slice(3);

      console.log('切分后的诊断列表:');
      console.log('  - 显示前3条:', displayedDiagnosisList);
      console.log('  - 剩余记录:', remainingDiagnosisList);
      
      // 计算最新诊断（使用缓存的总结）
      const latestDiagnosis = aiDiagnosisHistory.length > 0 ? 
        aiDiagnosisHistory[0].summary || 
        await this.summarizeSymptoms(aiDiagnosisHistory[0].symptoms) : '';
      
      // 根据诊断历史更新健康状态
      const healthStatus = this.calculateHealthStatus(aiDiagnosisHistory);
      
      // 处理收藏文章列表
      const processedFavoriteArticles = this.processFavoriteArticles(favoriteArticles);
      const displayedFavoriteArticles = processedFavoriteArticles.slice(0, 3);
      const remainingFavoriteArticles = processedFavoriteArticles.slice(3);
      
      this.setData({
        aiRecordsCount: aiDiagnosisHistory.length,
        aiDiagnosisList: aiDiagnosisList,
        displayedDiagnosisList: displayedDiagnosisList, // 显示前3条
        remainingDiagnosisList: remainingDiagnosisList, // 剩余记录
        selfCheckCount: selfCheckRecords.length,
        latestDiagnosis: latestDiagnosis,
        healthStatus: healthStatus,
        favoriteArticles: favoriteArticles.length,
        displayedFavoriteArticles: displayedFavoriteArticles, // 显示前3篇收藏
        remainingFavoriteArticles: remainingFavoriteArticles, // 剩余收藏
        watchedVideos: watchedVideos.length,
        commonDepartmentsCount: commonDepartments.length,
        favoriteHospitals: favoriteHospitals.length,
        recommendedArticle: this.getRecommendedArticle(aiDiagnosisHistory),
        showAllFavorites: false, // 默认不展开所有收藏
        loading: false
      });
      
      console.log('设置数据完成，aiDiagnosisList长度:', aiDiagnosisList.length);
      console.log('aiDiagnosisList内容:', aiDiagnosisList);
      console.log('页面数据状态:', this.data);
      
      // 详细调试信息
      console.log('=== 详细调试信息 ===');
      console.log('aiDiagnosisList类型:', typeof aiDiagnosisList);
      console.log('aiDiagnosisList是否为数组:', Array.isArray(aiDiagnosisList));
      console.log('aiDiagnosisList长度:', aiDiagnosisList.length);
      
      if (aiDiagnosisList.length > 0) {
        console.log('第一条记录详情:');
        console.log('  - ID:', aiDiagnosisList[0].id);
        console.log('  - Symptoms:', aiDiagnosisList[0].symptoms);
        console.log('  - Type of symptoms:', typeof aiDiagnosisList[0].symptoms);
        console.log('  - Department:', aiDiagnosisList[0].department);
        console.log('  - Timestamp:', aiDiagnosisList[0].timestamp);
        
        console.log('所有记录symptoms字段:');
        aiDiagnosisList.forEach((record, index) => {
          console.log(`  ${index + 1}. ${record.symptoms} (${typeof record.symptoms})`);
        });
      }
      
      console.log('loading状态:', this.data.loading);
      console.log('aiRecordsCount:', this.data.aiRecordsCount);
      console.log('showAllDiagnosis:', this.data.showAllDiagnosis);
      console.log('=== 调试信息结束 ===');
    } catch (error) {
      console.error('加载健康数据失败:', error);
      // 出错时使用空数据
      this.setData({
        aiRecordsCount: 0,
        aiDiagnosisList: [],
        displayedDiagnosisList: [],
        remainingDiagnosisList: [],
        selfCheckCount: 0,
        latestDiagnosis: '',
        healthStatus: {
          theme: 'default',
          text: '待评估',
          desc: '尚未进行AI诊断'
        },
        favoriteArticles: 0,
        watchedVideos: 0,
        commonDepartmentsCount: 0,
        favoriteHospitals: 0,
        recommendedArticle: ''
      });
    }
  },

  async processDiagnosisList(history) {
    const processedList = [];
    
    // 处理每条记录的症状总结
    for (const record of history) {
      // 检查是否已经有缓存的总结
      let symptomsSummary = record.summary;
      if (!symptomsSummary) {
        // 如果没有缓存，调用AI总结
        symptomsSummary = await this.summarizeSymptoms(record.symptoms);
        // 保存总结结果到存储
        await this.saveSummaryToStorage(record.timestamp, symptomsSummary);
      }
      
      // 格式化时间
      const formattedTime = this.formatTimestamp(record.timestamp);
      
      processedList.push({
        id: record.timestamp || Date.now(),
        symptoms: symptomsSummary,
        department: record.department,
        severity: record.severity,
        timestamp: record.timestamp,
        formattedTime: formattedTime,
        fullRecord: record
      });
    }
    
    return processedList.reverse(); // 最新的在前
  },

  // 时间格式化函数
  formatTimestamp(timestamp) {
    if (!timestamp) return '未知时间';
    
    // 如果是ISO格式时间戳，提取日期部分
    if (timestamp.includes('T')) {
      return timestamp.split('T')[0];
    }
    
    // 其他格式的时间戳处理
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return '未知时间';
      }
      return date.toISOString().split('T')[0];
    } catch (error) {
      return '未知时间';
    }
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

  async summarizeSymptoms(symptoms) {
    if (!symptoms) return '未知症状';
    
    // 如果症状描述较短，直接显示
    if (symptoms.length <= 15) {
      return symptoms;
    }
    
    // 直接使用AI总结：调用AI接口生成简洁的症状描述
    const aiSummary = await this.generateAiSummary(symptoms);
    
    // 如果AI总结有效，使用它；否则使用关键词
    if (aiSummary && aiSummary.length > 0) {
      return aiSummary;
    }
    
    // 备用方案：使用关键词
    return this.extractKeywords(symptoms);
  },

  async generateAiSummary(symptoms) {
    // 使用DeepSeek API生成简洁的症状描述
    try {
      const summary = await this.callDeepSeekForSummary(symptoms);
      return summary;
    } catch (error) {
      console.error('AI总结失败，使用备用方案:', error);
      return this.fallbackSummary(symptoms);
    }
  },

  async callDeepSeekForSummary(symptoms) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: 'https://api.deepseek.com/chat/completions',
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sk-68966a908d44452ca87264e055e9863e'
        },
        data: {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: '你是一个医疗AI助手。请将用户描述的症状总结为2-3个关键词或简短描述，用中文逗号分隔。只需要总结症状本身，不需要分析或建议。例如："牙齿疼痛持续三天，牙龈有些红肿" → "牙痛、牙龈红肿"'
            },
            {
              role: 'user',
              content: `症状描述：${symptoms}`
            }
          ],
          temperature: 0.1,
          max_tokens: 30
        },
        success: (res) => {
          if (res.statusCode === 200) {
            const content = res.data.choices[0].message.content;
            // 清理响应内容，去除多余的标点符号
            const cleanedContent = content.replace(/[，。、！？；：,.!?;:\s]+$/, '');
            resolve(cleanedContent);
          } else {
            reject(new Error(`API请求失败: ${res.statusCode}`));
          }
        },
        fail: (error) => {
          reject(error);
        }
      });
    });
  },

  fallbackSummary(symptoms) {
    // 备用方案：使用简单的关键词提取
    const aiSummaryRules = [
      { pattern: /(牙痛|牙疼|牙齿痛)/, summary: '牙痛' },
      { pattern: /(牙龈|牙肉).*(出血|红肿)/, summary: '牙龈问题' },
      { pattern: /(智齿|第三磨牙)/, summary: '智齿问题' },
      { pattern: /(松动|脱落|断裂)/, summary: '牙齿松动' },
      { pattern: /(溃疡|疼痛)/, summary: '口腔溃疡' },
      { pattern: /(敏感|酸痛)/, summary: '牙齿敏感' },
      { pattern: /(炎症|肿痛)/, summary: '牙周炎症' },
      { pattern: /(蛀牙|龋齿|洞)/, summary: '蛀牙' },
      { pattern: /(持续|间断|阵发)/, summary: '持续不适' }
    ];
    
    const matchedSummaries = [];
    for (const rule of aiSummaryRules) {
      if (rule.pattern.test(symptoms)) {
        matchedSummaries.push(rule.summary);
      }
    }
    
    if (matchedSummaries.length > 0) {
      const uniqueSummaries = [...new Set(matchedSummaries)];
      return uniqueSummaries.slice(0, 2).join('、');
    }
    
    return null;
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
    const showAllDiagnosis = !this.data.showAllDiagnosis;
    
    // 根据是否展开来决定显示哪些记录
    if (showAllDiagnosis) {
      // 展开时显示所有记录，保持剩余记录不变
      this.setData({
        showAllDiagnosis: showAllDiagnosis,
        displayedDiagnosisList: this.data.aiDiagnosisList
      });
    } else {
      // 收起时只显示前3条
      this.setData({
        showAllDiagnosis: showAllDiagnosis,
        displayedDiagnosisList: this.data.aiDiagnosisList.slice(0, 3)
      });
    }
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

  // 处理收藏文章列表
  processFavoriteArticles(favoriteArticles) {
    return favoriteArticles.map(article => ({
      ...article,
      formattedTime: this.formatTime(article.timestamp)
    }));
  },

  // 切换收藏列表展开/收起状态
  toggleFavoriteList() {
    const { showAllFavorites, favoriteArticles } = this.data;
    
    if (favoriteArticles <= 3) {
      return; // 只有3篇或更少，不需要切换
    }
    
    this.setData({
      showAllFavorites: !showAllFavorites
    });
    
    // 根据展开状态更新显示的收藏列表
    if (showAllFavorites) {
      // 收起时只显示前3篇
      const processedFavoriteArticles = this.processFavoriteArticles(UserDataManager.getFavoriteArticles());
      this.setData({
        displayedFavoriteArticles: processedFavoriteArticles.slice(0, 3),
        remainingFavoriteArticles: processedFavoriteArticles.slice(3)
      });
    } else {
      // 展开时显示所有收藏
      const processedFavoriteArticles = this.processFavoriteArticles(UserDataManager.getFavoriteArticles());
      this.setData({
        displayedFavoriteArticles: processedFavoriteArticles
      });
    }
  },

  // 查看收藏文章详情
  viewFavoriteArticle(e) {
    const articleId = e.currentTarget.dataset.id;
    
    // 跳转到对应文章详情页
    wx.navigateTo({
      url: `/pages/science/detail/detail?id=${articleId}`
    });
  },

  // 格式化时间
  formatTime(timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // 如果是今天
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    
    // 如果是昨天
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return '昨天 ' + date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    
    // 一周内
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      return `${days}天前`;
    }
    
    // 更早的时间
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
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

  // 缓存管理方法
  async loadCachedDiagnosisHistory() {
    const history = wx.getStorageSync('aiDiagnosisHistory') || [];
    const summaries = wx.getStorageSync('aiDiagnosisSummaries') || {};
    
    // 为每条记录添加缓存的总结
    return history.map(record => ({
      ...record,
      summary: summaries[record.timestamp]
    }));
  },

  async saveSummaryToStorage(timestamp, summary) {
    const summaries = wx.getStorageSync('aiDiagnosisSummaries') || {};
    summaries[timestamp] = summary;
    wx.setStorageSync('aiDiagnosisSummaries', summaries);
    
    // 同时更新诊断历史记录中的总结字段
    const history = wx.getStorageSync('aiDiagnosisHistory') || [];
    const updatedHistory = history.map(record => {
      if (record.timestamp === timestamp) {
        return { ...record, summary: summary };
      }
      return record;
    });
    wx.setStorageSync('aiDiagnosisHistory', updatedHistory);
  },

  goToLogin() {
    wx.navigateBack();
  }
})