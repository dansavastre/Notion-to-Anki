const express = require('express');
const cors = require('cors');
const { updateSettings, getAllPageIds, getPageContent,
        getPage, uploadFinanceCSV, proxyAnkiConnect } = require('./routes/routes');
const { parseCSV } = require('./routes/csvParser');
const {join} = require("path");

const app = express();
const port = 3000;

// Serve static files from the "public" directory
app.use(express.static('public'));
app.use(express.json());
app.use(cors());


app.post('/update-settings', updateSettings);
app.get('/get-page-ids', getAllPageIds);
app.get('/get-page-content/:pageId', getPageContent);
app.get('/get-page/:pageId', getPage);
app.post('/anki-connect', proxyAnkiConnect);
app.post('/upload-finance-csv', uploadFinanceCSV);


// Routes for each HTML page
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, '..', 'public', 'html', 'index.html'));
});

app.get('/finance-tracker', (req, res) => {
    res.sendFile(join(__dirname, '..', 'public', 'html', 'finance-tracker.html'));
});

app.get('/notion-to-anki', (req, res) => {
    res.sendFile(join(__dirname, '..', 'public', 'html', 'notion-to-anki.html'));
});


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
