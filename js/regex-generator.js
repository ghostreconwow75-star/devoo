// ===== AI REGEX GENERATOR =====

let currentRegex = null;

async function generateRegex() {
    const description = document.getElementById('regex-description').value.trim();
    
    if (!description) {
        showError('Please describe what you want to match.');
        return;
    }

    hideError();
    toggleLoading(true);
    document.getElementById('regex-result').style.display = 'none';

    try {
        const result = await getAIRegex(description);
        displayRegexResult(result);
    } catch (e) {
        // Fallback to common patterns
        const fallback = getFallbackRegex(description);
        displayRegexResult(fallback);
    } finally {
        toggleLoading(false);
    }
}

async function getAIRegex(description) {

const response = await fetch('/API/generate-regex.js', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ description: description })
});

if (!response.ok) throw new Error('API failed');
const data = await response.json();
const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const patternMatch = text.match(/PATTERN:\s*(.+)/);
    const explanationMatch = text.match(/EXPLANATION:\s*(.+)/);

    return {
        pattern: patternMatch ? patternMatch[1].trim() : getFallbackRegex(description).pattern,
        explanation: explanationMatch ? explanationMatch[1].trim() : 'Matches the described pattern.'
    };
}

function getFallbackRegex(description) {
    const lower = description.toLowerCase();
    
    const patterns = {
        'email': {
            pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
            explanation: 'Matches standard email format: username@domain.extension'
        },
        'phone': {
            pattern: '^\\(?([0-9]{3})\\)?[-.\\s]?([0-9]{3})[-.\\s]?([0-9]{4})$',
            explanation: 'Matches US phone numbers: (123) 456-7890, 123-456-7890, etc.'
        },
        'url': {
            pattern: '^https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)$',
            explanation: 'Matches HTTP/HTTPS URLs with optional www subdomain'
        },
        'date': {
            pattern: '^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$',
            explanation: 'Matches ISO 8601 dates: YYYY-MM-DD format'
        },
        'ip': {
            pattern: '^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$',
            explanation: 'Matches IPv4 addresses: xxx.xxx.xxx.xxx where each octet is 0-255'
        }
    };

    for (const [key, value] of Object.entries(patterns)) {
        if (lower.includes(key)) return value;
    }

    // Generic fallback
    return {
        pattern: '.*',
        explanation: 'Generic pattern that matches any characters. Try a more specific description for better results.'
    };
}

function displayRegexResult(result) {
    document.getElementById('regex-pattern').textContent = result.pattern;
    document.getElementById('regex-explanation').textContent = result.explanation;
    document.getElementById('regex-result').style.display = 'block';
    
    try {
        currentRegex = new RegExp(result.pattern, 'g');
    } catch (e) {
        currentRegex = null;
        showError('Generated regex is invalid. Please try a different description.');
    }
}

function testRegex() {
    const input = document.getElementById('test-input').value;
    const resultsDiv = document.getElementById('test-results');

    if (!input || !currentRegex) {
        resultsDiv.innerHTML = '<span class="no-match">Start typing to test matches...</span>';
        return;
    }

    try {
        const regex = new RegExp(currentRegex.source, 'g');
        const matches = [];
        let match;
        
        while ((match = regex.exec(input)) !== null) {
            matches.push({ text: match[0], index: match.index });
            if (match.index === regex.lastIndex) regex.lastIndex++;
        }

        if (matches.length === 0) {
            resultsDiv.innerHTML = '<span style="color:var(--error)">❌ No matches found</span>';
        } else {
            let html = `<div style="margin-bottom:8px;color:var(--success);font-weight:600;">✓ ${matches.length} match(es) found</div>`;
            
            // Highlight matches in the input text
            let lastIndex = 0;
            let highlighted = '';
            
            const sortedMatches = [...matches].sort((a, b) => a.index - b.index);
            
            for (const m of sortedMatches) {
                highlighted += escapeHtml(input.substring(lastIndex, m.index));
                highlighted += `<span class="match-highlight">${escapeHtml(m.text)}</span>`;
                lastIndex = m.index + m.text.length;
            }
            highlighted += escapeHtml(input.substring(lastIndex));
            
            html += `<div style="font-family:var(--font-mono);font-size:0.9rem;">${highlighted}</div>`;
            resultsDiv.innerHTML = html;
        }
    } catch (e) {
        resultsDiv.innerHTML = '<span style="color:var(--error)">Invalid regex pattern</span>';
    }
}

function setDescription(text) {
    document.getElementById('regex-description').value = text;
    generateRegex();
}

function clearRegex() {
    document.getElementById('regex-description').value = '';
    document.getElementById('regex-result').style.display = 'none';
    document.getElementById('test-input').value = '';
    currentRegex = null;
    hideError();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
