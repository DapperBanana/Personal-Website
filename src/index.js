const express = require('express');
const routes = require('./routes/index.js');
const https = require('https');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');

const app = express();
const options = {
  key: fs.readFileSync('src/private.key'),
  cert: fs.readFileSync('src/certificate.crt'),
};
const server = https.createServer(options, app);
const wss = new WebSocket.Server({ server });
const ipDataFilePath = 'src/ip_data.json';


let clientCount = 0;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));


// Mount the routes
app.use('/', routes);

// Middleware to parse JSON
app.use(express.json());

// Handle POST requests to "/"
app.post('/', (req, res) => {
  const clientIP = req.body.ip; // Extract client IP from the request body
  const clientCountry = req.body.country; // Extract client country from the request body
  
  // Read existing IP data from the file
  fs.readFile(ipDataFilePath, 'utf8', (err, data) => {
      if (err) {
          console.error('Error reading IP data file:', err);
          res.status(500).send('Error reading IP data file');
          return;
      }

      let ipData = JSON.parse(data);

      // Update total IP count
      ipData.Total = (ipData.Total || 0) + 1;

      // Update country-specific IP count
      ipData[clientCountry] = (ipData[clientCountry] || 0) + 1;

      // Write updated IP data back to the file
      fs.writeFile(ipDataFilePath, JSON.stringify(ipData, null, 2), 'utf8', (err) => {
          if (err) {
              console.error('Error writing IP data file:', err);
              res.status(500).send('Error writing IP data file');
              return;
          }
          res.sendStatus(200);
      });
  });
});

// Serve blog links
app.get('/blogLinks', (req, res) => {
  const blogFolderPath = path.join(__dirname, '/public/blog-posts/');
  fs.readdir(blogFolderPath, (err, files) => {
    if (err) {
      console.error('Error reading blog folder:', err);
      res.status(500).send('Error reading blog folder');
      return;
    }

    const blogLinks = [];
    files.forEach(file => {
      if (path.extname(file) === '.md') {
        const title = getTitleFromMarkdownFile(path.join(blogFolderPath, file));
        const year = getYearFromMarkdownFile(path.join(blogFolderPath, file));
        const restOfDate = getRestOfDateFromMarkdownFile(path.join(blogFolderPath, file));
        const link = `/blog-posts/${file}`;
        blogLinks.push({ year, restOfDate, title, link });
      }
    });

    res.json(blogLinks);
  });
});

// Function to extract title from the first line of a Markdown file
function getTitleFromMarkdownFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    return lines[1].replace(/Title: (.*)/, '$1').trim();
  } catch (error) {
    console.error('Error reading Markdown file:', error);
    return 'NotFound'; 
  }
}

function getYearFromMarkdownFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const regex = /(?<=\/..\/).*$/gm;
    const match = regex.exec(lines[0]);
    if (match && match[0]) {
      return match[0].trim();
    } else {
      return 'NotFound';
    }
  } catch (error) {
    console.error('Error reading Markdown file:', error);
    return 'NotFound'; 
  }
}

// Function to read total count from ip_data.json
function readTotalCount(callback) {
  fs.readFile(ipDataFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading IP data file:', err);
      callback(0); // Return 0 if file read fails
      return;
    }
    const ipData = JSON.parse(data);
    const totalCount = ipData && ipData.Total ? ipData.Total : 0;
    callback(totalCount);
  });
}

function getRestOfDateFromMarkdownFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const regex = /(?<=Date: ).*(?=\/)/gm;
    const match = regex.exec(lines[0]);
    if (match && match[0]) {
      return match[0].trim();
    } else {
      return 'NotFound';
    }
  } catch (error) {
    console.error('Error reading Markdown file:', error);
    return 'NotFound'; 
  }
}

// Store connected clients' mouse positions
const clients = new Map();

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  clientCount++;
  // Handle incoming messages (mouse position data)
  ws.on('message', (data) => {
    
    const {userId, x, y } = JSON.parse(data);
    clients.set(ws, { userId, x, y });
    
    // Broadcast updated mouse positions to all clients
    broadcastPositions(data);
  });

  // Handle client disconnection
  ws.on('close', () => {
    clientCount--;
    clients.delete(ws);
    
    // Broadcast updated mouse positions to all clients
    broadcastPositions();
    broadcastClientCount();
  });

  // Function to broadcast mouse positions to all clients
  function broadcastPositions(data) {
    const positions = Array.from(clients.values()); // Get values from Map
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(positions));
      }
    });
  }  
  function broadcastClientCount() {
    let totalCount = 0;
    fs.readFile(ipDataFilePath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading IP data file:', err);
        totalCount = 0; // Set total count to 0 if file read fails
      } else {
        const ipData = JSON.parse(data);
        totalCount = ipData && ipData.Total ? ipData.Total : 0;
      }

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'clientCount', count: clientCount, totalCount: totalCount }));
        }
      });
    });
  }
  // Initial broadcast of mouse positions to the newly connected client
  broadcastPositions();
  broadcastClientCount();
});

// Start the server
const PORT = process.env.PORT || 3000; //443 for SSL
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
