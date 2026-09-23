const db = require("../database/db");

async function getAppointment(id) {
  const [rows] = await db.query(
    "SELECT * FROM appointments WHERE id = ?",
    [id]
  );

  return rows[0] || null;
}

module.exports = {
  getAppointment
};