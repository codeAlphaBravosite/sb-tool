const STORAGE_KEY = 'storyboards';
const scriptInput = document.getElementById('scriptInput');
const convertButton = document.getElementById('convertButton');
const statusElement = document.getElementById('status');

// Storage helper functions
function saveToStorage(scenes) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(scenes));
        return true;
    } catch (error) {
        console.error('Error saving to storage:', error);
        return false;
    }
}

function getFromStorage() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error reading from storage:', error);
        return [];
    }
}

function breakIntoScenes(text) {
    if (!text || typeof text !== 'string') {
        throw new Error('Invalid input: text must be a non-empty string');
    }
    const scenes = text.split('।')
        .map(s => s.trim())
        .filter(s => s);
    
    if (scenes.length === 0) {
        throw new Error('No valid scenes found in the input text');
    }
    
    // Auto-save to localStorage when scenes are successfully created
    if (scenes.length > 0) {
        saveToStorage(scenes);
    }
    
    return scenes;
}

function arrayToCSV(scenes) {
    const BOM = '\uFEFF'; // Add BOM for proper UTF-8 encoding
    const header = ['Scene Number', 'VO/Script', 'Files', 'Notes'];
    
    const rows = scenes.map((scene, index) => {
        return [index + 1, scene, '', ''];
    });
    const csvArray = [header, ...rows];
    
    return BOM + csvArray.map(row => {
        return row.map(field => {
            // Proper CSV escaping
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
        URL.revokeObjectURL(url); // Clean up the URL object
    }
}

function updateStatus(message, isError = false) {
    statusElement.textContent = message;
    statusElement.className = isError ? 'error' : 'success';
}

// Debounce helper to prevent too frequent saves
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Auto-save on input when there's a valid scene break
const debouncedSave = debounce((text) => {
    if (text.includes('।')) {
        try {
            const scenes = breakIntoScenes(text);
            if (scenes.length > 0) {
                updateStatus('Scenes auto-saved');
            }
        } catch (error) {
            console.error('Auto-save error:', error);
        }
    }
}, 1000); // Wait 1 second after last input before saving

// Load saved content when page loads
document.addEventListener('DOMContentLoaded', () => {
    const savedScenes = getFromStorage();
    if (savedScenes.length > 0) {
        scriptInput.value = savedScenes.join('।\n');
        updateStatus('Loaded saved scenes');
    }
});

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
        const csvString = arrayToCSV(scenes);
        downloadCSV(csvString);
        updateStatus('Converted! Download started automatically.');
    } catch (error) {
        console.error('Conversion error:', error);
        updateStatus(`❌ Error: ${error.message}`, true);
    } finally {
        convertButton.disabled = false;
    }
});

scriptInput.addEventListener('input', (e) => {
    statusElement.textContent = '';
    statusElement.className = '';
    debouncedSave(e.target.value);
});
