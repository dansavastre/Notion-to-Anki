const express = require('express');
const fetch = require('cross-fetch');
const { Client } = require('@notionhq/client');
const { NotionToMarkdown } = require("notion-to-md");
require('dotenv').config();
const cors = require('cors');

const showdown = require('showdown'),
    converter = new showdown.Converter();


const app = express();
const port = 3000;
const timeout = 300000; // 5 minutes

let notion = new Client({
  auth: process.env.NOTION_SECRET,
});

let n2m = new NotionToMarkdown({ notionClient: notion });


// Serve static files from the "public" directory
app.use(express.static('public'));
app.use(express.json());
app.use(cors());

const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
server.setTimeout(timeout);


async function getPage(pageId){
    return await notion.pages.retrieve({
        page_id: pageId
    });
}


// Function to get all page IDs in a database
async function getAllPageIds(databaseId) {
    const response = await notion.databases.query({
        database_id: process.env.FLASHCARDS_DB,
    });
    return response.results.map((page) => page.id);
}


// Function to get the content of a page by ID
async function getPageContent(pageId) {
    return await n2m.pageToMarkdown(pageId, 2);
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


function notionBlocksToMarkdown(blocks, depth = 0) {
    let markdown = '';

    if (blocks.length === 0) {
        return '';
    }

    blocks.forEach(block => {
        switch (block.type) {
            case 'heading_1':
                markdown += `${block.parent}\n`;
                break;
            case 'heading_2':
                markdown += `${block.parent}\n`;
                break;
            case 'heading_3':
                markdown += `${block.parent}\n`;
                break;
            case 'bulleted_list_item':
                markdown += `${'\t'.repeat(depth)}${block.parent}\n`;
                break;
            case 'numbered_list_item':
                markdown += `${'\t'.repeat(depth)}${block.parent}\n`;
                break;
            case 'toggle':
                markdown += `${'\t'.repeat(depth)}${block.parent}\n`;
                break;
            case 'paragraph':
                markdown += `${'\t'.repeat(depth)}${block.parent}\n`;
                break;
            case 'quote':
                markdown += `${'\t'.repeat(depth)}${block.parent}\n`;
                break;
            case 'to_do':
                markdown += `${'\t'.repeat(depth)}${block.parent}\n`;
                break;
            default:
                // Unsupported block type, just skip it
                break;
        }

        if (block.children) {
            markdown += notionBlocksToMarkdown(block.children, depth + 1);
        }
    });

    return markdown;
}

app.get('/get-page-content/:pageId', async (req, res) => {
  try {
    const { pageId } = req.params;
    const content = await getPageContent(pageId);

    // const mdText = notionBlocksToMarkdown(content);
    // console.log("MD: \n", mdText);
    // console.log("HTML: \n", converter.makeHtml(mdText));

    // console.log("Page content: ", content)
    let flashcards = [];
    for (let i = 0; i < content.length; i++) {
        if(content[i].type === "toggle") {
            // Skip empty toggles
            if (content[i].parent === "") {
                continue;
            }

            const question = converter.makeHtml(content[i].parent);
            const answer = converter.makeHtml(notionBlocksToMarkdown(content[i].children));
            // console.log("Question: ", question);
            // console.log("Answer: ", answer);
            flashcards.push({question, answer});
        }
    }
    // console.log("Flashcards: ", flashcards);

    res.send(flashcards);
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