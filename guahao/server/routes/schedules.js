const express = require("express");
const router = express.Router();
const db = require("../database/db");

router.get("/:doctorId", async (req, res) => {
  try {
    const doctorId = Number(req.params.doctorId);

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: "医生ID错误"
      });
    }

    const [rows] = await db.query(`
      SELECT
        id,
        DATE_FORMAT(schedule_date, '%Y-%m-%d') AS date,
        DATE_FORMAT(schedule_time, '%H:%i') AS time,
        remaining
      FROM doctor_schedules
      WHERE doctor_id = ?
      AND remaining > 0
      AND TIMESTAMP(schedule_date, schedule_time) >= NOW()
      ORDER BY schedule_date ASC, schedule_time ASC
    `, [doctorId]);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error("获取号源失败:", error);

    res.status(500).json({
      success: false,
      message: "获取号源失败"
    });
  }
});

module.exports = router;