Page({
  data: {
    id: '',
    imageUrl: ''
  },
  onLoad: function(option) {
    const id = option.id || '1';
    console.log(id);
    this.setData({
      id: id,
      imageUrl: this.getImageUrl(id)
    });
  },

  getImageUrl: function(id) {
    const imageBaseUrl = 'https://miniapp-navigation-1382838528.cos.ap-shanghai.myqcloud.com/image-';
    return `${imageBaseUrl}${parseInt(id)+1}.jpg`;
  },

  goBack: function() {
    wx.navigateBack();
  }
})