const groceries = ["Albert Heijn", "Action", "Jumbo Supermarkt", "Thuisbezorgd.nl", "Flink", "Etos", "Gall & Gall"];
const rent = "To Stichting Derdengelden Pactum Vastgoed";


function getCategoriesId() {
    console.log(localStorage.getItem('categoriesId'));
    return localStorage.getItem('categoriesId');
}

function getFinanceId() {
    return localStorage.getItem('financeId');
}

function sendTransactions(transactions) {
    for (const transaction of transactions) {
        console.log(transaction);
        console.log(transaction.income);
        console.log(transaction.expense);
    }
}

async function parseAndSendToNotion() {
    const fileInput = document.getElementById('csvFile');
    const file = fileInput.files[0];

    if (!file) {
        console.error('No file selected.');
        return;
    }

    const reader = new FileReader();
    const categories = await getCategories();
    let props = [];
    console.log("Categories", categories);

    reader.onload = async function (event) {
        try {
            const csvText = event.target.result;
            const jsonData = csvJSON(csvText);
            console.log(jsonData);

            // Transform JSON data to new structure
            const transformedData = jsonData.map(item => {
                return {
                    Account: item['Product'],
                    Date: item['Completed Date'],
                    Description: item.Description,
                    Amount: (parseFloat(item['Amount']) - parseFloat(item['Fee'])).toFixed(2),
                    Currency: item.Currency,
                    Category: item.Type
                };
            });

            var fields = Object.keys(transformedData[0])
            var replacer = function(key, value) { return value === null ? '' : value }
            var csv = transformedData.map(function(row){
                return fields.map(function(fieldName){
                    return JSON.stringify(row[fieldName], replacer)
                }).join(',')
            })
            csv.unshift(fields.join(',')) // add header column
            csv = csv.join('\r\n');
            console.log(csv)

            // Create a Blob object with the CSV data
            const blob = new Blob([csv], { type: 'text/csv' });

            // Create a temporary link element
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = 'parsed_data.csv'; // File name
            link.click();

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
    console.log('props');

    let result = {};
    for (const pageid of pageIds) {
        const page = await getPage(pageid);
        console.log('props: ', page.properties);
        // result[page.properties.Name.title[0].text.content] = pageId;
    }
    return result;
}

async function getPage(pageId) {
    const response = await fetch(`/get-page/${pageId}`);
    const page = await response.json();
    const pageTitle = page.properties.Name.title[0]?.plain_text || 'Untitled';
    console.log(page);
    return page;
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


// Parsing functions

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

function createNotionProperties(name, type, amount, date, categoryId, tags) {
    return {
        "Name": {
            "title": [
                {
                    "text": {
                        "content": name,
                    }
                }
            ]
        },
        "Type": {
            "select": {
                "name": type
            }
        },
        "Expense Amount": type === "Expense"
            ? {
                "number": amount,
            }
            : {
                "number": 0,
            },
        "Income Amount": type === "Income"
            ? {
                "number": amount,
            }
            : {
                "number": 0,
            },
        "Date": {
            "date": {
                "start": date,
            }
        },
        "Category": {
            "relation": [
                {
                    "id": categoryId,
                }
            ],
            "has_more": false,
        },
    };
}

function aggregateTransactionsByUniqueName(props) {
    // const props = convertJsonToNotionProperties(jsonData);

    // Create an object to store aggregated transactions by name
    // const aggregatedTransactions = new Set(props.map(o => o.Name.title[0].text.content))
    const aggregatedTransactions = {};

    props.forEach(transaction => {
        // Extract name from the transaction
        const name = transaction.Name.title[0].text.content;

        // If the name doesn't exist in the aggregatedTransactions object, create an entry
        if (!aggregatedTransactions[name]) {
            aggregatedTransactions[name] = {
                income: 0,
                expenses: 0,
                other: transaction,
            };
        }

        // Check if it's an income or expense and update the corresponding total
        if (transaction.Type.select.name === 'Income') {
            aggregatedTransactions[name].income += transaction['Income Amount'].number;
        } else {
            aggregatedTransactions[name].expenses += transaction['Expense Amount'].number;
        }
    });

    // Now aggregatedTransactions object contains the aggregated data by unique names
    return aggregatedTransactions;
}
