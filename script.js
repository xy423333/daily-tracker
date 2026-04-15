let selectedMood = "";
let selectedDate = new Date().toLocaleDateString();
let isLoginMode = true; // 登录/注册模式切换
let currentUser = null; // 当前用户
let selectedCategory = "mood"; // ⭐新增：当前选择的分类（mood/sleep/diet）
let sleepQualityRating = 0; // ⭐新增：睡眠质量星级
let dietRatingValue = 0; // ⭐新增：饮食美味星级

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

// 显示认证页面（旧版，注释保留）
/*
function showAuthPage() {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelector(".page-auth").classList.add("active");
}
*/

// 添加事件（重构版 - 带星级评价）
async function addEvent() {
  const event = document.getElementById("event").value;
  const note = document.getElementById("note").value;

  if (!event) return alert("事件不能为空");
  if (!currentUser) return alert("请先登录");

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

    // 保存到 Firestore
    const docRef = db.collection("users").doc(currentUser.uid).collection("days").doc(selectedDate);
    
    await docRef.set({
      date: selectedDate,
      events: firebase.firestore.FieldValue.arrayUnion({
        event,
        note,
        mood: selectedMood,
        ...categoryData // ⭐合并分类数据
      }),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    document.getElementById("event").value = "";
    document.getElementById("note").value = "";
    selectedMood = "";
    
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
    alert("记录成功！");
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

// 删除
function deleteEvent(index) {
  let data = JSON.parse(localStorage.getItem("data")) || {};
  data[selectedDate].events.splice(index, 1);
  localStorage.setItem("data", JSON.stringify(data));
  load();
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

// 加载数据
function load() {
  let data = JSON.parse(localStorage.getItem("data")) || {};
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

  bindMoodEvents(); // ⭐关键！！！
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

// ⭐新增：分类选择
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
  
  console.log("选择分类:", category);
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

// 监听认证状态变化（重构版）
auth.onAuthStateChanged((user) => {
  if (user) {
    // 用户已登录
    currentUser = user;
    document.getElementById("userEmail").innerText = user.email;
    document.getElementById("mainTabbar").style.display = "flex";
    updateProfilePage();
    switchTab("home");
    load();
  } else {
    // 用户未登录
    currentUser = null;
    document.getElementById("mainTabbar").style.display = "none";
    updateProfilePage();
    switchTab("profile");
  }
});

// 初始化
window.onload = function () {
  switchTab("home");   // 先切页面
  load();              // 再加载数据
  bindMoodEvents();    // 绑定点击
};
/*if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}*/