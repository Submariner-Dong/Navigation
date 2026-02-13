// utils/userDataManager.js
// 统一用户数据管理模块

// 数据模型定义
const userDataSchema = {
  userInfo: {
    name: '',
    phone: '',
    gender: '',
    age: '',
    avatarUrl: ''
  },
  medicalData: {
    aiDiagnosisHistory: [],
    selfCheckRecords: [],
    medicalRecords: []
  },
  preferences: {
    favoriteArticles: [],
    favoriteHospitals: [],
    commonDepartments: [],
    watchedVideos: []
  },
  settings: {
    notificationEnabled: true,
    theme: 'light'
  }
};

// 加载用户数据
function loadUserData() {
  try {
    const storedData = wx.getStorageSync('userData');
    if (!storedData) {
      // 首次使用，创建默认数据
      const defaultData = JSON.parse(JSON.stringify(userDataSchema));
      saveUserData(defaultData);
      return defaultData;
    }
    
    // 数据合并，确保新字段有默认值
    return mergeWithDefault(storedData);
  } catch (error) {
    console.error('加载用户数据失败:', error);
    return JSON.parse(JSON.stringify(userDataSchema));
  }
}

// 保存用户数据
function saveUserData(data) {
  try {
    wx.setStorageSync('userData', data);
    return true;
  } catch (error) {
    console.error('保存用户数据失败:', error);
    return false;
  }
}

// 数据合并，确保完整性
function mergeWithDefault(storedData) {
  const result = JSON.parse(JSON.stringify(userDataSchema));
  
  // 深度合并
  const mergeDeep = (target, source) => {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        mergeDeep(target[key], source[key]);
      } else if (Array.isArray(source[key])) {
        target[key] = source[key] || [];
      } else {
        target[key] = source[key] !== undefined ? source[key] : target[key];
      }
    }
  };
  
  mergeDeep(result, storedData);
  return result;
}

// === 用户信息操作 ===

// 更新用户基本信息
function updateUserInfo(userInfo) {
  const data = loadUserData();
  data.userInfo = { ...data.userInfo, ...userInfo };
  return saveUserData(data);
}

// 获取用户基本信息
function getUserInfo() {
  return loadUserData().userInfo;
}

// === 医疗数据操作 ===

// 添加AI问诊记录
function addAiDiagnosisRecord(record) {
  const data = loadUserData();
  record.id = record.id || Date.now();
  record.timestamp = record.timestamp || new Date().toISOString();
  
  data.medicalData.aiDiagnosisHistory.unshift(record); // 最新的在前
  
  // 限制历史记录数量（可选）
  if (data.medicalData.aiDiagnosisHistory.length > 100) {
    data.medicalData.aiDiagnosisHistory = data.medicalData.aiDiagnosisHistory.slice(0, 100);
  }
  
  return saveUserData(data);
}

// 获取AI问诊历史
function getAiDiagnosisHistory() {
  return loadUserData().medicalData.aiDiagnosisHistory;
}

// 添加自查记录
function addSelfCheckRecord(record) {
  const data = loadUserData();
  record.id = record.id || Date.now();
  record.timestamp = record.timestamp || new Date().toISOString();
  
  data.medicalData.selfCheckRecords.unshift(record);
  return saveUserData(data);
}

// 获取自查记录
function getSelfCheckRecords() {
  return loadUserData().medicalData.selfCheckRecords;
}

// 添加医疗记录
function addMedicalRecord(record) {
  const data = loadUserData();
  record.id = record.id || Date.now();
  record.timestamp = record.timestamp || new Date().toISOString();
  
  data.medicalData.medicalRecords.unshift(record);
  return saveUserData(data);
}

// 获取医疗记录
function getMedicalRecords() {
  return loadUserData().medicalData.medicalRecords;
}

// === 偏好设置操作 ===

// 收藏文章
function addFavoriteArticle(article) {
  const data = loadUserData();
  
  // 检查是否已收藏
  const exists = data.preferences.favoriteArticles.some(
    item => item.id === article.id || item.url === article.url
  );
  
  if (!exists) {
    article.timestamp = article.timestamp || new Date().toISOString();
    data.preferences.favoriteArticles.unshift(article);
    return saveUserData(data);
  }
  
  return false; // 已存在
}

// 取消收藏文章
function removeFavoriteArticle(articleId) {
  const data = loadUserData();
  data.preferences.favoriteArticles = data.preferences.favoriteArticles.filter(
    item => item.id !== articleId
  );
  return saveUserData(data);
}

// 获取收藏文章
function getFavoriteArticles() {
  return loadUserData().preferences.favoriteArticles;
}

// 添加常用科室
function addCommonDepartment(department) {
  const data = loadUserData();
  
  // 检查是否已存在
  const exists = data.preferences.commonDepartments.some(
    item => item.id === department.id || item.name === department.name
  );
  
  if (!exists) {
    department.timestamp = department.timestamp || new Date().toISOString();
    department.count = department.count || 1;
    data.preferences.commonDepartments.unshift(department);
  } else {
    // 增加使用次数
    const existingDept = data.preferences.commonDepartments.find(
      item => item.id === department.id || item.name === department.name
    );
    if (existingDept) {
      existingDept.count = (existingDept.count || 0) + 1;
      existingDept.timestamp = new Date().toISOString();
    }
  }
  
  // 按使用次数排序
  data.preferences.commonDepartments.sort((a, b) => (b.count || 0) - (a.count || 0));
  
  return saveUserData(data);
}

// 获取常用科室
function getCommonDepartments() {
  return loadUserData().preferences.commonDepartments;
}


// === 设置操作 ===

// 更新通知设置
function updateNotificationSetting(enabled) {
  const data = loadUserData();
  data.settings.notificationEnabled = enabled;
  return saveUserData(data);
}

// 获取通知设置
function getNotificationSetting() {
  return loadUserData().settings.notificationEnabled;
}

// 更新主题设置
function updateTheme(theme) {
  const data = loadUserData();
  data.settings.theme = theme;
  return saveUserData(data);
}

// 获取主题设置
function getTheme() {
  return loadUserData().settings.theme;
}

// === 工具方法 ===

// 导出用户数据（用于备份）
function exportUserData() {
  return JSON.stringify(loadUserData(), null, 2);
}

// 导入用户数据（用于恢复）
function importUserData(jsonData) {
  try {
    const importedData = JSON.parse(jsonData);
    const mergedData = mergeWithDefault(importedData);
    return saveUserData(mergedData);
  } catch (error) {
    console.error('导入用户数据失败:', error);
    return false;
  }
}

// 清空用户数据（谨慎使用）
function clearUserData() {
  try {
    wx.removeStorageSync('userData');
    return true;
  } catch (error) {
    console.error('清空用户数据失败:', error);
    return false;
  }
}

// 获取数据统计信息
function getStatistics() {
  const data = loadUserData();
  return {
    aiDiagnosisCount: data.medicalData.aiDiagnosisHistory.length,
    selfCheckCount: data.medicalData.selfCheckRecords.length,
    medicalRecordCount: data.medicalData.medicalRecords.length,
    favoriteArticleCount: data.preferences.favoriteArticles.length,
    favoriteHospitalCount: data.preferences.favoriteHospitals.length,
    commonDepartmentCount: data.preferences.commonDepartments.length,
    watchedVideoCount: data.preferences.watchedVideos.length
  };
}

// 导出模块
module.exports = {
  loadUserData,
  saveUserData,
  mergeWithDefault,
  updateUserInfo,
  getUserInfo,
  addAiDiagnosisRecord,
  getAiDiagnosisHistory,
  addSelfCheckRecord,
  getSelfCheckRecords,
  addMedicalRecord,
  getMedicalRecords,
  addFavoriteArticle,
  removeFavoriteArticle,
  getFavoriteArticles,
  addCommonDepartment,
  getCommonDepartments,
  updateNotificationSetting,
  getNotificationSetting,
  updateTheme,
  getTheme,
  exportUserData,
  importUserData,
  clearUserData,
  getStatistics
};