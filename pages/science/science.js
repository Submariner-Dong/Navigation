Page({
  data: {
    imageList: [
      '/public/images/image-1.jpg',
      '/public/images/image-2.jpg',
      '/public/images/image-3.jpg',
      '/public/images/image-4.jpg'
    ],
    articles: [
      { id: 1, title: "“鼻”须知道\n——打败口呼吸小怪兽的魔法指南" },
      { id: 2, title: "“口干”勿躁：糖尿病患者科学护口指南" },
      { id: 3, title: "糖尿病人牙周健康科普手册" },
      { id: 4, title: "图稳糖护黏，笑容常在\n——糖尿病患者口腔黏膜病指南" }
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