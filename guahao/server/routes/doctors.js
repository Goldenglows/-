const express = require("express");
const router = express.Router();
const db = require("../database/db");

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        d.id,
        d.name,
        d.title,
        d.avatar,
        d.good,
        d.intro,
        d.price,
        d.fast_price AS fastPrice,

        (
          SELECT COUNT(*)
          FROM view_logs v
          WHERE v.doctor_id = d.id
        ) AS total,

        (
          SELECT COUNT(*)
          FROM view_logs v
          WHERE v.doctor_id = d.id
          AND DATE(v.created_at) = CURDATE()
        ) AS views,

        (
          SELECT COUNT(*)
          FROM view_logs v
          WHERE v.doctor_id = d.id
          AND DATE(v.created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
        ) AS yesterday,

        (
          SELECT COUNT(*)
          FROM appointments a
          WHERE a.doctor_id = d.id
          AND a.status != 'cancelled'
        ) AS registered,

        (
          SELECT CONCAT(
            DATE_FORMAT(s.schedule_date, '%Y-%m-%d'),
            ' ',
            DATE_FORMAT(s.schedule_time, '%H:%i')
          )
          FROM doctor_schedules s
          WHERE s.doctor_id = d.id
          AND s.remaining > 0
          AND TIMESTAMP(
            s.schedule_date,
            s.schedule_time
          ) >= NOW()
          ORDER BY
            s.schedule_date ASC,
            s.schedule_time ASC
          LIMIT 1
        ) AS recent,

        (
          SELECT TIMESTAMP(
            s.schedule_date,
            s.schedule_time
          )
          FROM doctor_schedules s
          WHERE s.doctor_id = d.id
          AND s.remaining > 0
          AND TIMESTAMP(
            s.schedule_date,
            s.schedule_time
          ) >= NOW()
          ORDER BY
            s.schedule_date ASC,
            s.schedule_time ASC
          LIMIT 1
        ) AS nextDateTime

      FROM doctors d
      WHERE d.status = 1
      ORDER BY d.id ASC
    `);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error("获取医生失败:", error);

    res.status(500).json({
      success: false,
      message: "获取医生信息失败"
    });
  }
});

module.exports = router;