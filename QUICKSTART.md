# 🚀 快速启动指南（免费AI版）

## 方式一：本地测试（推荐先试这个）

### 1. 安装Vercel CLI
```bash
npm install -g vercel
```

### 2. 获取Hugging Face Token（免费）
1. 访问 https://huggingface.co/settings/tokens
2. 注册/登录账号
3. 点击 "Create new token"
4. 选择 "Read" 权限
5. 复制Token（格式：`hf_xxxxx`）

### 3. 配置Token
编辑 `.env.local` 文件：
```
HF_API_TOKEN=hf_你的真实Token
```

### 4. 启动本地服务器
```bash
vercel dev
```

### 5. 访问应用
打开浏览器访问：`http://localhost:3000`

---

## 方式二：直接部署到Vercel（生产环境）

### 1. 推送到GitHub
```bash
git init
git add .
git commit -m "Add free AI report feature"
git branch -M main
git remote add origin https://github.com/your-username/daily-tracker.git
git push -u origin main
```

### 2. 在Vercel部署
1. 访问 https://vercel.com/new
2. 导入你的GitHub仓库
3. **重要**：在 "Environment Variables" 中添加：
   - Name: `HF_API_TOKEN`
   - Value: `hf_你的真实Token`
4. 点击 "Deploy"

### 3. 完成！
Vercel会自动分配一个域名，例如：`daily-tracker.vercel.app`

---

## 📝 获取Hugging Face Token（完全免费）

1. 访问 https://huggingface.co/settings/tokens
2. 注册账号（只需邮箱，无需信用卡）
3. 点击 "Create new token"
4. 输入名称（如 "daily-tracker"）
5. 选择 "Read" 权限
6. 点击 "Generate"
7. 复制生成的Token（格式：`hf_xxxxxxxxxx`）

💰 **费用：¥0** - 每月20,000次免费请求额度

---

## ⚠️ 常见问题

### 问题1：vercel dev 报错
**解决**：确保已全局安装Vercel CLI
```bash
npm install -g vercel
```

### 问题2：API调用失败，提示"HF_API_TOKEN未配置"
**解决**：
- 本地测试：检查 `.env.local` 文件是否存在且配置正确
- 生产环境：检查Vercel控制台的 "Environment Variables"

### 问题3：首次调用很慢（约20秒）
**解决**：正常现象！Hugging Face免费模型首次调用需要加载模型，后续调用会很快。

### 问题4：前端仍然显示配置提示
**解决**：刷新浏览器页面（Ctrl + Shift + R 强制刷新）

### 问题5：CORS错误
**解决**：确保使用 `vercel dev` 启动，而不是直接用Live Server

---

## 🎯 测试流程

1. ✅ 添加几条心情记录（至少3-7天）
2. ✅ 切换到"日期"标签页
3. ✅ 点击"📊 生成AI报告"按钮
4. ✅ 等待几秒（首次可能20秒），查看分析报告

---

## 🔐 安全提醒

- ✅ API Token存储在服务器端，前端无法获取
- ✅ `.env.local` 已加入 `.gitignore`，不会泄露
- ❌ 不要将 `.env.local` 提交到Git
- ❌ 不要在前端代码中硬编码Token

---

## 💡 优势对比

| 特性 | OpenAI | Hugging Face |
|------|--------|--------------|
| 费用 | 付费（$0.002/次） | **免费**（20,000次/月） |
| 需要信用卡 | 是 | **否** |
| 中文能力 | 好 | **更好**（Qwen模型） |
| 国内访问 | 需VPN | **更稳定** |
| 首次调用速度 | 快 | 慢（20秒加载） |
| 后续调用速度 | 快 | **快** |

**结论：Hugging Face完全适合个人使用，而且完全免费！** 🎉
