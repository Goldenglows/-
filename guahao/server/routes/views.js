const express = require("express");
const router = express.Router();
const db = require("../database/db");

router.get("/", async (req, res) => {
  try {
    const doctorId = Number(req.query.doctorId);

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: "医生ID错误"
      });
    }

    const [doctor] = await db.query(
      `
      SELECT id
      FROM doctors
      WHERE id = ?
      AND status = 1
      `,
      [doctorId]
    );

    if (!doctor.length) {
      return res.status(404).json({
        success: false,
        message: "医生不存在"
      });
    }

    await db.query(
      `
      INSERT INTO view_logs (doctor_id)
      VALUES (?)
      `,
      [doctorId]
    );

    res.json({
      success: true,
      message: "浏览记录写入成功",
      doctorId
    });

  } catch (error) {
    console.error(
      "记录浏览失败:",
      error
    );

    res.status(500).json({
      success: false,
      message: "记录浏览失败"
    });
  }
});

module.exports = router;