// App state
let state = {
    releases: [],
    selectedIds: new Set(),
    currentFilter: 'all',
    searchQuery: '',
    lastFetched: null
};

// DOM Elements
const feedTimeline = document.getElementById('feed-timeline');
const refreshBtn = document.getElementById('refresh-btn');
const refreshIcon = document.getElementById('refresh-icon');
const refreshText = document.getElementById('refresh-text');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');
const retryBtn = document.getElementById('retry-btn');
const emptyState = document.getElementById('empty-state');

// Stats Elements
const totalCountEl = document.getElementById('total-count');
const featureCountEl = document.getElementById('feature-count');
const lastFetchedTimeEl = document.getElementById('last-fetched-time');

// Search and Filter Elements
const searchInput = document.getElementById('search-input');
const filterButtons = document.querySelectorAll('.filter-btn');
const selectionBox = document.getElementById('selection-box');
const selectionText = document.getElementById('selection-text');
const tweetSelectedBtn = document.getElementById('tweet-selected-btn');

// Modal Elements
const tweetModal = document.getElementById('tweet-modal');
const modalCloseBtn = document.getElementById('modal-close-btn');
const tweetTextArea = document.getElementById('tweet-text');
const modalTweetBtn = document.getElementById('modal-tweet-btn');
const charCountNum = document.getElementById('char-count-num');
const progressCircle = document.getElementById('progress-circle');

// Initialize Progress Circle SVG Constants
const CIRCLE_RADIUS = 14;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;
progressCircle.style.strokeDasharray = `${CIRCLE_CIRCUMFERENCE} ${CIRCLE_CIRCUMFERENCE}`;
progressCircle.style.strokeDashoffset = CIRCLE_CIRCUMFERENCE;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchReleases();
    setupEventListeners();
});

// Event Listeners Setup
function setupEventListeners() {
    refreshBtn.addEventListener('click', fetchReleases);
    retryBtn.addEventListener('click', fetchReleases);
    
    // Search input
    searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.toLowerCase();
        renderFeed();
    });

    // Category filter buttons
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.currentFilter = btn.dataset.category;
            renderFeed();
        });
    });

    // Tweet Selected button
    tweetSelectedBtn.addEventListener('click', handleTweetSelected);

    // Modal Close
    modalCloseBtn.addEventListener('click', closeTweetModal);
    tweetModal.addEventListener('click', (e) => {
        if (e.target === tweetModal) closeTweetModal();
    });

    // Textarea input event for character counting
    tweetTextArea.addEventListener('input', updateCharCounter);
}

// Fetch Release Notes from backend API
async function fetchReleases() {
    // UI Loading state
    setLoading(true);
    
    try {
        const response = await fetch('/api/releases');
        const result = await response.json();
        
        if (result.status === 'success') {
            state.releases = result.data;
            state.selectedIds.clear();
            state.lastFetched = new Date();
            
            updateStats();
            renderFeed();
            setError(false);
        } else {
            throw new Error(result.message || 'API responded with error status');
        }
    } catch (err) {
        console.error('Fetch error:', err);
        errorMessage.textContent = err.message || 'Failed to communicate with Flask backend.';
        setError(true);
    } finally {
        setLoading(false);
    }
}

function setLoading(isLoading) {
    if (isLoading) {
        refreshBtn.classList.add('spinning');
        refreshBtn.disabled = true;
        refreshText.textContent = "Fetching...";
        loadingState.classList.remove('hidden');
        feedTimeline.classList.add('hidden');
        errorState.classList.add('hidden');
        emptyState.classList.add('hidden');
    } else {
        refreshBtn.classList.remove('spinning');
        refreshBtn.disabled = false;
        refreshText.textContent = "Refresh Feed";
        loadingState.classList.add('hidden');
    }
}

function setError(hasError) {
    if (hasError) {
        errorState.classList.remove('hidden');
        feedTimeline.classList.add('hidden');
        emptyState.classList.add('hidden');
    } else {
        errorState.classList.add('hidden');
        feedTimeline.classList.remove('hidden');
    }
}

function updateStats() {
    totalCountEl.textContent = state.releases.length;
    
    const featuresCount = state.releases.filter(r => r.type === 'Feature').length;
    featureCountEl.textContent = featuresCount;
    
    if (state.lastFetched) {
        const timeStr = state.lastFetched.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        lastFetchedTimeEl.textContent = timeStr;
    }
}

// Helper to strip HTML tags
function stripHtml(html) {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}

// Helper to truncate text to fit in a tweet
function cleanAndTruncateSnippet(htmlText, maxLength = 140) {
    let text = stripHtml(htmlText);
    text = text.replace(/\s+/g, ' ').trim(); // normalize whitespace
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

// Render Feed Timeline
function renderFeed() {
    feedTimeline.innerHTML = '';
    
    // Filter the releases
    const filtered = state.releases.filter(item => {
        // Category check
        const categoryMatch = state.currentFilter === 'all' || item.type === state.currentFilter;
        
        // Search text check
        const searchTarget = `${item.date} ${item.type} ${stripHtml(item.content)}`.toLowerCase();
        const searchMatch = !state.searchQuery || searchTarget.includes(state.searchQuery);
        
        return categoryMatch && searchMatch;
    });

    if (filtered.length === 0) {
        feedTimeline.classList.add('hidden');
        emptyState.classList.remove('hidden');
        updateSelectionBox();
        return;
    }
    
    emptyState.classList.add('hidden');
    feedTimeline.classList.remove('hidden');
    
    // Group filtered items by Date (which is item.date)
    const groups = {};
    filtered.forEach(item => {
        if (!groups[item.date]) {
            groups[item.date] = [];
        }
        groups[item.date].push(item);
    });

    // Render group elements
    for (const [date, items] of Object.entries(groups)) {
        const dateGroup = document.createElement('div');
        dateGroup.className = 'date-group';
        
        // Create Date Header
        const dateHeader = document.createElement('div');
        dateHeader.className = 'date-header';
        
        const dateTitle = document.createElement('span');
        dateTitle.className = 'date-title';
        dateTitle.textContent = date;
        
        dateHeader.appendChild(dateTitle);
        dateGroup.appendChild(dateHeader);
        
        // Render item cards in this date group
        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'update-card glass';
            card.setAttribute('data-type', item.type);
            card.setAttribute('data-id', item.id);
            
            const isChecked = state.selectedIds.has(item.id);
            
            // Generate Badge Type Class
            let badgeClass = 'badge-general';
            if (item.type === 'Feature') badgeClass = 'badge-feature';
            else if (item.type === 'Announcement') badgeClass = 'badge-announcement';
            else if (item.type === 'Issue' || item.type === 'Deprecation') badgeClass = 'badge-issue';
            
            card.innerHTML = `
                <div class="card-checkbox-wrapper">
                    <input type="checkbox" class="card-checkbox" data-id="${item.id}" ${isChecked ? 'checked' : ''}>
                </div>
                <div class="card-main">
                    <div class="card-meta">
                        <span class="card-badge ${badgeClass}">${item.type}</span>
                        ${item.link ? `
                            <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="card-link">
                                <i data-lucide="external-link"></i> Link
                            </a>
                        ` : ''}
                    </div>
                    <div class="card-content">
                        ${item.content}
                    </div>
                    <div class="card-actions">
                        <button class="btn-tweet-action" data-id="${item.id}">
                            <i data-lucide="twitter"></i> Draft Tweet
                        </button>
                    </div>
                </div>
            `;
            
            // Attach individual handlers
            const checkbox = card.querySelector('.card-checkbox');
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    state.selectedIds.add(item.id);
                } else {
                    state.selectedIds.delete(item.id);
                }
                updateSelectionBox();
            });
            
            const tweetBtn = card.querySelector('.btn-tweet-action');
            tweetBtn.addEventListener('click', () => {
                draftSingleTweet(item);
            });
            
            dateGroup.appendChild(card);
        });
        
        feedTimeline.appendChild(dateGroup);
    }
    
    // Re-render Lucide icons dynamically added
    lucide.createIcons();
    updateSelectionBox();
}

// Update the selected items panel UI
function updateSelectionBox() {
    const count = state.selectedIds.size;
    if (count > 0) {
        selectionText.textContent = `${count} update${count > 1 ? 's' : ''} selected`;
        selectionBox.classList.remove('hidden');
    } else {
        selectionBox.classList.add('hidden');
    }
}

// Draft a tweet for a single update
function draftSingleTweet(item) {
    const cleanSnippet = cleanAndTruncateSnippet(item.content, 140);
    const hashtag = item.type === 'Feature' ? ' #BigQueryFeature' : ' #BigQuery';
    const draftText = `BigQuery ${item.type} (${item.date}):\n\n"${cleanSnippet}"\n\nRead details here: ${item.link || 'https://docs.cloud.google.com/bigquery/docs/release-notes'}${hashtag} #GoogleCloud`;
    
    openTweetModal(draftText);
}

// Draft a tweet combining all selected updates
function handleTweetSelected() {
    if (state.selectedIds.size === 0) return;
    
    // Get the actual update items selected
    const selectedItems = state.releases.filter(r => state.selectedIds.has(r.id));
    
    let draftText = `🔔 Latest BigQuery Updates Summary:\n\n`;
    
    selectedItems.forEach((item, index) => {
        const bulletText = `• [${item.type}] ${cleanAndTruncateSnippet(item.content, 50)}\n`;
        // Check if adding this bullet will exceed limits, if yes truncate
        if ((draftText + bulletText).length + 80 < 280) {
            draftText += bulletText;
        }
    });
    
    draftText += `\nFull Release Notes: https://docs.cloud.google.com/bigquery/docs/release-notes\n#BigQuery #GoogleCloud`;
    
    openTweetModal(draftText);
}

// Open modal with drafted text
function openTweetModal(text) {
    tweetTextArea.value = text;
    tweetModal.classList.remove('hidden');
    updateCharCounter();
    
    // Setup the share intent click handler
    modalTweetBtn.onclick = () => {
        const finalTweetText = tweetTextArea.value;
        const twitterIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(finalTweetText)}`;
        window.open(twitterIntentUrl, '_blank', 'noopener,noreferrer');
        closeTweetModal();
    };
}

function closeTweetModal() {
    tweetModal.classList.add('hidden');
}

// Update Character Counter UI
function updateCharCounter() {
    const length = tweetTextArea.value.length;
    const remaining = 280 - length;
    
    charCountNum.textContent = remaining;
    
    // Progress circle visual updates
    const percentage = Math.min((length / 280) * 100, 100);
    const offset = CIRCLE_CIRCUMFERENCE - (percentage / 100) * CIRCLE_CIRCUMFERENCE;
    progressCircle.style.strokeDashoffset = offset;
    
    // Colors depending on remaining characters
    if (remaining < 0) {
        progressCircle.style.stroke = '#ef4444'; // Red
        charCountNum.style.color = '#ef4444';
        modalTweetBtn.disabled = true;
        modalTweetBtn.style.opacity = 0.5;
        modalTweetBtn.style.cursor = 'not-allowed';
    } else if (remaining <= 20) {
        progressCircle.style.stroke = '#f59e0b'; // Amber
        charCountNum.style.color = '#f59e0b';
        modalTweetBtn.disabled = false;
        modalTweetBtn.style.opacity = 1;
        modalTweetBtn.style.cursor = 'pointer';
    } else {
        progressCircle.style.stroke = '#1d9bf0'; // Twitter Blue
        charCountNum.style.color = '#94a3b8';
        modalTweetBtn.disabled = false;
        modalTweetBtn.style.opacity = 1;
        modalTweetBtn.style.cursor = 'pointer';
    }
}
