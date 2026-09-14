require("dotenv").config();

const express = require("express");

const doctors = require("./routes/doctors");
const diseases = require("./routes/diseases");
const schedules = require("./routes/schedules");
const appointments = require("./routes/appointments");
const views = require("./routes/views");
const users = require("./routes/users");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "医院预约挂号系统运行正常"
  });
});

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "云托管连接成功"
  });
});

app.use("/api/doctors", doctors);
app.use("/api/diseases", diseases);
app.use("/api/schedules", schedules);
app.use("/api/appointments", appointments);
app.use("/api/views", views);
app.use("/api/user", users);

const PORT = process.env.PORT || 80;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});