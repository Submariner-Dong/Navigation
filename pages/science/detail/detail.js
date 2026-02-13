const UserDataManager = require('../../userDataManager.js');

Page({
  data: {
    id: '',
    imageUrl: '',
    isFavorite: false
  },
  onLoad: function(option) {
    const id = option.id || '1';
    console.log(id);
    this.setData({
      id: id,
      imageUrl: this.getImageUrl(id)
    });
    
    // 检查是否已收藏
    this.checkFavoriteStatus(id);
  },

  getImageUrl: function(id) {
    const imageBaseUrl = 'https://miniapp-navigation-1382838528.cos.ap-shanghai.myqcloud.com/image-';
    return `${imageBaseUrl}${parseInt(id)+1}.jpg`;
  },

  goBack: function() {
    wx.navigateBack();
  },
  
  // 检查收藏状态
  checkFavoriteStatus: function(id) {
    const favoriteArticles = UserDataManager.getFavoriteArticles();
    const isFavorite = favoriteArticles.some(article => article.id === parseInt(id));
    this.setData({ isFavorite });
  },
  
  // 切换收藏状态
  toggleFavorite: function() {
    const { id, isFavorite } = this.data;
    const articleInfo = {
      id: parseInt(id),
      title: this.getArticleTitle(id),
      imageUrl: this.getImageUrl(id),
      type: '科普文章'
    };
    
    if (isFavorite) {
      // 取消收藏
      UserDataManager.removeFavoriteArticle(parseInt(id));
      this.setData({ isFavorite: false });
      wx.showToast({
        title: '已取消收藏',
        icon: 'success',
        duration: 1000
      });
    } else {
      // 添加收藏
      UserDataManager.addFavoriteArticle(articleInfo);
      this.setData({ isFavorite: true });
      wx.showToast({
        title: '收藏成功',
        icon: 'success',
        duration: 1000
      });
    }
  },
  
  // 获取文章标题
  getArticleTitle: function(id) {
    const titles = {
      1: "“鼻”须知道——打败口呼吸小怪兽的魔法指南",
      2: "“口干”勿躁：糖尿病患者科学护口指南",
      3: "糖尿病人牙周健康科普手册",
      4: "稳糖护黏，笑容常在——糖尿病患者口腔黏膜病指南"
    };
    return titles[id] || "科普文章";
  }
})