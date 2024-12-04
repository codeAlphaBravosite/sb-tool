const STORAGE_KEY = 'storyboards';
const scriptInput = document.getElementById('scriptInput');
const convertButton = document.getElementById('convertButton');
const statusElement = document.getElementById('status');

function createStoryboard(title) {
    return {
        id: Date.now().toString(),
        title: title,
        scenes: [],
        lastEdited: new Date().toISOString()
    };
}

function createScene(number) {
    return {
        id: Date.now().toString() + '-' + number,
        number: number,
        voScript: '',
        files: [],
        notes: ''
    };
}

function getStoryboards() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error reading from storage:', error);
        return [];
    }
}

function saveStoryboards(storyboards) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(storyboards));
        return true;
    } catch (error) {
        console.error('Error saving to storage:', error);
        return false;
    }
}

function breakIntoScenes(text) {
    if (!text || typeof text !== 'string') {
        throw new Error('Invalid input: text must be a non-empty string');
    }
    const sceneTexts = text.split('।')
        .map(s => s.trim())
        .filter(s => s);
    
    if (sceneTexts.length === 0) {
        throw new Error('No valid scenes found in the input text');
    }

    // Create storyboard in the same format as storage.js
    const storyboard = createStoryboard('Created via script');
    storyboard.scenes = sceneTexts.map((text, index) => {
        const scene = createScene(index + 1);
        scene.voScript = text;
        return scene;
    });

    // Get existing storyboards and add new one at the beginning
    const storyboards = getStoryboards();
    storyboards.unshift(storyboard);
    saveStoryboards(storyboards);
    
    return sceneTexts;
}

/* CSV Download functionality - commented out but preserved for future use
function arrayToCSV(scenes) {
    const BOM = '\uFEFF';
    const header = ['Scene Number', 'VO/Script', 'Files', 'Notes'];
    
    const rows = scenes.map((scene, index) => {
        return [index + 1, scene, '', ''];
    });
    const csvArray = [header, ...rows];
    
    return BOM + csvArray.map(row => {
        return row.map(field => {
            const stringField = String(field);
            if (stringField.includes(',') || stringField.includes('"') || 
                stringField.includes('\n') || stringField.includes('।')) {
                return `"${stringField.replace(/"/g, '""')}"`;
            }
            return stringField;
        }).join(',');
    }).join('\n');
}

function downloadCSV(csvString, filename = 'script_breakdown.csv') {
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    try {
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } finally {
        URL.revokeObjectURL(url);
    }
}
*/

function updateStatus(message, isError = false) {
    statusElement.textContent = message;
    statusElement.className = isError ? 'error' : 'success';
}

convertButton.addEventListener('click', async () => {
    const text = scriptInput.value.trim();
    
    if (!text) {
        updateStatus('Please enter your script before converting.', true);
        return;
    }
    convertButton.disabled = true;
    updateStatus('Converting your script...');
    try {
        const scenes = breakIntoScenes(text);
        // const csvString = arrayToCSV(scenes);
        // downloadCSV(csvString);
        updateStatus('Successfully Created! (go to ⧉StoryboardPro and refresh)');
    } catch (error) {
        console.error('Conversion error:', error);
        updateStatus(`❌ Error: ${error.message}`, true);
    } finally {
        convertButton.disabled = false;
    }
});

scriptInput.addEventListener('input', () => {
    statusElement.textContent = '';
    statusElement.className = '';
});
