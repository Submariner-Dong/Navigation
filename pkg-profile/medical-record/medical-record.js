const UserDataManager = require('../../../utils/userDataManager.js');

Page({
  data: {
    formData: {
      visitTime: '',
      department: '',
      doctor: '',
      mainComplaint: '',
      diagnosis: '',
      treatmentProcess: '',
      medication: '',
      followUp: '',
      examination: '',
      advice: ''
    },
    departmentOptions: [
      '牙体牙髓病科', '牙周科', '口腔修复科', '口腔正畸科',
      '口腔颌面外科', '儿童口腔科', '口腔预防科'
    ],
    showDepartmentPicker: false,
    maxDate: '', // 日期选择器最大可选日期（今天）
    isEditMode: false, // 是否为编辑模式
    editingRecordId: null // 正在编辑的记录ID
  },

  onLoad(options) {
    // 默认就诊时间为今天，格式：2026-07-04
    const today = this.formatDate(new Date());
    this.setData({
      'formData.visitTime': today,
      maxDate: today
    });

    // 如果传入编辑参数，进入编辑模式
    if (options.record) {
      try {
        const record = JSON.parse(decodeURIComponent(options.record));
        if (record.isManual) {
          this.setData({
            isEditMode: true,
            editingRecordId: record.id,
            formData: {
              visitTime: record.visitTime || '',
              department: record.department || '',
              doctor: record.doctor || '',
              mainComplaint: record.mainComplaint || '',
              diagnosis: record.diagnosis || '',
              treatmentProcess: record.treatmentProcess || '',
              medication: record.medication || '',
              followUp: record.followUp || '',
              examination: record.examination || '',
              advice: record.advice || ''
            }
          });
          // 设置标题为编辑模式
          wx.setNavigationBarTitle({ title: '编辑病历' });
        }
      } catch (error) {
        console.error('解析编辑数据失败:', error);
      }
    }
  },

  // 统一日期格式化函数：2026-07-04
  formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 输入框值变化
  onInputChange(e) {
    const { field } = e.currentTarget.dataset;
    const value = e.detail.value;
    this.setData({ [`formData.${field}`]: value });
  },

  // 日期选择变化
  onDatePick(e) {
    this.setData({ 'formData.visitTime': e.detail.value });
  },

  // 科室选择
  onDepartmentPick(e) {
    const index = e.detail.value;
    const department = this.data.departmentOptions[index];
    this.setData({ 'formData.department': department });
  },

  // 显示科室选择器
  showDepartmentPicker() {
    this.setData({ showDepartmentPicker: true });
  },

  // 保存病历
  saveMedicalRecord() {
    const { formData } = this.data;

    // 必填校验
    if (!formData.visitTime) {
      wx.showToast({ title: '请填写就诊时间', icon: 'none' });
      return;
    }

    // 防呆：检查日期是否为未来日期（统一转为 YYYY-MM-DD 字符串比较，避免时区问题）
    const selectedDateStr = formData.visitTime;           // 已是 "2026-07-04" 格式
    const todayStr = this.formatDate(new Date());         // 今天的 "2026-07-04"
    if (selectedDateStr > todayStr) {
      wx.showToast({ title: '就诊时间不能是未来日期', icon: 'none' });
      return;
    }

    if (!formData.department) {
      wx.showToast({ title: '请选择科室', icon: 'none' });
      return;
    }
    if (!formData.doctor) {
      wx.showToast({ title: '请填写医生姓名', icon: 'none' });
      return;
    }

    // 构建病历记录对象
    const record = {
      id: this.data.editingRecordId || `manual_${Date.now()}`,
      visitTime: formData.visitTime,
      department: formData.department,
      doctor: formData.doctor,
      diagnosis: formData.diagnosis || '待补充',
      description: `${formData.department}就诊记录，${formData.diagnosis || '手动录入'}`,
      treatment: formData.treatmentProcess || '常规治疗完成',
      nextVisit: formData.followUp || '暂无复诊需求',
      // 详细信息（用于详情页展示）
      mainComplaint: formData.mainComplaint,
      treatmentProcess: formData.treatmentProcess,
      medication: formData.medication,
      followUp: formData.followUp,
      examination: formData.examination,
      advice: formData.advice,
      isManual: true // 标记为手动添加
    };

    // 保存到本地存储
    try {
      const userData = UserDataManager.loadUserData();
      userData.medicalData.medicalRecords = userData.medicalData.medicalRecords || [];

      if (this.data.isEditMode) {
        // 编辑模式：更新已有记录
        const index = userData.medicalData.medicalRecords.findIndex(r => r.id === this.data.editingRecordId);
        if (index !== -1) {
          userData.medicalData.medicalRecords[index] = record;
        }
        wx.showToast({ title: '病历更新成功', icon: 'success' });
      } else {
        // 新增模式：插入到最前面
        userData.medicalData.medicalRecords.unshift(record);
        wx.showToast({ title: '病历保存成功', icon: 'success' });
      }

      UserDataManager.saveUserData(userData);

      // 延迟返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (error) {
      console.error('保存病历失败:', error);
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'none'
      });
    }
  },

  // 重置表单
  resetForm() {
    wx.showModal({
      title: '提示',
      content: '确定要清空所有已填写的内容吗？',
      confirmText: '清空',
      confirmColor: '#fa5151',
      success: (res) => {
        if (res.confirm) {
          const today = this.formatDate(new Date());
          this.setData({
            formData: {
              visitTime: today,
              department: '',
              doctor: '',
              mainComplaint: '',
              diagnosis: '',
              treatmentProcess: '',
              medication: '',
              followUp: '',
              examination: '',
              advice: ''
            }
          });
          wx.showToast({ title: '已重置', icon: 'success' });
        }
      }
    });
  },

  goBack() {
    wx.navigateBack();
  }
});
