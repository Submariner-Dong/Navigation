const UserDataManager = require('../utils/userDataManager.js');

// 头像URL常量（替代跨包引用 avatarManager）
const DEFAULT_AVATAR = 'https://miniapp-navigation-1382838528.cos.ap-shanghai.myqcloud.com/user-avatar.png';
const AI_AVATAR_URL = 'https://miniapp-navigation-1382838528.cos.ap-shanghai.myqcloud.com/ai-avatar.png';

// 辅助函数：获取用户头像（内联实现）
function getUserAvatar() {
  try {
    const userData = UserDataManager.loadUserData();
    if (userData && userData.userInfo && userData.userInfo.avatarUrl) {
      return userData.userInfo.avatarUrl;
    }
    return DEFAULT_AVATAR;
  } catch (error) {
    console.error('获取用户头像失败:', error);
    return DEFAULT_AVATAR;
  }
}

// 缓存数据，避免重复计算
const cache = {
  userAvatar: null,
  systemPrompt: `你是一个专业的口腔医疗AI分诊助手。请根据用户描述的症状和对话历史，分析可能的口腔问题，并推荐合适的口腔科室。

重要提醒：如果患者年龄在18岁以下，请优先推荐儿童口腔科，因为儿童的口腔问题需要专门的儿童牙医处理。

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
- 儿童口腔科（儿童牙齿问题，18岁以下患者优先推荐）
- 口腔修复科（假牙、牙冠修复）
- 口腔种植科（种植牙）
- 口腔黏膜科（口腔溃疡、白斑）

注意：请基于整个对话历史进行分析，确保回答的连贯性。特别关注患者的年龄信息，18岁以下必须推荐儿童口腔科。`
};

// 专家医生列表（后续可扩展）
const EXPERT_DOCTORS = [
  {
    id: 'implant_ye',
    name: '叶颖',
    title: '副主任医师',
    department: '口腔种植科',
    description: '擅长种植牙、复杂骨增量、全口/半口即刻负重'
  }
];

Page({
  data: {
    // ===== 模式状态 =====
    chatMode: 'diagnosis',        // 'diagnosis' = AI智能分诊 | 'expert' = 专家数字分身
    showDoctorList: false,          // 是否显示医生选择面板
    selectedDoctor: null,           // 当前选中的专家

    // ===== 对话数据 =====
    messages: [],
    inputText: '',
    recommendedDepartment: '',
    recommendationReason: '',

    // ===== 专家医生列表 =====
    doctors: EXPERT_DOCTORS,

    // ===== 专家模式专属 =====
    expertConversationId: '',       // Dify 会话ID（用于多轮上下文）

    // ===== UI 状态 =====
    scrollTop: 0,
    userAvatar: '',
    aiAvatar: '',
    keyboardHeight: 0           // 键盘高度，用于动态调整布局
  },

  doctors: EXPERT_DOCTORS,

  onLoad(options) {
    // 使用缓存避免重复获取头像
    if (!cache.userAvatar) {
      cache.userAvatar = getUserAvatar();
    }
    this.setData({
      userAvatar: cache.userAvatar,
      aiAvatar: AI_AVATAR_URL
    });
    
    // 检查是否从用户信息页面传递了诊断记录
    if (options.diagnosisRecord) {
      try {
        const record = JSON.parse(decodeURIComponent(options.diagnosisRecord));
        this.showDiagnosisRecord(record);
      } catch (error) {
        console.error('解析诊断记录失败:', error);
        this.addMessage('您好，我是智能分诊助手，请描述您的症状，我将为您推荐合适的科室。', 'ai');
      }
    } else {
      this.addMessage('您好，我是智能分诊助手，请描述您的症状，我将为您推荐合适的科室。', 'ai');
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

  /**
   * 键盘高度变化时动态调整聊天区域底部间距
   * 配合 adjust-position="{{false}}" 使用
   */
  onKeyboardHeightChange(e) {
    const height = e.detail.height;
    this.setData({ keyboardHeight: height });

    // 键盘弹出后延迟滚动到底部，确保最新消息可见
    if (height > 0) {
      setTimeout(() => {
        this.setData({ scrollTop: 99999 });
      }, 100);
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
      // 失败时使用备用逻辑，传递错误码
      let errorCode = error.statusCode || error.message || '';
      
      // 检测网络断开错误
      if (error.errMsg && error.errMsg.includes('request:fail')) {
        errorCode = 'NETWORK_DISCONNECTED';
      } else if (error.message && error.message.includes('ERR_INTERNET_DISCONNECTED')) {
        errorCode = 'NETWORK_DISCONNECTED';
      }
      
      return this.fallbackAnalyze(symptoms, errorCode);
    }
  },

  async callDeepSeekAPI(symptoms) {
    // 预先计算消息历史，避免重复构建
    const messageHistory = this.buildMessageHistory();

    // 通过云函数安全代理调用 DeepSeek API（Key 不暴露给前端）
    return new Promise((resolve, reject) => {
      wx.cloud.init()
      wx.cloud.callFunction({
        name: 'aiDiagnosis',
        data: {
          mode: 'diagnosis',
          systemPrompt: cache.systemPrompt,
          messages: messageHistory,
          userMessage: `当前患者症状描述：${symptoms}`
        },
        success: (res) => {
          const result = res.result;
          if (result && result.success) {
            resolve(result.data);
          } else {
            // 将云函数错误转换为前端可识别的错误格式
            const error = new Error(result?.error || 'AI 服务调用失败');
            error.statusCode = result?.code || 'CLOUD_ERROR';
            reject(error);
          }
        },
        fail: (error) => {
          console.error('调用 aiDiagnosis 云函数失败:', error);
          reject(error);
        }
      });
    });
  },

  buildMessageHistory() {
    const { messages } = this.data;
    const history = [];
    
    // 跳过第一条AI欢迎消息，只保留实际的对话内容
    for (let i = 1; i < messages.length; i++) {
      const message = messages[i];
      if (message.type === 'user') {
        history.push({
          role: 'user',
          content: `患者症状描述：${message.content}`
        });
      } else if (message.type === 'ai') {
        // 从AI回复中提取关键信息
        const aiContent = this.extractAIResponseContent(message.content);
        history.push({
          role: 'assistant',
          content: aiContent
        });
      }
    }
    
    return history;
  },

  extractAIResponseContent(content) {
    // 去除建议列表等格式化内容
    const cleanedContent = content.replace(/建议：\n(\d+\.\s*[^\n]*\n)*/g, '').trim();
    return cleanedContent || content;
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
      // 传递解析错误信息
      const errorCode = `PARSE_ERROR: ${error.message}`;
      return this.fallbackAnalyze('', errorCode);
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

    // 文本分析失败时使用备用逻辑
    const errorCode = 'TEXT_ANALYSIS_FAILED';
    return this.fallbackAnalyze('', errorCode);
  },

  fallbackAnalyze(symptoms, errorCode = null) {
    // 检查网络连接状态
    wx.getNetworkType({
      success: (res) => {
        if (res.networkType === 'none') {
          wx.showToast({
            title: '网络连接失败，请检查网络设置',
            icon: 'none',
            duration: 3000
          });
        } else {
          let errorMessage = 'AI服务暂时不可用，请稍后重试';
          
          // 处理可能为null的errorCode
          if (errorCode) {
            errorMessage += `（错误码：${errorCode}）`;
            
            // 添加详细的错误提示
            if (errorCode.includes('NETWORK_DISCONNECTED') || errorCode.includes('ERR_INTERNET_DISCONNECTED')) {
              errorMessage = '网络连接已断开\n请检查网络连接并重试';
            } else if (errorCode.includes('timeout') || errorCode.includes('Network Error')) {
              errorMessage += '\n可能原因：网络连接超时或域名无法访问';
            } else if (errorCode.includes('401')) {
              errorMessage += '\n可能原因：API服务认证失败';
            } else if (errorCode.includes('403')) {
              errorMessage += '\n可能原因：访问被拒绝，请检查网络环境';
            }
          }
          
          wx.showToast({
            title: errorMessage,
            icon: 'none',
            duration: 4000
          });
        }
      }
    });

    // 备用分析逻辑
    const keywordMap = {
      '牙痛': '牙体牙髓病科',
      '拔牙': '口腔颌面外科',
      '矫正': '正畸科',
      '儿童': '儿童口腔科',
      '小孩': '儿童口腔科',
      '未成年': '儿童口腔科',
      '18岁': '儿童口腔科',
      '青少年': '儿童口腔科',
      '牙周': '牙周科',
      '修复': '口腔修复科'
    };

    for (const keyword in keywordMap) {
      if (symptoms.includes(keyword)) {
        let reason = `根据您的症状"${keyword}"，建议您前往${keywordMap[keyword]}就诊。`;
        
        // 特殊处理儿童相关关键词
        if (keyword === '儿童' || keyword === '小孩' || keyword === '未成年' || keyword === '18岁' || keyword === '青少年') {
          reason += '\n\n重要提醒：18岁以下患者应优先选择儿童口腔科，儿童口腔问题需要专门的儿童牙医处理。';
        }
        
        reason += '\n\n（AI分析服务暂时不可用，已使用本地备用分析）';
        
        // 处理可能为null的errorCode
        if (errorCode) {
          reason += `\n错误码：${errorCode}`;
          
          if (errorCode.includes('NETWORK_DISCONNECTED') || errorCode.includes('ERR_INTERNET_DISCONNECTED')) {
            reason += '\n网络连接已断开\n请检查网络连接并重试';
          } else if (errorCode.includes('timeout') || errorCode.includes('Network Error')) {
            reason += '\n提示：请检查网络环境或尝试切换WiFi/移动数据';
          }
        }
        return {
          department: keywordMap[keyword],
          reason: reason,
          severity: 'mild',
          suggestions: [],
          errorCode: errorCode
        };
      }
    }

    let reason = '根据您的描述，建议您先前往口腔颌面外科进行初步检查。\n\n（AI分析服务暂时不可用，已使用本地备用分析）';
    
    // 处理可能为null的errorCode
    if (errorCode) {
      reason += `\n错误码：${errorCode}`;
      
      if (errorCode.includes('NETWORK_DISCONNECTED') || errorCode.includes('ERR_INTERNET_DISCONNECTED')) {
        reason = '网络连接已断开\n\n根据您的描述，建议您先前往口腔颌面外科进行初步检查。\n\n请检查网络连接后重试';
      } else if (errorCode.includes('timeout') || errorCode.includes('Network Error')) {
        reason += '\n提示：请检查网络环境或尝试切换WiFi/移动数据';
      }
    }
    return {
      department: '口腔颌面外科',
      reason: reason,
      severity: 'mild',
      suggestions: [],
      errorCode: errorCode
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
    
    // 判断是否需要滚动到底部：
    // 1. 如果是第一条AI消息（页面初始化时的欢迎消息），不滚动
    // 2. 其他情况（用户发送消息、AI回复、后续消息）都滚动到底部
    const shouldScrollToBottom = !(type === 'ai' && this.data.messages.length === 0);
    
    this.setData({ 
      messages,
      scrollTop: shouldScrollToBottom ? 99999 : 0
    });
  },

  navigateToDepartment() {
    const { recommendedDepartment } = this.data;
    console.log('推荐科室：', recommendedDepartment)
    
    // 直接跳转到科室导航页面，不经过选择界面
    wx.navigateTo({
      url: `/pkg-navigation/navigation/department/department?d=${recommendedDepartment}`
    });
  },

  // ===== 专家数字分身相关方法 =====

  /**
   * 切换到专家咨询模式（显示医生列表）
   */
  switchToExpertMode() {
    this.setData({ showDoctorList: true });
  },

  /**
   * 切换回 AI 分诊模式
   */
  switchToDiagnosisMode() {
    this.setData({
      chatMode: 'diagnosis',
      showDoctorList: false,
      messages: [],
      inputText: '',
      recommendedDepartment: '',
      recommendationReason: ''
    });
    this.addMessage('您好，我是智能分诊助手，请描述您的症状，我将为您推荐合适的科室。', 'ai');
  },

  /**
   * 选择医生并进入专家对话模式
   */
  selectDoctor(e) {
    const doctorId = e.currentTarget.dataset.id;
    const doctor = EXPERT_DOCTORS.find(d => d.id === doctorId);
    
    if (!doctor) return;

    // 重置对话状态
    this.setData({
      selectedDoctor: doctor,
      chatMode: 'expert',
      showDoctorList: false,
      messages: [],
      expertConversationId: '',  // 新会话，清空 conversation_id
      inputText: '',
      recommendedDepartment: '',
      recommendationReason: ''
    });

    // 发送欢迎消息
    const welcomeMsg = `您好！我是${doctor.department}的${doctor.title}${doctor.name}。\n\n${doctor.description}\n\n请问有什么我可以帮您的？`;
    this.addMessage(welcomeMsg, 'ai');
  },

  /**
   * 发送专家咨询消息（通过 Dify RAG API）
   */
  async sendExpertMessage() {
    const { inputText, expertConversationId, selectedDoctor } = this.data;
    if (!inputText.trim()) return;

    this.addMessage(inputText, 'user');
    this.setData({ inputText: '' });

    wx.showLoading({
      title: `${selectedDoctor.name}医生思考中...`,
      mask: true
    });

    try {
      wx.cloud.init()
      const result = await new Promise((resolve, reject) => {
        wx.cloud.callFunction({
          name: 'aiDiagnosis',
          data: {
            mode: 'expertAvatar',
            query: inputText,
            conversationId: expertConversationId || '',
            userId: `wx_user_${Date.now()}`,
            doctorName: selectedDoctor ? selectedDoctor.name : ''
          },
          success: (res) => {
            const cloudResult = res.result;
            if (cloudResult && cloudResult.success) {
              resolve(cloudResult);
            } else {
              // 携带原始错误信息用于调试
              const detail = cloudResult?.raw
                ? `\n[Dify详情] ${cloudResult.raw.difyCode || ''}: ${cloudResult.raw.difyMessage || JSON.stringify(cloudResult.raw.body)}`
                : '';
              reject(new Error(cloudResult?.error + detail || 'Dify 服务调用失败'));
            }
          },
          fail: (err) => {
            console.error('调用 Dify 云函数失败:', err);
            reject(err);
          }
        });
      });

      // 显示回复
      this.addMessage(result.content, 'ai');

      // 更新 conversation_id 以保持多轮上下文
      if (result.conversationId) {
        this.setData({ expertConversationId: result.conversationId });
      }

    } catch (error) {
      console.error('专家咨询失败:', error);
      this.addMessage(`抱歉，${selectedDoctor.name}医生暂时无法回答，请稍后重试。错误：${error.message || '服务异常'}`, 'ai');
    } finally {
      wx.hideLoading();
    }
  },

  /**
   * 统一发送消息入口（根据当前模式路由）
   */
  sendMessage() {
    if (this.data.chatMode === 'expert') {
      this.sendExpertMessage();
    } else {
      this.sendDiagnosisMessage();
    }
  },

  /**
   * AI 分诊模式的发送消息（原有逻辑）
   */
  async sendDiagnosisMessage() {
    const { inputText } = this.data;
    if (!inputText.trim()) return;

    this.addMessage(inputText, 'user');
    this.setData({ inputText: '' });

    wx.showLoading({ title: 'AI分析中...', mask: true });

    try {
      const result = await this.analyzeSymptoms(inputText);

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

      if (result.severity === 'severe') {
        wx.showModal({
          title: '重要提醒',
          content: '您的症状可能较为严重，建议尽快就医检查！',
          confirmText: '立即导航',
          success: (res) => { if (res.confirm) { this.navigateToDepartment(); } }
        });
      }

    } catch (error) {
      console.error('AI分析失败:', error);
      this.addMessage('抱歉，AI分析暂时不可用，请稍后再试或联系客服。', 'ai');
    } finally {
      wx.hideLoading();
    }
  },
})