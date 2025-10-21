import navigationConfig from "../../config/navigationConfig";

Page({
  data: {
    navigationArray: [
      "正畸科", "放射科", "儿童口腔科", "牙周科", "牙体牙髓病科", "种植科", "口腔颌面外科", "检验科", "口腔修复科",
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
      url: `/pages/navigation/department/department?d=${department}`,
      success: function(res) {
        res.eventChannel.emit('sendNavigationData', {
          navigationInfo: this.data.navigationInfo[department],
          department: department
        });
      }.bind(this)
    });
  },
})