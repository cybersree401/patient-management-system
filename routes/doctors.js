const express = require('express');
const { Pool } = require('pg');
const verifyToken = require('../middleware/auth');

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Get all doctors
router.get('/', verifyToken, async (req, res) => {
  try {
    const query = 'SELECT * FROM doctors;';
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get doctor by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const query = 'SELECT * FROM doctors WHERE id = $1;';
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new doctor
router.post('/', verifyToken, async (req, res) => {
  try {
    const { first_name, last_name, email, phone, specialization, license_number } = req.body;

    const query = `
      INSERT INTO doctors (first_name, last_name, email, phone, specialization, license_number)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;

    const result = await pool.query(query, [
      first_name,
      last_name,
      email,
      phone,
      specialization,
      license_number,
    ]);

    res.status(201).json({
      message: 'Doctor created successfully',
      doctor: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update doctor
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, email, phone, specialization, license_number } = req.body;

    const query = `
      UPDATE doctors
      SET first_name = $1, last_name = $2, email = $3, phone = $4, 
          specialization = $5, license_number = $6, updated_at = NOW()
      WHERE id = $7
      RETURNING *;
    `;

    const result = await pool.query(query, [
      first_name,
      last_name,
      email,
      phone,
      specialization,
      license_number,
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    res.json({
      message: 'Doctor updated successfully',
      doctor: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete doctor
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const query = 'DELETE FROM doctors WHERE id = $1 RETURNING *;';
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    res.json({
      message: 'Doctor deleted successfully',
      doctor: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;