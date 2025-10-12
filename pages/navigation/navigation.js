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
    const destination = this.data.destination;
    if (this.data.navigationInfo[destination]) {
      this.setData({
        showNavigation: true,
        currentStep: 0,
        selectedRoute: "",
        department: destination,
        steps: this.data.navigationInfo[destination].steps
      });
      console.log('导航开始，目标科室:', destination, '导航步骤:', this.data.steps);
    } else {
      wx.showToast({
        title: "未找到该科室",
        icon: "none"
      });
      console.log('未找到科室:', destination);
    }
  },

  selectRoute: function(e) {
    const selectedType = e.currentTarget.dataset.type;
    this.setData({
      selectedRoute: selectedType,
      currentStep: this.data.currentStep + 1,
      selectedOption: selectedType,
      navigationPath: [...this.data.navigationPath, selectedType]
    });
    console.log('用户选择路径:', selectedType, '当前步骤:', this.data.currentStep);
  },

  nextStep: function() {
    const nextStep = this.data.currentStep + 1;
    this.setData({ currentStep: nextStep });
    console.log('进入下一步，当前步骤:', nextStep);
  },

  /**
   * 更新当前步骤的显示
   */
  updateCurrentStep() {
    const { steps, currentStepIndex, navigationPath } = this.data;
    let currentStep = steps[currentStepIndex]; // 获取当前步骤
    
    // 如果当前步骤有选项且用户之前已选择，则标记已选选项
    if (currentStep.options && navigationPath[currentStepIndex]) {
      const selectedType = navigationPath[currentStepIndex]; // 获取用户选择的选项类型
      currentStep = {
        ...currentStep,
        options: currentStep.options.map(opt => ({
          ...opt,
          selected: opt.type === selectedType // 标记已选选项
        }))
      };
    }

    // 更新页面数据
    this.setData({
      currentStep: currentStep, // 当前步骤详情
      hasOptions: !!currentStep.options, // 当前步骤是否有选项
      isLastStep: currentStepIndex === steps.length - 1 // 是否为最后一步
    });
    console.log('更新当前步骤:', currentStep);
  }
})