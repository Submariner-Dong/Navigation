const cloud = require("wx-server-sdk")
const axios = require("axios")

cloud.init()

// entry
exports.main = async (event, context) => {
  // 从前端拿到用户输入的口腔问题
  const userQuery = event.text;

  // ⚠️ 记得把下面替换为你真实的 DeepSeek API Key
  const DEEPSEEK_API_KEY = 'Bearer sk-68966a908d44452ca87264e055e9863e'; 

  try {
    // 2. 使用 axios.post 直连 DeepSeek 官方接口
    const response = await axios.post('https://api.deepseek.com/chat/completions', {
      model: "deepseek-chat", // 官方指定的对话模型名称
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
      stream: false, // 阻塞模式，一次性返回
      temperature: 0.7
    }, {
      // 3. 配置请求头和超时时间
      headers: {
        'Authorization': DEEPSEEK_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 医疗模型思考可能较慢，给足 60 秒的容错时间
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