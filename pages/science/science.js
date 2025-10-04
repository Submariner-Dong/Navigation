Page({
  data: {
    imageList: [
      '/public/images/image-1.jpg',
      '/public/images/image-2.jpg',
      '/public/images/image-3.jpg',
      '/public/images/image-4.jpg'
    ],
    articles: [
      { id: 1, title: "图片1" },
      { id: 2, title: "图片2" },
      { id: 3, title: "图片3" },
      { id: 4, title: "图片4" }
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