Page({
  data: {
    longitude: 0,
    latitude: 0,
    markers: [],
    searchText: "",
    timer: null
  },
  onLoad: function() {
    this.initAMap();
    this.getUserLocation();
    // 每30秒更新一次位置
    this.data.timer = setInterval(() => {
      this.getUserLocation();
    }, 30000);
  },
  onUnload: function() {
    // 清除定时器
    if (this.data.timer) clearInterval(this.data.timer);
  },
  initAMap: function() {
    // 引入高德地图SDK
    const amapFile = require('../../libs/amap-wx.js');
    this.amapPlugin = new amapFile.AMapWX({ key: '21785100aeae5f79be2a00ae97f333c0' });
  },
  getUserLocation: function() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.setData({
          longitude: res.longitude,
          latitude: res.latitude
        });
        this.fetchNearbyHospitals(res.longitude, res.latitude);
      },
      fail: (err) => {
        console.error('获取位置失败', err);
      }
    });
  },
  fetchNearbyHospitals: function(longitude, latitude) {
    this.amapPlugin.getPoiAround({
      location: `${longitude},${latitude}`,
      keywords: '口腔医院',
      radius: 5000, // 5公里范围
      success: (data) => {
        const markers = data.poisData.map((poi, index) => ({
          id: index,
          longitude: poi.longitude,
          latitude: poi.latitude,
          name: poi.name,
          address: poi.address,
          width: 30,
          height: 30
        }));
        this.setData({ markers });
      },
      fail: (err) => {
        console.error('获取医院数据失败', err);
      }
    });
  },
  onInput: function(e) {
    this.setData({ searchText: e.detail.value });
  },
  onSearch: function() {
    const { searchText, longitude, latitude } = this.data;
    if (!searchText.trim()) {
      this.fetchNearbyHospitals(longitude, latitude);
      return;
    }
    this.amapPlugin.getPoiAround({
      location: `${longitude},${latitude}`,
      keywords: searchText,
      radius: 5000,
      success: (data) => {
        const markers = data.poisData.map((poi, index) => ({
          id: index,
          longitude: poi.longitude,
          latitude: poi.latitude,
          name: poi.name,
          address: poi.address,
          width: 30,
          height: 30
        }));
        this.setData({ markers });
      },
      fail: (err) => {
        console.error('搜索医院失败', err);
      }
    });
  },
  onMarkerTap: function(e) {
    const markerId = e.markerId;
    const marker = this.data.markers.find(m => m.id === markerId);
    wx.showActionSheet({
      itemList: ["导航到" + marker.name],
      success: (res) => {
        if (res.tapIndex === 0) {
          wx.openLocation({
            latitude: marker.latitude,
            longitude: marker.longitude,
            name: marker.name,
            address: marker.address
          });
        }
      }
    });
  }
})