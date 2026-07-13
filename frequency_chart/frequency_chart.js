let frequencyChart;
let fetchTimer = null;
let chartUpdateTimer = null;
const CLOUD_API_URL = "/api";
const MAX_SHOW = 200;
const CHART_UPDATE_INTERVAL = 50;

let timeList = [];
let xData = [];
let yData = [];
let zData = [];
let allRecord = [];

let pendingX = [];
let pendingY = [];
let pendingZ = [];
let pendingTime = [];

function initChart() {
  const ctx = document.getElementById("frequency_Chart").getContext("2d");
  frequencyChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: timeList,
      datasets: [
        {
          label: "X轴加速度",
          data: xData,
          borderWidth: 1,
          pointRadius: 0.1,
          pointHoverRadius: 4,
          fill: false,
          borderColor: "#f44336",
          tension: 0.1,
        },
        {
          label: "Y轴加速度",
          data: yData,
          borderWidth: 1,
          pointRadius: 0.1,
          pointHoverRadius: 4,
          fill: false,
          borderColor: "#2196f3",
          tension: 0.1,
        },
        {
          label: "Z轴加速度",
          data: zData,
          borderWidth: 1,
          pointRadius: 0.1,
          pointHoverRadius: 4,
          fill: false,
          borderColor: "#4caf50",
          tension: 0.1,
        },
      ],
    },
    options: {
      responsive: true,
      animation: { duration: 0 },
      interaction: { intersect: false, mode: "index" },
      plugins: {
        legend: { position: "top" },
        zoom: {
          pan: {
            enabled: true,
            mode: "x",
          },
          zoom: {
            wheel: { enabled: true },
            pinch: { enabled: true },
            mode: "x",
          },
        },
      },
      scales: {
        x: {
          title: { display: true, text: "采集时间" },
          ticks: { maxTicksLimit: 6 },
        },
        y: {
          title: { display: true, text: "加速度 g" },
          suggestedMin: -5,
          suggestedMax: 5,
        },
      },
    },
  });
}

function updateChart() {
  if (pendingX.length === 0) return;

  timeList.push(...pendingTime);
  xData.push(...pendingX);
  yData.push(...pendingY);
  zData.push(...pendingZ);

  pendingX = [];
  pendingY = [];
  pendingZ = [];
  pendingTime = [];

  while (timeList.length > MAX_SHOW) {
    timeList.shift();
    xData.shift();
    yData.shift();
    zData.shift();
  }

  frequencyChart.data.labels = timeList;
  frequencyChart.data.datasets[0].data = xData;
  frequencyChart.data.datasets[1].data = yData;
  frequencyChart.data.datasets[2].data = zData;
  frequencyChart.update("none");
}

function addNewData(x, y, z) {
  const now = new Date();
  const timeStr =
    now.toLocaleTimeString() +
    "." +
    String(now.getMilliseconds()).padStart(3, "0");
  pendingTime.push(timeStr);
  pendingX.push(x);
  pendingY.push(y);
  pendingZ.push(z);
  allRecord.push({ time: timeStr, X: x, Y: y, Z: z });
}

function updateStatus(msg, type) {
  const box = document.getElementById("status-box");
  const now = new Date().toLocaleTimeString();
  box.innerHTML = `<span class="status-${type}">[${now}] ${msg}</span>`;
}

function startFetchESP32() {
  if (fetchTimer) return;

  timeList = [];
  xData = [];
  yData = [];
  zData = [];
  allRecord = [];
  pendingX = [];
  pendingY = [];
  pendingZ = [];
  pendingTime = [];

  frequencyChart.data.labels = [];
  frequencyChart.data.datasets[0].data = [];
  frequencyChart.data.datasets[1].data = [];
  frequencyChart.data.datasets[2].data = [];
  frequencyChart.update("none");

  updateStatus("开始从云端获取数据", "info");

  fetchTimer = setInterval(async () => {
    try {
      const res = await fetch(CLOUD_API_URL + "/latest", {
        method: "GET",
        mode: "cors",
        cache: "no-cache",
      });
      if (!res.ok) {
        updateStatus("HTTP错误: " + res.status, "error");
        return;
      }
      const data = await res.json();
      updateStatus(
        "X: " +
          data.x.toFixed(2) +
          "  Y: " +
          data.y.toFixed(2) +
          "  Z: " +
          data.z.toFixed(2),
        "success",
      );
      addNewData(data.x, data.y, data.z);
    } catch (err) {
      updateStatus("连接失败: " + err.message, "error");
    }
  }, 1000);

  chartUpdateTimer = setInterval(updateChart, CHART_UPDATE_INTERVAL);
}

function stopFetch() {
  clearInterval(fetchTimer);
  clearInterval(chartUpdateTimer);
  fetchTimer = null;
  chartUpdateTimer = null;

  if (allRecord.length > 0) {
    timeList = allRecord.map((item) => item.time);
    xData = allRecord.map((item) => item.X);
    yData = allRecord.map((item) => item.Y);
    zData = allRecord.map((item) => item.Z);
    frequencyChart.data.labels = timeList;
    frequencyChart.data.datasets[0].data = xData;
    frequencyChart.data.datasets[1].data = yData;
    frequencyChart.data.datasets[2].data = zData;
    frequencyChart.options.interaction.mode = "index";
    frequencyChart.options.plugins.legend.display = true;
    frequencyChart.update("none");
  }

  updateStatus("已停止采集，可拖动查看完整数据", "info");
}

function downloadImg() {
  const allTime = allRecord.map((item) => item.time);
  const allX = allRecord.map((item) => item.X);
  const allY = allRecord.map((item) => item.Y);
  const allZ = allRecord.map((item) => item.Z);

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = 1920;
  tempCanvas.height = 1080;
  const ctx = tempCanvas.getContext("2d");

  const fullChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: allTime,
      datasets: [
        {
          label: "X轴加速度",
          data: allX,
          borderWidth: 2,
          pointRadius: 0,
          borderColor: "#f44336",
          tension: 0.1,
        },
        {
          label: "Y轴加速度",
          data: allY,
          borderWidth: 2,
          pointRadius: 0,
          borderColor: "#2196f3",
          tension: 0.1,
        },
        {
          label: "Z轴加速度",
          data: allZ,
          borderWidth: 2,
          pointRadius: 0,
          borderColor: "#4caf50",
          tension: 0.1,
        },
      ],
    },
    options: {
      responsive: false,
      animation: { duration: 0 },
      plugins: {
        legend: { display: true, position: "top" },
        title: {
          display: true,
          text: "ADXL345三轴振动完整数据曲线",
          font: { size: 18 },
        },
      },
      scales: {
        x: {
          title: { display: true, text: "采集时间" },
          ticks: { maxTicksLimit: 20 },
        },
        y: {
          title: { display: true, text: "加速度 g" },
          suggestedMin: -5,
          suggestedMax: 5,
        },
      },
    },
  });

  setTimeout(() => {
    const imgUrl = fullChart.toBase64Image();
    const a = document.createElement("a");
    a.href = imgUrl;
    a.download = "ADXL345三轴振动完整数据曲线.png";
    a.click();
    fullChart.destroy();
  }, 100);
}

function downloadSingleAxis(axis) {
  const allTime = allRecord.map((item) => item.time);
  const configs = {
    X: {
      data: allRecord.map((item) => item.X),
      color: "#f44336",
      label: "X轴加速度",
      filename: "ADXL345_X轴振动数据曲线.png",
    },
    Y: {
      data: allRecord.map((item) => item.Y),
      color: "#2196f3",
      label: "Y轴加速度",
      filename: "ADXL345_Y轴振动数据曲线.png",
    },
    Z: {
      data: allRecord.map((item) => item.Z),
      color: "#4caf50",
      label: "Z轴加速度",
      filename: "ADXL345_Z轴振动数据曲线.png",
    },
  };
  const cfg = configs[axis];

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = 1920;
  tempCanvas.height = 1080;
  const ctx = tempCanvas.getContext("2d");

  const singleChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: allTime,
      datasets: [
        {
          label: cfg.label,
          data: cfg.data,
          borderWidth: 3,
          pointRadius: 0,
          borderColor: cfg.color,
          tension: 0.1,
        },
      ],
    },
    options: {
      responsive: false,
      animation: { duration: 0 },
      plugins: {
        legend: { display: true, position: "top" },
        title: {
          display: true,
          text: "ADXL345" + axis + "轴振动完整数据曲线",
          font: { size: 18 },
        },
      },
      scales: {
        x: {
          title: { display: true, text: "采集时间" },
          ticks: { maxTicksLimit: 20 },
        },
        y: {
          title: { display: true, text: "加速度 g" },
          suggestedMin: -5,
          suggestedMax: 5,
        },
      },
    },
  });

  setTimeout(() => {
    const imgUrl = singleChart.toBase64Image();
    const a = document.createElement("a");
    a.href = imgUrl;
    a.download = cfg.filename;
    a.click();
    singleChart.destroy();
  }, 100);
}

function downloadCsv() {
  let csv = "采集时间,X轴(g),Y轴(g),Z轴(g)\n";
  allRecord.forEach((item) => {
    csv += `${item.time},${item.X},${item.Y},${item.Z}\n`;
  });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ADXL345三轴完整采集数据.csv";
  a.click();
  URL.revokeObjectURL(url);
}

window.onload = function () {
  initChart();
  document.getElementById("start").onclick = startFetchESP32;
  document.getElementById("stop").onclick = stopFetch;
  document.getElementById("exportImg").onclick = downloadImg;
  document.getElementById("exportX").onclick = () => downloadSingleAxis("X");
  document.getElementById("exportY").onclick = () => downloadSingleAxis("Y");
  document.getElementById("exportZ").onclick = () => downloadSingleAxis("Z");
  document.getElementById("exportCsv").onclick = downloadCsv;
};