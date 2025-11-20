Page({
  data: {
    messages: [],
    inputText: '',
    recommendedDepartment: '',
    recommendationReason: ''
  },

  onLoad() {
    this.addMessage('您好，我是AI智能分诊助手，请描述您的症状，我将为您推荐合适的科室。', 'ai');
  },

  sendMessage() {
    const { inputText } = this.data;
    if (!inputText.trim()) return;

    this.addMessage(inputText, 'user');
    this.setData({ inputText: '' });

    // 模拟AI分析
    setTimeout(() => {
      const result = this.analyzeSymptoms(inputText);
      this.addMessage(result.reason, 'ai');
      this.setData({
        recommendedDepartment: result.department,
        recommendationReason: result.reason
      });
    }, 1000);
  },

  analyzeSymptoms(symptoms) {
    // 简单的模拟逻辑，实际应调用AI模型
    const keywordMap = {
      '牙痛': '牙体牙髓病科',
      '拔牙': '口腔颌面外科',
      '矫正': '正畸科',
      '儿童': '儿童口腔科',
      '牙周': '牙周科',
      '修复': '口腔修复科'
    };

    for (const keyword in keywordMap) {
      if (symptoms.includes(keyword)) {
        return {
          department: keywordMap[keyword],
          reason: `根据您的症状"${keyword}"，建议您前往${keywordMap[keyword]}就诊。`
        };
      }
    }

    return {
      department: '口腔颌面外科',
      reason: '根据您的描述，建议您先前往口腔颌面外科进行初步检查。'
    };
  },

  addMessage(content, type) {
    const messages = [...this.data.messages, { content, type }];
    this.setData({ messages });
  },

  navigateToDepartment() {
    const { recommendedDepartment } = this.data;
    wx.navigateTo({
      url: `/pages/navigation/navigation?department=${recommendedDepartment}`
    });
  }
})