// ===== JSON FORMATTER =====

function formatJSON() {
    const input = document.getElementById('json-input').value.trim();
    const output = document.getElementById('json-output');
    const errorEl = document.getElementById('json-error');

    if (!input) {
        showError('Please paste some JSON to format.');
        return;
    }

    hideError();

    try {
        const parsed = JSON.parse(input);
        const formatted = JSON.stringify(parsed, null, 2);
        output.innerHTML = syntaxHighlight(formatted);
        output.style.display = 'block';
    } catch (e) {
        errorEl.textContent = `❌ Invalid JSON: ${e.message}`;
        errorEl.classList.add('active');
        output.style.display = 'none';
        setTimeout(() => errorEl.classList.remove('active'), 5000);
    }
}

function minifyJSON() {
    const input = document.getElementById('json-input').value.trim();
    const output = document.getElementById('json-output');

    if (!input) return;

    try {
        const parsed = JSON.parse(input);
        const minified = JSON.stringify(parsed);
        output.innerHTML = `<div class="code-block">${escapeHtml(minified)}</div>`;
        output.style.display = 'block';
    } catch (e) {
        showError('Cannot minify invalid JSON. Please fix errors first.');
    }
}

function syntaxHighlight(json) {
    json = escapeHtml(json);
    
    return json
        .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?)/g, function (match) {
            let cls = 'json-string';
            if (/:$/.test(match)) {
                cls = 'json-key';
                match = match.slice(0, -1) + '</span>:';
                return `<span class="${cls}">${match}`;
            }
            return `<span class="${cls}">${match}</span>`;
        })
        .replace(/\b(true|false)\b/g, '<span class="json-boolean">$1</span>')
        .replace(/\b(null)\b/g, '<span class="json-boolean">$1</span>')
        .replace(/\b(\d+\.?\d*)\b/g, '<span class="json-number">$1</span>');
}

async function explainJSON() {
    const input = document.getElementById('json-input').value.trim();
    const resultsDiv = document.getElementById('explanation-results');
    const contentDiv = document.getElementById('explanation-content');

    if (!input) {
        showError('Please paste JSON first.');
        return;
    }

    let parsed;
    try {
        parsed = JSON.parse(input);
    } catch (e) {
        showError('Please fix JSON errors before requesting explanation.');
        return;
    }

    toggleLoading(true);
    resultsDiv.style.display = 'none';

    try {
        // Try AI explanation first
        const explanations = await getAIExplanation(parsed);
        contentDiv.innerHTML = explanations;
    } catch (e) {
        // Fallback to local explanation
        contentDiv.innerHTML = getLocalExplanation(parsed);
    } finally {
        toggleLoading(false);
        resultsDiv.style.display = 'block';
        resultsDiv.classList.add('active');
    }
}

async function getAIExplanation(parsed) {
    

    const schema = JSON.stringify(parsed, null, 2).substring(0, 3000);

    const response = await fetch('/API/explain-json', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ schema: schema })
});

if (!response.ok) throw new Error('API failed');
const data = await response.json();
const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    // Convert bullet points to HTML
    return text.split('\n')
        .filter(line => line.trim().startsWith('•'))
        .map(line => {
            const clean = line.trim().substring(1).trim();
            const [field, ...rest] = clean.split(':');
            return `<div class="result-item">
                <div class="result-meta">${field.trim()}</div>
                <div class="result-text">${rest.join(':').trim()}</div>
            </div>`;
        })
        .join('');
}

function getLocalExplanation(parsed) {
    const explanations = [];
    
    function analyzeObject(obj, prefix = '') {
        for (const [key, value] of Object.entries(obj)) {
            const type = Array.isArray(value) ? 'array' : typeof value;
            const fullKey = prefix ? `${prefix}.${key}` : key;
            
            let desc = '';
            switch (type) {
                case 'string':
                    desc = `Text value. Example: "${value.length > 30 ? value.substring(0, 30) + '...' : value}"`;
                    break;
                case 'number':
                    desc = `Numeric value${Number.isInteger(value) ? ' (integer)' : ' (decimal)'}.`;
                    break;
                case 'boolean':
                    desc = `Boolean flag. Currently ${value ? 'enabled' : 'disabled'}.`;
                    break;
                case 'object':
                    if (value === null) {
                        desc = 'Null value (no data).';
                    } else {
                        desc = `Nested ${Array.isArray(value) ? 'list' : 'object'} with ${Object.keys(value).length} field(s).`;
                    }
                    break;
                default:
                    desc = `Value of type ${type}.`;
            }
            
            explanations.push({ key: fullKey, type, desc });
            
            if (type === 'object' && value !== null && !Array.isArray(value)) {
                analyzeObject(value, fullKey);
            }
        }
    }

    analyzeObject(parsed);

    return explanations.map(exp => `
        <div class="result-item">
            <div class="result-meta">${exp.key} <span style="color:var(--text-muted)">(${exp.type})</span></div>
            <div class="result-text">${exp.desc}</div>
        </div>
    `).join('');
}

function clearJSON() {
    document.getElementById('json-input').value = '';
    document.getElementById('json-output').style.display = 'none';
    document.getElementById('explanation-results').style.display = 'none';
    document.getElementById('json-error').classList.remove('active');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
