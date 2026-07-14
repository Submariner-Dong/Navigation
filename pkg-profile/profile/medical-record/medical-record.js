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
    editingRecordId: null, // 正在编辑的记录ID

    // ====== 防重复提交相关 ======
    submitting: false,           // 提交中状态（按钮loading/禁用）
    _submitTimer: null           // 3秒冷却定时器句柄
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

  // 保存病历（内容指纹去重 + loading锁 + 3秒节流）
  saveMedicalRecord() {
    const { formData } = this.data;

    // ========== loading 锁 ==========
    if (this.data.submitting) {
      console.log('【防重复】提交中，忽略重复点击');
      return;
    }

    // 必填校验
    if (!formData.visitTime) {
      wx.showToast({ title: '请填写就诊时间', icon: 'none' });
      return;
    }
    if (formData.visitTime > this.formatDate(new Date())) {
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

    // ========== 激活 loading 锁 + 启动3秒冷却定时器 ==========
    this.setData({ submitting: true });

    // 安全兜底：即使 navigateBack 意外失败，3秒后自动解锁按钮
    this._submitTimer = setTimeout(() => {
      if (this.data.submitting) {
        console.log('【防重复】冷却期结束，自动解锁');
        this.setData({ submitting: false });
      }
    }, 3000);

    // 构建病历记录对象（这就是最终要存入的完整数据）
    const record = {
      id: this.data.editingRecordId || `manual_${Date.now()}`,
      visitTime: formData.visitTime,
      department: formData.department,
      doctor: formData.doctor,
      diagnosis: formData.diagnosis || '待补充',
      description: `${formData.department}就诊记录，${formData.diagnosis || '手动录入'}`,
      treatment: formData.treatmentProcess || '常规治疗完成',
      nextVisit: formData.followUp || '暂无复诊需求',
      mainComplaint: formData.mainComplaint,
      treatmentProcess: formData.treatmentProcess,
      medication: formData.medication,
      followUp: formData.followUp,
      examination: formData.examination,
      advice: formData.advice,
      isManual: true
    };

    // ========== C-b方案：查重 — 用完整 record 与已存储记录对比 ==========
    // 在写入前检查是否已存在完全相同的病历（仅新增模式生效）
    if (!this.data.isEditMode) {
      try {
        const existingData = UserDataManager.loadUserData();
        const records = existingData.medicalData.medicalRecords || [];
        const hasDuplicate = records.some(r =>
          r.visitTime === record.visitTime &&
          r.department === record.department &&
          r.doctor === record.doctor &&
          r.diagnosis === record.diagnosis &&
          r.mainComplaint === record.mainComplaint &&
          r.treatmentProcess === record.treatmentProcess &&
          r.medication === record.medication
        );

        if (hasDuplicate) {
          console.log('发现与已存储记录完全相同，拦截');
          // 解锁（不保存了）
          this.setData({ submitting: false });
          if (this._submitTimer) { clearTimeout(this._submitTimer); this._submitTimer = null; }
          wx.showToast({
            title: '请勿重复保存相同病历',
            icon: 'none',
            duration: 2000
          });
          return;
        }
      } catch (err) {
        console.warn('查重读取失败，跳过此层防护:', err);
      }
    }

    // 写入存储
    try {
      const userData = UserDataManager.loadUserData();
      userData.medicalData.medicalRecords = userData.medicalData.medicalRecords || [];

      if (this.data.isEditMode) {
        const index = userData.medicalData.medicalRecords.findIndex(r => r.id === this.data.editingRecordId);
        if (index !== -1) {
          userData.medicalData.medicalRecords[index] = record;
        }
        wx.showToast({ title: '病历更新成功', icon: 'success' });
      } else {
        userData.medicalData.medicalRecords.unshift(record);
        wx.showToast({ title: '病历保存成功', icon: 'success' });
      }

      UserDataManager.saveUserData(userData);

      // 清除冷却定时器（正常返回前清除）
      if (this._submitTimer) {
        clearTimeout(this._submitTimer);
        this._submitTimer = null;
      }

      // 延迟返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (error) {
      console.error('保存病历失败:', error);
      // 出错也要解锁
      this.setData({ submitting: false });
      if (this._submitTimer) {
        clearTimeout(this._submitTimer);
        this._submitTimer = null;
      }
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
  },

  // 页面卸载时清理定时器
  onUnload() {
    if (this._submitTimer) {
      clearTimeout(this._submitTimer);
      this._submitTimer = null;
    }
  }
});
