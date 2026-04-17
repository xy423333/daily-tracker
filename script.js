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

// ⭐新增：情绪映射（将emoji转换为数值）
const moodMap = {
  "😄": 5,
  "😊": 4,
  "😐": 3,
  "😢": 2,
  "😡": 1,
  "🥱": 2,
  "😍": 5
};

let moodChart = null; // ⭐新增：图表实例

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

// 添加事件（纯云端版 - 仅使用 Firestore）
async function addEvent() {
  const event = document.getElementById("event").value;
  const note = document.getElementById("note").value;

  if (!event) return alert("事件不能为空");
  if (!currentUser || !isFirebaseConfigured) return alert("请先登录");

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

    // 🔥 纯云端模式：只保存到Firestore
    const docRef = db.collection("users").doc(currentUser.uid).collection("days").doc(selectedDate);
    
    await docRef.set({
      date: selectedDate,
      events: firebase.firestore.FieldValue.arrayUnion(record),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    console.log("✅ 已保存到云端");

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
    alert("记录成功！（已同步到云端）");
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

// 删除（纯云端版）
async function deleteEvent(index) {
  console.log("🗑 开始删除记录，索引:", index, "日期:", selectedDate);
  console.log("   当前用户:", currentUser ? currentUser.email : "未登录");
  
  if (!currentUser || !isFirebaseConfigured) {
    alert("请先登录");
    return;
  }
  
  if (!confirm("确定要删除这条记录吗？")) {
    console.log("❌ 用户取消删除");
    return;
  }

  try {
    // 🔥 纯云端模式：只从Firestore删除
    console.log("🔄 云端模式：从Firestore删除...");
    const docRef = db.collection("users").doc(currentUser.uid).collection("days").doc(selectedDate);
    const doc = await docRef.get();
    
    if (doc.exists) {
      const data = doc.data();
      const events = data.events || [];
      
      console.log("   当前事件数量:", events.length);
      console.log("   要删除的索引:", index);
      
      if (index >= 0 && index < events.length) {
        console.log("   删除的事件:", events[index]);
        events.splice(index, 1);
        
        console.log("   删除后事件数量:", events.length);
        
        await docRef.set({
          events: events,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        console.log("   ✅ Firestore更新成功");
        console.log("✅ 已从云端删除");
      } else {
        console.error("❌ 索引超出范围:", index, "事件数量:", events.length);
        alert("删除失败：索引超出范围");
      }
    } else {
      console.error("❌ Firestore中无该日期数据");
      alert("删除失败：云端无该日期数据");
    }

    // 重新加载页面
    console.log("🔄 重新加载数据...");
    load();
  } catch (error) {
    console.error("❌ 删除失败:", error);
    alert("删除失败：" + error.message);
  }
}

// 睡眠（纯云端版）
async function saveSleep() {
  if (!currentUser || !isFirebaseConfigured) {
    alert("请先登录");
    return;
  }
  
  let sleep = document.getElementById("sleep").value;

  try {
    // 🔥 纯云端模式：只保存到Firestore独立字段
    const docRef = db.collection("users").doc(currentUser.uid).collection("days").doc(selectedDate);
    
    await docRef.set({
      sleep: sleep,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    console.log("✅ 睡眠记录已保存到云端");
    load();
  } catch (error) {
    console.error("保存睡眠失败:", error);
    alert("保存失败：" + error.message);
  }
}

// 点击日历
function selectDate(date) {
  selectedDate = date;
  // 跳转到日期详情页面
  switchTab("daydetail");
  loadDayDetail();
}

// 加载数据（纯云端版）
async function load() {
  if (!currentUser || !isFirebaseConfigured) {
    console.log("⚠️ 用户未登录，跳过数据加载");
    return;
  }
  
  let data = {};
  
  try {
    // 🔥 纯云端模式：只从Firestore加载
    const docRef = db.collection("users").doc(currentUser.uid).collection("days").doc(selectedDate);
    const doc = await docRef.get();
    
    if (doc.exists) {
      const docData = doc.data();
      data[selectedDate] = {
        events: docData.events || [],
        sleep: docData.sleep || "",
        sleepQuality: docData.sleepQuality || 0,
        diet: docData.diet || "",
        dietRating: docData.dietRating || 0
      };
      
      console.log("✅ 从云端加载数据");
    } else {
      console.log("ℹ️ 云端无该日期数据");
    }
  } catch (error) {
    console.error("❌ 云端加载失败:", error);
    alert("加载失败：" + error.message);
    return;
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
  
  // ⭐新增：渲染情绪趋势图
  renderMoodChart(data);
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

// ⭐新增：切换月份（旧版 - 已禁用）
/*
function changeMonth_OLD(offset) {
  currentMonth += offset;
  
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  } else if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }

  let data = JSON.parse(localStorage.getItem("data")) || {};
  renderCalendar(data);
}
*/

// ⭐新增：切换月份（新版 - 强制使用 Firebase，单一数据源）
async function changeMonth(offset) {
  // ⭐登录锁：必须登录后才能操作
  if (!currentUser || !isFirebaseConfigured) {
    alert("❌ 请先登录后再切换月份");
    return;
  }
  
  currentMonth += offset;
  
  // 处理跨年
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  } else if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }

  // 🔥 从云端加载数据并渲染日历
  try {
    const snapshot = await db.collection("users").doc(currentUser.uid).collection("days").get();
    const data = {};
    
    snapshot.forEach(doc => {
      data[doc.id] = doc.data();
    });
    
    renderCalendar(data);
    console.log("✅ 月份切换完成，从云端加载数据");
  } catch (error) {
    console.error("切换月份失败:", error);
    alert("切换失败：" + error.message);
  }
}

// 页面切换（重构版）
function switchTab(tab) {
  // 隐藏所有
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));

  // 取消按钮高亮（详情页不显示底部导航）
  if (tab !== "daydetail") {
    document.querySelectorAll(".tabbar div").forEach(t => t.classList.remove("active"));
  }

  // 显示对应页面
  document.querySelectorAll(".page-" + tab).forEach(p => {
    p.classList.add("active");
  });

  // 高亮按钮（详情页不显示底部导航）
  if (tab !== "daydetail") {
    const tabElement = document.getElementById("tab-" + tab);
    if (tabElement) {
      tabElement.classList.add("active");
    }
  }

  // 如果切换到个人页面，更新显示状态
  if (tab === "profile") {
    updateProfilePage();
  }

  // 🔥 如果切换到日历，从云端加载数据并渲染
  if (tab === "calendar") {
    // ⭐登录锁：必须登录后才能操作
    if (!currentUser || !isFirebaseConfigured) {
      console.log("⚠️ 用户未登录，跳过日历渲染");
      return;
    }
    
    // 从云端加载整个月份的数据
    (async () => {
      try {
        const snapshot = await db.collection("users").doc(currentUser.uid).collection("days").get();
        const data = {};
        
        snapshot.forEach(doc => {
          data[doc.id] = doc.data();
        });
        
        renderCalendar(data);
        console.log("✅ 月份切换完成，从云端加载数据");
      } catch (error) {
        console.error("切换月份失败:", error);
      }
    })();
  }
}

// 切换页面（旧版 - 已禁用）
/*
function switchTab_OLD(tab) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));

  if (tab !== "daydetail") {
    document.querySelectorAll(".tabbar div").forEach(t => t.classList.remove("active"));
  }

  document.querySelectorAll(".page-" + tab).forEach(p => {
    p.classList.add("active");
  });

  if (tab !== "daydetail") {
    const tabElement = document.getElementById("tab-" + tab);
    if (tabElement) {
      tabElement.classList.add("active");
    }
  }

  if (tab === "profile") {
    updateProfilePage();
  }

  if (tab === "calendar") {
    let data = JSON.parse(localStorage.getItem("data")) || {};
    renderCalendar(data);
  }
}
*/

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
    loadProfile(); // ⭐新增：加载个人信息
  } else {
    // 未登录
    authSection.style.display = "block";
    infoSection.style.display = "none";
  }
}

/**
 * 加载用户个人信息
 */
async function loadProfile() {
  if (!currentUser || !isFirebaseConfigured) return;

  try {
    const doc = await db.collection("users").doc(currentUser.uid).get();

    if (doc.exists) {
      const data = doc.data();

      // 填充表单
      document.getElementById("nickname").value = data.nickname || "";
      document.getElementById("bio").value = data.bio || "";

      console.log("✅ 个人信息加载成功");
    } else {
      console.log("ℹ️ 用户文档不存在，显示空表单");
    }
  } catch (error) {
    console.error("❌ 加载个人信息失败:", error);
  }
}

/**
 * 保存用户个人信息
 */
async function saveProfile() {
  if (!currentUser || !isFirebaseConfigured) {
    alert("请先登录");
    return;
  }

  const nickname = document.getElementById("nickname").value.trim();
  const bio = document.getElementById("bio").value.trim();

  try {
    // 保存到 Firestore
    await db.collection("users").doc(currentUser.uid).set({
      email: currentUser.email,
      nickname: nickname,
      bio: bio,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    alert("保存成功！");
    console.log("✅ 个人信息保存成功");
  } catch (error) {
    console.error("❌ 保存个人信息失败:", error);
    alert("保存失败：" + error.message);
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

// ⭐新增：提取每日情绪数据用于趋势图
function getMoodTrendData(data) {
  let trend = [];

  Object.keys(data).forEach(date => {
    const events = data[date].events || [];

    if (events.length > 0) {
      // 取当天最后一个心情记录
      const moodEvents = events.filter(e => e.mood);
      if (moodEvents.length > 0) {
        const lastMood = moodEvents[moodEvents.length - 1].mood;
        const score = moodMap[lastMood] || 3; // 默认值为3（中性）

        trend.push({
          date,
          score
        });
      }
    }
  });

  // 按时间排序
  trend.sort((a, b) => new Date(a.date) - new Date(b.date));

  return trend;
}

// ⭐新增：渲染情绪趋势图
function renderMoodChart(data) {
  const canvas = document.getElementById("moodChart");
  if (!canvas) return; // 如果canvas不存在，直接返回

  const trend = getMoodTrendData(data);

  if (trend.length === 0) {
    // 如果没有数据，销毁旧图表并返回
    if (moodChart) {
      moodChart.destroy();
      moodChart = null;
    }
    return;
  }

  const labels = trend.map(item => item.date);
  const scores = trend.map(item => item.score);

  const ctx = canvas.getContext("2d");

  // 销毁旧图表
  if (moodChart) {
    moodChart.destroy();
  }

  // 创建新图表
  moodChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "情绪趋势",
        data: scores,
        borderColor: "#007AFF",
        backgroundColor: "rgba(0, 122, 255, 0.1)",
        tension: 0.3,
        fill: true,
        pointBackgroundColor: "#007AFF",
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2,
      scales: {
        y: {
          min: 1,
          max: 5,
          ticks: {
            stepSize: 1,
            callback: function(value) {
              const emojis = {1: "😡", 2: "😢", 3: "😐", 4: "😊", 5: "😄"};
              return emojis[value] || "";
            }
          },
          grid: {
            color: "rgba(0, 0, 0, 0.05)"
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            maxRotation: 45,
            minRotation: 45
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const emojis = {1: "😡 愤怒", 2: "😢 难过", 3: "😐 平静", 4: "😊 开心", 5: "😄 兴奋"};
              return `情绪：${emojis[context.parsed.y] || "未知"}`;
            }
          }
        }
      }
    }
  });
}

// ⭐新增：添加睡眠记录（纯云端版 - 独立字段）
async function addSleepRecord() {
  if (!currentUser || !isFirebaseConfigured) {
    alert("请先登录");
    return;
  }
  
  const sleepHours = document.getElementById("sleep").value;
  
  if (!sleepHours) {
    alert("请输入睡眠时长");
    return;
  }

  try {
    // 🔥 纯云端模式：保存到Firestore独立字段
    const docRef = db.collection("users").doc(currentUser.uid).collection("days").doc(selectedDate);
    
    await docRef.set({
      sleep: sleepHours,
      sleepQuality: sleepQualityRating,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    console.log("✅ 睡眠记录已保存到云端");

    // 清空表单
    document.getElementById("sleep").value = "";
    sleepQualityRating = 0;
    document.querySelectorAll("#sleepQuality span").forEach(star => star.classList.remove("active"));

    load();
    alert("睡眠记录添加成功！（已同步到云端）");
  } catch (error) {
    console.error("添加睡眠记录失败:", error);
    alert("添加失败：" + error.message);
  }
}

// ⭐新增：添加饮食记录（纯云端版 - 独立字段）
async function addDietRecord() {
  if (!currentUser || !isFirebaseConfigured) {
    alert("请先登录");
    return;
  }
  
  const dietContent = document.getElementById("diet").value.trim();
  
  if (!dietContent) {
    alert("请输入饮食内容");
    return;
  }

  try {
    // 🔥 纯云端模式：保存到Firestore独立字段
    const docRef = db.collection("users").doc(currentUser.uid).collection("days").doc(selectedDate);
    
    await docRef.set({
      diet: dietContent,
      dietRating: dietRatingValue,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    console.log("✅ 饮食记录已保存到云端");

    // 清空表单
    document.getElementById("diet").value = "";
    dietRatingValue = 0;
    document.querySelectorAll("#dietRating span").forEach(star => star.classList.remove("active"));

    load();
    alert("饮食记录添加成功！（已同步到云端）");
  } catch (error) {
    console.error("添加饮食记录失败:", error);
    alert("添加失败：" + error.message);
  }
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

// 监听认证状态变化（纯云端版）
if (isFirebaseConfigured && auth) {
  auth.onAuthStateChanged(async (user) => {
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
      document.getElementById("userEmail").innerText = "未登录";
      document.getElementById("mainTabbar").style.display = "none"; // ⭐隐藏导航栏，强制登录
      updateProfilePage();
      switchTab("home");
      console.log("ℹ️ 未登录，请先登录");
    }
  });
} else {
  // Firebase未配置
  console.error("❌ Firebase未配置，请在script.js顶部配置您的Firebase信息");
  currentUser = null;
  document.getElementById("userEmail").innerText = "未配置";
  document.getElementById("mainTabbar").style.display = "none";
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

// ========================================
// 🤖 AI情绪分析报告功能
// ========================================

/**
 * 提取最近7天的情绪数据
 * @param {Object} data - 所有日期数据
 * @returns {Array} 最近7天的情绪数据数组
 */
function getRecentMoodData(data) {
  let result = [];

  Object.keys(data).forEach(date => {
    const dayData = data[date];
    
    // 处理不同数据结构（兼容本地和云端）
    let events = [];
    if (dayData.events && Array.isArray(dayData.events)) {
      events = dayData.events;
    } else if (Array.isArray(dayData)) {
      events = dayData;
    }

    if (events.length > 0) {
      // 获取当天的最后一条记录（通常是最新的情绪）
      const lastEvent = events[events.length - 1];
      
      result.push({
        date: date,
        mood: lastEvent.mood || "",
        note: lastEvent.note || "",
        event: lastEvent.event || ""
      });
    }
  });

  // 按日期排序
  result.sort((a, b) => new Date(a.date) - new Date(b.date));

  // 只取最近7天
  return result.slice(-7);
}

/**
 * 生成AI情绪分析报告（纯云端版）
 */
async function generateAIReport() {
  if (!currentUser || !isFirebaseConfigured) {
    alert("请先登录");
    return;
  }
  
  let data = {};

  try {
    // 🔥 纯云端模式：只从Firestore获取数据
    document.getElementById("aiReport").style.display = "block";
    document.getElementById("aiReport").innerText = "⏳ 正在从云端获取数据...";
    
    const snapshot = await db.collection("users").doc(currentUser.uid).collection("days").get();
    
    snapshot.forEach(doc => {
      data[doc.id] = doc.data();
    });
    
    console.log("✅ 已从云端获取数据:", Object.keys(data).length, "天");

    // 提取最近7天的情绪数据
    const moodData = getRecentMoodData(data);

    if (moodData.length === 0) {
      alert("❌ 没有足够的数据进行分析，请先添加一些记录");
      document.getElementById("aiReport").style.display = "none";
      return;
    }

    // 构建AI提示词
    const prompt = `
你是一个温暖的心理分析助手，请根据以下用户最近${moodData.length}天的情绪记录生成简短报告：

数据：
${JSON.stringify(moodData, null, 2)}

要求：
1. 总结整体情绪趋势（积极/消极/波动）
2. 指出情绪低谷或明显波动的日期
3. 给出1-2条温和、实用的建议
4. 语言风格：中文、简洁、温暖、鼓励性
5. 格式：使用emoji增强可读性，分段清晰

请生成报告：
`;

    document.getElementById("aiReport").style.display = "block";
    document.getElementById("aiReport").innerText = "🤖 AI正在分析中，请稍候...";

    // ✅ 安全方式：通过后端代理调用（API Key不会暴露）
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: prompt
      })
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || errorData.message || "API请求失败");
    }

    const responseData = await res.json();
    const reportText = responseData.report;

    // 显示报告
    document.getElementById("aiReport").innerText = reportText;
    console.log("✅ AI报告生成成功");

  } catch (err) {
    console.error("AI分析失败:", err);
    document.getElementById("aiReport").innerHTML = `
      <div style="color: #ff3b30; font-weight: bold;">❌ 分析失败</div>
      <p style="margin-top: 10px; color: #666;">错误信息：${err.message}</p>
      <p style="margin-top: 10px; color: #999; font-size: 14px;">
        可能原因：<br>
        • 后端服务未启动或未部署<br>
        • OPENAI_API_KEY未配置<br>
        • 网络连接问题<br>
        • API配额已用完
      </p>
    `;
  }
}

/*if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}*/

// ========================================
// 📅 日期详情页面功能
// ========================================

/**
 * 加载日期详情数据
 */
async function loadDayDetail() {
  // ⭐登录锁：必须登录后才能操作
  if (!currentUser || !isFirebaseConfigured) {
    alert("❌ 请先登录后再查看日期详情");
    return;
  }
  
  let data = {};
  
  try {
    // 🔥 只使用 Firebase Firestore 加载
    const docRef = db.collection("users").doc(currentUser.uid).collection("days").doc(selectedDate);
    const doc = await docRef.get();
    
    if (doc.exists) {
      const docData = doc.data();
      data[selectedDate] = {
        events: docData.events || [],
        sleep: docData.sleep || "",
        sleepQuality: docData.sleepQuality || 0,
        diet: docData.diet || "",
        dietRating: docData.dietRating || 0
      };
    }
    console.log("✅ 从云端加载日期详情");

    // 更新标题
    document.getElementById("detailDateTitle").innerText = "📅 " + selectedDate;

    // 渲染事件列表
    renderEventsList(data);
    
    // 渲染睡眠信息
    renderSleepInfo(data);
    
    // 渲染饮食信息
    renderDietInfo(data);

    // 默认显示事件标签
    switchDetailTab('events');

  } catch (error) {
    console.error("加载日期详情失败:", error);
    alert("加载失败：" + error.message);
  }
}

/**
 * 渲染事件列表
 */
function renderEventsList(data) {
  const container = document.getElementById("eventsList");
  container.innerHTML = "";

  const dayData = data[selectedDate];
  
  if (!dayData || !dayData.events || dayData.events.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📝</div>
        <div class="empty-text">暂无事件记录</div>
      </div>
    `;
    return;
  }

  dayData.events.forEach((event, index) => {
    const eventDiv = document.createElement("div");
    eventDiv.className = "event-item";
    
    let timeStr = "";
    if (event.timestamp) {
      const time = new Date(event.timestamp);
      timeStr = time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }

    eventDiv.innerHTML = `
      ${event.mood ? `<div class="event-mood">${event.mood}</div>` : ''}
      <div class="event-title">${event.event || ''}</div>
      ${event.note ? `<div class="event-note">${event.note}</div>` : ''}
      ${timeStr ? `<div class="event-time">🕐 ${timeStr}</div>` : ''}
      <div class="event-actions">
        <button class="edit-btn" onclick="editEvent(${index})">✏️ 编辑</button>
        <button class="delete-btn" onclick="deleteEventFromDetail(${index})">🗑 删除</button>
      </div>
    `;
    
    container.appendChild(eventDiv);
  });
}

/**
 * 渲染睡眠信息
 */
function renderSleepInfo(data) {
  const container = document.getElementById("sleepInfo");
  const dayData = data[selectedDate];

  if (!dayData || !dayData.sleep) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">😴</div>
        <div class="empty-text">暂无睡眠记录</div>
      </div>
    `;
    return;
  }

  const sleepHours = dayData.sleep;
  const sleepQuality = dayData.sleepQuality || 0;
  const stars = "⭐".repeat(sleepQuality) + "☆".repeat(5 - sleepQuality);

  container.innerHTML = `
    <div class="info-item">
      <div class="info-label">睡眠时长</div>
      <div class="info-value">${sleepHours} 小时</div>
    </div>
    <div class="info-item">
      <div class="info-label">睡眠质量</div>
      <div class="stars">${stars}</div>
    </div>
  `;
}

/**
 * 渲染饮食信息
 */
function renderDietInfo(data) {
  const container = document.getElementById("dietInfo");
  const dayData = data[selectedDate];

  if (!dayData || !dayData.diet) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🍽</div>
        <div class="empty-text">暂无饮食记录</div>
      </div>
    `;
    return;
  }

  const dietContent = dayData.diet;
  const dietRating = dayData.dietRating || 0;
  const stars = "⭐".repeat(dietRating) + "☆".repeat(5 - dietRating);

  container.innerHTML = `
    <div class="info-item">
      <div class="info-label">饮食内容</div>
      <div class="info-value" style="font-size: 16px; line-height: 1.6;">${dietContent}</div>
    </div>
    <div class="info-item">
      <div class="info-label">美味程度</div>
      <div class="stars">${stars}</div>
    </div>
  `;
}

/**
 * 切换详情页面标签
 */
function switchDetailTab(tabName) {
  // 更新导航栏状态
  document.querySelectorAll(".nav-item").forEach(item => {
    item.classList.remove("active");
  });
  document.getElementById("nav-" + tabName).classList.add("active");

  // 更新内容区域
  document.querySelectorAll(".content-section").forEach(section => {
    section.classList.remove("active");
  });
  document.getElementById("content-" + tabName).classList.add("active");
}

/**
 * 返回日历页面
 */
function backToCalendar() {
  switchTab("calendar");
}

// ========================================
// ✏️ 补录和编辑功能
// ========================================

// 弹窗状态管理
let modalMode = 'event'; // 'event', 'sleep', 'diet'
let editingIndex = -1; // -1表示新增，>=0表示编辑
let modalMoodValue = '';
let modalSleepQualityValue = 0;
let modalDietRatingValue = 0;

/**
 * 打开补录弹窗（事件）
 */
function addRecordInDetail() {
  modalMode = 'event';
  editingIndex = -1;
  
  document.getElementById("modalTitle").innerText = "➕ 补录事件";
  document.getElementById("modalSleepForm").style.display = "none";
  document.getElementById("modalDietForm").style.display = "none";
  document.getElementById("modalMoodList").style.display = "flex";
  
  // 清空表单
  document.getElementById("modalEvent").value = "";
  document.getElementById("modalNote").value = "";
  modalMoodValue = '';
  document.querySelectorAll("#modalMoodList span").forEach(s => s.classList.remove("selected"));
  
  // 显示弹窗
  document.getElementById("editModal").style.display = "flex";
}

/**
 * 编辑事件（纯云端版）
 */
async function editEvent(index) {
  if (!currentUser || !isFirebaseConfigured) {
    alert("请先登录");
    return;
  }
  
  try {
    // 🔥 纯云端模式：只从Firestore读取
    const docRef = db.collection("users").doc(currentUser.uid).collection("days").doc(selectedDate);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      alert("记录不存在");
      return;
    }
    
    const data = {};
    data[selectedDate] = doc.data();
    console.log("✅ 从云端加载编辑数据");
    
    const dayData = data[selectedDate];
    
    if (!dayData || !dayData.events || !dayData.events[index]) {
      alert("记录不存在");
      return;
    }
    
    const event = dayData.events[index];
    modalMode = 'event';
    editingIndex = index;
    
    document.getElementById("modalTitle").innerText = "✏️ 编辑事件";
    document.getElementById("modalSleepForm").style.display = "none";
    document.getElementById("modalDietForm").style.display = "none";
    document.getElementById("modalMoodList").style.display = "flex";
    
    // 填充表单
    document.getElementById("modalEvent").value = event.event || "";
    document.getElementById("modalNote").value = event.note || "";
    modalMoodValue = event.mood || '';
    
    // 选中心情
    document.querySelectorAll("#modalMoodList span").forEach(s => {
      s.classList.remove("selected");
      if (s.innerText === modalMoodValue) {
        s.classList.add("selected");
      }
    });
    
    // 显示弹窗
    document.getElementById("editModal").style.display = "flex";
  } catch (error) {
    console.error("加载编辑数据失败:", error);
    alert("加载失败：" + error.message);
  }
}

/**
 * 编辑睡眠记录（纯云端版）
 */
async function editSleepInDetail() {
  if (!currentUser || !isFirebaseConfigured) {
    alert("请先登录");
    return;
  }
  
  try {
    // 🔥 纯云端模式：只从Firestore读取
    const docRef = db.collection("users").doc(currentUser.uid).collection("days").doc(selectedDate);
    const doc = await docRef.get();
    
    let dayData = {};
    if (doc.exists) {
      dayData = doc.data();
      console.log("✅ 从云端加载睡眠编辑数据");
    }
    
    modalMode = 'sleep';
    editingIndex = -1;
    
    document.getElementById("modalTitle").innerText = dayData.sleep ? "✏️ 编辑睡眠" : "➕ 添加睡眠";
    document.getElementById("modalSleepForm").style.display = "block";
    document.getElementById("modalDietForm").style.display = "none";
    document.getElementById("modalMoodList").style.display = "none";
    
    // 填充表单
    document.getElementById("modalSleep").value = dayData.sleep || "";
    modalSleepQualityValue = dayData.sleepQuality || 0;
    
    // 更新星级显示
    updateModalSleepQualityStars();
    
    // 显示弹窗
    document.getElementById("editModal").style.display = "flex";
  } catch (error) {
    console.error("加载睡眠编辑数据失败:", error);
    alert("加载失败：" + error.message);
  }
}

/**
 * 编辑饮食记录（纯云端版）
 */
async function editDietInDetail() {
  if (!currentUser || !isFirebaseConfigured) {
    alert("请先登录");
    return;
  }
  
  try {
    // 🔥 纯云端模式：只从Firestore读取
    const docRef = db.collection("users").doc(currentUser.uid).collection("days").doc(selectedDate);
    const doc = await docRef.get();
    
    let dayData = {};
    if (doc.exists) {
      dayData = doc.data();
      console.log("✅ 从云端加载饮食编辑数据");
    }
    
    modalMode = 'diet';
    editingIndex = -1;
    
    document.getElementById("modalTitle").innerText = dayData.diet ? "✏️ 编辑饮食" : "➕ 添加饮食";
    document.getElementById("modalSleepForm").style.display = "none";
    document.getElementById("modalDietForm").style.display = "block";
    document.getElementById("modalMoodList").style.display = "none";
    
    // 填充表单
    document.getElementById("modalDiet").value = dayData.diet || "";
    modalDietRatingValue = dayData.dietRating || 0;
    
    // 更新星级显示
    updateModalDietRatingStars();
    
    // 显示弹窗
    document.getElementById("editModal").style.display = "flex";
  } catch (error) {
    console.error("加载饮食编辑数据失败:", error);
    alert("加载失败：" + error.message);
  }
}

/**
 * 选择弹窗中的心情
 */
function selectModalMood(mood) {
  modalMoodValue = mood;
  document.querySelectorAll("#modalMoodList span").forEach(s => {
    s.classList.remove("selected");
    if (s.innerText === mood) {
      s.classList.add("selected");
    }
  });
}

/**
 * 选择弹窗中的睡眠质量
 */
function selectModalSleepQuality(rating) {
  modalSleepQualityValue = rating;
  updateModalSleepQualityStars();
}

/**
 * 更新弹窗睡眠质量星级显示
 */
function updateModalSleepQualityStars() {
  document.querySelectorAll("#modalSleepQuality span").forEach((star, index) => {
    if (index < modalSleepQualityValue) {
      star.classList.add("active");
    } else {
      star.classList.remove("active");
    }
  });
}

/**
 * 选择弹窗中的饮食评分
 */
function selectModalDietRating(rating) {
  modalDietRatingValue = rating;
  updateModalDietRatingStars();
}

/**
 * 更新弹窗饮食评分星级显示
 */
function updateModalDietRatingStars() {
  document.querySelectorAll("#modalDietRating span").forEach((star, index) => {
    if (index < modalDietRatingValue) {
      star.classList.add("active");
    } else {
      star.classList.remove("active");
    }
  });
}

/**
 * 关闭弹窗
 */
function closeEditModal() {
  document.getElementById("editModal").style.display = "none";
  editingIndex = -1;
}

/**
 * 保存弹窗中的记录（纯云端版）
 */
async function saveModalRecord() {
  if (!currentUser || !isFirebaseConfigured) {
    alert("请先登录");
    return;
  }
  
  try {
    const docRef = db.collection("users").doc(currentUser.uid).collection("days").doc(selectedDate);
    
    if (modalMode === 'event') {
      // 保存事件
      const eventValue = document.getElementById("modalEvent").value.trim();
      if (!eventValue) {
        alert("事件不能为空");
        return;
      }
      
      const record = {
        event: eventValue,
        note: document.getElementById("modalNote").value,
        mood: modalMoodValue,
        timestamp: new Date().toISOString()
      };
      
      if (editingIndex >= 0) {
        // 编辑模式：先读取再更新
        const doc = await docRef.get();
        if (doc.exists) {
          const data = doc.data();
          const events = data.events || [];
          events[editingIndex] = record;
          
          await docRef.set({
            events: events,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        }
      } else {
        // 新增模式
        await docRef.set({
          events: firebase.firestore.FieldValue.arrayUnion(record),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }
      
    } else if (modalMode === 'sleep') {
      // 保存睡眠
      const sleepValue = document.getElementById("modalSleep").value;
      if (!sleepValue) {
        alert("睡眠时长不能为空");
        return;
      }
      
      await docRef.set({
        sleep: sleepValue,
        sleepQuality: modalSleepQualityValue,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      
    } else if (modalMode === 'diet') {
      // 保存饮食
      const dietValue = document.getElementById("modalDiet").value.trim();
      if (!dietValue) {
        alert("饮食内容不能为空");
        return;
      }
      
      await docRef.set({
        diet: dietValue,
        dietRating: modalDietRatingValue,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }
    
    // 关闭弹窗
    closeEditModal();
    
    // 重新加载详情页面
    loadDayDetail();
    
    alert("保存成功！（已同步到云端）");
    
  } catch (error) {
    console.error("保存失败:", error);
    alert("保存失败：" + error.message);
  }
}

/**
 * 从详情页删除事件（纯云端版）
 */
async function deleteEventFromDetail(index) {
  console.log("🗑 [详情页] 开始删除记录，索引:", index, "日期:", selectedDate);
  console.log("   当前用户:", currentUser ? currentUser.email : "未登录");
  
  if (!currentUser || !isFirebaseConfigured) {
    alert("请先登录");
    return;
  }
  
  if (!confirm("确定要删除这条记录吗？")) {
    console.log("❌ 用户取消删除");
    return;
  }
  
  try {
    // 🔥 纯云端模式：只从Firestore删除
    console.log("🔄 [详情页] 云端模式：从Firestore删除...");
    const docRef = db.collection("users").doc(currentUser.uid).collection("days").doc(selectedDate);
    const doc = await docRef.get();
    
    if (doc.exists) {
      const data = doc.data();
      const events = data.events || [];
      
      console.log("   当前事件数量:", events.length);
      console.log("   要删除的索引:", index);
      
      if (index >= 0 && index < events.length) {
        console.log("   删除的事件:", events[index]);
        events.splice(index, 1);
        
        console.log("   删除后事件数量:", events.length);
        
        await docRef.set({
          events: events,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        console.log("   ✅ Firestore更新成功");
        console.log("✅ [详情页] 已从云端删除");
      } else {
        console.error("❌ 索引超出范围:", index, "事件数量:", events.length);
        alert("删除失败：索引超出范围");
      }
    } else {
      console.error("❌ Firestore中无该日期数据");
      alert("删除失败：云端无该日期数据");
    }
    
    // 重新加载详情页面
    console.log("🔄 [详情页] 重新加载详情...");
    loadDayDetail();
  } catch (error) {
    console.error("❌ [详情页] 删除失败:", error);
    alert("删除失败：" + error.message);
  }
}
