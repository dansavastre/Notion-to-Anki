# Notion-to-Anki

## SETUP PROCEDURE

### 1. Create a New Integration on Notion

Visit [Notion Integrations](https://www.notion.so/my-integrations) and create a new integration for your app.

### 2. Get the Database ID

Find the Notion database you want to use, and extract the ID from the URL. For example:

[https://www.notion.so/dansavastre/**bf286c62528946bfbe38146bc7006b16**?v=206d7ee703744ac488d760192339804e](https://www.notion.so/bf286c62528946bfbe38146bc7006b16?pvs=21)

### 3. Give Integration Access to the Database

In your Notion database, click on the options in the top right corner, then select "Add Connection" and choose your integration.

### 4. Configure Anki Connect

In Anki, go to Tools → Add-ons → Click on Anki Connect, and then click "Config." Adjust the configuration:

```json
{
  "apiKey": null,
  "apiLogPath": null,
  "ignoreOriginList": [
    "http://localhost:3000"
  ],
  "webBindAddress": "127.0.0.1",
  "webBindPort": 8765,
  "webCorsOriginList": [
    "http://localhost"
  ]
}
