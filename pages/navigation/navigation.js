import navigationConfig from "../../config/navigationConfig";

Page({
  data: {
    navigationArray: [
      "正畸科", "放射科", "儿科/儿童口腔科"
    ],
    navigationInfo: navigationConfig,

    destination: "",
    value: [0],
    showNavigation: false,
    currentStep: 0,
    selectedRoute: "",
  },

  onLoad(options) {
    this.setData({
      destination: this.data.navigationArray[0],
    })
  },

  bindChange: function(e) {
    const val = e.detail.value;
    this.setData({
      destination: this.data.navigationArray[val[0]]
    })
    console.log("set destination to", this.data.navigationArray[val[0]]);
  },

  handleSearch: function() {
    if (this.data.destination.trim() === "") {
      wx.showToast({
        title: "请输入目的科室",
        icon: "none"
      });
      return;
    }
    const destination = this.data.destination;
    if (this.data.navigationInfo[destination]) {
      this.setData({
        showNavigation: true,
        currentStep: 0,
        selectedRoute: ""
      });
    } else {
      wx.showToast({
        title: "未找到该科室",
        icon: "none"
      });
    }
  },
  selectRoute: function(e) {
    this.setData({
      selectedRoute: e.currentTarget.dataset.type,
      currentStep: this.data.currentStep + 1
    });
  },
  nextStep: function() {
    const nextStep = this.data.currentStep + 1;
    this.setData({ currentStep: nextStep });
  }
})