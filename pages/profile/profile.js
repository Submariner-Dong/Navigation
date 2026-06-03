// 数据缓存机制
const cachedHealthData = {
  timestamp: 0,
  data: null
};
const CACHE_DURATION = 30000; // 30秒缓存

// 导入数据管理模块
const UserDataManager = require('../../utils/userDataManager.js');
const AvatarManager = require('../../utils/avatarManager.js');

// 导入图片配置
import imageConfig from '../../config/imageConfig.js'

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
    
    // 图片配置
    images: imageConfig,
    currentPage: 'profile',
    
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
    commonDepartmentsList: [],
    favoriteHospitals: 0,
    latestAppointment: '',
    
    // 新增：加载状态和分页控制
    loading: true,
    diagnosisPage: 1,
    pageSize: 10,
    hasMore: true,
    
    // 病历信息相关数据
    medicalRecordsLoading: false,
    medicalRecordsCount: 0,
    medicalRecordsList: [],
    displayedMedicalRecords: [],
    remainingMedicalRecords: [],
    showAllMedicalRecords: false
  },

  async onLoad() {
    // 并行加载数据
    await Promise.all([
      this.loadUserData(),
      this.loadUserAccount(),
      this.loadHealthData()
    ]);
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
    // 使用统一的头像管理模块加载用户信息
    const userData = UserDataManager.loadUserData() || {};
    const userAccount = {
      avatarUrl: AvatarManager.getUserAvatar(),
      nickName: userData.userInfo.name || '用户',
      // 其他用户信息...
    };
    
    this.setData({ userAccount });
  },

  async loadHealthData() {
    // 检查缓存
    const now = Date.now();
    if (cachedHealthData.data && now - cachedHealthData.timestamp < CACHE_DURATION) {
      this.setData(cachedHealthData.data);
      return;
    }
    
    try {
      // 从统一数据管理模块加载数据
      const userData = UserDataManager.loadUserData();
      
      const aiDiagnosisHistory = userData.medicalData.aiDiagnosisHistory;
      const selfCheckRecords = userData.medicalData.selfCheckRecords;
      const favoriteArticles = userData.preferences.favoriteArticles;
      const watchedVideos = userData.preferences.watchedVideos;
      const commonDepartments = userData.preferences.commonDepartments;
      const favoriteHospitals = userData.preferences.favoriteHospitals;
      
      // 并行处理数据
      const [aiDiagnosisList, healthStatus, latestDiagnosis] = await Promise.all([
        this.processDiagnosisListAsync(aiDiagnosisHistory.slice(0, 10)), // 只处理前10条
        this.calculateHealthStatus(aiDiagnosisHistory),
        aiDiagnosisHistory.length > 0 ? 
          (aiDiagnosisHistory[0].summary || this.summarizeSymptoms(aiDiagnosisHistory[0].symptoms)) : ''
      ]);
      
      // 处理常用科室列表 - 按使用次数排序，取前3个
      const commonDepartmentsList = commonDepartments
        .sort((a, b) => (b.count || 0) - (a.count || 0))
        .slice(0, 3);
      
      // 批量处理收藏文章
      const displayedFavoriteArticles = favoriteArticles.slice(0, 3).map(article => ({
        ...article,
        formattedTime: this.formatTime(article.timestamp)
      }));
      
      const pageData = {
        aiRecordsCount: aiDiagnosisHistory.length,
        aiDiagnosisList: aiDiagnosisList,
        displayedDiagnosisList: aiDiagnosisList.slice(0, 3), // 显示前3条
        remainingDiagnosisList: aiDiagnosisList.slice(3), // 剩余记录
        selfCheckCount: selfCheckRecords.length,
        latestDiagnosis: latestDiagnosis,
        healthStatus: healthStatus,
        favoriteArticles: favoriteArticles.length,
        displayedFavoriteArticles: displayedFavoriteArticles, // 显示前3篇收藏
        remainingFavoriteArticles: favoriteArticles.slice(3), // 剩余收藏
        watchedVideos: watchedVideos.length,
        commonDepartmentsCount: commonDepartments.length,
        commonDepartmentsList: commonDepartmentsList, // 常用科室列表
        favoriteHospitals: favoriteHospitals.length,
        recommendedArticle: this.getRecommendedArticle(aiDiagnosisHistory),
        showAllFavorites: false, // 默认不展开所有收藏
        loading: false,
        currentPage: 1,
        hasMore: aiDiagnosisHistory.length > 3
      };
      
      // 更新缓存
      cachedHealthData.data = pageData;
      cachedHealthData.timestamp = now;
      
      this.setData(pageData);
      
      //console.log('设置数据完成，aiDiagnosisList长度:', aiDiagnosisList.length);
      //console.log('aiDiagnosisList内容:', aiDiagnosisList);
      //console.log('页面数据状态:', this.data);
      
      // 详细调试信息
      //console.log('=== 详细调试信息 ===');
      //console.log('aiDiagnosisList类型:', typeof aiDiagnosisList);
      //console.log('aiDiagnosisList是否为数组:', Array.isArray(aiDiagnosisList));
      //console.log('aiDiagnosisList长度:', aiDiagnosisList.length);
      
      /*if (aiDiagnosisList.length > 0) {
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
      }*/
      
      //console.log('loading状态:', this.data.loading);
      //console.log('aiRecordsCount:', this.data.aiRecordsCount);
      //console.log('showAllDiagnosis:', this.data.showAllDiagnosis);
      //console.log('=== 调试信息结束 ===');
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

  // 优化的异步处理诊断列表
  async processDiagnosisListAsync(history) {
    if (!history || history.length === 0) return [];
    
    // 批量处理记录
    const processedList = await Promise.all(
      history.map(async (record) => {
        // 检查是否已经有缓存的总结
        let symptomsSummary = record.summary;
        if (!symptomsSummary) {
          // 如果没有缓存，提取关键词（避免AI调用）
          symptomsSummary = this.extractKeywords(record.symptoms);
        }
        
        // 格式化时间
        const formattedTime = this.formatTimestamp(record.timestamp);
        
        return {
          id: record.timestamp || Date.now(),
          symptoms: symptomsSummary,
          department: record.department,
          severity: record.severity,
          timestamp: record.timestamp,
          formattedTime: formattedTime,
          fullRecord: record
        };
      })
    );
    
    return processedList.reverse(); // 最新的在前
  },

  // 分页加载更多诊断记录
  async loadMoreDiagnosisHistory() {
    if (!this.data.hasMore) return;
    
    const userData = UserDataManager.loadUserData();
    const aiDiagnosisHistory = userData.medicalData.aiDiagnosisHistory;
    
    const startIndex = (this.data.diagnosisPage - 1) * this.data.pageSize;
    const endIndex = startIndex + this.data.pageSize;
    
    if (startIndex >= aiDiagnosisHistory.length) {
      this.setData({ hasMore: false });
      return;
    }
    
    const newRecords = aiDiagnosisHistory.slice(startIndex, endIndex);
    const processedRecords = await this.processDiagnosisListAsync(newRecords);
    
    if (processedRecords.length > 0) {
      this.setData({
        displayedDiagnosisList: [...this.data.displayedDiagnosisList, ...processedRecords],
        diagnosisPage: this.data.diagnosisPage + 1,
        hasMore: endIndex < aiDiagnosisHistory.length
      });
    }
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
    // 通过云函数安全代理调用 DeepSeek API（Key 不暴露给前端）
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'aiDiagnosis',
        data: {
          mode: 'summary',
          systemPrompt: '你是一个医疗AI助手。请将用户描述的症状总结为2-3个关键词或简短描述，用中文逗号分隔。只需要总结症状本身，不需要分析或建议。例如："牙齿疼痛持续三天，牙龈有些红肿" → "牙痛、牙龈红肿"',
          userMessage: `症状描述：${symptoms}`,
          temperature: 0.1,
          maxTokens: 30
        },
        success: (res) => {
          const result = res.result;
          if (result && result.success) {
            const content = result.content;
            const cleanedContent = content.replace(/[，。、！？；：,.!?;:\s]+$/, '');
            resolve(cleanedContent);
          } else {
            reject(new Error(result?.error || 'AI 服务调用失败'));
          }
        },
        fail: (error) => {
          console.error('调用 aiDiagnosis 云函数(summary模式)失败:', error);
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
        
        // 使用统一的头像管理模块
        AvatarManager.setUserAvatar(tempFilePath);
        
        // 更新当前页面显示
        const userAccount = { 
          ...this.data.userAccount, 
          avatarUrl: AvatarManager.getUserAvatar() 
        };
        this.setData({ userAccount });
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
    console.log('=== 开始处理收藏文章列表 ===');
    console.log('原始收藏文章数量:', favoriteArticles.length);
    console.log('原始收藏文章详情:', favoriteArticles);
    
    const processedArticles = favoriteArticles.map(article => {
      console.log('处理文章 ID:', article.id, '标题:', article.title);
      console.log('原始时间戳:', article.timestamp);
      const formattedTime = this.formatTime(article.timestamp);
      console.log('格式化后时间:', formattedTime);
      
      return {
        ...article,
        formattedTime: formattedTime
      };
    });
    
    console.log('处理后的收藏文章列表:', processedArticles);
    console.log('=== 收藏文章处理完成 ===');
    
    return processedArticles;
  },

  // 切换收藏列表展开/收起状态
  toggleFavoriteList() {
    const { showAllFavorites, favoriteArticles } = this.data;
    
    console.log('=== 切换收藏列表展开状态 ===');
    console.log('当前状态 showAllFavorites:', showAllFavorites);
    console.log('收藏文章总数 favoriteArticles:', favoriteArticles);
    
    if (favoriteArticles <= 3) {
      console.log('收藏文章数量 <= 3，不需要切换');
      return; // 只有3篇或更少，不需要切换
    }
    
    const newShowAllFavorites = !showAllFavorites;
    console.log('切换后状态:', newShowAllFavorites);
    
    this.setData({
      showAllFavorites: newShowAllFavorites
    });
    
    // 获取最新的收藏文章数据
    const userData = UserDataManager.loadUserData();
    const currentFavoriteArticles = userData.preferences.favoriteArticles;
    console.log('当前收藏文章数据:', currentFavoriteArticles);
    const processedFavoriteArticles = this.processFavoriteArticles(currentFavoriteArticles);
    
    // 根据展开状态更新显示的收藏列表
    if (newShowAllFavorites) {
      console.log('展开状态：显示所有收藏文章');
      this.setData({
        displayedFavoriteArticles: processedFavoriteArticles
      });
      console.log('显示所有收藏文章，数量:', processedFavoriteArticles.length);
    } else {
      console.log('收起状态：只显示前3篇收藏文章');
      this.setData({
        displayedFavoriteArticles: processedFavoriteArticles.slice(0, 3),
        remainingFavoriteArticles: processedFavoriteArticles.slice(3)
      });
      console.log('显示前3篇，剩余:', processedFavoriteArticles.slice(3).length, '篇');
    }
    
    console.log('=== 收藏列表切换完成 ===');
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

  // 直接跳转到科室导航
  navigateToDepartment(e) {
    const departmentName = e.currentTarget.dataset.name;
    
    if (!departmentName) {
      console.error('科室名称为空');
      return;
    }

    console.log(`跳转到科室：${departmentName}`);
    
    // 直接跳转到对应科室的导航页面
    wx.navigateTo({
      url: `/pages/navigation/department/department?d=${departmentName}`
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

  dataManagement() {
    wx.showActionSheet({
      itemList: ['删除智能问诊记录', '删除收藏的文章', '删除常用科室', '清除缓存'],
      success: (res) => {
        const tapIndex = res.tapIndex;
        switch (tapIndex) {
          case 0:
            this.deleteAiDiagnosisRecords();
            break;
          case 1:
            this.deleteFavoriteArticles();
            break;
          case 2:
            this.deleteCommonDepartments();
            break;
          case 3:
            this.clearAllCache();
            break;
        }
      }
    });
  },

  // 删除智能问诊记录
  deleteAiDiagnosisRecords() {
    const aiDiagnosisCount = this.data.aiRecordsCount;
    
    if (aiDiagnosisCount === 0) {
      wx.showModal({
        title: '提示',
        content: '您还没有智能问诊记录',
        showCancel: false
      });
      return;
    }

    wx.showModal({
      title: '删除智能问诊记录',
      content: `确定要删除所有${aiDiagnosisCount}条智能问诊记录吗？此操作不可逆。`,
      confirmText: '删除',
      confirmColor: '#fa5151',
      success: (res) => {
        if (res.confirm) {
          const userData = UserDataManager.loadUserData();
          userData.medicalData.aiDiagnosisHistory = [];
          UserDataManager.saveUserData(userData);
          
          wx.showToast({
            title: '问诊记录已删除',
            icon: 'success'
          });
          
          // 重新加载数据
          this.loadHealthData();
        }
      }
    });
  },

  // 删除收藏的文章
  deleteFavoriteArticles() {
    const favoriteCount = this.data.favoriteArticles;
    
    if (favoriteCount === 0) {
      wx.showModal({
        title: '提示',
        content: '您还没有收藏的文章',
        showCancel: false
      });
      return;
    }

    wx.showModal({
      title: '删除收藏的文章',
      content: `确定要删除所有${favoriteCount}篇收藏文章吗？此操作不可逆。`,
      confirmText: '删除',
      confirmColor: '#fa5151',
      success: (res) => {
        if (res.confirm) {
          const userData = UserDataManager.loadUserData();
          userData.preferences.favoriteArticles = [];
          UserDataManager.saveUserData(userData);
          
          wx.showToast({
            title: '收藏文章已删除',
            icon: 'success'
          });
          
          // 重新加载数据
          this.loadHealthData();
        }
      }
    });
  },

  // 删除常用科室
  deleteCommonDepartments() {
    const departmentsCount = this.data.commonDepartmentsCount;
    
    if (departmentsCount === 0) {
      wx.showModal({
        title: '提示',
        content: '您还没有常用科室记录',
        showCancel: false
      });
      return;
    }

    wx.showModal({
      title: '删除常用科室',
      content: `确定要删除所有${departmentsCount}个常用科室记录吗？此操作不可逆。`,
      confirmText: '删除',
      confirmColor: '#fa5151',
      success: (res) => {
        if (res.confirm) {
          const userData = UserDataManager.loadUserData();
          userData.preferences.commonDepartments = [];
          UserDataManager.saveUserData(userData);
          
          wx.showToast({
            title: '常用科室已删除',
            icon: 'success'
          });
          
          // 重新加载数据
          this.loadHealthData();
        }
      }
    });
  },

  // 清除所有缓存（合并到数据管理）
  clearAllCache() {
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除所有缓存数据吗？此操作将删除所有本地存储的数据，不可逆。',
      confirmText: '清除',
      confirmColor: '#fa5151',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync();
          wx.showToast({
            title: '缓存已清除',
            icon: 'success'
          });
          
          // 重新初始化用户数据
          const defaultData = UserDataManager.loadUserData();
          UserDataManager.saveUserData(defaultData);
          
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
      wx.navigateBack();
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

  // 病历信息相关方法

  // 获取病历信息（模拟医院系统接口）
  fetchMedicalRecords() {
    if (this.data.medicalRecordsLoading) return;
    
    this.setData({
      medicalRecordsLoading: true
    });

    // 模拟API调用延迟
    setTimeout(() => {
      try {
        // 模拟从医院系统获取的病历数据
        const mockMedicalRecords = this.generateMockMedicalRecords();
        
        this.setData({
          medicalRecordsList: mockMedicalRecords,
          medicalRecordsCount: mockMedicalRecords.length,
          displayedMedicalRecords: mockMedicalRecords.slice(0, 3),
          remainingMedicalRecords: mockMedicalRecords.slice(3),
          medicalRecordsLoading: false
        });

        wx.showToast({
          title: '病历信息同步成功',
          icon: 'success'
        });
      } catch (error) {
        console.error('获取病历信息失败:', error);
        this.setData({
          medicalRecordsLoading: false
        });
        
        wx.showToast({
          title: '病历信息获取失败',
          icon: 'none'
        });
      }
    }, 1500);
  },

  // 生成模拟病历数据
  generateMockMedicalRecords() {
    const departments = [
      '牙体牙髓病科', '牙周科', '口腔修复科', '口腔正畸科', 
      '口腔颌面外科', '儿童口腔科', '口腔预防科'
    ];
    
    const doctors = [
      '张医生', '李医生', '王医生', '赵医生', '刘医生',
      '陈医生', '杨医生', '黄医生', '周医生', '吴医生'
    ];
    
    const diagnoses = [
      '龋齿修复', '牙龈炎治疗', '牙齿矫正', '智齿拔除',
      '牙周炎治疗', '根管治疗', '牙齿美白', '口腔检查',
      '牙体修复', '口腔卫生指导'
    ];
    
    const records = [];
    const recordCount = Math.floor(Math.random() * 3) + 3; // 3-5份病历
    
    for (let i = 0; i < recordCount; i++) {
      const randomDept = departments[Math.floor(Math.random() * departments.length)];
      const randomDoctor = doctors[Math.floor(Math.random() * doctors.length)];
      const randomDiagnosis = diagnoses[Math.floor(Math.random() * diagnoses.length)];
      
      // 生成随机的就诊时间（过去一年内）
      const randomDays = Math.floor(Math.random() * 365);
      const visitDate = new Date();
      visitDate.setDate(visitDate.getDate() - randomDays);
      const visitTime = visitDate.toLocaleDateString('zh-CN');
      
      records.push({
        id: `medical_${Date.now()}_${i}`,
        department: randomDept,
        doctor: randomDoctor,
        diagnosis: randomDiagnosis,
        visitTime: visitTime,
        description: `${randomDept}就诊记录，${randomDiagnosis}治疗`,
        treatment: '常规治疗完成',
        nextVisit: randomDays > 180 ? '建议3个月后复查' : '暂无复诊需求'
      });
    }
    
    // 按就诊时间倒序排列
    return records.sort((a, b) => new Date(b.visitTime) - new Date(a.visitTime));
  },

  // 查看病历详情
  viewMedicalRecordDetail(e) {
    const recordId = e.currentTarget.dataset.id;
    const index = e.currentTarget.dataset.index;
    
    // 直接从当前显示的记录中获取，避免查找错误
    let record = null;
    if (index !== undefined) {
      record = this.data.displayedMedicalRecords[index];
    }
    
    // 如果通过index找不到，再尝试通过id查找
    if (!record) {
      record = this.data.medicalRecordsList.find(r => r.id === recordId);
    }
    
    if (!record) {
      wx.showToast({
        title: '病历信息不存在',
        icon: 'none'
      });
      return;
    }
    
    // 跳转到病历详情页面
    wx.navigateTo({
      url: `/pages/profile/medical-record-detail/medical-record-detail?record=${encodeURIComponent(JSON.stringify(record))}`
    });
  },

  // 切换病历列表展开/收起状态
  toggleMedicalRecordsList() {
    const { showAllMedicalRecords, medicalRecordsList } = this.data;
    
    if (medicalRecordsList.length <= 3) {
      return; // 只有3份或更少，不需要切换
    }
    
    const newShowAll = !showAllMedicalRecords;
    
    if (newShowAll) {
      // 展开所有病历
      this.setData({
        showAllMedicalRecords: newShowAll,
        displayedMedicalRecords: medicalRecordsList
      });
    } else {
      // 收起，只显示前3份
      this.setData({
        showAllMedicalRecords: newShowAll,
        displayedMedicalRecords: medicalRecordsList.slice(0, 3),
        remainingMedicalRecords: medicalRecordsList.slice(3)
      });
    }
  }
})