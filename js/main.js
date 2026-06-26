// Mobile menu toggle
document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.querySelector('.mobile-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (toggle) {
        toggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // Close mobile menu on link click
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
        });
    });
});

// Copy to clipboard utility
function copyToClipboard(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
        const original = btn.textContent;
        btn.textContent = '✓ Copied!';
        setTimeout(() => btn.textContent = original, 2000);
    });
}

// Show/hide loading
function toggleLoading(show) {
    const loading = document.querySelector('.loading');
    if (loading) loading.classList.toggle('active', show);
}

// Show error
function showError(message) {
    const errorEl = document.querySelector('.error-msg');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.add('active');
        setTimeout(() => errorEl.classList.remove('active'), 5000);
    }
}

// Hide error
function hideError() {
    const errorEl = document.querySelector('.error-msg');
    if (errorEl) errorEl.classList.remove('active');
}
