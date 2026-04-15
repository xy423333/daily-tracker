let selectedMood = "";
let selectedDate = new Date().toLocaleDateString();

// ⭐新增：日历月份状态
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth(); // 0-11

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
function addEvent() {
  const event = document.getElementById("event").value;
  const note = document.getElementById("note").value;

  if (!event) return alert("事件不能为空");

  let data = JSON.parse(localStorage.getItem("data")) || {};

  if (!data[selectedDate]) data[selectedDate] = { events: [], sleep: "" };

  data[selectedDate].events.push({ event, note, mood: selectedMood });

  localStorage.setItem("data", JSON.stringify(data));

  document.getElementById("event").value = "";
  document.getElementById("note").value = "";
  selectedMood = "";

  load();
}

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

  renderCalendar(data);
  bindMoodEvents(); // ⭐关键！！！
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
function renderCalendar(data) {
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
  switchTab("home");   // 先切页面
  load();              // 再加载数据
  bindMoodEvents();    // 绑定点击
};
/*if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}*/