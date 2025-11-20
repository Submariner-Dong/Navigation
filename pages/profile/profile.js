Page({
  data: {
    userAccount: null,
    userInfo: {
      name: '',
      gender: '',
      age: '',
      phone: ''
    },
    medicalRecords: []
  },

  onLoad() {
    this.loadUserData();
    this.loadUserAccount();
  },

  loadUserData() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    const medicalRecords = wx.getStorageSync('medicalRecords') || [];
    this.setData({ userInfo, medicalRecords });
  },

  saveUserInfo(e) {
    const { field } = e.currentTarget.dataset;
    const value = e.detail.value;
    const userInfo = { ...this.data.userInfo, [field]: value };
    this.setData({ userInfo });
    wx.setStorageSync('userInfo', userInfo);
  },

  onGenderChange(e) {
    const index = e.detail.value;
    const genderOptions = ['男', '女'];
    const selectedGender = genderOptions[index];
    const userInfo = { ...this.data.userInfo, gender: selectedGender };
    this.setData({ userInfo });
    wx.setStorageSync('userInfo', userInfo);
  },

  addMedicalRecord() {
    wx.navigateTo({
      url: '/pages/profile/medical-record/medical-record'
    });
  },

  deleteRecord(e) {
    const { index } = e.currentTarget.dataset;
    const medicalRecords = this.data.medicalRecords.filter((_, i) => i !== index);
    this.setData({ medicalRecords });
    wx.setStorageSync('medicalRecords', medicalRecords);
  },

  loadUserAccount() {
    const userAccount = wx.getStorageSync('userAccount');
    if (userAccount) {
      this.setData({ userAccount });
    }
  },

  goToLogin() {
    wx.navigateBack();
  }
})