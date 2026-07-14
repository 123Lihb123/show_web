const CLOUD_API_URL = "/api";

let frequencyChart;
let fetchTimer = null;
let timeList = [];
let latData = [];
let lngData = [];
let altData = [];
let allRecord = [];

function initChart() {
  const ctx = document.getElementById("gpsChart").getContext("2d");
  frequencyChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "纬度",
          data: [],
          borderWidth: 1,
          pointRadius: 0.1,
          borderColor: "#f44336",
          tension: 0.3,
        },
        {
          label: "经度",
          data: [],
          borderWidth: 1,
          pointRadius: 0.1,
          borderColor: "#2196f3",
          tension: 0.3,
        },
        {
          label: "高度(m)",
          data: [],
          borderWidth: 1,
          pointRadius: 0.1,
          borderColor: "#4caf50",
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      animation: { duration: 0 },
      interaction: { intersect: false, mode: "index" },
      plugins: {
        legend: { position: "top" },
        title: {
          display: true,
          text: "GPS定位数据实时曲线",
          font: { size: 16 },
        },
      },
      scales: {
        x: {
          title: { display: true, text: "时间" },
          ticks: { maxTicksLimit: 10 },
        },
        y: { title: { display: true, text: "数值" } },
      },
    },
  });
}

function updateChart() {
  if (timeList.length > 0) {
    frequencyChart.data.labels = timeList.slice(-50);
    frequencyChart.data.datasets[0].data = latData.slice(-50);
    frequencyChart.data.datasets[1].data = lngData.slice(-50);
    frequencyChart.data.datasets[2].data = altData.slice(-50);
    frequencyChart.update("none");
  }
}

function updateStatus(msg, type = "info") {
  const box = document.getElementById("status-box");
  const now = new Date().toLocaleTimeString();
  box.innerHTML += `<br>[${now}] <span class="status-${type}">${msg}</span>`;
  box.scrollTop = box.scrollHeight;
}

function updateGPSInfo(data) {
  const info = document.getElementById("gpsInfo");
  if (data.valid) {
    info.innerHTML = `
      <strong>GPS定位成功！</strong><br>
      纬度: <span style="color:#f44336">${data.latitude.toFixed(6)}</span><br>
      经度: <span style="color:#2196f3">${data.longitude.toFixed(6)}</span><br>
      高度: <span style="color:#4caf50">${data.altitude.toFixed(1)}m</span><br>
      时间: ${data.time}
    `;
  } else {
    info.innerHTML = `<span class="status-error">GPS定位中...</span>`;
  }
}

async function fetchGPSData() {
  try {
    const response = await fetch(CLOUD_API_URL + "/gps/latest", {
      method: "GET",
      mode: "cors",
      cache: "no-cache",
    });

    if (!response.ok) {
      updateStatus("HTTP错误: " + response.status, "error");
      return;
    }

    const data = await response.json();

    const now = new Date().toLocaleTimeString();

    if (data.gps_valid) {
      timeList.push(now);
      latData.push(data.lat);
      lngData.push(data.lng);
      altData.push(data.alt);

      allRecord.push({
        time: now,
        latitude: data.lat,
        longitude: data.lng,
        altitude: data.alt,
      });

      updateGPSInfo({
        valid: true,
        latitude: data.lat,
        longitude: data.lng,
        altitude: data.alt,
        time: now,
      });
      updateChart();
    } else {
      updateGPSInfo({ valid: false });
    }
  } catch (error) {
    updateStatus("连接失败: " + error.message, "error");
  }
}

function startFetchGPS() {
  if (fetchTimer) return;

  updateStatus("开始获取GPS数据", "success");

  fetchTimer = setInterval(fetchGPSData, 1000);
}

function stopFetch() {
  if (!fetchTimer) return;

  clearInterval(fetchTimer);
  fetchTimer = null;

  if (allRecord.length > 0) {
    timeList = allRecord.map((item) => item.time);
    latData = allRecord.map((item) => item.latitude);
    lngData = allRecord.map((item) => item.longitude);
    altData = allRecord.map((item) => item.altitude);
    frequencyChart.data.labels = timeList;
    frequencyChart.data.datasets[0].data = latData;
    frequencyChart.data.datasets[1].data = lngData;
    frequencyChart.data.datasets[2].data = altData;
    frequencyChart.update("none");
  }

  updateStatus("已停止获取GPS数据", "info");
}

function downloadCsv() {
  let csv = "采集时间,纬度,经度,高度(m)\n";
  allRecord.forEach((item) => {
    csv += `${item.time},${item.latitude},${item.longitude},${item.altitude}\n`;
  });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "GPS定位数据.csv";
  a.click();
  URL.revokeObjectURL(url);
}

window.onload = function () {
  initChart();
  document.getElementById("start").onclick = startFetchGPS;
  document.getElementById("stop").onclick = stopFetch;
  document.getElementById("exportCsv").onclick = downloadCsv;
};