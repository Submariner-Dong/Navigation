Page({
  data: {
    longitude: 40,
    latitude: 39.915,
    markers: [
      {
        id: 1,
        longitude: 40,
        latitude: 39.915,
        name: "北京口腔医院",
        iconPath: "/images/marker.png"
      }
    ]
  },
  onLoad: function() {
    // 获取用户位置
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.setData({
          longitude: res.longitude,
          latitude: res.latitude
        });
      }
    });
  }
})