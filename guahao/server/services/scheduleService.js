const db = require("../database/db");

async function getDoctorSchedules(doctorId, date) {
  let sql = `
    SELECT
      id,
      doctor_id AS doctorId,
      DATE_FORMAT(schedule_date, '%Y-%m-%d') AS date,
      TIME_FORMAT(schedule_time, '%H:%i') AS time,
      remaining
    FROM doctor_schedules
    WHERE doctor_id = ?
  `;

  const params = [doctorId];

  if (date) {
    sql += " AND schedule_date = ?";
    params.push(date);
  }

  sql += " ORDER BY schedule_date, schedule_time";

  const [rows] = await db.query(sql, params);

  return rows;
}

async function getNearestSchedule(doctorId) {
  const [rows] = await db.query(`
    SELECT
      id,
      doctor_id AS doctorId,
      DATE_FORMAT(schedule_date, '%Y-%m-%d') AS date,
      TIME_FORMAT(schedule_time, '%H:%i') AS time,
      remaining
    FROM doctor_schedules
    WHERE doctor_id = ?
      AND remaining > 0
      AND TIMESTAMP(schedule_date, schedule_time) >= NOW()
    ORDER BY schedule_date, schedule_time
    LIMIT 1
  `, [doctorId]);

  return rows[0] || null;
}

async function getNearestSchedules() {
  const [rows] = await db.query(`
    SELECT
      d.id AS doctorId,
      d.name,
      d.price,
      d.fast_price AS fastPrice,
      s.id AS scheduleId,
      DATE_FORMAT(s.schedule_date, '%Y-%m-%d') AS date,
      TIME_FORMAT(s.schedule_time, '%H:%i') AS time,
      s.remaining
    FROM doctors d
    INNER JOIN doctor_schedules s
      ON d.id = s.doctor_id
    WHERE d.status = 1
      AND s.remaining > 0
      AND TIMESTAMP(s.schedule_date, s.schedule_time) >= NOW()
    ORDER BY s.schedule_date, s.schedule_time
  `);

  const result = {};

  for (const row of rows) {
    if (!result[row.doctorId]) {
      result[row.doctorId] = row;
    }
  }

  return Object.values(result);
}

async function decreaseSchedule(connection, scheduleId) {
  const [result] = await connection.query(`
    UPDATE doctor_schedules
    SET remaining = remaining - 1
    WHERE id = ?
      AND remaining > 0
  `, [scheduleId]);

  return result.affectedRows > 0;
}

module.exports = {
  getDoctorSchedules,
  getNearestSchedule,
  getNearestSchedules,
  decreaseSchedule
};