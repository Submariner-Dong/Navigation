import imageConfig from '../../config/imageConfig.js';

Page({
  data: {
    imageList: [
      [
        'https://miniapp-navigation-1382838528.cos.ap-shanghai.myqcloud.com/image1-1.jpg', 
        'https://miniapp-navigation-1382838528.cos.ap-shanghai.myqcloud.com/image1-2.jpg',
        'https://miniapp-navigation-1382838528.cos.ap-shanghai.myqcloud.com/image1-3.jpg',
        'https://miniapp-navigation-1382838528.cos.ap-shanghai.myqcloud.com/image1-4.jpg', 
        'https://miniapp-navigation-1382838528.cos.ap-shanghai.myqcloud.com/image1-5.jpg',
        'https://miniapp-navigation-1382838528.cos.ap-shanghai.myqcloud.com/image1-6.jpg',
      ],
      [
        'https://miniapp-navigation-1382838528.cos.ap-shanghai.myqcloud.com/image2-1.jpg', 
        'https://miniapp-navigation-1382838528.cos.ap-shanghai.myqcloud.com/image2-2.jpg',
        'https://miniapp-navigation-1382838528.cos.ap-shanghai.myqcloud.com/image2-3.jpg',
        'https://miniapp-navigation-1382838528.cos.ap-shanghai.myqcloud.com/image2-4.jpg', 
        'https://miniapp-navigation-1382838528.cos.ap-shanghai.myqcloud.com/image2-5.jpg',
        'https://miniapp-navigation-1382838528.cos.ap-shanghai.myqcloud.com/image2-6.jpg',
      ],
      [
        'https://miniapp-navigation-1382838528.cos.ap-shanghai.myqcloud.com/image3-1.jpg', 
        'https://miniapp-navigation-1382838528.cos.ap-shanghai.myqcloud.com/image3-2.jpg',
        'https://miniapp-navigation-1382838528.cos.ap-shanghai.myqcloud.com/image3-3.jpg',
        'https://miniapp-navigation-1382838528.cos.ap-shanghai.myqcloud.com/image3-4.jpg', 
        'https://miniapp-navigation-1382838528.cos.ap-shanghai.myqcloud.com/image3-5.jpg',
        'https://miniapp-navigation-1382838528.cos.ap-shanghai.myqcloud.com/image3-6.jpg',
      ],
      [
        'https://miniapp-navigation-1382838528.cos.ap-shanghai.myqcloud.com/image4-1.jpg', 
        'https://miniapp-navigation-1382838528.cos.ap-shanghai.myqcloud.com/image4-2.jpg',
        'https://miniapp-navigation-1382838528.cos.ap-shanghai.myqcloud.com/image4-3.jpg',
        'https://miniapp-navigation-1382838528.cos.ap-shanghai.myqcloud.com/image4-4.jpg', 
        'https://miniapp-navigation-1382838528.cos.ap-shanghai.myqcloud.com/image4-5.jpg',
        'https://miniapp-navigation-1382838528.cos.ap-shanghai.myqcloud.com/image4-6.jpg',
      ],
    ],
    articles: [
      { id: 1, title: `"鼻"须知道\n——打败口呼吸小怪兽的魔法指南`, type: 'article' },
      { id: 2, title: `"口干"勿躁：糖尿病患者科学护口指南`, type: 'article' },
      { id: 3, title: '糖尿病人牙周健康科普手册', type: 'article' },
      { id: 4, title: '稳糖护黏，笑容常在\n——糖尿病患者口腔黏膜病指南', type: 'article' },
      {
        id: 6,
        title: "小隐裂，大隐患：隐裂牙自传",
        type: 'video',
        videoUrl: imageConfig.VIDEO_6_CRACKED_TOOTH
      },
      {
        id: 7,
        title: "趣味护牙，健康成长",
        type: 'video',
        videoUrl: imageConfig.VIDEO_7_CARE_FOR_TEETH
      },
      {
        id: 8,
        title: "探秘粉红王国——口腔小镇",
        type: 'video',
        videoUrl: imageConfig.VIDEO_8_ORAL_TOWN
      },
      {
        id: 9,
        title: "乳牙撞坏无所谓？绿茵场上要当心！",
        type: 'video',
        videoUrl: imageConfig.VIDEO_9_BABY_TOOTH
      },
      {
        id: 10,
        title: `"蛀牙"也爱吃甜食？牙齿保卫战大揭秘！`,
        type: 'video',
        videoUrl: imageConfig.VIDEO_10_CAVITY_FIGHT
      },
      {
        id: 11,
        title: `夜半三更"咔咔"声？解码夜间牙齿的"神秘运动会"`,
        type: 'video',
        videoUrl: imageConfig.VIDEO_11_NIGHT_GRINDING
      },
      {
        id: 12,
        title: "智齿，和智慧有关吗？",
        type: 'video',
        videoUrl: imageConfig.VIDEO_12_WISDOM_TOOTH
      },
      {
        id: 13,
        title: "地包天，天包地，错𬌗畸形要警惕",
        type: 'video',
        videoUrl: imageConfig.VIDEO_13_OCCLUSION
      },
      {
        id: 14,
        title: "口腔地毯（待定）",
        type: 'video',
        videoUrl: imageConfig.VIDEO_14_CARPET
      }
    ]
  },
  navigateToDetail: function(e) {
    const index = e.currentTarget.dataset.id;
    const article = this.data.articles[index];
    console.log('跳转详情:', article);

    wx.navigateTo({
      url: `/pkg-science/science/detail/detail?id=${article.id}&type=${article.type || 'article'}`
    });
  }
})