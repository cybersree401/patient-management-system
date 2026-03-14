const express = require('express');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const verifyToken = require('../middleware/auth');

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});

// Get all appointments
router.get('/', verifyToken, async (req, res) => {
  try {
    const query = `
      SELECT a.*, p.first_name, p.last_name, d.first_name as doctor_first_name, 
             d.last_name as doctor_last_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get appointment by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT a.*, p.first_name, p.last_name, d.first_name as doctor_first_name, 
             d.last_name as doctor_last_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      WHERE a.id = $1;
    `;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check for appointment conflicts
const checkConflict = async (doctor_id, appointment_date, appointment_time, duration_minutes) => {
  const query = `
    SELECT * FROM appointments
    WHERE doctor_id = $1
    AND appointment_date = $2
    AND (
      (appointment_time < $3 AND TIME(appointment_time) + INTERVAL '1 minute' * $4 > $3)
      OR (appointment_time >= $3 AND appointment_time < (TIME($3) + INTERVAL '1 minute' * $4))
    )
    AND status != 'cancelled';
  `;
  const result = await pool.query(query, [doctor_id, appointment_date, appointment_time, duration_minutes]);
  return result.rows.length > 0;
};

// Create new appointment
router.post('/', verifyToken, async (req, res) => {
  try {
    const { patient_id, doctor_id, appointment_date, appointment_time, reason, duration_minutes } = req.body;

    // Check for conflicts
    const hasConflict = await checkConflict(doctor_id, appointment_date, appointment_time, duration_minutes || 30);
    if (hasConflict) {
      return res.status(400).json({ error: 'Doctor is not available at this time' });
    }

    const query = `
      INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason, status)
      VALUES ($1, $2, $3, $4, $5, 'scheduled')
      RETURNING *;
    `;

    const result = await pool.query(query, [patient_id, doctor_id, appointment_date, appointment_time, reason]);

    // Send confirmation email
    const patientQuery = 'SELECT email FROM patients WHERE id = $1;';
    const patientResult = await pool.query(patientQuery, [patient_id]);
    if (patientResult.rows.length > 0) {
      const mailOptions = {
        from: process.env.MAIL_USER,
        to: patientResult.rows[0].email,
        subject: 'Appointment Confirmation',
        text: `Your appointment has been scheduled for ${appointment_date} at ${appointment_time}`,
      };
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.log('Email not sent:', err);
        } else {
          console.log('Email sent:', info.response);
        }
      });
    }

    res.status(201).json({
      message: 'Appointment created successfully',
      appointment: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update appointment
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { appointment_date, appointment_time, reason, status } = req.body;

    const query = `
      UPDATE appointments
      SET appointment_date = $1, appointment_time = $2, reason = $3, status = $4, updated_at = NOW()
      WHERE id = $5
      RETURNING *;
    `;

    const result = await pool.query(query, [appointment_date, appointment_time, reason, status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({
      message: 'Appointment updated successfully',
      appointment: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel appointment
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      UPDATE appointments
      SET status = 'cancelled', updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({
      message: 'Appointment cancelled successfully',
      appointment: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;