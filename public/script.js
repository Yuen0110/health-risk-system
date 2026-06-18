const API_URL = "http://localhost:3000/health-logs";

const form = document.getElementById("healthForm");
const logTable = document.getElementById("logTable");
const submitBtn = document.getElementById("submitBtn");
const cancelBtn = document.getElementById("cancelBtn");

// 載入所有健康日誌
async function loadLogs() {
  const response = await fetch(API_URL);
  const logs = await response.json();

  logTable.innerHTML = "";

  logs.forEach(log => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${log.log_date}</td>
      <td>${log.sleep_hours} 小時</td>
      <td>${log.steps} 步</td>
      <td>${log.mood_score} 分</td>
      <td><span class="${getRiskClass(log.risk_level)}">${log.risk_level}</span></td>
      <td>
        <button class="edit-btn" onclick="editLog(${log.id}, '${log.log_date}', ${log.sleep_hours}, ${log.steps}, ${log.mood_score})">修改</button>
        <button class="delete-btn" onclick="deleteLog(${log.id})">刪除</button>
      </td>
    `;

    logTable.appendChild(tr);
  });
}

// 根據風險等級套用不同顏色
function getRiskClass(riskLevel) {
  if (riskLevel === "低風險") {
    return "risk-low";
  } else if (riskLevel === "中風險") {
    return "risk-medium";
  } else if (riskLevel === "高風險") {
    return "risk-high";
  }
  return "";
}

// 新增或修改健康日誌
form.addEventListener("submit", async function (event) {
  event.preventDefault();

  const editId = document.getElementById("editId").value;

  const logData = {
    log_date: document.getElementById("log_date").value,
    sleep_hours: Number(document.getElementById("sleep_hours").value),
    steps: Number(document.getElementById("steps").value),
    mood_score: Number(document.getElementById("mood_score").value)
  };

  if (editId) {
    // 修改
    await fetch(`${API_URL}/${editId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(logData)
    });
  } else {
    // 新增
    await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(logData)
    });
  }

  form.reset();
  document.getElementById("editId").value = "";
  submitBtn.textContent = "新增日誌";
  cancelBtn.style.display = "none";

  loadLogs();
});

// 點修改時，把資料放回表單
function editLog(id, log_date, sleep_hours, steps, mood_score) {
  document.getElementById("editId").value = id;
  document.getElementById("log_date").value = log_date;
  document.getElementById("sleep_hours").value = sleep_hours;
  document.getElementById("steps").value = steps;
  document.getElementById("mood_score").value = mood_score;

  submitBtn.textContent = "確認修改";
  cancelBtn.style.display = "inline-block";

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

// 取消修改
function cancelEdit() {
  form.reset();
  document.getElementById("editId").value = "";
  submitBtn.textContent = "新增日誌";
  cancelBtn.style.display = "none";
}

// 刪除健康日誌
async function deleteLog(id) {
  const confirmDelete = confirm("確定要刪除這筆健康日誌嗎？");

  if (!confirmDelete) {
    return;
  }

  await fetch(`${API_URL}/${id}`, {
    method: "DELETE"
  });

  loadLogs();
}

// 頁面一打開就載入資料
loadLogs();