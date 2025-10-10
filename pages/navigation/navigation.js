Page({
  data: {
    destination: "",
    showNavigation: false,
    currentStep: 0,
    selectedRoute: "",
    navigationInfo: {
      "正畸科": {
        steps: [
          { image: "/public/images/gate.jpg", text: "进入同济大学口腔医院" },
          { 
            options: [
              { type: "stairs", image: "/public/images/1-stairs.jpg", text: "沿楼梯上楼至2楼" },
              { type: "elevator", image: "/public/images/1-elevator.jpg", text: "上电梯前往2楼" }
            ]
          },
          { image: "/public/images/1-orthodontics-1.jpg", text: "成功到达正畸科，治疗顺利！" }
        ]
      },
      "放射科": {
        steps: [
          { image: "/public/images/gate.jpg", text: "进入同济大学口腔医院" },
          { image: "/public/images/passage.jpg", text: "穿过过道" },
          { image: "/public/images/2-radiology-1.jpg", text: "成功到达放射科，治疗顺利！" }
        ]
      },
      "儿科": {
        steps: [
          { image: "/public/images/gate.jpg", text: "进入同济大学口腔医院" },
          { image: "/public/images/passage.jpg", text: "穿过过道" },
          { image: "/public/images/2-pediatric-1.jpg", text: "乘电梯或走楼梯前往4楼" },
          { image: "/public/images/2-radiology-1.jpg", text: "成功到达儿童口腔科，治疗顺利！" }
        ]
      },
      "儿童口腔科": {
        steps: [
          { image: "/public/images/gate.jpg", text: "进入同济大学口腔医院" },
          { image: "/public/images/passage.jpg", text: "穿过过道" },
          { image: "/public/images/2-pediatric-1.jpg", text: "乘电梯或走楼梯前往4楼" },
          { image: "/public/images/2-radiology-1.jpg", text: "成功到达儿童口腔科，治疗顺利！" }
        ]
      }
    }
  },
  handleInput: function(e) {
    this.setData({ destination: e.detail.value });
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