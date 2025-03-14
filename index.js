const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the current directory
app.use(express.static(__dirname));

// Serve the comprehensive-legal-bodies.json file from the parent directory with better error handling
app.get('/legal-bodies.json', (req, res) => {
  const filePath = path.join(__dirname, '..', 'comprehensive-legal-bodies.json');
  
  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error(`File not found: ${filePath}`);
      return res.status(404).json({ error: 'Legal bodies data not found' });
    }
    
    // Read file contents
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error(`Error reading file: ${err.message}`);
        return res.status(500).json({ error: 'Error reading legal bodies data' });
      }
      
      try {
        // Validate JSON
        const jsonData = JSON.parse(data);
        res.json(jsonData);
      } catch (parseErr) {
        console.error(`Invalid JSON format: ${parseErr.message}`);
        res.status(500).json({ error: 'Invalid JSON format in legal bodies data' });
      }
    });
  });
});

// Serve the index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
