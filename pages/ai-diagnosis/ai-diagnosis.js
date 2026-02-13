const UserDataManager = require('../../utils/userDataManager.js');

Page({
  data: {
    messages: [],
    inputText: '',
    recommendedDepartment: '',
    recommendationReason: ''
  },

  onLoad(options) {
    // 检查是否从用户信息页面传递了诊断记录
    if (options.diagnosisRecord) {
      try {
        const record = JSON.parse(decodeURIComponent(options.diagnosisRecord));
        this.showDiagnosisRecord(record);
      } catch (error) {
        console.error('解析诊断记录失败:', error);
        this.addMessage('您好，我是AI智能分诊助手，请描述您的症状，我将为您推荐合适的科室。', 'ai');
      }
    } else {
      this.addMessage('您好，我是AI智能分诊助手，请描述您的症状，我将为您推荐合适的科室。', 'ai');
    }
  },

  showDiagnosisRecord(record) {
    // 清空当前消息
    this.setData({ messages: [] });
    
    // 显示诊断记录
    this.addMessage(record.symptoms, 'user');
    
    let aiResponse = `${record.result}\n\n`;
    if (record.suggestions && record.suggestions.length > 0) {
      aiResponse += '建议：\n';
      record.suggestions.forEach((suggestion, index) => {
        aiResponse += `${index + 1}. ${suggestion}\n`;
      });
    }
    
    this.addMessage(aiResponse, 'ai');
    
    this.setData({
      recommendedDepartment: record.department,
      recommendationReason: record.result
    });
  },

  onInput(e) {
    this.setData({
      inputText: e.detail.value
    });
  },

  async sendMessage() {
    const { inputText } = this.data;
    if (!inputText.trim()) return;

    this.addMessage(inputText, 'user');
    this.setData({ inputText: '' });

    // 显示加载状态
    wx.showLoading({
      title: 'AI分析中...',
      mask: true
    });

    try {
      const result = await this.analyzeSymptoms(inputText);
      
      // 构建完整的回复消息
      let fullResponse = `${result.reason}\n\n`;
      if (result.suggestions && result.suggestions.length > 0) {
        fullResponse += '建议：\n';
        result.suggestions.forEach((suggestion, index) => {
          fullResponse += `${index + 1}. ${suggestion}\n`;
        });
      }
      
      this.addMessage(fullResponse, 'ai');
      this.setData({
        recommendedDepartment: result.department,
        recommendationReason: result.reason
      });
      
      // 根据严重程度显示不同的提示
      if (result.severity === 'severe') {
        wx.showModal({
          title: '重要提醒',
          content: '您的症状可能较为严重，建议尽快就医检查！',
          confirmText: '立即导航',
          success: (res) => {
            if (res.confirm) {
              this.navigateToDepartment();
            }
          }
        });
      }
      
    } catch (error) {
      console.error('AI分析失败:', error);
      this.addMessage('抱歉，AI分析暂时不可用，请稍后再试或联系客服。', 'ai');
    } finally {
      wx.hideLoading();
    }
  },

  async analyzeSymptoms(symptoms) {
    try {
      const response = await this.callDeepSeekAPI(symptoms);
      
      // 解析AI返回的结果
      const aiResponse = this.parseAIResponse(response);
      
      // 保存诊断历史
      this.saveDiagnosisHistory(symptoms, aiResponse);
      
      return aiResponse;
    } catch (error) {
      console.error('AI分析失败:', error);
      // 失败时使用备用逻辑
      return this.fallbackAnalyze(symptoms);
    }
  },

  async callDeepSeekAPI(symptoms) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: 'https://api.deepseek.com/chat/completions',
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sk-68966a908d44452ca87264e055e9863e'
        },
        data: {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: `你是一个专业的口腔医疗AI分诊助手。请根据用户描述的症状，分析可能的口腔问题，并推荐合适的口腔科室。

请按照以下格式返回JSON：
{
  "department": "科室名称",
  "reason": "详细的分析和建议",
  "severity": "严重程度（mild/moderate/severe）",
  "suggestions": ["建议1", "建议2"]
}

可选的科室包括：
- 牙体牙髓病科（蛀牙、牙痛、根管治疗）
- 牙周科（牙龈出血、牙周炎）
- 口腔颌面外科（拔牙、智齿、手术）
- 正畸科（牙齿矫正、牙列不齐）
- 儿童口腔科（儿童牙齿问题）
- 口腔修复科（假牙、牙冠修复）
- 口腔种植科（种植牙）
- 口腔黏膜科（口腔溃疡、白斑）`
            },
            {
              role: 'user',
              content: `患者症状描述：${symptoms}`
            }
          ],
          temperature: 0.3,
          max_tokens: 500
        },
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            reject(new Error(`API请求失败: ${res.statusCode}`));
          }
        },
        fail: (error) => {
          reject(error);
        }
      });
    });
  },

  parseAIResponse(apiResponse) {
    try {
      const content = apiResponse.choices[0].message.content;
      
      // 尝试解析JSON格式的响应
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          department: result.department || '口腔颌面外科',
          reason: result.reason || '建议您前往口腔科进行详细检查',
          severity: result.severity || 'mild',
          suggestions: result.suggestions || []
        };
      }
      
      // 如果无法解析JSON，使用文本分析
      return this.parseTextResponse(content);
    } catch (error) {
      console.error('解析AI响应失败:', error);
      return this.fallbackAnalyze('');
    }
  },

  parseTextResponse(content) {
    // 简单的文本分析逻辑
    const departmentKeywords = {
      '牙体牙髓': '牙体牙髓病科',
      '牙周': '牙周科',
      '颌面外科': '口腔颌面外科',
      '正畸': '正畸科',
      '儿童': '儿童口腔科',
      '修复': '口腔修复科',
      '种植': '口腔种植科',
      '黏膜': '口腔黏膜科'
    };

    for (const [keyword, department] of Object.entries(departmentKeywords)) {
      if (content.includes(keyword)) {
        return {
          department: department,
          reason: content,
          severity: 'mild',
          suggestions: []
        };
      }
    }

    return this.fallbackAnalyze('');
  },

  fallbackAnalyze(symptoms) {
    // 备用分析逻辑
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
          reason: `根据您的症状"${keyword}"，建议您前往${keywordMap[keyword]}就诊。`,
          severity: 'mild',
          suggestions: []
        };
      }
    }

    return {
      department: '口腔颌面外科',
      reason: '根据您的描述，建议您先前往口腔颌面外科进行初步检查。',
      severity: 'mild',
      suggestions: []
    };
  },

  saveDiagnosisHistory(symptoms, result) {
    const diagnosisRecord = {
      timestamp: new Date().toISOString(),
      symptoms: symptoms,
      department: result.department,
      severity: result.severity,
      result: result.reason,
      suggestions: result.suggestions
    };

    // 使用统一数据管理模块保存诊断记录
    UserDataManager.addAiDiagnosisRecord(diagnosisRecord);
    
    // 统计常用科室
    const departmentRecord = {
      id: result.department,
      name: result.department,
      timestamp: new Date().toISOString()
    };
    UserDataManager.addCommonDepartment(departmentRecord);
  },

  addMessage(content, type) {
    const messages = [...this.data.messages, { content, type }];
    this.setData({ messages });
  },

  navigateToDepartment() {
    const { recommendedDepartment } = this.data;
    console.log('推荐科室：', recommendedDepartment)
    
    // 直接跳转到科室导航页面，不经过选择界面
    wx.navigateTo({
      url: `/pages/navigation/department/department?d=${recommendedDepartment}`
    });
  }
})