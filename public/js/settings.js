// Function to set Notion Secret
function setNotionSecret() {
    const notionSecret = document.getElementById('notionSecretInput').value;
    localStorage.setItem('notionSecret', notionSecret);
    updateServerSettings();
}

// Function to set Database ID
function setFlashcardsId() {
    const databaseId = document.getElementById('flashcardsIdInput').value;
    localStorage.setItem('flashcardsId', databaseId);
    updateServerSettings();
}

function setCategoriesId() {
    const categoriesId = document.getElementById('categoriesIdInput').value;
    localStorage.setItem('categoriesId', categoriesId);
    updateServerSettings();
}

function setFinanceId() {
    const financeId = document.getElementById('financeIdInput').value;
    localStorage.setItem('financeId', financeId);
    updateServerSettings();
}


// Function to update server settings
async function updateServerSettings() {
    const notionSecret = localStorage.getItem('notionSecret');
    const flashcardsId = localStorage.getItem('flashcardsId');
    const categoriesId = localStorage.getItem('categoriesId');
    const financeId = localStorage.getItem('financeId');

    try {
        const response = await fetch('/update-settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ notionSecret, flashcardsId, categoriesId, financeId }),
        });

        const result = await response.json();
        console.log(result);
    } catch (error) {
        console.error('Error updating server settings:', error);
    }
}

function goToIndex() {
    // Redirect to the settings page
    window.location.href = '/notion-to-anki';
}