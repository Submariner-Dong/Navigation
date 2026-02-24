// 引入高德地图微信小程序SDK
const amapFile = require('../../libs/amap-wx.130.js');

// 同济大学附属口腔医院坐标（上海市静安区大宁路街道延长中路399号）
const TONGJI_HOSPITAL = {
  longitude: 121.453074,
  latitude: 31.270738,
  name: '同济大学附属口腔医院'
};

// 高德地图API密钥
const AMAP_API_KEY = '21785100aeae5f79be2a00ae97f333c0';

Page({
  data: {
    // 用户当前位置
    longitude: 0,
    latitude: 0,
    
    // 医院信息
    hospital: TONGJI_HOSPITAL,
    
    // 导航信息
    distance: 0,
    duration: 0,
    currentNavMethod: 'driving',
    
    // 各种导航方式的信息
    drivingInfo: { distance: 0, duration: 0 },
    transitInfo: { distance: 0, duration: 0 },
    walkingInfo: { distance: 0, duration: 0 },
    bicyclingInfo: { distance: 0, duration: 0 },
    
    // 是否显示步行和骑行选项
    showWalking: false,
    showBicycling: false,
    
    // 路线详情
    routeSteps: [],
    
    // 导航状态
    isNavigating: false,
    
    // 地图缩放级别和位置
    mapScale: 16,
    mapControls: true,
    
    // 当前导航步骤
    currentStep: 0,
    
    // 地图标记点
    markers: [],
    
    // 路线折线
    polyline: []
  },

  onLoad: function() {
    // 初始化高德地图SDK
    this.myAmapFun = new amapFile.AMapWX({key: AMAP_API_KEY});
    this.initMap();
    this.getUserLocation();
  },

  onUnload: function() {
    // 清除定时器
    if (this.data.timer) clearInterval(this.data.timer);
  },

  initMap: function() {
    this.mapCtx = wx.createMapContext('map');
    console.log('地图上下文初始化完成');
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
          console.log('更新地图位置成功');
          this.calculateRouteInfo();
        });
      },
      fail: (err) => {
        console.error('获取位置失败', err);
        // 使用默认位置（同济大学附近）
        this.setData({
          longitude: 121.5064,
          latitude: 31.2452
        });
        wx.showToast({
          title: '定位失败，使用默认位置',
          icon: 'none'
        });
        this.calculateRouteInfo();
      }
    });
  },

  // 计算各种导航方式的信息
  calculateRouteInfo: function() {
    const userLoc = { longitude: this.data.longitude, latitude: this.data.latitude };
    const hospitalLoc = this.data.hospital;
    
    // 计算距离（简化计算，实际应用中应该使用地图API）
    const distance = this.calculateDistance(userLoc, hospitalLoc);
    
    // 根据距离设置是否显示步行和骑行选项
    this.setData({
      showWalking: distance <= 5, // 5公里内显示步行
      showBicycling: distance <= 10 // 10公里内显示骑行
    });

    // 设置默认距离信息
    this.setData({
      distance: distance.toFixed(1),
      
      drivingInfo: {
        distance: distance.toFixed(1),
        duration: Math.round(distance * 3 + 10) // 默认计算
      },
      
      transitInfo: {
        distance: distance.toFixed(1),
        duration: Math.round(distance * 5 + 15) // 默认计算
      },
      
      walkingInfo: {
        distance: distance.toFixed(1),
        duration: Math.round(distance * 15) // 步行速度约4km/h
      },
      
      bicyclingInfo: {
        distance: distance.toFixed(1),
        duration: Math.round(distance * 6) // 骑行速度约10km/h
      }
    });

    // 调用高德地图API获取真实路线信息
    this.getAmapRouteInfo();
    
    // 更新当前选择的导航方式
    this.updateRouteDetails();
  },

  // 调用高德地图API获取路线信息
  getAmapRouteInfo: function() {
    const origin = `${this.data.longitude},${this.data.latitude}`;
    const destination = `${this.data.hospital.longitude},${this.data.hospital.latitude}`;
    
    // 获取驾车路线
    this.getAmapDrivingRoute(origin, destination);
    
    // 获取公交路线
    this.getAmapTransitRoute(origin, destination);
    
    // 获取步行路线
    if (this.data.showWalking) {
      this.getAmapWalkingRoute(origin, destination);
    }
    
    // 获取骑行路线
    if (this.data.showBicycling) {
      this.getAmapBicyclingRoute(origin, destination);
    }
  },

  // 获取高德驾车路线
  getAmapDrivingRoute: function(origin, destination) {
    this.myAmapFun.getDrivingRoute({
      origin: origin,
      destination: destination,
      success: (data) => {
        if (data.paths && data.paths.length > 0) {
          const path = data.paths[0];
          this.setData({
            'drivingInfo.distance': (path.distance / 1000).toFixed(1),
            'drivingInfo.duration': Math.round(path.duration / 60)
          });
        }
      },
      fail: (err) => {
        console.error('获取驾车路线失败', err);
      }
    });
  },

  // 获取高德公交路线
  getAmapTransitRoute: function(origin, destination) {
    this.myAmapFun.getTransitRoute({
      origin: origin,
      destination: destination,
      city: '上海',
      success: (data) => {
        console.log('公交路线数据:', data);
        if (data && data.transits && data.transits.length > 0) {
          const transit = data.transits[0];
          this.setData({
            'transitInfo.distance': (transit.distance / 1000).toFixed(1),
            'transitInfo.duration': Math.round(transit.duration / 60)
          });
        } else {
          console.warn('公交路线数据为空或格式错误', data);
          // 使用默认值
          this.setData({
            'transitInfo.distance': '0.0',
            'transitInfo.duration': 0
          });
        }
      },
      fail: (err) => {
        console.error('获取公交路线失败', err);
        // 使用默认值避免显示错误
        this.setData({
          'transitInfo.distance': '0.0',
          'transitInfo.duration': 0
        });
      }
    });
  },

  // 获取高德步行路线
  getAmapWalkingRoute: function(origin, destination) {
    this.myAmapFun.getWalkingRoute({
      origin: origin,
      destination: destination,
      success: (data) => {
        if (data.paths && data.paths.length > 0) {
          const path = data.paths[0];
          this.setData({
            'walkingInfo.distance': (path.distance / 1000).toFixed(1),
            'walkingInfo.duration': Math.round(path.duration / 60)
          });
        }
      },
      fail: (err) => {
        console.error('获取步行路线失败', err);
      }
    });
  },

  // 获取高德骑行路线
  getAmapBicyclingRoute: function(origin, destination) {
    this.myAmapFun.getRidingRoute({
      origin: origin,
      destination: destination,
      success: (data) => {
        console.log('骑行路线数据:', data);
        if (data && data.paths && data.paths.length > 0) {
          const path = data.paths[0];
          this.setData({
            'bicyclingInfo.distance': (path.distance / 1000).toFixed(1),
            'bicyclingInfo.duration': Math.round(path.duration / 60)
          });
        } else {
          console.warn('骑行路线数据为空或格式错误', data);
          // 使用默认值
          this.setData({
            'bicyclingInfo.distance': '0.0',
            'bicyclingInfo.duration': 0
          });
        }
      },
      fail: (err) => {
        console.error('获取骑行路线失败', err);
        // 使用默认值避免显示错误
        this.setData({
          'bicyclingInfo.distance': '0.0',
          'bicyclingInfo.duration': 0
        });
      }
    });
  },

  // 计算两点间距离（简化版，实际应用应该使用地图API）
  calculateDistance: function(loc1, loc2) {
    const R = 6371; // 地球半径（公里）
    const dLat = (loc2.latitude - loc1.latitude) * Math.PI / 180;
    const dLon = (loc2.longitude - loc1.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(loc1.latitude * Math.PI / 180) * Math.cos(loc2.latitude * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  },

  // 切换导航方式
  switchNavMethod: function(e) {
    const method = e.currentTarget.dataset.method;
    this.setData({
      currentNavMethod: method
    });
    this.updateRouteDetails();
  },

  // 更新路线详情
  updateRouteDetails: function() {
    const method = this.data.currentNavMethod;
    
    // 调用高德地图API获取真实路线详情
    this.getAmapRouteDetails(method);
  },

  // 获取高德地图路线详情
  getAmapRouteDetails: function(method) {
    const origin = `${this.data.longitude},${this.data.latitude}`;
    const destination = `${this.data.hospital.longitude},${this.data.hospital.latitude}`;
    
    // 根据导航方式选择不同的API
    switch(method) {
      case 'driving':
        this.myAmapFun.getDrivingRoute({
          origin: origin,
          destination: destination,
          strategy: '0', // 速度优先
          success: (data) => {
            if (data.paths && data.paths.length > 0) {
              const path = data.paths[0];
              this.parseRouteSteps(method, path);
            } else {
              this.showApiError();
            }
          },
          fail: (err) => {
            console.error('获取驾车路线详情失败', err);
            this.showApiError();
          }
        });
        break;
      case 'transit':
        this.myAmapFun.getTransitRoute({
          origin: origin,
          destination: destination,
          city: '上海',
          strategy: '0', // 最快捷
          success: (data) => {
            if (data && data.transits && data.transits.length > 0) {
              const transit = data.transits[0];
              this.parseRouteSteps(method, transit);
            } else {
              this.showApiError();
            }
          },
          fail: (err) => {
            console.error('获取公交路线详情失败', err);
            this.showApiError();
          }
        });
        break;
      case 'walking':
        this.myAmapFun.getWalkingRoute({
          origin: origin,
          destination: destination,
          success: (data) => {
            if (data.paths && data.paths.length > 0) {
              const path = data.paths[0];
              this.parseRouteSteps(method, path);
            } else {
              this.showApiError();
            }
          },
          fail: (err) => {
            console.error('获取步行路线详情失败', err);
            this.showApiError();
          }
        });
        break;
      case 'bicycling':
        this.myAmapFun.getRidingRoute({
          origin: origin,
          destination: destination,
          success: (data) => {
            if (data && data.paths && data.paths.length > 0) {
              const path = data.paths[0];
              this.parseRouteSteps(method, path);
            } else {
              this.showApiError();
            }
          },
          fail: (err) => {
            console.error('获取骑行路线详情失败', err);
            this.showApiError();
          }
        });
        break;
    }
  },

  // 解析路线步骤
  parseRouteSteps: function(method, path) {
    let steps = [];
    
    if (method === 'transit') {
      // 公交路线解析
      if (path.transits && path.transits.length > 0) {
        const transit = path.transits[0];
        steps = this.parseTransitSteps(transit);
      }
    } else {
      // 驾车、步行、骑行路线解析
      if (path.steps && path.steps.length > 0) {
        steps = this.parseDrivingSteps(path.steps);
      }
    }
    
    // 解析路线折线
    this.parseRoutePolyline(method, path);
    
    // 设置标记点
    this.setMarkers();
    
    if (steps.length === 0) {
      // 如果没有路线步骤，显示错误信息
      this.showApiError();
    } else {
      this.setData({
        routeSteps: steps
      });
    }
  },

  // 解析公交路线步骤
  parseTransitSteps: function(transit) {
    const steps = [];
    
    // 开始导航
    steps.push({
      icon: '📍',
      instruction: '从当前位置出发',
      distance: 0
    });
    
    // 步行到公交站
    if (transit.walking && transit.walking.departure_stop) {
      steps.push({
        icon: '🚶',
        instruction: `步行到${transit.walking.departure_stop.name}`,
        distance: Math.round(transit.walking.distance)
      });
    }
    
    // 公交线路
    if (transit.segments && transit.segments.length > 0) {
      transit.segments.forEach(segment => {
        if (segment.bus && segment.bus.buslines && segment.bus.buslines.length > 0) {
          const busline = segment.bus.buslines[0];
          steps.push({
            icon: '🚌',
            instruction: `乘坐${busline.name}到${busline.arrival_stop.name}`,
            distance: Math.round(busline.distance)
          });
        } else if (segment.railway && segment.railway.name) {
          // 地铁线路
          steps.push({
            icon: '🚇',
            instruction: `乘坐${segment.railway.name}到${segment.railway.arrival_stop.name}`,
            distance: Math.round(segment.railway.distance)
          });
        }
      });
    }
    
    // 步行到目的地
    if (transit.walking && transit.walking.arrival_stop) {
      steps.push({
        icon: '🚶',
        instruction: `步行到${transit.walking.arrival_stop.name}`,
        distance: Math.round(transit.walking.distance)
      });
    }
    
    // 到达目的地
    steps.push({
      icon: '🏥',
      instruction: '到达同济大学附属口腔医院',
      distance: 0
    });
    
    return steps;
  },

  // 解析驾车、步行、骑行路线步骤
  parseDrivingSteps: function(apiSteps) {
    const steps = [];
    
    // 开始导航
    steps.push({
      icon: '📍',
      instruction: '从当前位置出发',
      distance: 0
    });
    
    // 解析路线步骤
    apiSteps.forEach((step, index) => {
      let icon = '🛣️';
      let instruction = step.instruction;
      
      // 根据路线类型选择图标
      if (instruction.includes('左转') || instruction.includes('右转') || instruction.includes('转弯')) {
        icon = '🔄';
      } else if (instruction.includes('直行')) {
        icon = '⬆️';
      } else if (instruction.includes('掉头')) {
        icon = '↩️';
      }
      
      steps.push({
        icon: icon,
        instruction: instruction.replace(/<[^>]*>/g, ''), // 移除HTML标签
        distance: Math.round(step.distance)
      });
    });
    
    // 到达目的地
    steps.push({
      icon: '🏥',
      instruction: '到达同济大学附属口腔医院',
      distance: 0
    });
    
    return steps;
  },

  // 解析路线折线
  parseRoutePolyline: function(method, path) {
    let points = [];
    
    if (method === 'transit') {
      // 公交路线折线
      if (path.transits && path.transits[0] && path.transits[0].segments) {
        const segments = path.transits[0].segments;
        segments.forEach(segment => {
          if (segment.walking && segment.walking.polyline) {
            points = points.concat(this.parsePolylineString(segment.walking.polyline));
          }
          if (segment.bus && segment.bus.buslines && segment.bus.buslines[0] && segment.bus.buslines[0].polyline) {
            points = points.concat(this.parsePolylineString(segment.bus.buslines[0].polyline));
          }
          if (segment.railway && segment.railway.polyline) {
            points = points.concat(this.parsePolylineString(segment.railway.polyline));
          }
        });
      }
    } else {
      // 驾车、步行、骑行路线折线
      if (path.steps && path.steps.length > 0) {
        path.steps.forEach(step => {
          if (step.polyline) {
            points = points.concat(this.parsePolylineString(step.polyline));
          }
        });
      }
    }
    
    if (points.length > 0) {
      this.setData({
        polyline: [{
          points: points,
          color: '#0091ff',
          width: 6,
          arrowLine: true
        }]
      });
    }
  },

  // 解析折线字符串
  parsePolylineString: function(polyline) {
    const points = [];
    const coords = polyline.split(';');
    
    coords.forEach(coord => {
      const parts = coord.split(',');
      if (parts.length === 2) {
        points.push({
          longitude: parseFloat(parts[0]),
          latitude: parseFloat(parts[1])
        });
      }
    });
    
    return points;
  },

  // 设置标记点
  setMarkers: function() {
    // 使用微信小程序默认的标记点样式
    const markers = [
      {
        id: 0,
        latitude: this.data.latitude,
        longitude: this.data.longitude,
        // 使用默认标记点，不指定iconPath
        width: 20,
        height: 20,
        callout: {
          content: '当前位置',
          color: '#ffffff',
          bgColor: '#0091ff',
          padding: 5,
          borderRadius: 3,
          display: 'ALWAYS'
        }
      },
      {
        id: 1,
        latitude: this.data.hospital.latitude,
        longitude: this.data.hospital.longitude,
        // 使用默认标记点，不指定iconPath
        width: 25,
        height: 25,
        callout: {
          content: this.data.hospital.name,
          color: '#ffffff',
          bgColor: '#ff6b6b',
          padding: 5,
          borderRadius: 3,
          display: 'ALWAYS'
        }
      }
    ];
    
    this.setData({ markers });
  },

  // 显示API调用错误信息
  showApiError: function() {
    wx.showToast({
      title: '路线信息获取失败，请检查网络连接',
      icon: 'none',
      duration: 3000
    });
    
    // API调用失败时直接显示调用失败，不要有默认路线步骤
    this.setData({
      routeSteps: []
    });
  },

  // 开始导航
  startNavigation: function() {
    const method = this.data.currentNavMethod;
    const methodNames = {
      'driving': '驾车',
      'transit': '公共交通',
      'walking': '步行',
      'bicycling': '骑行'
    };

    wx.showModal({
      title: '开始导航',
      content: `确定开始${methodNames[method]}导航到同济大学附属口腔医院吗？`,
      success: (res) => {
        if (res.confirm) {
          // 在小程序内实现导航功能
          this.startInAppNavigation();
        }
      }
    });
  },

  // 在小程序内开始导航
  startInAppNavigation: function() {
    // 进入导航模式：地图放大，其他内容下移
    this.setData({
      isNavigating: true,
      mapScale: 18, // 放大地图
      currentStep: 0
    });

    // 设置地图显示路线
    this.mapCtx.moveToLocation({
      longitude: this.data.hospital.longitude,
      latitude: this.data.hospital.latitude
    });

    // 开始语音导航
    this.startVoiceNavigation();
  },

  // 开始语音导航
  startVoiceNavigation: function() {
    const steps = this.data.routeSteps;
    if (steps.length === 0) return;
    
    // 显示导航开始提示
    wx.showToast({
      title: '导航开始',
      icon: 'success'
    });
    
    // 播报第一个步骤
    this.voiceNavigateStep(0);
    
    // 监听位置变化
    this.startLocationWatch();
  },

  // 语音播报导航步骤
  voiceNavigateStep: function(stepIndex) {
    const steps = this.data.routeSteps;
    if (stepIndex >= steps.length) return;
    
    const step = steps[stepIndex];
    
    // 更新当前步骤
    this.setData({
      currentStep: stepIndex
    });
    
    // 语音播报
    this.speakNavigation(step.instruction);
    
    // 如果是最后一步，显示到达提示
    if (stepIndex === steps.length - 1) {
      setTimeout(() => {
        wx.showModal({
          title: '导航完成',
          content: '已到达同济大学附属口腔医院',
          showCancel: false
        });
      }, 2000);
    }
  },

  // 语音播报
  speakNavigation: function(text) {
    // 使用微信小程序的语音合成功能
    if (wx.createInnerAudioContext) {
      // 这里可以集成语音合成API
      // 由于微信小程序限制，可以使用文本显示代替语音
      wx.showToast({
        title: text,
        icon: 'none',
        duration: 3000
      });
    }
  },

  // 开始监听位置变化
  startLocationWatch: function() {
    this.locationWatchId = wx.onLocationChange((res) => {
      // 根据位置变化自动播报下一个步骤
      this.autoNavigateByLocation(res);
    });
    
    // 开始持续定位
    wx.startLocationUpdate({
      success: () => {
        console.log('开始持续定位');
      },
      fail: (err) => {
        console.error('持续定位失败', err);
        // 如果持续定位失败，使用手动导航
        this.startManualNavigation();
      }
    });
  },

  // 根据位置自动导航
  autoNavigateByLocation: function(location) {
    const currentStep = this.data.currentStep;
    const steps = this.data.routeSteps;
    
    if (currentStep >= steps.length - 1) return;
    
    // 计算当前位置与下一步的距离
    // 这里简化处理，实际应用中应该使用更精确的算法
    const nextStepDistance = steps[currentStep + 1].distance;
    
    // 如果距离接近下一步，自动播报
    if (nextStepDistance < 50) { // 50米内触发下一步
      this.voiceNavigateStep(currentStep + 1);
    }
  },

  // 手动导航（备用方案）
  startManualNavigation: function() {
    let currentStep = 0;
    const steps = this.data.routeSteps;
    
    this.manualNavigationInterval = setInterval(() => {
      if (currentStep < steps.length) {
        this.voiceNavigateStep(currentStep);
        currentStep++;
      } else {
        clearInterval(this.manualNavigationInterval);
      }
    }, 10000); // 每10秒播报一次
  },

  // 下一站导航
  nextStep: function() {
    const steps = this.data.routeSteps;
    let currentStep = this.data.currentStep;
    
    if (currentStep < steps.length) {
      this.setData({
        currentStep: currentStep + 1
      });
    } else {
      wx.showToast({
        title: '已到达目的地',
        icon: 'success',
        duration: 2000
      });
    }
  },

  // 停止导航
  stopNavigation: function() {
    // 清除定时器
    if (this.data.timer) clearInterval(this.data.timer);
    if (this.manualNavigationInterval) clearInterval(this.manualNavigationInterval);
    
    // 停止位置监听
    if (this.locationWatchId) {
      wx.offLocationChange(this.locationWatchId);
    }
    wx.stopLocationUpdate();
    
    // 清除路线数据
    this.setData({
      isNavigating: false,
      mapScale: 16,
      currentStep: 0,
      polyline: [],
      markers: []
    });
    
    wx.showToast({
      title: '导航已结束',
      icon: 'success',
      duration: 1500
    });
  },

  // 标记点点击事件
  onMarkerTap: function(e) {
    console.log('标记点被点击:', e);
  }
})