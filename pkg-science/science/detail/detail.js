const UserDataManager = require('../../utils/userDataManager.js');
const imageConfig = require('../../config/imageConfig.js');

// 视频资源映射表（按 id → imageConfig key）
const VIDEO_MAP = {
  // 暂时隐藏: 5: imageConfig.VIDEO_5_DENTAL_IMPLANT,
  6: imageConfig.VIDEO_6_CRACKED_TOOTH,
  7: imageConfig.VIDEO_7_CARE_FOR_TEETH,
  8: imageConfig.VIDEO_8_ORAL_TOWN,
  9: imageConfig.VIDEO_9_BABY_TOOTH,
  10: imageConfig.VIDEO_10_CAVITY_FIGHT,
  11: imageConfig.VIDEO_11_NIGHT_GRINDING,
  12: imageConfig.VIDEO_12_WISDOM_TOOTH,
  13: imageConfig.VIDEO_13_OCCLUSION,
  14: imageConfig.VIDEO_14_CARPET
};

Page({
  data: {
    id: '',
    type: 'article',        // 'article' | 'video'
    imageUrl: '',
    videoUrl: '',
    isFavorite: false
  },
  onLoad: function(option) {
    // ========== 调试代码开始 ==========
    console.log('=== detail.js (science/detail) 模块加载调试 ===');
    console.log('1. UserDataManager 对象:', UserDataManager);
    console.log('2. UserDataManager 类型:', typeof UserDataManager);
    
    console.log('3. imageConfig 对象:', imageConfig);
    console.log('4. imageConfig 类型:', typeof imageConfig);
    console.log('5. imageConfig 包含的属性数量:', Object.keys(imageConfig).length);
    
    if (imageConfig && imageConfig.VIDEO_6_CRACKED_TOOTH) {
      console.log('6. ✅ imageConfig 加载成功');
      console.log('7. 测试视频URL:', imageConfig.VIDEO_6_CRACKED_TOOTH);
    } else {
      console.error('❌ imageConfig 加载失败或缺少预期属性');
    }
    console.log('=== 调试代码结束 ===\n');
    // ========== 调试代码结束 ==========
    
    const id = option.id || '1';
    const type = option.type || 'article';
    console.log('详情页加载, id:', id, ', type:', type);

    const data = { id, type };

    if (type === 'video') {
      // 视频类型：加载视频URL
      data.videoUrl = VIDEO_MAP[id] || '';
      data.imageUrl = '';
    } else {
      // 文章类型：加载图片URL
      data.imageUrl = this.getImageUrl(id);
      data.videoUrl = '';
    }

    this.setData(data);

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
      videoUrl: VIDEO_MAP[parsedId] || '',
      type: this.data.type === 'video' ? '科普视频' : '科普文章'
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
  
  // 获取文章/视频标题
  getArticleTitle: function(id) {
    const titles = {
      0: `鼻须知道——打败口呼吸小怪兽的魔法指南`,
      1: `口干勿躁：糖尿病患者科学护口指南`,
      2: '糖尿病人牙周健康科普手册',
      3: '稳糖护黏，笑容常在——糖尿病患者口腔黏膜病指南',
      // 暂时隐藏: 5: '即拔即种即吃饭：今天拔牙今天种牙今天吃饭，真的是最佳方案吗？',
      6: '小隐裂，大隐患：隐裂牙自传',
      7: '趣味护牙，健康成长',
      8: '探秘粉红王国——口腔小镇',
      9: '乳牙撞坏无所谓？绿茵场上要当心！',
      10: `"蛀牙"也爱吃甜食？牙齿保卫战大揭秘！`,
      11: `夜半三更"咔咔"声？解码夜间牙齿的"神秘运动会"`,
      12: '智齿，和智慧有关吗？',
      13: '地包天，天包地，错𬌗畸形要警惕',
      14: '嘴里疼的不止牙'
    };

    return titles[parseInt(id)] || "科普内容";
  }
})