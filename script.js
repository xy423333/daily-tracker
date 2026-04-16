// Firebase配置 - 真实配置
const firebaseConfig = {
  apiKey: "AIzaSyBbBQ1o-Vh38wKPYNJF2oddo0IG-V5-xJE",
  authDomain: "daily-tracker-18cf2.firebaseapp.com",
  projectId: "daily-tracker-18cf2",
  storageBucket: "daily-tracker-18cf2.firebasestorage.app",
  messagingSenderId: "134257074427",
  appId: "1:134257074427:web:a77a3625e7aba8e46d505e",
  measurementId: "G-0P44SBZDHY"
};

// 检查Firebase配置是否有效
const isFirebaseConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY";

// 初始化Firebase（仅在配置有效时）
let db, auth;
if (isFirebaseConfigured) {
  try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    auth = firebase.auth();
    console.log("✅ Firebase初始化成功");
  } catch (error) {
    console.error("❌ Firebase初始化失败:", error);
  }
} else {
  console.warn("⚠️ Firebase未配置，将使用本地存储模式");
}

let selectedMood = "";
let selectedDate = new Date().toLocaleDateString();
let isLoginMode = true; // 登录/注册模式切换
let currentUser = null; // 当前用户
let selectedCategory = "mood"; // ⭐新增：当前选择的分类（mood/sleep/diet）
let sleepQualityRating = 0; // ⭐新增：睡眠质量星级
let dietRatingValue = 0; // ⭐新增：饮食美味星级

// ✅ 绑定心情点击（修复版）
function bindMoodEvents() {
  const moodSpans = document.querySelectorAll("#moodList span");
  moodSpans.forEach(span => {
    // 移除旧的事件监听器（防止重复绑定）
    span.onclick = null;
    
    span.onclick = function () {
      console.log("点击心情:", this.innerText);
      
      // 清除所有选中状态
      document.querySelectorAll("#moodList span").forEach(s =>
        s.classList.remove("selected")
      );

      // 设置当前选中
      this.classList.add("selected");
      selectedMood = this.innerText;
      
      console.log("已选择心情:", selectedMood);
    };
  });
  
  console.log("✅ 心情事件绑定完成，共", moodSpans.length, "个心情按钮");
}

// ⭐新增：添加自定义心情
function addCustomMood() {
  const customInput = document.getElementById("customMood");
  const customValue = customInput.value.trim();
  
  if (!customValue) {
    alert("请输入表情符号");
    return;
  }
  
  // 添加到心情列表
  const moodList = document.getElementById("moodList");
  const newSpan = document.createElement("span");
  newSpan.innerText = customValue;
  newSpan.onclick = function () {
    document.querySelectorAll("#moodList span").forEach(s =>
      s.classList.remove("selected")
    );
    this.classList.add("selected");
    selectedMood = this.innerText;
  };
  moodList.appendChild(newSpan);
  
  // 清空输入框
  customInput.value = "";
  
  // 自动选中新添加的心情
  newSpan.click();
  
  alert("已添加自定义心情：" + customValue);
}

// 显示认证页面（旧版，注释保留）
/*
function showAuthPage() {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelector(".page-auth").classList.add("active");
}
*/

// 添加事件（双模式版 - 支持本地和云端）
async function addEvent() {
  const event = document.getElementById("event").value;
  const note = document.getElementById("note").value;

  if (!event) return alert("事件不能为空");

  try {
    // 获取分类数据
    let categoryData = {};
    if (selectedCategory === "mood") {
      categoryData = { category: "mood", mood: selectedMood };
    } else if (selectedCategory === "sleep") {
      categoryData = { 
        category: "sleep", 
        sleep: document.getElementById("sleep").value,
        sleepQuality: sleepQualityRating // ⭐新增：睡眠质量星级
      };
    } else if (selectedCategory === "diet") {
      categoryData = { 
        category: "diet", 
        diet: document.getElementById("diet").value,
        dietRating: dietRatingValue // ⭐新增：饮食美味星级
      };
    }

    // 构建记录对象
    const record = {
      event,
      note,
      ...categoryData,
      timestamp: new Date().toISOString()
    };

    if (currentUser && isFirebaseConfigured) {
      // 🔥 云端模式：保存到Firestore
      const docRef = db.collection("users").doc(currentUser.uid).collection("days").doc(selectedDate);
      
      await docRef.set({
        date: selectedDate,
        events: firebase.firestore.FieldValue.arrayUnion(record),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      
      console.log("✅ 已保存到云端");
    } else {
      // 💾 本地模式：保存到localStorage
      let data = JSON.parse(localStorage.getItem("data")) || {};
      
      if (!data[selectedDate]) {
        data[selectedDate] = { events: [], sleep: "" };
      }
      
      data[selectedDate].events.push(record);
      localStorage.setItem("data", JSON.stringify(data));
      
      console.log("✅ 已保存到本地");
    }

    // 清空表单
    document.getElementById("event").value = "";
    document.getElementById("note").value = "";
    selectedMood = "";
    document.querySelectorAll("#moodList span").forEach(s => s.classList.remove("selected"));
    
    // 清空分类输入
    if (selectedCategory === "sleep") {
      document.getElementById("sleep").value = "";
      sleepQualityRating = 0;
      document.querySelectorAll("#sleepQuality span").forEach(star => star.classList.remove("active"));
    } else if (selectedCategory === "diet") {
      document.getElementById("diet").value = "";
      dietRatingValue = 0;
      document.querySelectorAll("#dietRating span").forEach(star => star.classList.remove("active"));
    }

    load();
    alert("记录成功！" + (currentUser && isFirebaseConfigured ? "（已同步到云端）" : "（本地存储）"));
  } catch (error) {
    console.error("添加记录失败:", error);
    alert("添加失败：" + error.message);
  }
}

// 添加事件（旧版 Firebase 代码，注释保留）
/*
async function addEvent() {
  const event = document.getElementById("event").value;
  const note = document.getElementById("note").value;

  if (!event) return alert("事件不能为空");
  if (!currentUser) return alert("请先登录");

  try {
    // 保存到 Firestore
    const docRef = db.collection("users").doc(currentUser.uid).collection("days").doc(selectedDate);
    
    await docRef.set({
      date: selectedDate,
      events: firebase.firestore.FieldValue.arrayUnion({
        event,
        note,
        mood: selectedMood
      }),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    document.getElementById("event").value = "";
    document.getElementById("note").value = "";
    selectedMood = "";

    load();
    alert("记录成功！");
  } catch (error) {
    console.error("添加记录失败:", error);
    alert("添加失败：" + error.message);
  }
}
*/

// 删除（双模式版）
async function deleteEvent(index) {
  if (!confirm("确定要删除这条记录吗？")) return;

  try {
    if (currentUser && isFirebaseConfigured) {
      // 🔥 云端模式：从Firestore删除
      const docRef = db.collection("users").doc(currentUser.uid).collection("days").doc(selectedDate);
      const doc = await docRef.get();
      
      if (doc.exists) {
        const data = doc.data();
        const events = data.events || [];
        
        if (index >= 0 && index < events.length) {
          events.splice(index, 1);
          
          await docRef.set({
            events: events,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
          
          console.log("✅ 已从云端删除");
        }
      }
    } else {
      // 💾 本地模式：从localStorage删除
      let data = JSON.parse(localStorage.getItem("data")) || {};
      
      if (data[selectedDate] && data[selectedDate].events) {
        data[selectedDate].events.splice(index, 1);
        localStorage.setItem("data", JSON.stringify(data));
        console.log("✅ 已从本地删除");
      }
    }

    load();
  } catch (error) {
    console.error("删除失败:", error);
    alert("删除失败：" + error.message);
  }
}

// 睡眠
function saveSleep() {
  let sleep = document.getElementById("sleep").value;

  let data = JSON.parse(localStorage.getItem("data")) || {};

  if (!data[selectedDate]) data[selectedDate] = { events: [], sleep: "" };

  data[selectedDate].sleep = sleep;

  localStorage.setItem("data", JSON.stringify(data));
  load();
}

// 点击日历
function selectDate(date) {
  selectedDate = date;
  switchTab("home");
  load();
}

// 加载数据（双模式版）
async function load() {
  let data = {};
  
  if (currentUser && isFirebaseConfigured) {
    // 🔥 云端模式：从Firestore加载
    try {
      const docRef = db.collection("users").doc(currentUser.uid).collection("days").doc(selectedDate);
      const doc = await docRef.get();
      
      if (doc.exists) {
        const docData = doc.data();
        data[selectedDate] = {
          events: docData.events || [],
          sleep: ""
        };
      }
      console.log("✅ 从云端加载数据");
    } catch (error) {
      console.error("云端加载失败，切换到本地:", error);
      // 降级到本地存储
      data = JSON.parse(localStorage.getItem("data")) || {};
    }
  } else {
    // 💾 本地模式：从localStorage加载
    data = JSON.parse(localStorage.getItem("data")) || {};
    console.log("✅ 从本地加载数据");
  }

  const list = document.getElementById("list");
  const title = document.getElementById("currentDateTitle");

  list.innerHTML = "";
  title.innerText = "📅 " + selectedDate;

  if (data[selectedDate]) {
    data[selectedDate].events.forEach((e, i) => {
      let li = document.createElement("li");
      li.innerHTML = `
        ${e.event} ${e.mood || ""}
        <br><small>${e.note || ""}</small>
        <button class="delete" onclick="deleteEvent(${i})">删除</button>
      `;
      list.appendChild(li);
    });

    document.getElementById("sleep").value = data[selectedDate].sleep || "";
  } else {
    document.getElementById("sleep").value = "";
  }

  bindMoodEvents(); // ⭐关键：重新绑定心情事件
}

// 日历（旧版代码，注释保留）
/*
function renderCalendar(data) {
  const cal = document.getElementById("calendar");
  cal.innerHTML = "";

  for (let i = 0; i < 30; i++) {
    let d = new Date();
    d.setDate(d.getDate() - i);

    let key = d.toLocaleDateString();

    let mood = "";
    if (data[key] && data[key].events.length > 0) {
      mood = data[key].events[data[key].events.length - 1].mood;
    }

    let div = document.createElement("div");
    div.className = "day";

    if (key === selectedDate) {
      div.classList.add("active");
    }

    div.onclick = () => selectDate(key);

    div.innerHTML = `
      <div class="date">${d.getMonth()+1}/${d.getDate()}</div>
      <div>${mood || ""}</div>
    `;

    cal.appendChild(div);
  }
}
*/

// ⭐新版：按月正序显示（优化版）
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth(); // 0-11

// 渲染日历
function renderCalendar(data) {
  const cal = document.getElementById("calendar");
  const monthTitle = document.getElementById("currentMonth");
  
  // 清空日历
  cal.innerHTML = "";
  
  // 更新月份标题
  monthTitle.innerText = `${currentYear}年${currentMonth + 1}月`;

  // 获取该月的第一天是星期几（0=周日，1=周一...）
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  // 获取该月的天数
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // 使用 DocumentFragment 批量操作，提升性能
  const fragment = document.createDocumentFragment();

  // 添加空白占位（第一天之前的空白天数）
  for (let i = 0; i < firstDay; i++) {
    let emptyDiv = document.createElement("div");
    emptyDiv.className = "day empty";
    fragment.appendChild(emptyDiv);
  }

  // 正序遍历该月的每一天
  for (let day = 1; day <= daysInMonth; day++) {
    let d = new Date(currentYear, currentMonth, day);
    let key = d.toLocaleDateString();

    let mood = "";
    if (data[key] && data[key].events && data[key].events.length > 0) {
      mood = data[key].events[data[key].events.length - 1].mood;
    }

    let div = document.createElement("div");
    div.className = "day";

    if (key === selectedDate) {
      div.classList.add("active");
    }

    div.onclick = () => selectDate(key);

    div.innerHTML = `
      <div class="date">${day}</div>
      <div class="mood-icon">${mood || ""}</div>
    `;

    fragment.appendChild(div);
  }

  // 一次性添加所有元素到 DOM
  cal.appendChild(fragment);
}

// ⭐新增：切换月份
function changeMonth(offset) {
  currentMonth += offset;
  
  // 处理跨年
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  } else if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }

  // 重新渲染日历
  let data = JSON.parse(localStorage.getItem("data")) || {};
  renderCalendar(data);
}

// 页面切换（重构版）
function switchTab(tab) {
  // 隐藏所有
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));

  // 取消按钮高亮
  document.querySelectorAll(".tabbar div").forEach(t => t.classList.remove("active"));

  // 显示对应页面
  document.querySelectorAll(".page-" + tab).forEach(p => {
    p.classList.add("active");
  });

  // 高亮按钮
  const tabElement = document.getElementById("tab-" + tab);
  if (tabElement) {
    tabElement.classList.add("active");
  }

  // 如果切换到个人页面，更新显示状态
  if (tab === "profile") {
    updateProfilePage();
  }

  // 如果切换到日历，重新渲染
  if (tab === "calendar") {
    let data = JSON.parse(localStorage.getItem("data")) || {};
    renderCalendar(data);
  }
}

// ⭐新增：分类选择（修复版）
function selectCategory(category) {
  selectedCategory = category;
  
  // 隐藏所有模块
  document.getElementById("moodSection").style.display = "none";
  document.getElementById("sleepSection").style.display = "none";
  document.getElementById("dietSection").style.display = "none";
  
  // ⭐新增：控制事件和感想区域的显隐
  const eventSection = document.getElementById("eventSection");
  
  // 显示对应模块
  if (category === "mood") {
    document.getElementById("moodSection").style.display = "block";
    eventSection.style.display = "block"; // ⭐心情分类：显示事件区域
  } else if (category === "sleep") {
    document.getElementById("sleepSection").style.display = "block";
    eventSection.style.display = "none"; // ⭐睡眠分类：隐藏事件区域
  } else if (category === "diet") {
    document.getElementById("dietSection").style.display = "block";
    eventSection.style.display = "none"; // ⭐饮食分类：隐藏事件区域
  }
  
  // ⭐关键：重新绑定心情事件（确保点击有效）
  if (category === "mood") {
    setTimeout(() => bindMoodEvents(), 100);
  }
  
  console.log("✅ 选择分类:", category);
}

// ⭐新增：更新个人页面显示
function updateProfilePage() {
  const authSection = document.getElementById("profileAuth");
  const infoSection = document.getElementById("profileInfo");
  
  if (currentUser) {
    // 已登录
    authSection.style.display = "none";
    infoSection.style.display = "block";
    document.getElementById("profileEmail").innerText = currentUser.email;
  } else {
    // 未登录
    authSection.style.display = "block";
    infoSection.style.display = "none";
  }
}

// ⭐新增：选择睡眠质量星级
function selectSleepQuality(rating) {
  sleepQualityRating = rating;
  
  // 更新星星显示
  document.querySelectorAll("#sleepQuality span").forEach((star, index) => {
    if (index < rating) {
      star.classList.add("active");
    } else {
      star.classList.remove("active");
    }
  });
  
  console.log("睡眠质量评分:", rating);
}

// ⭐新增：选择饮食星级
function selectDietRating(rating) {
  dietRatingValue = rating;
  
  // 更新星星显示
  document.querySelectorAll("#dietRating span").forEach((star, index) => {
    if (index < rating) {
      star.classList.add("active");
    } else {
      star.classList.remove("active");
    }
  });
  
  console.log("饮食美味评分:", rating);
}

// ⭐新增：处理登录/注册（修复版）
async function handleAuth() {
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value;
  const messageEl = document.getElementById("authMessage");
  
  // 验证输入
  if (!email || !password) {
    messageEl.innerText = "请填写邮箱和密码";
    return;
  }
  
  if (!isFirebaseConfigured) {
    messageEl.innerText = "⚠️ Firebase未配置，无法使用登录功能。请在script.js中配置您的Firebase信息。";
    return;
  }

  try {
    messageEl.innerText = "处理中...";
    
    if (isLoginMode) {
      // 登录
      await auth.signInWithEmailAndPassword(email, password);
      console.log("✅ 登录成功");
    } else {
      // 注册
      await auth.createUserWithEmailAndPassword(email, password);
      console.log("✅ 注册成功");
    }
    
    messageEl.innerText = "";
  } catch (error) {
    console.error("认证失败:", error);
    
    // 友好的错误提示
    let errorMsg = "操作失败：";
    switch (error.code) {
      case "auth/user-not-found":
        errorMsg += "用户不存在，请检查邮箱或切换到注册";
        break;
      case "auth/wrong-password":
        errorMsg += "密码错误";
        break;
      case "auth/email-already-in-use":
        errorMsg += "该邮箱已被注册，请直接登录";
        break;
      case "auth/weak-password":
        errorMsg += "密码至少6位";
        break;
      case "auth/invalid-email":
        errorMsg += "邮箱格式不正确";
        break;
      case "auth/network-request-failed":
        errorMsg += "网络连接失败，请检查网络或VPN";
        break;
      default:
        errorMsg += error.message;
    }
    
    messageEl.innerText = errorMsg;
  }
}

// ⭐新增：切换登录/注册模式
function toggleAuthMode() {
  isLoginMode = !isLoginMode;
  
  const titleEl = document.getElementById("authTitle");
  const buttonEl = document.getElementById("authButton");
  const toggleBtnEl = document.getElementById("toggleAuthBtn");
  
  if (isLoginMode) {
    titleEl.innerText = "🔐 登录";
    buttonEl.innerText = "登录";
    toggleBtnEl.innerText = "切换到注册";
  } else {
    titleEl.innerText = "📝 注册";
    buttonEl.innerText = "注册";
    toggleBtnEl.innerText = "切换到登录";
  }
  
  // 清空消息
  document.getElementById("authMessage").innerText = "";
}

// ⭐新增：退出登录
async function logout() {
  if (!isFirebaseConfigured) {
    alert("Firebase未配置");
    return;
  }
  
  try {
    await auth.signOut();
    console.log("✅ 已退出登录");
  } catch (error) {
    console.error("退出失败:", error);
    alert("退出失败：" + error.message);
  }
}

// 监听认证状态变化（修复版）
if (isFirebaseConfigured && auth) {
  auth.onAuthStateChanged((user) => {
    if (user) {
      // 用户已登录
      currentUser = user;
      document.getElementById("userEmail").innerText = user.email;
      document.getElementById("mainTabbar").style.display = "flex";
      updateProfilePage();
      switchTab("home");
      load();
      console.log("✅ 用户已登录:", user.email);
    } else {
      // 用户未登录
      currentUser = null;
      document.getElementById("userEmail").innerText = "未登录（本地模式）";
      document.getElementById("mainTabbar").style.display = "flex"; // ⭐显示导航栏，允许使用
      updateProfilePage();
      switchTab("home");
      load();
      console.log("ℹ️ 未登录，使用本地存储模式");
    }
  });
} else {
  // Firebase未配置，直接使用本地模式
  console.warn("⚠️ Firebase未配置，应用将以本地模式运行");
  currentUser = null;
  document.getElementById("userEmail").innerText = "未登录（本地模式）";
  document.getElementById("mainTabbar").style.display = "flex";
  updateProfilePage();
}

// 初始化
window.onload = function () {
  console.log("🚀 应用初始化...");
  
  // 检查Firebase配置状态
  if (!isFirebaseConfigured) {
    console.warn("⚠️ Firebase未配置，请在script.js顶部配置您的Firebase信息以启用云端同步");
  }
  
  switchTab("home");   // 先切页面
  load();              // 再加载数据
  bindMoodEvents();    // 绑定心情点击
  
  console.log("✅ 应用初始化完成");
};
/*if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}*/