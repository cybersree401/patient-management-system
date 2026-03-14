const express = require('express');
const { Pool } = require('pg');
const verifyToken = require('../middleware/auth');

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Get doctor's availability
router.get('/doctor/:doctor_id', verifyToken, async (req, res) => {
  try {
    const { doctor_id } = req.params;

    const query = `
      SELECT * FROM doctor_availability
      WHERE doctor_id = $1
      ORDER BY day_of_week, start_time;
    `;

    const result = await pool.query(query, [doctor_id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set doctor availability
router.post('/', verifyToken, async (req, res) => {
  try {
    const { doctor_id, day_of_week, start_time, end_time } = req.body;

    const query = `
      INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;

    const result = await pool.query(query, [doctor_id, day_of_week, start_time, end_time]);

    res.status(201).json({
      message: 'Availability created successfully',
      availability: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update availability
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { day_of_week, start_time, end_time } = req.body;

    const query = `
      UPDATE doctor_availability
      SET day_of_week = $1, start_time = $2, end_time = $3
      WHERE id = $4
      RETURNING *;
    `;

    const result = await pool.query(query, [day_of_week, start_time, end_time, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Availability not found' });
    }

    res.json({
      message: 'Availability updated successfully',
      availability: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete availability
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const query = 'DELETE FROM doctor_availability WHERE id = $1 RETURNING *;';
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Availability not found' });
    }

    res.json({
      message: 'Availability deleted successfully',
      availability: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;