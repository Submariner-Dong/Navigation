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
    
    // 公交路线列表
    transitRoutes: [],
    // 当前选择的公交路线索引
    selectedTransitIndex: 0,
    
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
    
    // 总是显示步行和骑行选项
    this.setData({
      showWalking: true, // 总是显示步行选项
      showBicycling: true // 总是显示骑行选项
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
            'drivingInfo.duration': Math.round(path.duration / 60),
            // 同时更新顶部的距离和时间信息，使用驾车导航的数据
            distance: (path.distance / 1000).toFixed(1),
            duration: Math.round(path.duration / 60)
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
          // 保存所有公交路线
          const transitRoutes = data.transits.map((transit, index) => {
            return {
              index: index,
              distance: (transit.distance / 1000).toFixed(1),
              duration: Math.round(transit.duration / 60),
              cost: transit.cost || '0',
              segments: transit.segments || [],
              walkingDistance: transit.walking_distance || '0'
            };
          });
          
          // 设置第一条路线为默认
          const defaultTransit = data.transits[0];
          this.setData({
            'transitInfo.distance': (defaultTransit.distance / 1000).toFixed(1),
            'transitInfo.duration': Math.round(defaultTransit.duration / 60),
            transitRoutes: transitRoutes
          });
        } else {
          console.warn('公交路线数据为空或格式错误', data);
          // 不立即显示提示，只在用户点击公交路线时显示
          // 使用默认值
          this.setData({
            'transitInfo.distance': '0.0',
            'transitInfo.duration': 0,
            transitRoutes: []
          });
        }
      },
      fail: (err) => {
        console.error('获取公交路线失败', err);
        // 显示错误信息，保持与其他导航方式一致
        this.showApiError();
        // 使用默认值
        this.setData({
          'transitInfo.distance': '0.0',
          'transitInfo.duration': 0,
          transitRoutes: []
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
          // 使用默认值，不显示错误
          this.setData({
            'bicyclingInfo.distance': '0.0',
            'bicyclingInfo.duration': 0
          });
        }
      },
      fail: (err) => {
        console.error('获取骑行路线失败', err);
        // 使用默认值，不显示错误信息
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
    
    if (method === 'transit') {
      // 如果是公共交通，检查是否有可用路线
      if (this.data.transitRoutes && this.data.transitRoutes.length > 1) {
        this.showTransitRouteSelection();
      } else if (this.data.transitRoutes && this.data.transitRoutes.length === 0) {
        // 如果没有公交路线数据，显示提示信息
        wx.showToast({
          title: '无公交信息，请选择其他出行方式',
          icon: 'none',
          duration: 2000
        });
        return; // 不切换导航方式
      } else {
        // 只有一条路线，直接切换并显示详情
        this.setData({
          currentNavMethod: method
        });
        this.updateRouteDetails();
        
        // 如果还没有路线数据，重新获取
        if (!this.data.transitRoutes || this.data.transitRoutes.length === 0) {
          this.getAmapRouteInfo();
        }
      }
    } else {
      this.setData({
        currentNavMethod: method
      });
      this.updateRouteDetails();
    }
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
              // 获取用户选择的路线，默认第一条
              const selectedIndex = this.data.selectedTransitIndex || 0;
              const transit = data.transits[selectedIndex];
              
              // 更新路线信息显示
              this.setData({
                'transitInfo.distance': (transit.distance / 1000).toFixed(1),
                'transitInfo.duration': Math.round(transit.duration / 60)
              });
              
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
              // 骑行路线使用rides而不是steps
              this.parseBicyclingSteps(path);
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
      // 公交路线解析 - path参数已经是单个transit对象
      steps = this.parseTransitSteps(path);
    } else {
      // 驾车、步行路线解析
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
    
    // 清除其他导航方式的路线
    this.clearOtherRoutePolylines(method);
  },

  // 解析骑行路线步骤
  parseBicyclingSteps: function(path) {
    const steps = [];
    
    // 开始导航
    steps.push({
      icon: '📍',
      instruction: '从当前位置出发',
      distance: 0
    });
    
    // 骑行路线使用rides数组
    if (path.rides && path.rides.length > 0) {
      path.rides.forEach((ride, index) => {
        let icon = '🚲';
        let instruction = ride.instruction;
        
        // 根据骑行动作选择图标
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
          distance: Math.round(ride.distance)
        });
      });
    }
    
    // 到达目的地
    steps.push({
      icon: '🏥',
      instruction: '到达同济大学附属口腔医院',
      distance: 0
    });
    
    // 解析骑行路线折线
    this.parseBicyclingPolyline(path);
    
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
    
    // 清除其他导航方式的路线
    this.clearOtherRoutePolylines('bicycling');
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
    
    // 解析segments数组
    if (transit.segments && transit.segments.length > 0) {
      transit.segments.forEach((segment, index) => {
        // 每个segment包含步行和交通工具信息
        
        // 步行部分 - 显示具体步行路径
        if (segment.walking && segment.walking.distance > 0) {
          // 如果有步行步骤，显示详细步行路径
          if (segment.walking.steps && segment.walking.steps.length > 0) {
            segment.walking.steps.forEach((walkStep) => {
              steps.push({
                icon: '🚶',
                instruction: walkStep.instruction || `步行${Math.round(walkStep.distance)}米`,
                distance: Math.round(walkStep.distance)
              });
            });
          } else {
            // 没有详细步骤，显示总体步行信息
            steps.push({
              icon: '🚶',
              instruction: `步行${Math.round(segment.walking.distance)}米到公交站`,
              distance: Math.round(segment.walking.distance)
            });
          }
        }
        
        // 公交部分
        if (segment.bus && segment.bus.buslines && segment.bus.buslines.length > 0) {
          const busline = segment.bus.buslines[0];
          steps.push({
            icon: '🚌',
            instruction: `乘坐${busline.name}，${Math.round(busline.via_num || 0)}站`,
            distance: Math.round(busline.distance)
          });
        }
        
        // 地铁部分
        if (segment.railway && segment.railway.name) {
          steps.push({
            icon: '🚇',
            instruction: `乘坐${segment.railway.name}`,
            distance: Math.round(segment.railway.distance)
          });
        }
        
        // 出入口信息
        if (segment.entrance && segment.entrance.name) {
          steps.push({
            icon: '🚪',
            instruction: `从${segment.entrance.name}进入`,
            distance: 0
          });
        }
        
        if (segment.exit && segment.exit.name) {
          steps.push({
            icon: '🚪',
            instruction: `从${segment.exit.name}出站`,
            distance: 0
          });
        }
        
        // 最后一段步行（从公交站到医院）
        if (index === transit.segments.length - 1 && segment.walking && segment.walking.distance > 0) {
          steps.push({
            icon: '🚶',
            instruction: `步行${Math.round(segment.walking.distance)}米到医院`,
            distance: Math.round(segment.walking.distance)
          });
        }
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
      // 公交路线折线 - 显示完整的步行和公交路线
      if (path.segments && path.segments.length > 0) {
        const segments = path.segments;
        segments.forEach(segment => {
          // 步行部分 - 显示所有步行路径
          if (segment.walking && segment.walking.polyline) {
            points = points.concat(this.parsePolylineString(segment.walking.polyline));
          }
          
          // 如果有步行步骤，显示详细步行路径
          if (segment.walking && segment.walking.steps && segment.walking.steps.length > 0) {
            segment.walking.steps.forEach(walkStep => {
              if (walkStep.polyline) {
                points = points.concat(this.parsePolylineString(walkStep.polyline));
              }
            });
          }
          
          // 公交部分
          if (segment.bus && segment.bus.buslines && segment.bus.buslines[0] && segment.bus.buslines[0].polyline) {
            points = points.concat(this.parsePolylineString(segment.bus.buslines[0].polyline));
          }
          
          // 地铁部分
          if (segment.railway && segment.railway.polyline) {
            points = points.concat(this.parsePolylineString(segment.railway.polyline));
          }
        });
      }
    } else {
      // 驾车、步行路线折线
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

  // 解析骑行路线折线
  parseBicyclingPolyline: function(path) {
    let points = [];
    
    // 骑行路线使用rides数组
    if (path.rides && path.rides.length > 0) {
      path.rides.forEach(ride => {
        if (ride.polyline) {
          points = points.concat(this.parsePolylineString(ride.polyline));
        }
      });
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

  // 清除其他导航方式的路线
  clearOtherRoutePolylines: function(currentMethod) {
    // 当切换到某个导航方式时，清除其他方式的路线
    if (currentMethod === 'transit') {
      // 如果是公交导航，清除驾车、步行、骑行的路线
      this.clearDrivingRoute();
      this.clearWalkingRoute();
      this.clearBicyclingRoute();
    } else if (currentMethod === 'driving') {
      // 如果是驾车导航，清除公交、步行、骑行的路线
      this.clearTransitRoute();
      this.clearWalkingRoute();
      this.clearBicyclingRoute();
    } else if (currentMethod === 'walking') {
      // 如果是步行导航，清除公交、驾车、骑行的路线
      this.clearTransitRoute();
      this.clearDrivingRoute();
      this.clearBicyclingRoute();
    } else if (currentMethod === 'bicycling') {
      // 如果是骑行导航，清除公交、驾车、步行的路线
      this.clearTransitRoute();
      this.clearDrivingRoute();
      this.clearWalkingRoute();
    }
  },

  // 清除公交路线
  clearTransitRoute: function() {
    // 公交路线由polyline控制，不需要额外清除
  },

  // 清除驾车路线
  clearDrivingRoute: function() {
    // 驾车路线由polyline控制，不需要额外清除
  },

  // 清除步行路线
  clearWalkingRoute: function() {
    // 步行路线由polyline控制，不需要额外清除
  },

  // 清除骑行路线
  clearBicyclingRoute: function() {
    // 骑行路线由polyline控制，不需要额外清除
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

  // 显示公交路线选择
  showTransitRouteSelection: function() {
    const routes = this.data.transitRoutes;
    if (routes.length === 0) return;
    
    // 生成滑动选择器的选项
    const range = routes.map((route, index) => {
      const routeDescription = this.generateRouteDescription(route);
      return `${route.duration}分钟 | ${routeDescription}`;
    });
    
    // 当前选择的索引
    const currentIndex = this.data.selectedTransitIndex || 0;
    
    wx.showActionSheet({
      itemList: range,
      success: (res) => {
        const selectedIndex = res.tapIndex;
        if (selectedIndex >= 0 && selectedIndex < routes.length) {
          // 更新当前选择的公交路线
          this.setData({
            currentNavMethod: 'transit',
            selectedTransitIndex: selectedIndex
          });
          this.updateRouteDetails();
        }
      },
      fail: () => {
        // 用户取消选择，保持当前状态
      }
    });
  },

  // 生成路线描述
  generateRouteDescription: function(route) {
    const segments = route.segments || [];
    const descriptions = [];
    
    segments.forEach(segment => {
      // 公交线路
      if (segment.bus && segment.bus.buslines && segment.bus.buslines.length > 0) {
        const busline = segment.bus.buslines[0];
        descriptions.push(busline.name || '公交');
      }
      
      // 地铁线路
      if (segment.railway && segment.railway.name) {
        descriptions.push(segment.railway.name);
      }
    });
    
    // 如果没有具体的线路信息，显示步行距离
    if (descriptions.length === 0 && route.walkingDistance) {
      descriptions.push(`步行${Math.round(route.walkingDistance)}米`);
    }
    
    return descriptions.join('→') || '公交路线';
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

    // 立即将地图中心移动到用户当前位置
    this.mapCtx.moveToLocation({
      longitude: this.data.longitude,
      latitude: this.data.latitude
    });

    // 重新设置路线数据，确保导航模式下路线可见
    this.ensureRouteVisible();

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
        // 如果持续定位失败，显示错误信息
        wx.showToast({
          title: '持续定位失败，请检查定位权限',
          icon: 'none',
          duration: 3000
        });
      }
    });
  },

  // 根据位置自动导航
  autoNavigateByLocation: function(location) {
    const currentStep = this.data.currentStep;
    const steps = this.data.routeSteps;
    
    if (currentStep >= steps.length - 1) return;
    
    // 计算当前位置与下一步的距离（使用更精确的算法）
    const nextStepDistance = this.calculateStepDistance(location, steps[currentStep + 1]);
    
    // 根据距离智能切换步骤
    if (nextStepDistance < 30) { // 30米内触发下一步
      this.autoNextStep();
    }
    
    // 实时更新路线：如果偏离路线超过50米，重新规划
    this.checkRouteDeviation(location);
    
    // 更新已走过的路线颜色
    this.updateRouteColor(location);
    
    // 确保路线在导航模式下始终可见
    this.ensureRouteVisible();
  },

  // 计算当前位置与步骤的距离
  calculateStepDistance: function(currentLocation, step) {
    // 这里简化处理，实际应该根据步骤类型和位置计算
    // 返回一个估算的距离值
    return step.distance || 100; // 默认返回步骤的距离或100米
  },

  // 自动导航到下一步（基于位置变化）
  autoNextStep: function() {
    const steps = this.data.routeSteps;
    let currentStep = this.data.currentStep;
    
    if (currentStep < steps.length) {
      this.setData({
        currentStep: currentStep + 1
      });
      
      // 语音播报新的导航步骤
      if (steps[currentStep + 1]) {
        this.speakNavigation(steps[currentStep + 1].instruction);
      }
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
  },

  // 检查路线偏离，如果偏离超过阈值则重新规划
  checkRouteDeviation: function(currentLocation) {
    if (!this.data.isNavigating || !this.data.polyline || this.data.polyline.length === 0) {
      return;
    }

    const routePoints = this.data.polyline[0].points;
    let minDistance = Infinity;
    
    // 计算当前位置到路线的最短距离
    for (let i = 0; i < routePoints.length; i++) {
      const distance = this.calculateDistance(
        currentLocation.latitude, currentLocation.longitude,
        routePoints[i].latitude, routePoints[i].longitude
      );
      if (distance < minDistance) {
        minDistance = distance;
      }
    }

    // 如果偏离超过50米，重新规划路线
    if (minDistance > 50) {
      console.log('路线偏离，重新规划中...', minDistance);
      this.replanRoute(currentLocation);
    }
  },

  // 重新规划路线
  replanRoute: function(currentLocation) {
    const currentMethod = this.data.currentNavMethod;
    const destination = {
      longitude: this.data.hospitalLongitude,
      latitude: this.data.hospitalLatitude
    };

    // 根据当前导航方式重新规划路线
    switch (currentMethod) {
      case 'transit':
        this.getAmapTransitRoute(currentLocation, destination);
        break;
      case 'driving':
        this.getAmapDrivingRoute(currentLocation, destination);
        break;
      case 'walking':
        this.getAmapWalkingRoute(currentLocation, destination);
        break;
      case 'bicycling':
        this.getAmapBicyclingRoute(currentLocation, destination);
        break;
    }
  },

  // 更新路线颜色，将已走过的路线变为灰色
  updateRouteColor: function(currentLocation) {
    if (!this.data.isNavigating || !this.data.polyline || this.data.polyline.length === 0) {
      return;
    }

    const routePoints = this.data.polyline[0].points;
    const currentStep = this.data.currentStep;
    const steps = this.data.routeSteps;
    
    if (currentStep >= steps.length - 1) return;

    // 计算当前位置到路线各点的距离
    const distances = routePoints.map(point => 
      this.calculateDistance(
        currentLocation.latitude, currentLocation.longitude,
        point.latitude, point.longitude
      )
    );

    // 找到距离最近的路线点索引
    const nearestIndex = distances.indexOf(Math.min(...distances));

    // 将路线分为已走过和未走过两部分
    const passedPoints = routePoints.slice(0, nearestIndex + 1);
    const remainingPoints = routePoints.slice(nearestIndex + 1);

    // 更新路线颜色
    this.setData({
      polyline: [
        {
          points: passedPoints,
          color: '#CCCCCC', // 灰色 - 已走过的路线
          width: 6,
          arrowLine: true
        },
        {
          points: remainingPoints,
          color: '#0091ff', // 蓝色 - 未走过的路线
          width: 6,
          arrowLine: true
        }
      ]
    });
  },

  // 计算两点间距离（米）
  calculateDistance: function(lat1, lng1, lat2, lng2) {
    const R = 6371000; // 地球半径（米）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  },

  // 确保导航模式下路线可见
  ensureRouteVisible: function() {
    const currentMethod = this.data.currentNavMethod;
    const origin = `${this.data.longitude},${this.data.latitude}`;
    const destination = `${this.data.hospital.longitude},${this.data.hospital.latitude}`;

    // 重新获取当前导航方式的路线信息
    switch (currentMethod) {
      case 'driving':
        this.getAmapDrivingRoute(origin, destination);
        break;
      case 'transit':
        this.getAmapTransitRoute(origin, destination);
        break;
      case 'walking':
        this.getAmapWalkingRoute(origin, destination);
        break;
      case 'bicycling':
        this.getAmapBicyclingRoute(origin, destination);
        break;
    }

    // 延迟更新路线详情，确保API调用完成
    setTimeout(() => {
      this.updateRouteDetails();
    }, 500);
  },

  // 地图区域变化时重新绘制路线
  onMapRegionChange: function(e) {
    // 如果正在导航，重新绘制路线
    if (this.data.isNavigating) {
      this.redrawRoute();
    }
    // 非导航模式下，如果路线数据存在也重新绘制
    else if (this.data.routeSteps.length > 0) {
      this.redrawRoute();
    }
  },

  // 重新绘制路线
  redrawRoute: function() {
    const currentMethod = this.data.currentNavMethod;
    
    // 根据当前导航方式重新绘制路线
    switch (currentMethod) {
      case 'driving':
      case 'walking':
        if (this.data.routeSteps.length > 0) {
          // 重新设置polyline数据
          this.setData({
            polyline: this.data.polyline || []
          });
        }
        break;
      case 'transit':
        if (this.data.transitRoutes.length > 0) {
          // 重新设置公交路线
          this.setData({
            polyline: this.data.polyline || []
          });
        }
        break;
      case 'bicycling':
        if (this.data.routeSteps.length > 0) {
          // 重新设置骑行路线
          this.setData({
            polyline: this.data.polyline || []
          });
        }
        break;
    }
  }
})