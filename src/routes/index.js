const path = require('path');
const express = require('express');
const router = express.Router();

// Define route for the homepage
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'main.html'));
});

// Define route for the homepage
router.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'about.html'));
});

// Route for the blog page
router.get('/blog', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'blog.html'));
});

// Route for the projects page
router.get('/projects', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'projects.html'));
});

// Route for the resume page
router.get('/resume', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'resume.html'));
});

module.exports = router;
