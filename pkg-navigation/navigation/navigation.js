const navigationConfig = require('../../config/navigationConfig');

Page({
  data: {
    navigationArray: [
      "正畸科", "放射科", "儿童口腔科", "牙周科", "牙体牙髓病科", "口腔颌面外科", "检验科", "口腔修复科", //"种植科",
    ],
    navigationInfo: navigationConfig,

    destination: "",
    value: [0],
    showNavigation: false,
    currentStep: 0,
    selectedRoute: "",
    department: '', // 当前导航的目标部门
    steps: [], // 导航步骤数组，每个步骤可能包含选项
    currentStepIndex: 0, // 当前步骤的索引
    selectedOption: null, // 当前步骤中用户选择的选项
    navigationPath: [] // 记录用户在每个步骤中选择的路径
  },

  onLoad(options) {
    // ========== 调试代码开始 ==========
    console.log('=== navigation.js 模块加载调试 ===');
    console.log('1. navigationConfig 对象:', navigationConfig);
    console.log('2. navigationConfig 类型:', typeof navigationConfig);
    console.log('3. 是否为数组/对象:', Array.isArray(navigationConfig) || typeof navigationConfig === 'object');
    console.log('4. 包含的科室数量:', Object.keys(navigationConfig).length);
    console.log('5. 科室列表:', Object.keys(navigationConfig));
    
    if (navigationConfig && navigationConfig['正畸科']) {
      console.log('6. ✅ 正畸科数据正常');
      console.log('7. 正畸科步骤数:', navigationConfig['正畸科'].steps.length);
      if (navigationConfig['正畸科'].steps[0]) {
        const firstStepImage = navigationConfig['正畸科'].steps[0].image;
        console.log('8. 第一步图片URL:', firstStepImage);
        console.log('9. 图片URL类型:', typeof firstStepImage);
        if (firstStepImage) {
          console.log('10. 图片URL是否包含http:', firstStepImage.includes('http'));
        } else {
          console.error('⚠️  警告：图片URL为空！请检查 imageConfig 是否包含 GATE 等属性');
        }
      }
    } else {
      console.error('❌ 错误：navigationConfig未定义或缺少正畸科数据！');
    }
    console.log('=== 调试代码结束 ===\n');
    // ========== 调试代码结束 ==========
    
    this.setData({
      destination: this.data.navigationArray[0],
    });
    console.log('页面加载完成，初始目标科室:', this.data.destination);
  },

  bindChange: function(e) {
    const val = e.detail.value;
    this.setData({
      destination: this.data.navigationArray[val[0]]
    });
    console.log("用户选择科室:", this.data.navigationArray[val[0]]);
  },

  handleSearch: function() {
    /*if (this.data.destination.trim() === "") {
      wx.showToast({
        title: "请选择目的科室",
        icon: "none"
      });
      console.log('未选择科室名称');
      return;
    }*/
    const department = this.data.destination;
    wx.navigateTo({
      url: `/pkg-navigation/navigation/department/department?d=${department}`,
      success: function(res) {
        res.eventChannel.emit('sendNavigationData', {
          navigationInfo: this.data.navigationInfo[department],
          department: department
        });
      }.bind(this)
    });
  },
})