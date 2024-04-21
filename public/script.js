// -------------- Get Variables -----------------------

// Function to get Notion Secret from local storage
function getNotionSecret() {
    return localStorage.getItem('notionSecret');
}

// Function to get Database ID from local storage
function getDatabaseId() {
    return localStorage.getItem('databaseId');
}

const notionSecret = localStorage.getItem('notionSecret');
const databaseId = localStorage.getItem('databaseId');


function goToSettings() {
    // Redirect to the settings page
    window.location.href = '/settings.html';  // Assuming your settings page is named "settings.html"
}


// -------------- Notion Interactions ------------------------------

async function getAllPageIds() {
    try {
        const response = await fetch('/get-page-ids');
        return await response.json();

        // document.getElementById('pageIds').innerText = 'Page IDs: ' + JSON.stringify(pageIds);
    } catch (error) {
        console.error('Error fetching page IDs:', error);
    }
}

async function getPageProperties(pageId) {
    try {
        // const pageId = document.getElementById('pageIdInput').value;
        const response = await fetch(`/get-page/${pageId}`);
        const page = await response.json();

        // Extract properties
        const pageTitle = page.properties.Name.title[0]?.plain_text || 'Untitled';
        const cardCount = parseInt(page.properties.Cards.number || 0);

        // Assume page.properties is the provided properties object

        // Extract Courses property
        // const coursesProperty = page.properties['📑 Courses'];
        // const coursesValue = coursesProperty ? coursesProperty.rollup : null;

        // Extract Vak property
        // const vakProperty = page.properties.Vak;
        // const vakValue = vakProperty ? vakProperty.rollup : null;


        // Extract Courses
        // const coursesValue = coursesProperty ? coursesProperty.rollup.array : null;
        // Extract Vak
        // const vakValue = vakProperty ? vakProperty.rollup.array : null;

        // Now you can use coursesValue and vakValue in your code
        // console.log('Courses:', coursesValue);
        // console.log('Vak:', vakValue);


        return { pageTitle, cardCount };
    } catch (error) {
        console.error('Error fetching page:', error);
    }
}

async function getAllContent(pageId) {
    try {
        // const pageId = document.getElementById('pageIdInput').value;
        const response = await fetch(`/get-page-content/${pageId}`);
        // const flashcards = [];
        // for(let i= 0; i < content.length; i++) {
        //     if (content[i].type === "toggle") {
        //         const question = content[i].parent;
        //         const answer = buildBulletedList(content[i].children)
        //         flashcards.push({question, answer});
        //     }
        // }
        // console.log("Flashcards: ", flashcards);

        // Get page properties (Title, cardCount)
        // const props = await getPageProperties(pageId);
        return await response.json();
    } catch (error) {
        console.error('Error fetching content:', error);
    }
}

async function getNotionPages() {
    let pageProperties;
    try {
        await updateServerSettings();

        const notionPagesContainer = document.getElementById('notionPages');
        notionPagesContainer.innerHTML = ''; // Clear existing content

        const pageIds = await getAllPageIds();
        console.log("Page ids: ", pageIds)

        for (const pageId of pageIds) {
            const row = document.createElement('tr');

            // Checkbox cell
            const checkboxCell = document.createElement('td');
            checkboxCell.className = 'page-checkbox';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = pageId;
            checkboxCell.appendChild(checkbox);
            row.appendChild(checkboxCell);

            // Get page properties from notion
            pageProperties = await getPageProperties(pageId);

            // Page title cell
            const titleCell = document.createElement('td');
            titleCell.textContent = pageProperties.pageTitle;
            row.appendChild(titleCell);

            // Card count cell
            const countCell = document.createElement('td');
            countCell.textContent = pageProperties.cardCount;
            row.appendChild(countCell);

            document.getElementById('notionPages').appendChild(row);
        }


    } catch (error) {
        console.error('Error getting Notion pages:', error);
    }
}


// -------------- Helper functions --------------------------------

function buildBulletedList(blocks, indentation = 0) {
    let result = '';

    blocks.forEach(block => {
        const blockText = block.parent;

        // Add indentation based on the current level
        const indentedText = '  '.repeat(indentation * 2) + blockText + '\n';
        result += indentedText;

        // Recursively process children if available
        if (block.children && block.children.length > 0) {
            const childResult = buildBulletedList(block.children, indentation + 1);
            result += childResult;
        }
    });

    return result;
}

function getSelectedPageIds() {
    const selectedPageIds = [];

    // Select all checkboxes with the class 'page-checkbox'
    const checkboxes = document.querySelectorAll('.page-checkbox input[type="checkbox"]');

    checkboxes.forEach((checkbox) => {
        if (checkbox.checked) {
            // If the checkbox is checked, add its id to the selectedPageIds array
            selectedPageIds.push(checkbox.id);
        }
    });

    return selectedPageIds;
}

// -------------- Anki --------------------------------
const ANKI_CONNECT_ENDPOINT = '/anki-connect';

async function invoke(action, version, params = {}) {
    try {
        const response = await fetch(`${ANKI_CONNECT_ENDPOINT}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action, version, params }),
        });

        const result = await response.json();
        return result.result;
    } catch (error) {
        console.error(`Error invoking '${action}':`, error);
        throw error;
    }
}

function formatText(text) {
    const lines = text.split('\n');
    let html = '';
    let currentIndentLevel = 0;

    for (const line of lines) {
        const match = line.match(/^(\s*)- (.+)$/);

        if (match) {
            const indent = match[1].length / 4; // Assuming 4 spaces per level
            const trimmedLine = match[2];

            if (indent === currentIndentLevel) {
                // Same level
                html += `${'<li>' + trimmedLine + '</li>'}\n`;
            } else if (indent > currentIndentLevel) {
                // Increased indentation, start a new sublist
                html += '<ul>\n';
                currentIndentLevel = indent;
                html += `${'<li>' + trimmedLine + '</li>'}\n`;
            } else {
                // Decreased indentation, close current sublist(s)
                html += '</ul>\n'.repeat(currentIndentLevel - indent);
                currentIndentLevel = indent;
                html += `${'<li>' + trimmedLine + '</li>'}\n`;
            }
        }
    }

    // Close any remaining open sublists
    html += '</ul>\n'.repeat(currentIndentLevel);

    return html;
}

async function sendToAnki(deckName, cardCount, flashcards) {
    try {
        const deckNames = await invoke('deckNames', 6);

        console.log(`Sending flashcards to Deck: ${deckName}`);
        console.log('Flashcards to be sent:', flashcards);

        // **** For testing ****
        // const deckNames = ['Flashcards 1', 'Some other text Flashcards 2 some more text here'];
        // *********************
        // console.log('Existing decks: ', deckNames);
        // console.log('Deck name: ', deckName);
        // console.log(deckNames.some((name) => name.includes(deckName)));


        // Check if the deck exists
        const deckExists = deckNames.some((name) => name.includes(deckName));
        if (!deckExists) {
            // If the deck doesn't exist, create it
            await invoke('createDeck', 6, { deck: deckName });
            console.log(`Deck created: ${deckName}`);
        }

        // Get existing questions in the deck
        const notes = await invoke('findNotes', 6, { query: `deck:"${deckName}"` });
        const notesInfo = await invoke('notesInfo', 6, { notes });
        const existingQuestions = notesInfo.map(note => note.fields.Front);
        console.log("Existing questions: ", existingQuestions);

        // Loop over flashcards and send them to Anki
        for (const flashcard of flashcards) {
            const { question, answer } = flashcard;
            // const formatedAnswer = null;
            // console.log("updated ans: ", formatedAnswer);

            // Check if the question already exists in the deck
            if (!existingQuestions.includes(question)) {
                // If not, add the flashcard to Anki
                const addNoteParams = {
                    "deckName": `${deckName}`,
                    "modelName": 'Basic',
                    "fields": {
                        "Front": `${question}`,
                        // "Back": `${formatText(answer)}`,
                        "Back": `${answer}`
                    },
                };
                // console.log("Note: ", addNoteParams);
                await invoke('addNote', 6, { note: addNoteParams });
                // console.log(`Flashcard added: ${question}`);
                existingQuestions.push(question);
            }
            // else {
                // console.log(`Flashcard already exists: ${question}`);
            // }
        }
    } catch (error) {
        console.error('Error sending flashcards to Anki:', error);
        throw error;
    }
}


// ------------------------------------------------------------------------------------

// Function to update server settings
async function updateServerSettings() {
    const notionSecret = localStorage.getItem('notionSecret');
    const databaseId = localStorage.getItem('databaseId');

    try {
        const response = await fetch('/update-settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ notionSecret, databaseId }),
        });

        const result = await response.json();
        console.log(result);
    } catch (error) {
        console.error('Error updating server settings:', error);
    }
}

async function generateFlashcards() {
    try {
        const selectedPageIds = getSelectedPageIds();
        console.log("Selected pages: ", selectedPageIds);

        if (selectedPageIds.length === 0) {
            alert('Please select at least one page.');
            return;
        }

        for (const pageId of selectedPageIds) {
            const flashcards = await getAllContent(pageId);
            props = await getPageProperties(pageId);
            await sendToAnki(props.pageTitle, props.cardCount, flashcards);
        }

        alert('Flashcards sent to Anki successfully!');
    } catch (error) {
        console.error('Error generating flashcards:', error);
    }
}

