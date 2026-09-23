const db = require("../database/db");

async function getDoctors() {
  const [rows] = await db.query(
    "SELECT * FROM doctors WHERE status = 1 ORDER BY id"
  );

  return rows;
}

module.exports = {
  getDoctors
};