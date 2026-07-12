// 头像管理模块
const UserDataManager = require('./userDataManager.js');

class AvatarManager {
  // 获取默认用户头像
  static getDefaultUserAvatar() {
    return 'https://miniapp-navigation-1382838528.cos.ap-shanghai.myqcloud.com/user-avatar.png';
  }

  // 获取AI头像
  static getAIAvatar() {
    return 'https://miniapp-navigation-1382838528.cos.ap-shanghai.myqcloud.com/ai-avatar.png';
  }

  // 获取当前用户的头像
  static getUserAvatar() {
    try {
      // 尝试从用户数据中获取头像
      const userData = UserDataManager.loadUserData();
      if (userData && userData.userInfo && userData.userInfo.avatarUrl) {
        return userData.userInfo.avatarUrl;
      }
      
      // 如果用户没有设置头像，返回默认头像
      return this.getDefaultUserAvatar();
    } catch (error) {
      console.error('获取用户头像失败:', error);
      return this.getDefaultUserAvatar();
    }
  }

  // 设置用户头像
  static setUserAvatar(avatarUrl) {
    try {
      const userData = UserDataManager.loadUserData() || {};
      if (!userData.userInfo) {
        userData.userInfo = {};
      }
      userData.userInfo.avatarUrl = avatarUrl;
      UserDataManager.saveUserData(userData);
      return true;
    } catch (error) {
      console.error('设置用户头像失败:', error);
      return false;
    }
  }

  // 检查用户是否有自定义头像
  static hasCustomAvatar() {
    try {
      const userData = UserDataManager.loadUserData();
      return !!(userData && userData.userInfo && userData.userInfo.avatarUrl);
    } catch (error) {
      console.error('检查用户头像失败:', error);
      return false;
    }
  }

  // 重置为默认头像
  static resetToDefaultAvatar() {
    try {
      const userData = UserDataManager.loadUserData() || {};
      if (userData.userInfo) {
        delete userData.userInfo.avatarUrl;
      }
      UserDataManager.saveUserData(userData);
      return true;
    } catch (error) {
      console.error('重置用户头像失败:', error);
      return false;
    }
  }
}

module.exports = AvatarManager;