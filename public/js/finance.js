function getCategoriesId() {
    return localStorage.getItem('categoriesId');
}

function getFinanceId() {
    return localStorage.getItem('financeId');
}

function csvJSON(text, quoteChar = '"', delimiter = ',') {
    const rows = text.split("\n");
    const headers = rows[0].split(",");

    const regex = new RegExp(`\\s*(${quoteChar})?(.*?)\\1\\s*(?:${delimiter}|$)`, 'gs');

    const match = line => [...line.matchAll(regex)]
        .map(m => m[2])
        .slice(0, -1);

    let lines = text.split('\n');
    const heads = headers ?? match(lines.shift());
    lines = lines.slice(1);

    return lines.map(line => {
        return match(line).reduce((acc, cur, i) => {
            // replace blank matches with `null`
            const val = cur.length <= 0 ? null : Number(cur) || cur;
            const key = heads[i] ?? `{i}`;
            return { ...acc, [key]: val };
        }, {});
    });
}


async function parseAndSendToNotion() {
    const fileInput = document.getElementById('csvFile');
    const file = fileInput.files[0];

    if (!file) {
        console.error('No file selected.');
        return;
    }

    const reader = new FileReader();

    reader.onload = function (event) {
        try {
            const csvText = event.target.result;
            const jsonData = csvJSON(csvText);
            console.log(jsonData);

            props = convertJsonToNotionProperties(jsonData);
            for (const transaction of props) {
                console.log(transaction);
                addPage(getFinanceId(), transaction);
            }

        } catch (error) {
            console.error(error);
        }
    };

    reader.readAsText(file);
}



async function getAllPageIds(databaseId) {
    try {
        const response = await fetch(`/get-page-ids/${databaseId}`);
        return await response.json();

        // document.getElementById('pageIds').innerText = 'Page IDs: ' + JSON.stringify(pageIds);
    } catch (error) {
        console.error('Error fetching page IDs:', error);
    }
}

async function getCategories() {
    const response = await getAllPageIds(getCategoriesId());
    const pageIds = response.results.map(page => page.id);
    console.log(pageIds);

    for (const pageid of pageIds) {
        getPage(pageid);
    }
}

async function getPage(pageId) {
    const response = await fetch(`/get-page/${pageId}`);
    const page = await response.json();
    const pageTitle = page.properties.Name.title[0]?.plain_text || 'Untitled';
    console.log(page);
}

async function addPage(databaseId, properties) {
    try {
        const respone = await fetch('/add-page', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ databaseId, properties }),
        });

        if (!respone.ok) {
            console.error("Error sending page to notion");
            return ;
        }

        const responseData = await response.json();
        console.log('Page added: ', responseData);
    } catch (error) {
        console.error("Error creating page in notion");
    }
}



function convertJsonToNotionProperties(jsonData) {
    return jsonData.map(transaction => {
        return {
            "Name": {
                "title": [
                    {
                        "text": {
                            "content": transaction.Description || 'No Name',
                        }
                    }
                ]
            },
            "Type": {
                "select": {
                    "name": transaction.Amount < 0 ? "Expense" : "Income"
                }
            },
            "Expense Amount": transaction.Amount < 0
                ? {
                    "number": -transaction.Amount,
                }
                : {
                    "number": 0,
                },
            "Income Amount": transaction.Amount >= 0
                ? {
                    "number": transaction.Amount,
                }
                : {
                    "number": 0,
                },
            "Date": {
                "date": {
                    "start": transaction['Completed Date'],
                }
            },
            "Category": {
                "relation": [
                    {
                        "id": "7511cfd0-e7b7-4142-82b5-98ab80bc1163",
                    }
                ],
                "has_more": false,
            },
        };
    });
}


/*
* {
*   "object":"page",
*   "id":"d3f94f66-97eb-4344-accc-d7a6161170d9",
*   "created_time":"2024-02-03T10:08:00.000Z",
*   "last_edited_time":"2024-02-04T11:49:00.000Z",
*   "created_by":{
*       "object":"user",
*       "id":"4d3b1189-0601-4f59-bc44-6584852af4a5"
*   },
*   "last_edited_by":{
*       "object":"user",
*       "id":"4d3b1189-0601-4f59-bc44-6584852af4a5"
*   },
*   "cover":null,
*   "icon":null,
*   "parent":{
*       "type":"database_id",
*       "database_id":"7f6aca4d-0bd1-406b-bcc1-12e09e402422"
*   },
*   "archived":false,
*   "properties":{
*       "Type":{
*           "id":"A%3BgP",
*           "type":"multi_select",
*           "multi_select":[{"id":"vw?|","name":"Income","color":"green"}]
*       },
*       "Date":{
*           "id":"J%3E%5Bs",
*           "type":"date",
*           "date":{"start":"2024-01-25","end":null,"time_zone":null}
*       },
*       "Expense Amount":{
*           "id":"%5DFic",
*           "type":"number",
*           "number":null
*       },"Tags":{"id":"j%3DIb","type":"multi_select","multi_select":[]},"Income Amount":{"id":"ssP%5E","type":"number","number":480},"Category":{"id":"z%5DEj","type":"relation","relation":[{"id":"7511cfd0-e7b7-4142-82b5-98ab80bc1163"}],"has_more":false},"Name":{"id":"title","type":"title","title":[{"type":"text","text":{"content":"Salary","link":null},"annotations":{"bold":false,"italic":false,"strikethrough":false,"underline":false,"code":false,"color":"default"},"plain_text":"Salary","href":null}]}},"url":"https://www.notion.so/Salary-d3f94f6697eb4344acccd7a6161170d9","public_url":null,"request_id":"aed89170-b667-4ada-9690-f5c07d3e70f2"}

* */