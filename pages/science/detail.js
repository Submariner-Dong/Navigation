Page({
  data: {
    imageUrl: ''
  },
  onLoad: function(options) {
    this.setData({
      imageUrl: options.imageUrl
    });
  },
  goBack: function() {
    wx.navigateBack();
  }
})