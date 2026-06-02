const cloud = require("wx-server-sdk")

cloud.init()

// entry
exports.main = async (event, context) => {
  const weContext = cloud.getWXContext()

  return {
    event,
    sum: event.a + event.b,
    openid: weContext.OPENID,
    appid: weContext.APPID,
    unionid: weContext.UNIONID,
  }
}


