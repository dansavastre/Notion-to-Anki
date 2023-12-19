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


// -------------- Notion ------------------------------

async function getAllPageIds() {
    try {
        const response = await fetch('/get-page-ids');
        return await response.json();

        // document.getElementById('pageIds').innerText = 'Page IDs: ' + JSON.stringify(pageIds);
    } catch (error) {
        console.error('Error fetching page IDs:', error);
    }
}

async function getPage(pageId) {
    try {
        // const pageId = document.getElementById('pageIdInput').value;
        const response = await fetch(`/get-page/${pageId}`);
        const page = await response.json();

        // Extract title and properties
        const pageTitle = page.properties.Name.title[0]?.plain_text || 'Untitled';
        const cardCount = parseInt(page.properties.Cards.number || 0);

        return { pageTitle, cardCount };
    } catch (error) {
        console.error('Error fetching page:', error);
    }
}

async function getAllContent(pageId) {
    try {
        // const pageId = document.getElementById('pageIdInput').value;
        const response = await fetch(`/get-page-content/${pageId}`);
        const content = await response.json();


        const flashcards = [];
        for(let i= 0; i < content.length; i++) {
            if (content[i].type === "toggle") {
                const question = content[i].parent;
                const answer = buildBulletedList(content[i].children)
                flashcards.push({question, answer});
            }
        }
        console.log("Flashcards: ", flashcards);

        // Get page properties (Title, cardCount)
        const props = await getPage(pageId);
        return flashcards;
    } catch (error) {
        console.error('Error fetching content:', error);
    }
}

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

        // Log the entire response for debugging
        // console.log(`Anki Connect Response for '${action}':`, result);

        // Check if the action is 'addNote' and log the note ID for debugging
        // if (action === 'addNote') {
        //     console.log(`Added note ID: ${result.result}`);
        // }

        return result.result;
    } catch (error) {
        console.error(`Error invoking '${action}':`, error);
        throw error;
    }
}


async function sendToAnki(deckName, cardCount, flashcards) {
    try {
        const deckNames = await invoke('deckNames', 6);

        console.log(`Sending flashcards to Deck: ${deckName}`);
        console.log('Flashcards to be sent:', flashcards);

        // Check if the deck exists
        if (!deckNames.includes(deckName)) {
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

            // Check if the question already exists in the deck
            if (!existingQuestions.includes(question)) {
                // If not, add the flashcard to Anki
                const addNoteParams = {
                    "deckName": `${deckName}`,
                    "modelName": 'Basic',
                    "fields": {
                        "Front": `${question}`,
                        "Back": `${answer}`,
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

async function getNotionPages() {
    try {
        // console.log(notionSecret);
        // console.log(databaseId);
        const notionPagesContainer = document.getElementById('notionPages');
        notionPagesContainer.innerHTML = ''; // Clear existing content

        const pageIds = await getAllPageIds();
        console.log("Page ids: ", pageIds)

        for (const pageId of pageIds) {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = pageId;
            checkbox.className = 'page-checkbox';

            // const flashcards = await getAllContent(pageId);
            // console.log(flashcards);

            props = await getPage(pageId);
            console.log("Page properties: ", props);

            const label = document.createElement('label');
            label.htmlFor = pageId;
            label.textContent = `${props.pageTitle} with ${props.cardCount} flashcards`;

            notionPagesContainer.appendChild(checkbox);
            notionPagesContainer.appendChild(label);
            notionPagesContainer.appendChild(document.createElement('br'));
        }
    } catch (error) {
        console.error('Error getting Notion pages:', error);
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
            props = await getPage(pageId);
            sendToAnki(props.pageTitle, props.cardCount, flashcards);
        }

        alert('Flashcards sent to Anki successfully!');
    } catch (error) {
        console.error('Error generating flashcards:', error);
    }
}

function getSelectedPageIds() {
    const selectedPageIds = [];
    const checkboxes = document.querySelectorAll('.page-checkbox');

    checkboxes.forEach((checkbox) => {
        if (checkbox.checked) {
            selectedPageIds.push(checkbox.id);
        }
    });

    return selectedPageIds;
}