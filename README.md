# GlaDOS 自动签到机器人

📦 一个基于 Cloudflare Workers 的 GlaDOS 自动签到工具，无需本地环境，直接通过 Cloudflare 网页控制台部署的自动签到服务，支持多账号管理和 Telegram 通知。

## 主要功能

- 🌩️ 纯网页部署 - 无需安装任何本地工具
- ⏰ 自动签到 - 支持定时任务配置
- 📱 通知提醒 - Telegram 消息推送
- 🔁 失败重试 - 内置自动重试机制
- 🔒 多账号支持 - 同时管理多个 GlaDOS 账号

## 准备事项

1. 有效的 Cloudflare 账号
2. GlaDOS 账号 Cookie（[获取方法](#获取cookie)）
3. [可选] Telegram Bot Token 和 Chat ID（[配置指南](#telegram-通知配置)）

## 网页端部署指南

### 步骤 1：创建 Worker
1. 登录 [Cloudflare 控制台](https://dash.cloudflare.com/)
2. 进入 Workers & Pages → 创建应用程序 → 点击Hello world 模板部署 Worker
3. 点击编辑代码，进行部署代码

### 步骤 2：粘贴代码
1. 在「Quick Edit」编辑器界面
2. 清空默认代码，粘贴[完整代码](https://github.com/ly921002/cf-glados-checkin/blob/main/worker.js)
3. 点击右上角「Save and Deploy」

### 步骤 3：配置环境变量
1. 进入 Worker 的 **Settings** > **Variables**
2. 添加以下环境变量：

| 变量名          | 必填 | 示例值                          | 说明说明                                                                 |
|-----------------|------|--------------------------------|-----------------------------------------------------------------------|
| GR_COOKIE       | 是   | cookie1&cookie2               | 多个Cookie用`&`分隔                                                   |
| TG_BOT_TOKEN    | 否   | 123456:ABC-DEF1234ghIkl-zyx57 | 从 @BotFather 获取的机器人 Token                                      |
| TG_CHAT_ID      | 否   | -1001234567890                | 个人聊天ID或频道ID                                                    |
| TRIGGER_PATH    | 否   | /my-checkin                   | 自定义触发路径（默认`/glados-checkin`）                               |

### 步骤 4：设置定时任务
1. 进入 **Triggers** 标签页
2. 在 **Cron Triggers** 部分添加触发规则：
   - 示例：`0 8 * * *` (每天UTC时间8:00执行)
   - 推荐：`0 8,20 * * *` (每日UTC 8:00和20:00执行)

### 步骤 5：部署生效
1. 点击右上角 **Save and Deploy**
2. 记录 Worker 的访问域名（格式：`xxx.your-subdomain.workers.dev`）

## 使用说明

### 手动触发
访问以下地址立即执行签到：
```
https://[你的worker域名]/glados-checkin
```

### 自动签到
根据配置的 Cron 规则自动执行，建议每日执行 1-2 次

### 响应结果
- 成功：返回签到状态和剩余天数
- 失败：返回错误信息（同时发送 Telegram 通知）

## 获取Cookie

1. 登录 [GlaDOS 控制台](https://glados.rocks/console/checkin)
2. 按 `F12` 打开开发者工具
3. 进入 **Network** 标签页
4. 刷新页面，复制任意请求中的 `Cookie` 请求头值
5. 完整格式应为：`koa:sess=xxxxxx; koa:sess.sig=xxxxxx`

## Telegram 通知配置

1. 创建机器人：
   - 向 [@BotFather](https://t.me/BotFather) 发送 `/newbot`
   - 按提示操作获取 `TG_BOT_TOKEN`

2. 获取 Chat ID：
   - 向 [@userinfobot](https://t.me/userinfobot) 发送任意消息
   - 复制返回的 `Id` 数值作为 `TG_CHAT_ID`

## 注意事项

⚠️ **敏感信息保护**  
Cookie 是账号凭证，请勿泄露给他人

⚡ **执行限制**  
免费版 Workers 每日限额 100,000 次请求

🌍 **时区设置**  
Cron 触发器使用 UTC 时区，请注意换算当地时间

🔧 **调试建议**  
首次部署后建议手动触发测试功能是否正常

## 常见问题

❓ **为什么收不到通知？**  
• 检查机器人是否已加入目标聊天  
• 确认环境变量名称全大写且拼写正确  
• 查看 Worker 日志排查错误

❓ **如何添加多个账号？**  
在 `GR_COOKIE` 变量中用英文 `&` 分隔多个 Cookie：
```
cookie1&cookie2&cookie3
```

❓ **签到结果不准确？**  
由于 GlaDOS API 限制，实际天数以控制台显示为准
```
