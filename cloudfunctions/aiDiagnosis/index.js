/**
 * aiDiagnosis 云函数 — DeepSeek API 统一安全代理
 *
 * 功能：将前端的所有 DeepSeek API 调用收敛到云函数内，
 *       API Key 从环境变量中读取，前端无法获取。
 *
 * 支持的调用模式 (event.mode):
 *   - "diagnosis": AI 智能分诊（ai-diagnosis 页面使用）
 *   - "summary":  症状总结（profile 页面使用）
 *   - "expertAvatar": 专家数字分身（chatAI / 专家咨询使用）
 */

const cloud = require("wx-server-sdk")
const axios = require("axios")

cloud.init()

// 从环境变量读取 API Key（在微信开发者工具云函数配置中设置）
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

// entry
exports.main = async (event, context) => {
  const { mode, systemPrompt, messages, userMessage, temperature, maxTokens } = event;

  // 安全检查：API Key 是否已配置
  if (!DEEPSEEK_API_KEY) {
    console.error('[aiDiagnosis] 未配置 DEEPSEEK_API_KEY 环境变量');
    return {
      success: false,
      error: '服务配置错误：未设置 API 密钥',
      code: 'ENV_MISSING_KEY'
    };
  }

  try {
    // 构建请求消息数组
    const requestMessages = [];

    // 如果传入了 systemPrompt，添加系统消息
    if (systemPrompt) {
      requestMessages.push({
        role: 'system',
        content: systemPrompt
      });
    }

    // 如果传入了消息历史，追加到请求中
    if (messages && Array.isArray(messages)) {
      requestMessages.push(...messages);
    }

    // 如果传入了用户当前输入，作为最后一条消息
    if (userMessage) {
      requestMessages.push({
        role: 'user',
        content: userMessage
      });
    }

    // 根据模式设置默认参数
    let defaultTemperature = 0.3;
    let defaultMaxTokens = 800;

    switch (mode) {
      case 'summary':
        defaultTemperature = 0.1;
        defaultMaxTokens = 30;
        break;
      case 'expertAvatar':
        defaultTemperature = 0.7;
        defaultMaxTokens = 1500;
        break;
      case 'diagnosis':
      default:
        defaultTemperature = 0.3;
        defaultMaxTokens = 800;
        break;
    }

    const response = await axios.post(DEEPSEEK_API_URL, {
      model: 'deepseek-chat',
      messages: requestMessages,
      stream: false,
      temperature: temperature || defaultTemperature,
      max_tokens: maxTokens || defaultMaxTokens
    }, {
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });

    const resultData = response.data;

    if (resultData.choices && resultData.choices.length > 0) {
      return {
        success: true,
        data: resultData,
        content: resultData.choices[0].message.content,
        usage: resultData.usage || null
      };
    } else {
      console.error('[aiDiagnosis] DeepSeek 返回数据异常:', JSON.stringify(resultData));
      return {
        success: false,
        error: 'AI 服务返回数据异常',
        code: 'INVALID_RESPONSE',
        raw: resultData
      };
    }
  } catch (error) {
    console.error('[aiDiagnosis] 请求失败:', error.message);

    // 区分不同错误类型
    let errorCode = 'UNKNOWN';
    let errorMessage = error.message;

    if (error.response) {
      const status = error.response.status;
      switch (status) {
        case 401:
          errorCode = 'AUTH_FAILED';
          errorMessage = 'API 认证失败，请检查密钥配置';
          break;
        case 403:
          errorCode = 'FORBIDDEN';
          errorMessage = 'API 访问被拒绝';
          break;
        case 429:
          errorCode = 'RATE_LIMITED';
          errorMessage = 'API 调用频率超限，请稍后重试';
          break;
        case 500:
        case 502:
        case 503:
          errorCode = 'SERVER_ERROR';
          errorMessage = 'AI 服务暂时不可用，请稍后重试';
          break;
        default:
          errorCode = `HTTP_${status}`;
          errorMessage = `请求失败 (${status})`;
      }
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      errorCode = 'TIMEOUT';
      errorMessage = '请求超时，AI 服务响应较慢';
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      errorCode = 'NETWORK_ERROR';
      errorMessage = '网络连接失败，请检查网络设置';
    }

    return {
      success: false,
      error: errorMessage,
      code:errorCode
    };
  }
}
