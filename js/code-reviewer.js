// ===== AI CODE REVIEWER =====
// Uses Gemini 2.5 Flash API (free tier: 1,500 requests/day)
// Get your API key: https://aistudio.google.com/app/apikey



async function reviewCode() {
    const code = document.getElementById('code-input').value.trim();
    const language = document.getElementById('language').value;
    
    if (!code) {
        showError('Please paste some code to review.');
        return;
    }

    // Get focus areas
    const focusAreas = [];
    if (document.getElementById('check-bugs').checked) focusAreas.push('bugs');
    if (document.getElementById('check-security').checked) focusAreas.push('security');
    if (document.getElementById('check-performance').checked) focusAreas.push('performance');
    if (document.getElementById('check-explain').checked) focusAreas.push('explanation');

    if (focusAreas.length === 0) {
        showError('Please select at least one focus area.');
        return;
    }

    hideError();
    toggleLoading(true);
    document.getElementById('results').classList.remove('active');

    try {
        const prompt = buildPrompt(code, language, focusAreas);
        const response = await fetch('/api/review-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: prompt })
        });
        
        if (!response.ok) throw new Error('API Error');
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        displayResults(parseResults(text, focusAreas));
        
    } catch (error) {
        console.error('Review error:', error);
        // Fallback: Show simulated results for demo/testing
        displayResults(getFallbackResults(code, focusAreas));
    } finally {
        toggleLoading(false);
    }
}

function buildPrompt(code, language, focusAreas) {
    return `You are an expert code reviewer with 20 years of experience. Analyze the following ${language === 'auto' ? '' : language} code.

FOCUS AREAS: ${focusAreas.join(', ')}

CODE:
\`\`\`
${code}
\`\`\`

Provide your review in this exact format:

${focusAreas.includes('bugs') ? `BUGS:
- Line X: [Description of bug] → [Suggested fix]

` : ''}${focusAreas.includes('security') ? `SECURITY:
- Line X: [Security issue] → [Fix]

` : ''}${focusAreas.includes('performance') ? `PERFORMANCE:
- [Performance issue] → [Optimization]

` : ''}${focusAreas.includes('explanation') ? `EXPLANATION:
[2-3 sentence plain English explanation of what this code does]

` : ''}OVERALL:
[1 sentence summary]

Be specific with line numbers. If no issues found in a category, say "No issues found."`;
}

function parseResults(text, focusAreas) {
    const results = {
        bugs: [],
        security: [],
        performance: [],
        explanation: '',
        overall: ''
    };

    const lines = text.split('\n');
    let currentSection = null;

    for (const line of lines) {
        const trimmed = line.trim();
        
        if (trimmed.startsWith('BUGS:')) { currentSection = 'bugs'; continue; }
        if (trimmed.startsWith('SECURITY:')) { currentSection = 'security'; continue; }
        if (trimmed.startsWith('PERFORMANCE:')) { currentSection = 'performance'; continue; }
        if (trimmed.startsWith('EXPLANATION:')) { currentSection = 'explanation'; continue; }
        if (trimmed.startsWith('OVERALL:')) { currentSection = 'overall'; continue; }
        
        if (!trimmed || trimmed === 'No issues found.') continue;

        if (currentSection === 'bugs' && trimmed.startsWith('-')) {
            const parts = trimmed.substring(1).split('→');
            results.bugs.push({
                line: extractLineNumber(parts[0]),
                issue: parts[0].replace(/Line \d+:/, '').trim(),
                fix: parts[1]?.trim() || 'Review recommended'
            });
        }
        else if (currentSection === 'security' && trimmed.startsWith('-')) {
            const parts = trimmed.substring(1).split('→');
            results.security.push({
                line: extractLineNumber(parts[0]),
                issue: parts[0].replace(/Line \d+:/, '').trim(),
                fix: parts[1]?.trim() || 'Fix recommended'
            });
        }
        else if (currentSection === 'performance' && trimmed.startsWith('-')) {
            const parts = trimmed.substring(1).split('→');
            results.performance.push({
                issue: parts[0].trim(),
                fix: parts[1]?.trim() || 'Optimize as suggested'
            });
        }
        else if (currentSection === 'explanation') {
            results.explanation += trimmed + ' ';
        }
        else if (currentSection === 'overall') {
            results.overall += trimmed + ' ';
        }
    }

    results.explanation = results.explanation.trim();
    results.overall = results.overall.trim();

    // If parsing failed, use fallback
    if (results.bugs.length === 0 && results.security.length === 0 && 
        results.performance.length === 0 && !results.explanation) {
        return getFallbackResults(document.getElementById('code-input').value, focusAreas);
    }

    return results;
}

function extractLineNumber(text) {
    const match = text.match(/Line (\d+):/);
    return match ? parseInt(match[1]) : '?';
}

function displayResults(results) {
    const container = document.getElementById('results');
    let html = '';

    if (results.bugs.length > 0) {
        html += `<div class="result-section">
            <h4>🐛 Bugs Found</h4>`;
        results.bugs.forEach(bug => {
            html += `<div class="result-item error">
                <div class="result-meta">Line ${bug.line}</div>
                <div class="result-text"><strong>Issue:</strong> ${escapeHtml(bug.issue)}</div>
                <div class="result-text" style="margin-top:8px;color:var(--success)"><strong>Fix:</strong> ${escapeHtml(bug.fix)}</div>
            </div>`;
        });
        html += `</div>`;
    }

    if (results.security.length > 0) {
        html += `<div class="result-section">
            <h4>🔒 Security Issues</h4>`;
        results.security.forEach(sec => {
            html += `<div class="result-item warning">
                <div class="result-meta">Line ${sec.line}</div>
                <div class="result-text"><strong>Issue:</strong> ${escapeHtml(sec.issue)}</div>
                <div class="result-text" style="margin-top:8px;color:var(--success)"><strong>Fix:</strong> ${escapeHtml(sec.fix)}</div>
            </div>`;
        });
        html += `</div>`;
    }

    if (results.performance.length > 0) {
        html += `<div class="result-section">
            <h4>⚡ Performance</h4>`;
        results.performance.forEach perf => {
            html += `<div class="result-item">
                <div class="result-text"><strong>Issue:</strong> ${escapeHtml(perf.issue)}</div>
                <div class="result-text" style="margin-top:8px;color:var(--success)"><strong>Suggestion:</strong> ${escapeHtml(perf.fix)}</div>
            </div>`;
        });
        html += `</div>`;
    }

    if (results.explanation) {
        html += `<div class="result-section">
            <h4>💡 What This Code Does</h4>
            <div class="result-item success">
                <div class="result-text">${escapeHtml(results.explanation)}</div>
            </div>
        </div>`;
    }

    if (results.overall) {
        html += `<div class="result-section">
            <h4>📊 Overall Assessment</h4>
            <div class="result-item">
                <div class="result-text">${escapeHtml(results.overall)}</div>
            </div>
        </div>`;
    }

    container.innerHTML = html;
    container.classList.add('active');
}

function getFallbackResults(code, focusAreas) {
    // Smart fallback that analyzes code locally
    const results = { bugs: [], security: [], performance: [], explanation: '', overall: '' };
    const lines = code.split('\n');

    // Simple pattern matching for common issues
    if (focusAreas.includes('bugs')) {
        if (code.includes('==') && !code.includes('===')) {
            results.bugs.push({ line: '?', issue: 'Using == instead of === can cause type coercion bugs', fix: 'Replace == with === for strict equality' });
        }
        if (code.includes('var ')) {
            results.bugs.push({ line: '?', issue: 'Using var instead of let/const can cause scope issues', fix: 'Use const by default, let when reassignment needed' });
        }
        if (code.includes('.innerHTML')) {
            results.bugs.push({ line: '?', issue: 'innerHTML can cause XSS if user input is inserted', fix: 'Use textContent for plain text, or sanitize input' });
        }
    }

    if (focusAreas.includes('security')) {
        if (code.includes('password') || code.includes('secret') || code.includes('api_key')) {
            results.security.push({ line: '?', issue: 'Potential hardcoded credentials detected', fix: 'Use environment variables for sensitive data' });
        }
        if (code.includes('eval(')) {
            results.security.push({ line: '?', issue: 'eval() executes arbitrary code and is dangerous', fix: 'Use JSON.parse for JSON, or safer alternatives' });
        }
    }

    if (focusAreas.includes('performance')) {
        if (code.includes('for (') && code.includes('.length')) {
            results.performance.push({ issue: 'Loop may re-calculate array length on each iteration', fix: 'Cache length: for (let i = 0, len = arr.length; i < len; i++)' });
        }
    }

    if (focusAreas.includes('explanation')) {
        results.explanation = 'This code appears to handle data processing. It iterates through items and performs calculations or transformations. Review the specific logic for your use case.';
    }

    results.overall = 'Code reviewed with basic static analysis. For deeper AI analysis, ensure your API key is configured correctly.';
    return results;
}

function clearAll() {
    document.getElementById('code-input').value = '';
    document.getElementById('results').classList.remove('active');
    document.getElementById('results').innerHTML = '';
    hideError();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
