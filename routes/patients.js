const express = require('express');
const { Pool } = require('pg');
const verifyToken = require('../middleware/auth');

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Get all patients
router.get('/', verifyToken, async (req, res) => {
  try {
    const query = 'SELECT * FROM patients;';
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get patient by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const query = 'SELECT * FROM patients WHERE id = $1;';
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new patient
router.post('/', verifyToken, async (req, res) => {
  try {
    const { first_name, last_name, email, phone, date_of_birth, gender, address } = req.body;

    const query = `
      INSERT INTO patients (first_name, last_name, email, phone, date_of_birth, gender, address)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;

    const result = await pool.query(query, [
      first_name,
      last_name,
      email,
      phone,
      date_of_birth,
      gender,
      address,
    ]);

    res.status(201).json({
      message: 'Patient created successfully',
      patient: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update patient
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, email, phone, date_of_birth, gender, address } = req.body;

    const query = `
      UPDATE patients
      SET first_name = $1, last_name = $2, email = $3, phone = $4, 
          date_of_birth = $5, gender = $6, address = $7, updated_at = NOW()
      WHERE id = $8
      RETURNING *;
    `;

    const result = await pool.query(query, [
      first_name,
      last_name,
      email,
      phone,
      date_of_birth,
      gender,
      address,
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json({
      message: 'Patient updated successfully',
      patient: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete patient
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const query = 'DELETE FROM patients WHERE id = $1 RETURNING *;';
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json({
      message: 'Patient deleted successfully',
      patient: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;