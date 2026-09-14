const db = require("../database/db");

async function addView(doctorId) {
  if (!doctorId) {
    throw new Error("医生ID不能为空");
  }

  const [doctor] = await db.query(
    "SELECT id FROM doctors WHERE id = ? AND status = 1",
    [doctorId]
  );

  if (!doctor.length) {
    throw new Error("医生不存在");
  }

  await db.query(
    `
    INSERT INTO view_logs (doctor_id)
    VALUES (?)
    `,
    [doctorId]
  );

  return true;
}

async function getViewStats(doctorId) {
  const [rows] = await db.query(
    `
    SELECT
      (
        SELECT COUNT(*)
        FROM view_logs
        WHERE doctor_id = ?
        AND DATE(created_at) = CURDATE()
      ) AS views,

      (
        SELECT COUNT(*)
        FROM view_logs
        WHERE doctor_id = ?
        AND DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
      ) AS yesterday,

      (
        SELECT COUNT(*)
        FROM view_logs
        WHERE doctor_id = ?
      ) AS total
    `,
    [doctorId, doctorId, doctorId]
  );

  return rows[0];
}

module.exports = {
  addView,
  getViewStats
};