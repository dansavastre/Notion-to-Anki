// Function to set Notion Secret
function setNotionSecret() {
    const notionSecret = document.getElementById('notionSecretInput').value;
    localStorage.setItem('notionSecret', notionSecret);
    updateServerSettings();
}

// Function to set Database ID
function setDatabaseId() {
    const databaseId = document.getElementById('databaseIdInput').value;
    localStorage.setItem('databaseId', databaseId);
    updateServerSettings();
}

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

function goToIndex() {
    // Redirect to the settings page
    window.location.href = '/notion-to-anki';
}