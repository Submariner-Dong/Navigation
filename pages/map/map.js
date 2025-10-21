var amapFile = require('../../libs/amap-wx.130');

Page({
  data: {
    longitude: 116.404, // 默认经度
    latitude: 39.915,   // 默认纬度
    markers: [],
    searchText: "",
    timer: null,
    aroundData: {}
  },
  onLoad: function() {
    console.log('当前经度:', this.data.longitude);
    console.log('当前纬度:', this.data.latitude);
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
    this.amapPlugin = new amapFile.AMapWX({ key: '21785100aeae5f79be2a00ae97f333c0' });
    console.log('高德地图插件初始化完成:', this.amapPlugin);
  },
  getUserLocation: function() {
    console.log('开始获取用户位置...');
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        console.log('获取位置成功:', res);
        this.setData({
          longitude: res.longitude,
          latitude: res.latitude
        }, () => {
          console.log('更新地图位置:', res.longitude, res.latitude);
          //this.updateMultiMarker();
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
    console.log('开始更新标记点...');
    if (!this.amapPlugin) {
      console.error('高德地图初始化失败', this.amapPlugin);
      wx.showToast({
        title: '地图初始化失败',
        icon: 'none'
      });
      return;
    }
    const { markers } = this.data.markers;
    console.log('当前标记点数据:', markers);
    if (!markers || markers.length === 0) {
      console.error('标记点数据为空');
      /*
      wx.showToast({
        title: '暂无标记点数据',
        icon: 'none'
      });
      */
      return;
    }
    // 确保每个标记点都有有效的经纬度
    const validMarkers = markers.filter(marker => {
      const isValid = marker.longitude !== undefined && 
                     marker.latitude !== undefined &&
                     !isNaN(marker.longitude) && 
                     !isNaN(marker.latitude);
      if (!isValid) {
        console.warn('无效标记点:', marker);
      }
      return isValid;
    });
    console.log('有效标记点数据:', validMarkers);
    if (validMarkers.length === 0) {
      console.error('标记点数据无效', markers);
      wx.showToast({
        title: '标记点数据无效',
        icon: 'none'
      });
      return;
    }
    try {
      console.log('调用 updateMultiMarker 方法...');
      this.mapCtx.updateMultiMarker({ markers: validMarkers });
      console.log('标记点更新成功');
    } catch (error) {
      console.error('更新标记点失败', error);
      wx.showToast({
        title: '地图更新失败',
        icon: 'none'
      });
    }
  },
  fetchNearbyHospitals: function(longitude, latitude) {
    console.log('开始获取附近医院数据...', longitude, latitude);
    this.amapPlugin.getPoiAround({
      location: `${longitude},${latitude}`,
      querykeywords: '口腔医院',
      querytypes:'医院',
      radius: 5000, // 5公里范围
      success: (data) => {
        console.log('获取医院数据成功:', data);
        if (!data || !data.poisData) {
          console.error('未获取到有效数据', data);
          wx.showToast({
            title: '未获取到有效数据',
            icon: 'none'
          });
          return;
        }
        // 严格校验数据格式
        const validMarkers = data.markers;
          
        console.log('过滤后的标记点数据:', validMarkers);
        if (validMarkers.length === 0) {
          console.error('过滤后的标记点数据为空');
          wx.showToast({
            title: '未找到附近医院',
            icon: 'none'
          });
          return;
        }
        this.setData({ markers: validMarkers }, () => {
          console.log('标记点数据已更新:', validMarkers);
          this.updateMultiMarker();
        });
      },
      fail: (err) => {
        console.error('获取医院数据失败', err);
        wx.showToast({
          title: '获取数据失败',
          icon: 'none'
        });
      }
    });
  },
  onInput: function(e) {
    const keywords = e.detail.value;
    this.setData({ searchText: keywords });
    if (keywords.trim()) {
      this.amapPlugin.getInputtips({
        keywords: keywords,
        location: `${this.data.longitude},${this.data.latitude}`,
        success: (data) => {
          if (data && data.tips) {
            this.setData({ tips: data.tips });
          }
        },
        fail: (err) => {
          console.error('获取输入提示失败', err);
        }
      });
    } else {
      this.setData({ tips: [] });
    }
  },
  onInputButtonTap: function(e) {
    const tipIndex = e.currentTarget.dataset.tipIndex;
    console.log('点击的提示信息索引:', tipIndex);
    const tip = this.data.tips[tipIndex];
    console.log('找到的提示信息:', tip);
    if (!tip) {
      wx.showToast({
        title: '未找到提示信息',
        icon: 'none'
      });
      return;
    }
    const location = tip.location.split(',');
    wx.openLocation({
      latitude: parseFloat(location[1]),
      longitude: parseFloat(location[0]),
      name: tip.name,
      address: tip.district + tip.address
    });
  },

  onSearch: function(e) {
    const keywords = e.target.dataset.keywords || this.data.searchText;
    const { longitude, latitude } = this.data;
    if (!keywords.trim()) {
      this.fetchNearbyHospitals(longitude, latitude);
      return;
    }
    this.amapPlugin.getPoiAround({
      location: `${longitude},${latitude}`,
      keywords: keywords,
      radius: 5000,
      success: (data) => {
        if (!data || !data.poisData) {
          console.error('未获取到有效数据', data);
          /*
          wx.showToast({
            title: '未找到相关医院',
            icon: 'none'
          });
          */
          return;
        }
        const markers = data.poisData
          .filter(poi => {
            const isValid = !isNaN(poi.longitude) && !isNaN(poi.latitude);
            return isValid;
          })
          .map((poi, index) => ({
            id: index,
            longitude: parseFloat(poi.longitude),
            latitude: parseFloat(poi.latitude),
            name: poi.name,
            address: poi.address,
            width: 30,
            height: 30
          }));
        
        if (markers.length === 0) {
          console.error('过滤后的标记点数据为空');
          /*
          wx.showToast({
            title: '未找到相关医院',
            icon: 'none'
          });
          */
          return;
        }
        this.setData({ markers, tips: [] });
      },
      fail: (err) => {
        console.error('搜索医院失败', err);
        wx.showToast({
          title: '搜索失败，请重试',
          icon: 'none'
        });
      }
    });
  },
  onMarkerTap: function(e) {
    const markerId = e.markerId;
    const marker = this.data.markers.find(m => m.id === markerId);
    /*
    if (!marker) {
      wx.showToast({
        title: '未找到标记信息',
        icon: 'none'
      });
      return;
    }
      */
    this.setData({ selectedMarker: marker });
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
  },

  onTextButtonTap: function(e) {
    const markerId = e.currentTarget.dataset.markerId;
    console.log('点击的标记点 ID:', markerId);
    const marker = this.data.markers.find(m => m.id === markerId);
    console.log('找到的标记点:', marker);
    if (!marker) {
      wx.showToast({
        title: '未找到标记信息',
        icon: 'none'
      });
      return;
    }
    wx.openLocation({
      latitude: marker.latitude,
      longitude: marker.longitude,
      name: marker.name,
      address: marker.address
    });
  },

  // 新增搜索功能
  searchHospitals: function(keyword, city = '', cityLimit = false, location = '') {
    console.log('开始搜索医疗机构...', keyword);
    this.amapPlugin.getInputtips({
      keywords: keyword,
      type: '医院',
      city: city,
      citylimit: cityLimit,
      location: location,
      success: (data) => {
        console.log('搜索医疗机构成功:', data);
        if (!data || !data.tips) {
          console.error('未获取到有效数据', data);
          wx.showToast({
            title: '未找到相关医疗机构',
            icon: 'none'
          });
          return;
        }
        // 解析提示词数据
        const validMarkers = data.tips
          .filter(tip => tip.location && tip.location.split(',').length === 2)
          .map(tip => {
            const [longitude, latitude] = tip.location.split(',').map(Number);
            return {
              id: tip.id,
              longitude: longitude,
              latitude: latitude,
              title: tip.name,
              // iconPath: '/assets/marker.png',
              width: 30,
              height: 30
            };
          });
        console.log('过滤后的标记点数据:', validMarkers);
        if (validMarkers.length === 0) {
          console.error('过滤后的标记点数据为空');
          wx.showToast({
            title: '未找到相关医疗机构',
            icon: 'none'
          });
          return;
        }
        this.setData({ markers: validMarkers }, () => {
          console.log('标记点数据已更新:', validMarkers);
          this.updateMultiMarker();
        });
      },
      fail: (err) => {
        console.error('搜索医疗机构失败', err);
        wx.showToast({
          title: '搜索失败',
          icon: 'none'
        });
      }
    });
  }
})