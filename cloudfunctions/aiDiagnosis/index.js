/**
 * aiDiagnosis 云函数 — AI API 统一安全代理
 *
 * 功能：将前端的所有 AI API 调用收敛到云函数内，
 *       API Key 从环境变量中读取，前端无法获取。
 *
 * 支持的调用模式 (event.mode):
 *   - "diagnosis": AI 智能分诊（ai-diagnosis 页面使用）→ DeepSeek
 *   - "summary":  症状总结（profile 页面使用）→ DeepSeek
 *   - "expertAvatar": 专家数字分身（RAG 专家咨询）→ Dify
 */

const cloud = require("wx-server-sdk")
const axios = require("axios")

cloud.init()

// 从环境变量读取 API Key（在微信开发者工具云函数配置中设置）
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

// Dify 配置（用于 expertAvatar 模式）
const DIFY_API_KEY = process.env.DIFY_API_KEY || '';
const DIFY_API_BASE_URL = process.env.DIFY_API_BASE_URL || 'https://api.dify.ai/v1';

// entry
exports.main = async (event, context) => {
  const { mode } = event;

  // expertAvatar 模式走 Dify API（RAG 知识库驱动）
  if (mode === 'expertAvatar') {
    return handleExpertAvatar(event);
  }

  // diagnosis / summary 模式走 DeepSeek API
  return handleDeepSeek(event);
};

/**
 * 处理 DeepSeek API 调用（diagnosis / summary 模式）
 */
async function handleDeepSeek(event) {
  const { systemPrompt, messages, userMessage, temperature, maxTokens } = event;

  if (!DEEPSEEK_API_KEY) {
    return {
      success: false,
      error: '服务配置错误：未设置 DeepSeek API 密钥',
      code: 'ENV_MISSING_DEEPSEEK_KEY'
    };
  }

  try {
    const requestMessages = [];
    if (systemPrompt) {
      requestMessages.push({ role: 'system', content: systemPrompt });
    }
    if (messages && Array.isArray(messages)) {
      requestMessages.push(...messages);
    }
    if (userMessage) {
      requestMessages.push({ role: 'user', content: userMessage });
    }

    let defaultTemperature = 0.3;
    let defaultMaxTokens = 800;

    switch (event.mode) {
      case 'summary':
        defaultTemperature = 0.1; defaultMaxTokens = 30; break;
      default:
        defaultTemperature = 0.3; defaultMaxTokens = 800; break;
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
      return {
        success: false,
        error: 'AI 服务返回数据异常',
        code: 'INVALID_RESPONSE',
        raw: resultData
      };
    }
  } catch (error) {
    return buildErrorResponse(error);
  }
}

/**
 * 处理 Dify 专家数字分身调用（expertAvatar 模式）
 * 基于 Dify RAG 知识库的对话型应用
 */
async function handleExpertAvatar(event) {
  const { query, conversationId, userId, doctorName } = event;

  if (!DIFY_API_KEY) {
    return {
      success: false,
      error: '服务配置错误：未设置 Dify API 密钥',
      code: 'ENV_MISSING_DIFY_KEY'
    };
  }

  try {
    const difyResponse = await axios.post(
      `${DIFY_API_BASE_URL}/chat-messages`,
      {
        inputs: {},
        query: query,
        response_mode: 'blocking',
        conversation_id: conversationId || '',
        user: userId || 'anonymous',
        auto_generate_name: true
      },
      {
        headers: {
          'Authorization': `Bearer ${DIFY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );

    const resultData = difyResponse.data;

    // Dify 阻塞模式返回完整 ChatCompletionResponse
    if (resultData.answer !== undefined) {
      // 提取知识库引用来源信息
      const references = (resultData.metadata && resultData.metadata.retriever_resources)
        ? resultData.metadata.retriever_resources.map(r => ({
            documentName: r.document_name,
            score: r.score,
            content: r.content ? r.content.substring(0, 200) : ''
          }))
        : [];

      return {
        success: true,
        content: resultData.answer,
        conversationId: resultData.conversation_id || '',
        messageId: resultData.message_id || '',
        taskId: resultData.task_id || '',
        usage: resultData.usage || null,
        references: references
      };
    } else {
      // 工作流暂停等特殊情况
      if (resultData.event === 'workflow_paused') {
        return {
          success: false,
          error: '专家助手正在处理中，请稍后重试',
          code: 'WORKFLOW_PAUSED',
          workflowRunId: resultData.workflow_run_id
        };
      }
      console.error('[aiDiagnosis][Dify] 返回数据异常:', JSON.stringify(resultData));
      return {
        success: false,
        error: 'Dify 服务返回数据异常',
        code: 'DIFY_INVALID_RESPONSE',
        raw: resultData
      };
    }
  } catch (error) {
    // Dify 特定错误码处理
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;

      // Dify 特定错误码映射
      const difyCodeMap = {
        400: errorData?.code || 'DIFY_BAD_REQUEST',
        404: 'DIFY_NOT_FOUND',
        429: 'DIFY_RATE_LIMITED',
        500: 'DIFY_SERVER_ERROR',
        502: 'DIFY_SERVER_ERROR',
        503: 'DIFY_SERVER_ERROR'
      };

      const difyMsgMap = {
        'app_unavailable': 'Dify 应用配置不可用',
        'provider_not_initialize': '模型凭据未配置',
        'provider_quota_exceeded': '模型调用额度不足',
        'model_currently_not_support': '当前模型不可用',
        'completion_request_error': '文本生成失败'
      };

      const difyCode = errorData?.code || '';
      const mappedMessage = difyMsgMap[difyCode]
        || `Dify 服务错误 (${status}: ${difyCode})`;

      // 打印详细日志用于调试
      console.error('[aiDiagnosis][Dify] 错误详情:', JSON.stringify({
        status: status,
        code: difyCode,
        message: errorData?.message || '',
        fullErrorData: errorData
      }));

      return {
        success: false,
        error: mappedMessage,
        code: difyCodeMap[status] || `HTTP_${status}`,
        // 返回原始错误信息供前端展示调试
        raw: {
          status: status,
          difyCode: difyCode,
          difyMessage: errorData?.message || '',
          body: errorData
        }
      };
    }

    return buildErrorResponse(error);
  }
}

/**
 * 通用错误响应构建器
 */
function buildErrorResponse(error) {
  console.error('[aiDiagnosis] 请求失败:', error.message);

  let errorCode = 'UNKNOWN';
  let errorMessage = error.message;

  if (error.response) {
    const status = error.response.status;
    switch (status) {
      case 401:
        errorCode = 'AUTH_FAILED'; errorMessage = 'API 认证失败，请检查密钥配置'; break;
      case 403:
        errorCode = 'FORBIDDEN'; errorMessage = 'API 访问被拒绝'; break;
      case 429:
        errorCode = 'RATE_LIMITED'; errorMessage = 'API 调用频率超限，请稍后重试'; break;
      case 500: case 502: case 503:
        errorCode = 'SERVER_ERROR'; errorMessage = 'AI 服务暂时不可用，请稍后重试'; break;
      default:
        errorCode = `HTTP_${status}`; errorMessage = `请求失败 (${status})`;
    }
  } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
    errorCode = 'TIMEOUT'; errorMessage = '请求超时，AI 服务响应较慢';
  } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    errorCode = 'NETWORK_ERROR'; errorMessage = '网络连接失败，请检查网络设置';
  }

  return { success: false, error: errorMessage, code: errorCode };
}
