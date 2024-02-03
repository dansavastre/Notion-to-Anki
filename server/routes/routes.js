const { Client } = require('@notionhq/client');
const { NotionToMarkdown } = require("notion-to-md");
const fetch = require('cross-fetch');
const { parse } = require("csv-parse");
const fs = require("fs");
require('dotenv').config();

let notion = new Client({
    auth: process.env.NOTION_SECRET,
});

let n2m = new NotionToMarkdown({ notionClient: notion });


async function updateSettings(req, res) {
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
}

async function getAllPageIds(req, res) {
    try {
        const { databaseId } = req.params;
        const response = await notion.databases.query({
            database_id: process.env.FLASHCARDS_DB,
        });
        res.json(response);
    } catch (error) {
        console.error('Error fetching page IDs:', error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message, stack: error.stack });
    }
}

async function getPageContent(req, res) {
    try {
        const { pageId } = req.params;
        const mdBlocks = await n2m.pageToMarkdown(pageId, 2);
        res.send(mdBlocks);
    } catch (error) {
        console.error('Error fetching content:', error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message, stack: error.stack });
    }
}

async function getPage(req, res) {
    try {
        const { pageId } = req.params;
        const response = await notion.pages.retrieve({
            page_id: pageId
        });
        res.send(response);
    } catch (error) {
        console.error('Error fetching page:', error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message, stack: error.stack });
    }
}

async function proxyAnkiConnect(req, res) {
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
}

async function uploadFinanceCSV(req, res) {
    // ... (existing code)
}

module.exports = {
    updateSettings,
    getAllPageIds,
    getPageContent,
    getPage,
    proxyAnkiConnect,
    uploadFinanceCSV
};
