Page({
  data: {
    department: '',
    steps: [],
    currentStepIndex: 0,
    selectedOption: null,
    navigationPath: [] // 记录选择的路径
  },

  onLoad(options) {
    const eventChannel = this.getOpenerEventChannel();
    
    eventChannel.on('sendNavigationData', (data) => {
      this.setData({
        department: data.department,
        steps: data.navigationInfo.steps,
        totalSteps: data.navigationInfo.steps.length
      });
      this.updateCurrentStep();
    });
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
  }
})