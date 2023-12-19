const express = require('express');
const fetch = require('cross-fetch');
const { Client } = require('@notionhq/client');
const { NotionToMarkdown } = require("notion-to-md");
require('dotenv').config();
const cors = require('cors');


const app = express();
const port = 3000;

let notion = new Client({
  auth: process.env.NOTION_SECRET,
});

let n2m = new NotionToMarkdown({ notionClient: notion });


// Serve static files from the "public" directory
app.use(express.static('public'));
app.use(express.json());
app.use(cors());




async function getPage(pageId){
  const response = await notion.pages.retrieve({
    page_id: pageId
  });
  console.log(response);
  return response;
}


// Function to get all page IDs in a database
async function getAllPageIds(databaseId) {
  const response = await notion.databases.query({
    database_id: process.env.FLASHCARDS_DB,
  });
  console.log(response.results);
  return response.results.map((page) => page.id);
}


// Function to get the content of a page by ID
async function getPageContent(pageId) {
  const mdblocks = await n2m.pageToMarkdown(pageId, 2);
  // const mdString = n2m.toMarkdownString(mdblocks);
  // console.log(mdString.parent);
  console.log("MD blocks: ", mdblocks);

  return mdblocks;
}




app.post('/update-settings', (req, res) => {
    const { notionSecret, databaseId } = req.body;

    try {
        // Update server-side environment variables or configuration with new values
        process.env.NOTION_SECRET = notionSecret;
        process.env.FLASHCARDS_DB = databaseId;

        notion = new Client({
            auth: process.env.NOTION_SECRET,
        });

        n2m = new NotionToMarkdown({ notionClient: notion });

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
});



app.get('/get-page-ids', async (req, res) => {
    try {
        const { databaseId } = req.params;
        const pageIds = await getAllPageIds(databaseId);
        res.json(pageIds);
    } catch (error) {
        console.error('Error fetching page IDs:', error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message, stack: error.stack });
    }
});


app.get('/get-page-content/:pageId', async (req, res) => {
  try {
    const { pageId } = req.params;
    const content = await getPageContent(pageId);
    res.send(content);
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message, stack: error.stack });
  }
});

app.get('/get-page/:pageId', async (req, res) => {
  try {
    const { pageId } = req.params;
    const content = await getPage(pageId);
    res.send(content);
  } catch (error) {
    console.error('Error fetching page:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message, stack: error.stack });
  }
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});


app.post('/anki-connect', async(req, res) => {
  const { action, version, params } = req.body;

  try {
    const response = await fetch('http://127.0.0.1:8765/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, version, params }),
    });

    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error('Error proxying Anki Connect request:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});