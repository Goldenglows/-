const express = require("express");
const router = express.Router();

const db = require("../database/db");

router.post("/", async (req, res) => {
  const {
    doctorId,
    type,
    disease,
    date,
    time,
    patientName,
    phone,
    description
  } = req.body;

  if (
    !doctorId ||
    !type ||
    !disease ||
    !date ||
    !time ||
    !patientName ||
    !phone
  ) {
    return res.status(400).json({
      success: false,
      message: "预约信息不完整"
    });
  }

  if (
    type !== "normal" &&
    type !== "fast"
  ) {
    return res.status(400).json({
      success: false,
      message: "预约类型错误"
    });
  }

  if (
    !/^1[3-9]\d{9}$/.test(phone)
  ) {
    return res.status(400).json({
      success: false,
      message: "手机号格式错误"
    });
  }

  const appointmentDateTime =
    new Date(`${date}T${time}:00`);

  if (
    Number.isNaN(
      appointmentDateTime.getTime()
    )
  ) {
    return res.status(400).json({
      success: false,
      message: "预约日期或时间格式错误"
    });
  }

  if (
    appointmentDateTime <= new Date()
  ) {
    return res.status(400).json({
      success: false,
      message: "该时间已经无法预约"
    });
  }

  const connection =
    await db.getConnection();

  try {
    await connection.beginTransaction();

    const [doctors] =
      await connection.query(
        `
        SELECT
          id,
          price,
          fast_price AS fastPrice
        FROM doctors
        WHERE id = ?
        AND status = 1
        FOR UPDATE
        `,
        [doctorId]
      );

    if (!doctors.length) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "医生不存在"
      });
    }

    const doctor = doctors[0];

    const price =
      type === "fast"
        ? Number(doctor.fastPrice)
        : Number(doctor.price);

    const [schedules] =
      await connection.query(
        `
        SELECT
          id,
          remaining
        FROM doctor_schedules
        WHERE doctor_id = ?
        AND schedule_date = ?
        AND schedule_time = ?
        AND remaining > 0
        AND TIMESTAMP(
          schedule_date,
          schedule_time
        ) > NOW()
        FOR UPDATE
        `,
        [
          doctorId,
          date,
          time
        ]
      );

    if (!schedules.length) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "该时段号源已满或已过期"
      });
    }

    const scheduleId =
      schedules[0].id;

    const [updateResult] =
      await connection.query(
        `
        UPDATE doctor_schedules
        SET remaining = remaining - 1
        WHERE id = ?
        AND remaining > 0
        `,
        [scheduleId]
      );

    if (
      updateResult.affectedRows !== 1
    ) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "号源不足，请重新选择"
      });
    }

    const [result] =
      await connection.query(
        `
        INSERT INTO appointments (
          doctor_id,
          patient_name,
          phone,
          disease,
          appointment_date,
          appointment_time,
          description,
          type,
          price,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        `,
        [
          doctorId,
          patientName.trim(),
          phone,
          disease,
          date,
          time,
          description
            ? description.trim()
            : "",
          type,
          price
        ]
      );

    await connection.commit();

    res.json({
      success: true,
      appointmentId:
        result.insertId,
      price
    });
  } catch (error) {
    await connection.rollback();

    console.error(
      "提交预约失败:",
      error
    );

    res.status(500).json({
      success: false,
      message: "提交预约失败"
    });
  } finally {
    connection.release();
  }
});

module.exports = router;