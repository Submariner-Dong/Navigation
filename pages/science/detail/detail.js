const UserDataManager = require('../../../utils/userDataManager.js');

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
    const imageNumber = parseInt(id) + 1; // ID从0开始，图片从1开始
    console.log('生成图片URL，文章ID:', id, '图片编号:', imageNumber);
    return `${imageBaseUrl}${imageNumber}.jpg`;
  },

  goBack: function() {
    wx.navigateBack();
  },
  
  // 检查收藏状态
  checkFavoriteStatus: function(id) {
    console.log('=== 检查收藏状态 ===');
    //console.log('文章ID:', id);
    
    const favoriteArticles = UserDataManager.getFavoriteArticles();
    console.log('当前收藏文章总数:', favoriteArticles.length);
    console.log('收藏文章列表:', favoriteArticles);
    
    const isFavorite = favoriteArticles.some(article => article.id === parseInt(id));
    console.log('是否已收藏:', isFavorite);
    
    this.setData({ isFavorite });
    console.log('=== 收藏状态检查完成 ===');
  },
  
  // 切换收藏状态
  toggleFavorite: function() {
    console.log('=== 切换收藏状态 ===');
    const { id, isFavorite } = this.data;
    
    console.log('当前文章ID:', id, '类型:', typeof id);
    console.log('当前收藏状态:', isFavorite);
    
    const parsedId = parseInt(id);
    console.log('解析后的文章ID:', parsedId);
    
    const articleInfo = {
      id: parsedId,
      title: this.getArticleTitle(id),
      imageUrl: this.getImageUrl(id),
      type: '科普文章'
    };
    
    console.log('准备操作的收藏文章信息:', articleInfo);
    
    // 先检查当前收藏状态（双重确认）
    const currentFavoritesBefore = UserDataManager.getFavoriteArticles();
    //console.log('操作前收藏文章总数:', currentFavoritesBefore.length);
    //console.log('操作前收藏文章列表:', currentFavoritesBefore);
    
    const isAlreadyFavorite = currentFavoritesBefore.some(article => article.id === parsedId);
    //console.log('双重检查是否已收藏:', isAlreadyFavorite);
    
    if (isFavorite || isAlreadyFavorite) {
      // 取消收藏
      console.log('执行取消收藏操作');
      UserDataManager.removeFavoriteArticle(parsedId);
      this.setData({ isFavorite: false });
      
      // 检查取消收藏后的状态
      const currentFavorites = UserDataManager.getFavoriteArticles();
      console.log('取消收藏后，当前收藏文章总数:', currentFavorites.length);
      console.log('取消收藏后，收藏文章列表:', currentFavorites);
      
      wx.showToast({
        title: '已取消收藏',
        icon: 'success',
        duration: 1000
      });
    } else {
      // 添加收藏
      console.log('执行添加收藏操作');
      const result = UserDataManager.addFavoriteArticle(articleInfo);
      console.log('添加收藏操作结果:', result);
      
      this.setData({ isFavorite: true });
      
      // 检查添加收藏后的状态
      const currentFavorites = UserDataManager.getFavoriteArticles();
      console.log('添加收藏后，当前收藏文章总数:', currentFavorites.length);
      console.log('添加收藏后，收藏文章列表:', currentFavorites);
      
      wx.showToast({
        title: '收藏成功',
        icon: 'success',
        duration: 1000
      });
    }
    
    console.log('=== 收藏状态切换完成 ===');
  },
  
  // 获取文章标题
  getArticleTitle: function(id) {
    //console.log('=== 获取文章标题 ===');
    //console.log('传入的文章ID:', id, '类型:', typeof id);
    
    const titles = {
      0: "鼻须知道——打败口呼吸小怪兽的魔法指南",
      1: "口干勿躁：糖尿病患者科学护口指南",
      2: "糖尿病人牙周健康科普手册",
      3: "稳糖护黏，笑容常在——糖尿病患者口腔黏膜病指南"
    };
    
    const parsedId = parseInt(id);
    //console.log('解析后的文章ID:', parsedId);
    //console.log('可用的标题映射:', titles);
    
    const title = titles[parsedId] || "科普文章";
    //console.log('获取到的标题:', title);
    //console.log('=== 标题获取完成 ===');
    
    return title;
  }
})