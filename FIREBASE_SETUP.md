# 📘 我的日常记录 - Firebase配置指南

## 📋 功能说明

你的应用现在支持：
- ✅ 邮箱注册/登录
- ✅ 个人数据云端存储
- ✅ 多设备数据同步
- ✅ 自动会话管理

## 🔧 Firebase配置步骤

### 第1步：创建Firebase项目

1. 访问 [Firebase控制台](https://console.firebase.google.com/)
2. 点击"添加项目"
3. 输入项目名称（例如：daily-tracker）
4. 按照提示完成项目创建

### 第2步：启用邮箱认证

1. 在Firebase控制台左侧菜单，点击 **"Authentication"**
2. 点击 **"Sign-in method"** 标签
3. 找到 **"Email/Password"**，点击进入
4. 开启 **"启用"** 开关
5. 点击 **"保存"**

### 第3步：创建Firestore数据库

1. 在左侧菜单，点击 **"Firestore Database"**
2. 点击 **"创建数据库"**
3. 选择 **"以测试模式启动"**（方便开发）
4. 选择离你最近的位置
5. 点击 **"启用"**

### 第4步：获取配置信息

1. 点击项目概览旁边的 **⚙️ 设置图标**
2. 选择 **"项目设置"**
3. 向下滚动到 **"您的应用"** 部分
4. 点击 **"</>" Web图标** 添加Web应用
5. 输入应用名称（例如：Daily Tracker Web）
6. 复制配置对象中的所有值

### 第5步：更新代码配置

打开 `script.js` 文件，找到顶部的 `firebaseConfig` 对象，将占位符替换为你的实际配置：

```javascript
const firebaseConfig = {
  apiKey: "你的API_KEY",
  authDomain: "你的PROJECT_ID.firebaseapp.com",
  projectId: "你的PROJECT_ID",
  storageBucket: "你的PROJECT_ID.appspot.com",
  messagingSenderId: "你的SENDER_ID",
  appId: "你的APP_ID"
};
```

## 📊 数据结构说明

数据存储在Firestore中的结构：

```
users (集合)
  └── {userId} (文档，用户ID)
      └── days (子集合)
          └── {date} (文档，日期如 "2024/1/15")
              ├── events: [
              │     { event, note, mood, timestamp }
              │   ]
              └── sleep: "8"
```

## 🔒 安全规则（可选）

在Firestore的"规则"标签中，可以设置更严格的安全规则：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 用户只能访问自己的数据
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🚀 使用流程

1. **首次使用**：点击"切换到注册"，输入邮箱和密码创建账号
2. **登录**：输入已注册的邮箱和密码
3. **记录数据**：所有数据会自动保存到云端
4. **多设备同步**：在其他设备登录同一账号，数据会自动同步
5. **退出登录**：点击用户信息栏的"退出"按钮

## ⚠️ 注意事项

1. **免费额度**：Firebase提供免费套餐，足够个人使用
   - Authentication: 每月10,000次验证
   - Firestore: 1GB存储，50,000次读取/天
   
2. **本地数据迁移**：如果你之前有localStorage数据，需要手动重新录入

3. **网络连接**：使用云端存储需要网络连接

4. **密码找回**：如需添加"忘记密码"功能，可以使用Firebase的 `sendPasswordResetEmail()` 方法

## 🎯 下一步优化建议

- 添加"记住我"功能
- 实现密码重置功能
- 添加数据导出/备份功能
- 实现离线缓存（配合Service Worker）
- 添加数据可视化图表

## 📞 遇到问题？

如果配置过程中遇到问题：
1. 检查浏览器控制台是否有错误信息
2. 确认Firebase配置信息是否正确
3. 确认已启用Email/Password认证方式
4. 检查Firestore数据库是否已创建