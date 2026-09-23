const express = require("express");
const router = express.Router();
const db = require("../database/db");

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        id,
        name
      FROM diseases
      WHERE status = 1
      ORDER BY sort_order ASC, id ASC
    `);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error("获取病种失败:", error);

    res.status(500).json({
      success: false,
      message: "获取病种失败"
    });
  }
});

module.exports = router;