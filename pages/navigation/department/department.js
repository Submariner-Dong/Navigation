import navigationConfig from "../../../config/navigationConfig";

Page({
  data: {
    department: '',
    steps: [],
    currentStepIndex: 0,
    selectedOption: null,
    navigationPath: [] // 记录选择的路径
  },

  onLoad(options) {
    // 优先通过URL参数获取科室名称
    if (options && options.d) {
      const department = options.d;
      this.loadNavigationData(department);
    } else {
      // 备用方案：通过事件通道获取数据
      const eventChannel = this.getOpenerEventChannel();
      
      eventChannel.on('sendNavigationData', (data) => {
        this.setData({
          department: data.department,
          steps: data.navigationInfo.steps,
          totalSteps: data.navigationInfo.steps.length
        });
        this.updateCurrentStep();
      });
    }
  },

  loadNavigationData(department) {
    // 从导航配置中获取对应科室的导航信息
    const navigationInfo = navigationConfig[department];
    
    if (navigationInfo) {
      this.setData({
        department: department,
        steps: navigationInfo.steps,
        totalSteps: navigationInfo.steps.length
      });
      this.updateCurrentStep();
    } else {
      // 如果找不到对应科室，显示错误信息
      wx.showModal({
        title: '提示',
        content: `未找到${department}的导航信息`,
        showCancel: false,
        success: (res) => {
          if (res.confirm) {
            wx.navigateBack();
          }
        }
      });
    }
  },

  updateCurrentStep() {
    const { steps, currentStepIndex, navigationPath } = this.data;
    let currentStep = steps[currentStepIndex];
    
    // 处理分叉步骤的选择记录
    if (currentStep.options && navigationPath[currentStepIndex]) {
      const selectedType = navigationPath[currentStepIndex];
      currentStep = {
        ...currentStep,
        options: currentStep.options.map(opt => ({
          ...opt,
          selected: opt.type === selectedType
        }))
      };
    }

    this.setData({
      currentStep: currentStep,
      hasOptions: !!currentStep.options,
      isLastStep: currentStepIndex === steps.length - 1
    });
  },

  selectOption(e) {
    const option = e.currentTarget.dataset.option;
    const { currentStepIndex, navigationPath } = this.data;
    
    // 更新导航路径记录
    navigationPath[currentStepIndex] = option.type;
    
    this.setData({
      selectedOption: option.type,
      navigationPath: navigationPath
    });
  },

  nextStep() {
    const { currentStepIndex, steps, hasOptions, selectedOption, isLastStep } = this.data;
    
    if (hasOptions && !selectedOption) {
      wx.showToast({
        title: '请先选择一个选项',
        icon: 'none'
      });
      return;
    }

    if (isLastStep) {
      // 导航完成，统计常用科室
      this.recordDepartmentUsage();
      
      wx.showModal({
        title: '导航完成',
        content: `您已成功到达${this.data.department}`,
        showCancel: false,
        success: (res) => {
          if (res.confirm) {
            wx.navigateBack();
          }
        }
      });
      return;
    }

    this.setData({
      currentStepIndex: currentStepIndex + 1,
      selectedOption: null
    });
    
    this.updateCurrentStep();
  },

  prevStep() {
    const { currentStepIndex, navigationPath } = this.data;
    
    if (currentStepIndex > 0) {
      // 清除当前步骤的选择
      navigationPath[currentStepIndex] = null;
      
      this.setData({
        currentStepIndex: currentStepIndex - 1,
        selectedOption: navigationPath[currentStepIndex - 1] || null,
        navigationPath: navigationPath
      });
      
      this.updateCurrentStep();
    }
  },

  // 记录科室使用情况
  recordDepartmentUsage() {
    const { department } = this.data;
    
    // 导入UserDataManager
    const UserDataManager = require('../../../utils/userDataManager.js');
    
    // 统计常用科室
    const departmentRecord = {
      id: department,
      name: department,
      timestamp: new Date().toISOString()
    };
    
    UserDataManager.addCommonDepartment(departmentRecord);
    
    console.log(`已记录科室使用：${department}`);
  }
})