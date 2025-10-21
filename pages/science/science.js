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
      { id: 1, title: "“鼻”须知道\n——打败口呼吸小怪兽的魔法指南" },
      { id: 2, title: "“口干”勿躁：糖尿病患者科学护口指南" },
      { id: 3, title: "糖尿病人牙周健康科普手册" },
      { id: 4, title: "稳糖护黏，笑容常在\n——糖尿病患者口腔黏膜病指南" }
    ]
  },
  navigateToDetail: function(e) {
    const id = e.currentTarget.dataset.id;
    console.log(id);
    wx.navigateTo({
      url: `/pages/science/detail/detail?id=${id}`
    });
  }
})