async function parseCSV(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const csvData = event.target.result;
                // Implement your CSV parsing logic here
                // Example: const parsedData = parseCSVFunction(csvData);
                resolve(parsedData);
            } catch (error) {
                reject(error);
            }
        };

        reader.readAsText(file);
    });
}


async function parseAndSendToNotion() {
    const fileInput = document.getElementById('csvFile');
    const file = fileInput.files[0];

    if (file) {
        try {
            const csvData = await parseCSV(file);
            // Call your Notion API function here with csvData
            // Example: await sendToNotion(csvData);
            console.log('CSV Data:', csvData);
        } catch (error) {
            console.error('Error parsing CSV:', error);
        }
    } else {
        console.error('No file selected.');
    }
}


