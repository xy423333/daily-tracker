let selectedMood = "";
let selectedDate = new Date().toLocaleDateString();

// ✅ 绑定心情点击
function bindMoodEvents() {
  document.querySelectorAll("#moodList span").forEach(span => {
    span.onclick = function () {
      document.querySelectorAll("#moodList span").forEach(s => s.classList.remove("selected"));
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

// 页面切换
function switchTab(tab) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".tabbar div").forEach(t => t.classList.remove("active"));

  document.querySelector(".page-" + tab).classList.add("active");
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
load();
switchTab("home");