Page({
  data: {
    longitude: 116.404, // 默认经度
    latitude: 39.915,   // 默认纬度
    markers: [],
    searchText: "",
    timer: null
  },
  onLoad: function() {
  console.log('当前经度:', this.data.longitude);
  console.log('当前纬度:', this.data.latitude);
    this.initAMap();
    this.mapCtx = wx.createMapContext('map');
    if (!this.mapCtx) {
      console.error('地图上下文初始化失败');
      return;
    }
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
    const amapFile = require('../../libs/amap-wx.130.js');
    this.amapPlugin = new amapFile.AMapWX({ key: '21785100aeae5f79be2a00ae97f333c0' });
  },
  getUserLocation: function() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.setData({
          longitude: res.longitude,
          latitude: res.latitude
        }, () => {
          this.updateMultiMarker();
        });
        this.fetchNearbyHospitals(res.longitude, res.latitude);
      },
      fail: (err) => {
        console.error('获取位置失败', err);
        this.setData({
          longitude: 116.404,
          latitude: 39.915
        });
      }
    });
  },
  updateMultiMarker: function() {
    if (!this.mapCtx || typeof this.mapCtx.updateMultiMarker !== 'function') {
      console.error('地图上下文或方法无效');
      return;
    }
    const { markers } = this.data;
    if (!markers || markers.some(marker => isNaN(marker.longitude) || isNaN(marker.latitude))) {
      console.error('标记点数据无效');
      return;
    }
    this.mapCtx.updateMultiMarker({ markers });
  },
  fetchNearbyHospitals: function(longitude, latitude) {
    this.amapPlugin.getPoiAround({
      location: `${longitude},${latitude}`,
      keywords: '口腔医院',
      radius: 5000, // 5公里范围
      success: (data) => {
        if (!data || !data.pois) {
          console.error('未获取到有效数据');
          return;
        }
        const validMarkers = data.pois.filter(poi => 
          poi.location && !isNaN(poi.location.lng) && !isNaN(poi.location.lat)
        ).map(poi => ({
          id: poi.id,
          longitude: poi.location.lng,
          latitude: poi.location.lat,
          title: poi.name
        }));
        this.setData({ markers: validMarkers }, () => {
          this.updateMultiMarker(); // 确保数据更新完成
        });
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