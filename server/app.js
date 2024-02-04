const express = require('express');
const cors = require('cors');
const { updateSettings, getAllPageIds, getPageContent,
        getPage, sendPage, uploadFinanceCSV, proxyAnkiConnect, getCategories } = require('./routes/routes');
const {join} = require("path");
const csvParserRoute = require("csv-parser");

const app = express();
const port = 3000;

// Serve static files from the "public" directory
app.use(express.static('public'));
app.use(express.json());
app.use(cors());
app.use('/csv-parser', csvParserRoute);


app.post('/update-settings', updateSettings);
app.get('/get-page-ids/:databaseId', getAllPageIds);
app.get('/get-page-content/:pageId', getPageContent);
app.get('/get-page/:pageId', getPage);
app.post('/add-page', sendPage);
app.post('/anki-connect', proxyAnkiConnect);


// // New route for fetching categories
// app.get('/api/get-all-categories', getCategories);

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

app.get('/settings', (req, res) => {
    res.sendFile(join(__dirname, '..', 'public', 'html', 'settings.html'));
});





app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
