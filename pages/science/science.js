Page({
  data: {
    imageList: [
      'https://img.remit.ee/api/file/BQACAgUAAyEGAASHRsPbAAEDVCpo69970vksfU4zJUhhP9ZOZLsAAbAAAk4gAAIsvmFXaqVLndYsK7k2BA.jpg',
      'https://img.remit.ee/api/file/BQACAgUAAyEGAASHRsPbAAEDVCto69-Sim7ojfZYf-Mu9AR9t9vlSwACTyAAAiy-YVdLtb3I42vNqjYE.jpg',
      'https://img.remit.ee/api/file/BQACAgUAAyEGAASHRsPbAAEDVCxo69-W_K9tsccQTfa4qay430qbgwACUCAAAiy-YVdkVgP7EulQQzYE.jpg',
      'https://img.remit.ee/api/file/BQACAgUAAyEGAASHRsPbAAEDVC1o69-Z6puM9Fwmwn8Zl7ncm3E5qwACUSAAAiy-YVeHOy4IdRNjwDYE.jpg'
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