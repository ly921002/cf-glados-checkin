const DEFAULT_CONFIG = {
  COOKIES: [], // GlaDOS 账号 Cookie
  TRIGGER_PATH: '/glados-checkin',
  TG_BOT_TOKEN: '',
  TG_CHAT_ID: '',
  DOMAIN: 'glados.network' // 机场地址默认值
};

let config = { ...DEFAULT_CONFIG };

export default {
  async fetch(request, env, ctx) {
    await initializeConfig(env);
    const url = new URL(request.url);
    
    if (url.pathname === config.TRIGGER_PATH) {
      try {
        const result = await runCheckin();
        await sendTelegramNotification(`签到成功：\n${result.message}`);
        return successResponse(result.message);
      } catch (error) {
        await sendTelegramNotification(`签到失败：\n${error.message}`);
        return errorResponse(error);
      }
    } else if (url.pathname === '/') {
      return new Response(
        `请访问 ${config.TRIGGER_PATH} 触发GlaDOS签到`,
        { 
          status: 200,
          headers: { 'Content-Type': 'text/plain; charset=UTF-8' }
        }
      );
    }
    return new Response('Not Found', { status: 404 });
  },

  // 定义定时任务触发的处理函数
  async scheduled(event, env, ctx) {
    await initializeConfig(env);
    try {
      const result = await runCheckin();
      await sendTelegramNotification(`✅ 自动签到成功：\n${result.message}`);
    } catch (error) {
      await sendTelegramNotification(`❌ 自动签到失败：\n${error.message}`);
    }
  }
};

// 初始化配置
async function initializeConfig(env) {
  config = {
    COOKIES: env.GR_COOKIE ? env.GR_COOKIE.split('&') : config.COOKIES,
    TRIGGER_PATH: env.TRIGGER_PATH || config.TRIGGER_PATH,
    TG_BOT_TOKEN: env.TG_BOT_TOKEN || config.TG_BOT_TOKEN,
    TG_CHAT_ID: env.TG_CHAT_ID || config.TG_CHAT_ID,
    DOMAIN: env.DOMAIN || config.DOMAIN // 读取环境变量中的机场地址
  };
}

// 执行签到操作
async function checkin(cookie) {
  const checkin_url = "https://glados.rocks/api/user/checkin";
  const state_url = "https://glados.rocks/api/user/status";
  const referer = "https://glados.rocks/console/checkin";
  const origin = "https://glados.rocks";
  const useragent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.75 Safari/537.36";
  const payload = { token: "glados.one" };

  try {
    const checkinResponse = await fetch(checkin_url, {
      method: "POST",
      headers: {
        "cookie": cookie,
        "referer": referer,
        "origin": origin,
        "user-agent": useragent,
        "content-type": "application/json;charset=UTF-8",
      },
      body: JSON.stringify(payload),
    });

    const stateResponse = await fetch(state_url, {
      method: "GET",
      headers: {
        "cookie": cookie,
        "referer": referer,
        "origin": origin,
        "user-agent": useragent,
      },
    });

    const checkinData = await checkinResponse.json();
    const stateData = await stateResponse.json();

    let leftDays = stateData.data.leftDays;
    if (typeof leftDays !== "string") {
      leftDays = String(leftDays); // 确保是字符串
    }
    let remainTime = leftDays.split('.')[0]; // 取整数部分

    return {
      message: checkinData.message,
      remainDays: remainTime,
      email: stateData.data.email
    };
  } catch (error) {
    console.error("签到失败:", error);
    return null;
  }
}

// 执行所有的签到操作
async function runCheckin() {
  if (!config.COOKIES.length) {
    return { message: '未获取到GlaDOS账号Cookie' };
  }

  let results = [];
  for (let cookie of config.COOKIES) {
    const result = await checkin(cookie);
    if (result) {
      results.push(`账号：${maskString(result.email)}\n🎉 签到结果：${result.message}\n剩余天数：${result.remainDays}\n`);
    }
  }
  return { message: results.join('\n') };
}

// 发送 Telegram 通知
async function sendTelegramNotification(message) {
  const timeString = new Date().toLocaleString('zh-CN', { 
    timeZone: 'Asia/Shanghai',
    hour12: false 
  });

  const payload = {
    chat_id: config.TG_CHAT_ID,
    text: `🕒 执行时间: ${timeString}\n\n` +
          `🌐 机场地址: ${maskString(config.DOMAIN)}\n` +
          `${message}`,
    parse_mode: 'HTML',
    disable_web_page_preview: true
  };

  const telegramAPI = `https://api.telegram.org/bot${config.TG_BOT_TOKEN}/sendMessage`;
  
  try {
    const response = await fetch(telegramAPI, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      console.error('Telegram通知失败:', await response.text());
    }
  } catch (error) {
    console.error('Telegram通知异常:', error);
  }
}

// 用于隐藏账户信息的函数
function maskString(str, visibleStart = 2, visibleEnd = 2) {
  if (!str) return '';
  if (str.length <= visibleStart + visibleEnd) return str;
  return `${str.substring(0, visibleStart)}****${str.substring(str.length - visibleEnd)}`;
}

// 成功响应
function successResponse(data) {
  return new Response(data, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=UTF-8' }
  });
}

// 错误响应
function errorResponse(error) {
  return new Response(error.message, {
    status: 500,
    headers: { 'Content-Type': 'text/plain; charset=UTF-8' }
  });
}
