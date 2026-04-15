// Firebase 配置 - 你需要替换成你自己的配置
// Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBbBQ1o-Vh38wKPYNJF2oddo0IG-V5-xJE",
  authDomain: "daily-tracker-18cf2.firebaseapp.com",
  projectId: "daily-tracker-18cf2",
  storageBucket: "daily-tracker-18cf2.firebasestorage.app",
  messagingSenderId: "134257074427",
  appId: "1:134257074427:web:a77a3625e7aba8e46d505e",
  measurementId: "G-0P44SBZDHY"
};

// Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

// 初始化 Firebase（Compat 版本）
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let selectedMood = "";
let selectedDate = new Date().toLocaleDateString();
let isLoginMode = true; // 登录/注册模式切换
let currentUser = null; // 当前用户

// ⭐新增：日历月份状态
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth(); // 0-11

// ✅ 监听认证状态变化
auth.onAuthStateChanged((user) => {
  if (user) {
    // 用户已登录
    currentUser = user;
    document.getElementById("userEmail").innerText = user.email;
    document.getElementById("mainTabbar").style.display = "flex";
    switchTab("home");
    load();
  } else {
    // 用户未登录
    currentUser = null;
    document.getElementById("mainTabbar").style.display = "none";
    showAuthPage();
  }
});

// 显示认证页面
function showAuthPage() {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelector(".page-auth").classList.add("active");
}

// 处理登录/注册
async function handleAuth() {
  const email = document.getElementById("authEmail").value;
  const password = document.getElementById("authPassword").value;
  const messageEl = document.getElementById("authMessage");
  
  if (!email || !password) {
    messageEl.innerText = "请填写邮箱和密码";
    return;
  }
  
  try {
    if (isLoginMode) {
      // 登录
      await auth.signInWithEmailAndPassword(email, password);
      messageEl.innerText = "";
    } else {
      // 注册
      await auth.createUserWithEmailAndPassword(email, password);
      messageEl.innerText = "";
    }
  } catch (error) {
    messageEl.innerText = getAuthErrorMessage(error.code);
  }
}

// 获取认证错误信息
function getAuthErrorMessage(errorCode) {
  const messages = {
    "auth/user-not-found": "该邮箱未注册",
    "auth/wrong-password": "密码错误",
    "auth/email-already-in-use": "该邮箱已被注册",
    "auth/invalid-email": "邮箱格式不正确",
    "auth/weak-password": "密码至少需要6个字符",
    "auth/too-many-requests": "尝试次数过多，请稍后再试"
  };
  return messages[errorCode] || "操作失败，请重试";
}

// 切换登录/注册模式
function toggleAuthMode() {
  isLoginMode = !isLoginMode;
  document.getElementById("authTitle").innerText = isLoginMode ? "🔐 登录" : "✨ 注册";
  document.getElementById("authButton").innerText = isLoginMode ? "登录" : "注册";
  document.getElementById("toggleAuthBtn").innerText = isLoginMode ? "切换到注册" : "切换到登录";
  document.getElementById("authMessage").innerText = "";
}

// 退出登录
function logout() {
  auth.signOut();
}

// ✅ 绑定心情点击
function bindMoodEvents() {
  document.querySelectorAll("#moodList span").forEach(span => {
    span.onclick = function () {
      console.log("点击:", this.innerText); // 调试

      document.querySelectorAll("#moodList span").forEach(s =>
        s.classList.remove("selected")
      );

      this.classList.add("selected");
      selectedMood = this.innerText;
    };
  });
}

// 添加事件
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
        mood: selectedMood,
        timestamp: new Date().toISOString()
      })
    }, { merge: true });

    document.getElementById("event").value = "";
    document.getElementById("note").value = "";
    selectedMood = "";

    load();
  } catch (error) {
    console.error("保存失败:", error);
    alert("保存失败，请检查网络连接");
  }
}

// 删除
async function deleteEvent(index) {
  if (!currentUser) return;
  
  try {
    const docRef = db.collection("users").doc(currentUser.uid).collection("days").doc(selectedDate);
    const doc = await docRef.get();
    
    if (doc.exists) {
      const data = doc.data();
      const events = data.events || [];
      events.splice(index, 1);
      
      await docRef.update({ events });
      load();
    }
  } catch (error) {
    console.error("删除失败:", error);
    alert("删除失败");
  }
}

// 睡眠
async function saveSleep() {
  let sleep = document.getElementById("sleep").value;
  if (!currentUser) return alert("请先登录");

  try {
    const docRef = db.collection("users").doc(currentUser.uid).collection("days").doc(selectedDate);
    
    await docRef.set({
      date: selectedDate,
      sleep: sleep
    }, { merge: true });
    
    load();
  } catch (error) {
    console.error("保存失败:", error);
    alert("保存失败");
  }
}

// 点击日历
function selectDate(date) {
  selectedDate = date;
  switchTab("home");
  load();
}

// 加载数据
async function load() {
  if (!currentUser) return;
  
  const list = document.getElementById("list");
  const title = document.getElementById("currentDateTitle");

  list.innerHTML = "";
  title.innerText = "📅 " + selectedDate;

  try {
    const docRef = db.collection("users").doc(currentUser.uid).collection("days").doc(selectedDate);
    const doc = await docRef.get();
    
    if (doc.exists) {
      const data = doc.data();
      const events = data.events || [];
      
      events.forEach((e, i) => {
        let li = document.createElement("li");
        li.innerHTML = `
          ${e.event} ${e.mood || ""}
          <br><small>${e.note || ""}</small>
          <button class="delete" onclick="deleteEvent(${i})">删除</button>
        `;
        list.appendChild(li);
      });

      document.getElementById("sleep").value = data.sleep || "";
    } else {
      document.getElementById("sleep").value = "";
    }
  } catch (error) {
    console.error("加载失败:", error);
  }

  renderCalendar();
  bindMoodEvents();
}

// 日历
// ⭐旧版代码已注释（倒序30天）
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

// ⭐新版：按月正序显示
async function renderCalendar() {
  if (!currentUser) return;
  
  const cal = document.getElementById("calendar");
  const monthTitle = document.getElementById("currentMonth");
  cal.innerHTML = "";

  // 更新月份标题
  monthTitle.innerText = `${currentYear}年${currentMonth + 1}月`;

  // 获取该月的天数
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // 正序遍历该月的每一天
  for (let day = 1; day <= daysInMonth; day++) {
    let d = new Date(currentYear, currentMonth, day);
    let key = d.toLocaleDateString();

    let mood = "";
    
    try {
      const docRef = db.collection("users").doc(currentUser.uid).collection("days").doc(key);
      const doc = await docRef.get();
      
      if (doc.exists) {
        const data = doc.data();
        if (data.events && data.events.length > 0) {
          mood = data.events[data.events.length - 1].mood;
        }
      }
    } catch (error) {
      console.error("加载日历数据失败:", error);
    }

    let div = document.createElement("div");
    div.className = "day";

    if (key === selectedDate) {
      div.classList.add("active");
    }

    div.onclick = () => selectDate(key);

    div.innerHTML = `
      <div class="date">${currentMonth + 1}/${day}</div>
      <div>${mood || ""}</div>
    `;

    cal.appendChild(div);
  }
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

  load(); // 重新加载日历
}

// 页面切换
function switchTab(tab) {
  // 隐藏所有
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));

  // 取消按钮高亮
  document.querySelectorAll(".tabbar div").forEach(t => t.classList.remove("active"));

  // ⭐关键：显示所有同类页面（不是一个）
  document.querySelectorAll(".page-" + tab).forEach(p => {
    p.classList.add("active");
  });

  // 高亮按钮
  document.getElementById("tab-" + tab).classList.add("active");
}

// 自定义心情
function addCustomMood() {
  const input = document.getElementById("customMood");
  const emoji = input.value.trim();

  if (!emoji) return alert("请输入emoji");

  const span = document.createElement("span");
  span.innerText = emoji;

  document.getElementById("moodList").appendChild(span);

  input.value = "";

  bindMoodEvents(); // ⭐重新绑定
}

// 初始化
window.onload = function () {
  // Firebase 会自动处理认证状态，不需要手动调用
  bindMoodEvents();
};

/*if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}*/