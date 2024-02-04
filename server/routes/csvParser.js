const express = require('express');
const router = express.Router();
const fileUpload = require('express-fileupload');
const csv = require('csv-parser');

router.use(fileUpload());

router.post('/upload-and-parse', (req, res) => {
    console.log("parsing");

    try {
        const file = req.files.file;

        if (!file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        const jsonArray = [];

        const fileBuffer = file.data.toString('utf8'); // Convert buffer to string
        const lines = fileBuffer.split(/\r?\n/);

        for (const line of lines) {
            const row = line.split(','); // Adjust the delimiter if needed
            jsonArray.push(row);
        }

        res.json(jsonArray);
    } catch (error) {
        console.error('Error handling file upload:', error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
});

module.exports = router;
