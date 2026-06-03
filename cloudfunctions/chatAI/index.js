const cloud = require("wx-server-sdk")
const axios = require("axios")

cloud.init()

// 从环境变量读取 API Key（安全方式，不在代码中硬编码）
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';

// entry
exports.main = async (event, context) => {
  const userQuery = event.text;

  if (!DEEPSEEK_API_KEY) {
    return { success: false, error: '服务未配置API密钥' };
  }

  try {
    const response = await axios.post('https://api.deepseek.com/chat/completions', {
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: "你现在是口腔医学专家张教授的数字分身。请用专业、严谨且有同理心的态度回答患者的口腔健康问题。如果遇到严重的紧急情况（如大出血、呼吸困难），请果断提示患者去线下急诊。"
        },
        {
          role: "user",
          content: userQuery
        }
      ],
      stream: false,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });

    // 4. Axios 会把接口返回的数据包在 response.data 中
    const resultData = response.data;

    if (resultData.choices && resultData.choices[0]) {
      return {
        success: true,
        answer: resultData.choices[0].message.content // 提取张教授的回答文本
      }
    } else {
      return {
        success: false,
        error: "DeepSeek API 返回的数据结构异常",
        raw: resultData
      }
    }

  } catch (error) {
    // 5. 捕获请求期间的各种错误（如网络超时、Key失效等）
    console.error("Axios 发起请求失败:", error);
    
    // 如果是 Axios 封装的错误，尝试提取服务器返回的具体报错文本
    const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
    
    return {
      success: false,
      error: errorMsg
    }
  }
}