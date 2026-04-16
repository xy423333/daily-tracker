# 📘 Daily Tracker - AI情绪分析报告

一个个人日常记录追踪应用，支持心情、睡眠、饮食记录，并集成**免费AI情绪分析**功能。

## ✨ 主要功能

- 📝 日常记录（心情、睡眠、饮食）
- 📅 日历视图与情绪趋势图
- 🤖 **AI情绪分析报告**（基于最近7天数据，完全免费！）
- ☁️ Firebase云端同步（可选）
- 💾 本地存储模式（无需配置）

---

## 🚀 快速开始

### 1️⃣ 本地开发

```bash
# 克隆项目
git clone <your-repo-url>
cd daily-tracker

# 安装Vercel CLI（用于本地测试后端API）
npm install -g vercel

# 复制环境变量模板
cp .env.example .env.local

# 编辑 .env.local，填入你的 Hugging Face Token
# HF_API_TOKEN=hf_xxxxx

# 启动本地开发服务器
vercel dev
```

访问 `http://localhost:3000` 即可使用。

### 2️⃣ 生产部署（Vercel）

#### 步骤1：推送到GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

#### 步骤2：连接Vercel
1. 访问 [Vercel官网](https://vercel.com)
2. 点击 "New Project"
3. 导入你的GitHub仓库
4. 在 "Environment Variables" 中添加：
   - `HF_API_TOKEN`: 你的Hugging Face Token
5. 点击 "Deploy"

#### 步骤3：获取Hugging Face Token（免费）
- 访问 [Hugging Face Tokens页面](https://huggingface.co/settings/tokens)
- 注册/登录账号（免费）
- 点击 "Create new token"
- 选择 "Read" 权限
- 复制生成的Token（格式：`hf_xxxxx`）
- 粘贴到Vercel环境变量中

💰 **费用：完全免费！** 每月20,000次请求额度，个人使用绰绰有余。

---

## 🔧 技术栈

- **前端**: HTML5, CSS3, Vanilla JavaScript
- **图表**: Chart.js
- **后端**: Vercel Serverless Functions
- **数据库**: Firebase Firestore（可选）
- **认证**: Firebase Authentication（可选）
- **AI**: Hugging Face Inference API（免费）+ Qwen2.5模型

---

## 📁 项目结构

```
daily-tracker/
├── api/
│   └── ai.js              # Vercel Serverless函数（AI代理）
├── index.html             # 主页面
├── script.js              # 前端逻辑
├── style.css              # 样式文件
├── manifest.json          # PWA配置
├── sw.js                  # Service Worker
├── .env.example           # 环境变量模板
├── .env.local             # 本地环境变量（不提交到Git）
├── .gitignore             # Git忽略文件
└── README.md              # 本文件
```

---

## 🔐 安全说明

### ✅ 已实施的安全措施

1. **API Token保护**: Hugging Face Token存储在服务器端环境变量，前端无法获取
2. **后端代理**: 所有AI请求通过 `/api/ai` 后端接口
3. **环境变量隔离**: `.env.local` 已加入 `.gitignore`，不会泄露到Git

### ⚠️ 注意事项

- **永远不要**将 `.env.local` 提交到Git
- **永远不要**在前端代码中硬编码API Token
- 定期轮换Token以提高安全性

---

## 🤖 AI情绪分析功能

### 工作原理

1. 用户点击"生成AI报告"按钮
2. 前端提取最近7天的情绪数据
3. 构建提示词并发送到 `/api/ai`
4. 后端从环境变量读取Hugging Face Token
5. 调用Qwen2.5模型生成分析报告
6. 返回结果并显示给用户

### 报告内容

- 📊 整体情绪趋势分析
- 📉 情绪低谷或波动识别
- 💡 个性化建议（温暖鼓励风格）

### 使用的AI模型

- **模型**: Qwen/Qwen2.5-7B-Instruct（阿里通义千问）
- **优势**: 
  - 中文理解能力强
  - 完全免费（每月20,000次请求）
  - 响应速度快
  - 无需信用卡

---

## 🔥 Firebase配置（可选）

如需启用云端同步功能：

1. 在 [Firebase控制台](https://console.firebase.google.com) 创建项目
2. 启用Authentication和Firestore
3. 复制firebaseConfig到 `script.js` 顶部
4. 在Authentication设置中添加授权域名

详见 `script.js` 中的注释说明。

---

## 📱 移动端支持

- 响应式设计，适配手机屏幕
- PWA支持，可添加到主屏幕
- 离线可用（Service Worker缓存）

---

## 🛠 常见问题

### Q: 本地测试时API调用失败？
A: 确保已安装Vercel CLI并运行 `vercel dev`，且 `.env.local` 中配置了正确的Hugging Face Token。

### Q: 部署后仍然报错？
A: 检查Vercel控制台的 "Environment Variables" 是否正确设置了 `HF_API_TOKEN`。

### Q: 如何查看后端日志？
A: 在Vercel控制台选择你的项目，点击 "Functions" 标签页查看日志。

### Q: 首次调用很慢？
A: 正常现象！Hugging Face免费模型首次调用需要加载（约20秒），后续调用会很快。

### Q: 免费额度够用吗？
A: 每月20,000次请求，假设每天生成1次报告，可以用54年！完全够用。

### Q: 可以更换其他模型吗？
A: 可以！修改 `api/ai.js` 中的 `modelUrl` 和 `model` 参数即可。推荐模型：
   - `THUDM/chatglm3-6b`（清华智谱）
   - `Qwen/Qwen2.5-7B-Instruct`（当前使用）

---

## 💰 费用说明

| 服务 | 费用 | 说明 |
|------|------|------|
| Vercel | 免费 | 个人项目完全免费 |
| Hugging Face AI | 免费 | 每月20,000次请求 |
| Firebase | 免费 | 个人用量内免费 |
| **总计** | **¥0** | **完全免费！** |

---

## 📄 许可证

MIT License

---

## 💬 联系方式

如有问题或建议，欢迎提Issue！
