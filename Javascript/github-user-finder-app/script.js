const API_BASE_URL = 'https://api.github.com/users';
const MAX_REPOSITORIES = 6;
const FEEDBACK_DEFAULT_HTML = `Try searching for users like <button type="button" class="inline-suggestion" data-username="torvalds">torvalds</button>,
              <button type="button" class="inline-suggestion" data-username="gaearon">gaearon</button>, or
              <button type="button" class="inline-suggestion" data-username="octocat">octocat</button>.`;

const elements = {
  form: document.getElementById('search-form'),
  input: document.getElementById('username-input'),
  button: document.getElementById('search-button'),
  loader: document.getElementById('loader'),
  errorMessage: document.getElementById('error-message'),
  emptyState: document.getElementById('empty-state'),
  results: document.getElementById('results'),
  profileAvatar: document.getElementById('profile-avatar'),
  profileName: document.getElementById('profile-name'),
  profileUsername: document.getElementById('profile-username'),
  profileLink: document.getElementById('profile-link'),
  profileBio: document.getElementById('profile-bio'),
  profileMeta: document.getElementById('profile-meta'),
  reposCount: document.getElementById('repos-count'),
  followersCount: document.getElementById('followers-count'),
  followingCount: document.getElementById('following-count'),
  reposGrid: document.getElementById('repos-grid'),
  searchFeedback: document.getElementById('search-feedback')
};

let activeController = null;
let latestRequestId = 0;

function sanitizeUsername(value) {
  return value.trim().replace(/^@+/, '');
}

function formatNumber(value) {
  return new Intl.NumberFormat().format(value ?? 0);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function setLoadingState(isLoading) {
  elements.button.disabled = isLoading;
  elements.button.textContent = isLoading ? 'Searching...' : 'Search';
  elements.loader.classList.toggle('is-hidden', !isLoading);

  if (isLoading) {
    hideError();
    elements.emptyState.classList.add('is-hidden');
  }
}

function hideError() {
  elements.errorMessage.classList.add('is-hidden');
  elements.errorMessage.textContent = '';
}

function showError(message) {
  elements.results.classList.add('is-hidden');
  elements.emptyState.classList.add('is-hidden');
  elements.errorMessage.textContent = message;
  elements.errorMessage.classList.remove('is-hidden');
}

function showEmptyState() {
  elements.results.classList.add('is-hidden');
  hideError();
  elements.loader.classList.add('is-hidden');
  elements.emptyState.classList.remove('is-hidden');
}

function createMetaPill(icon, text) {
  return `
    <div class="meta-pill">
      ${icon}
      <span>${escapeHtml(text)}</span>
    </div>
  `;
}

function renderProfile(user) {
  const displayName = user.name || user.login;
  const bio = user.bio || 'No bio available for this profile.';

  elements.profileAvatar.src = user.avatar_url;
  elements.profileAvatar.alt = `${displayName} avatar`;
  elements.profileName.textContent = displayName;
  elements.profileUsername.textContent = `@${user.login}`;
  elements.profileBio.textContent = bio;
  elements.profileLink.href = user.html_url;
  elements.reposCount.textContent = formatNumber(user.public_repos);
  elements.followersCount.textContent = formatNumber(user.followers);
  elements.followingCount.textContent = formatNumber(user.following);

  const metaItems = [];

  if (user.location) {
    metaItems.push(
      createMetaPill(
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 21s7-4.35 7-11a7 7 0 1 0-14 0c0 6.65 7 11 7 11Z"></path><circle cx="12" cy="10" r="2.5"></circle></svg>',
        user.location
      )
    );
  }

  if (user.company) {
    metaItems.push(
      createMetaPill(
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 21h18"></path><path d="M5 21V7l7-4 7 4v14"></path><path d="M9 9h.01"></path><path d="M9 13h.01"></path><path d="M9 17h.01"></path><path d="M15 9h.01"></path><path d="M15 13h.01"></path><path d="M15 17h.01"></path></svg>',
        user.company.replace(/^@/, '')
      )
    );
  }

  if (user.blog) {
    const normalizedBlog = user.blog.startsWith('http') ? user.blog : `https://${user.blog}`;

    metaItems.push(
      createMetaPill(
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l1.92-1.91a5 5 0 0 0-7.07-7.08L10.86 6"></path><path d="M14 11a5 5 0 0 0-7.54-.54L4.54 12.4a5 5 0 1 0 7.07 7.07L13.14 18"></path></svg>',
        normalizedBlog.replace(/^https?:\/\//, '')
      )
    );
  }

  if (user.twitter_username) {
    metaItems.push(
      createMetaPill(
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 5.8c-.7.3-1.5.5-2.3.6.8-.5 1.5-1.2 1.8-2.1-.8.5-1.7.8-2.6 1-1.5-1.6-4.1-1.7-5.7-.2s-1.7 4.1-.2 5.7c-3.3-.2-6.4-1.8-8.4-4.3-1.1 1.9-.5 4.4 1.3 5.6-.6 0-1.2-.2-1.7-.4 0 2 1.4 3.8 3.4 4.2-.6.2-1.2.2-1.8.1.5 1.8 2.2 3 4.1 3A8.4 8.4 0 0 1 2 18.6 11.9 11.9 0 0 0 8.5 20c7.8 0 12.4-6.8 12.1-12.8.8-.5 1.4-1.2 1.9-2Z"></path></svg>',
        `@${user.twitter_username}`
      )
    );
  }

  if (user.created_at) {
    const joinedDate = new Date(user.created_at).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short'
    });

    metaItems.push(
      createMetaPill(
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path></svg>',
        `Joined ${joinedDate}`
      )
    );
  }

  elements.profileMeta.innerHTML = metaItems.join('');
}

function getLanguageClassName(language) {
  return language ? `language-${language.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : 'language-unknown';
}

function createRepoCard(repository) {
  const description = repository.description || 'No description provided for this repository.';
  const language = repository.language || 'Not specified';
  const languageClassName = getLanguageClassName(repository.language);

  return `
    <article class="repo-card">
      <div class="repo-card__header">
        <h3 class="repo-card__title">
          <a
            href="${repository.html_url}"
            target="_blank"
            rel="noopener noreferrer"
            data-tooltip="Open repository on GitHub"
            aria-label="Open ${escapeHtml(repository.name)} repository on GitHub"
          >
            ${escapeHtml(repository.name)}
          </a>
        </h3>
      </div>
      <p class="repo-card__description">${escapeHtml(description)}</p>
      <div class="repo-card__meta">
        <span class="repo-tag">
          <span class="repo-tag__dot ${languageClassName}"></span>
          ${escapeHtml(language)}
        </span>
        <span class="repo-tag">★ ${formatNumber(repository.stargazers_count)}</span>
      </div>
    </article>
  `;
}

function renderRepositories(repositories) {
  if (!repositories.length) {
    elements.reposGrid.innerHTML = `
      <div class="empty-repos">
        <h3>No public repositories found</h3>
        <p>This user does not currently have recent public repositories to display.</p>
      </div>
    `;
    return;
  }

  elements.reposGrid.innerHTML = repositories
    .slice(0, MAX_REPOSITORIES)
    .map((repository) => createRepoCard(repository))
    .join('');
}

async function fetchJson(url, signal) {
  const response = await fetch(url, {
    signal,
    headers: {
      Accept: 'application/vnd.github+json'
    }
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('USER_NOT_FOUND');
    }

    if (response.status === 403) {
      throw new Error('RATE_LIMITED');
    }

    throw new Error('REQUEST_FAILED');
  }

  return response.json();
}

async function fetchGitHubUser(username, signal) {
  const encodedUsername = encodeURIComponent(username);
  const userUrl = `${API_BASE_URL}/${encodedUsername}`;
  const reposUrl = `${API_BASE_URL}/${encodedUsername}/repos?sort=updated&per_page=${MAX_REPOSITORIES}`;

  const [user, repos] = await Promise.all([fetchJson(userUrl, signal), fetchJson(reposUrl, signal)]);

  return { user, repos };
}

function showResults() {
  hideError();
  elements.emptyState.classList.add('is-hidden');
  elements.results.classList.remove('is-hidden');
}

async function handleSearch(rawValue) {
  const username = sanitizeUsername(rawValue);

  if (!username) {
    showError('Please enter a GitHub username before searching.');
    elements.input.focus();
    return;
  }

  if (activeController) {
    activeController.abort();
  }

  activeController = new AbortController();
  const requestId = ++latestRequestId;

  setLoadingState(true);

  try {
    const { user, repos } = await fetchGitHubUser(username, activeController.signal);

    if (requestId !== latestRequestId) {
      return;
    }

    renderProfile(user);
    renderRepositories(repos);
    showResults();
    elements.searchFeedback.textContent = `Showing results for ${user.login}.`;
  } catch (error) {
    if (error.name === 'AbortError') {
      return;
    }

    if (requestId !== latestRequestId) {
      return;
    }

    if (error.message === 'USER_NOT_FOUND') {
      showError('We could not find that GitHub user. Please check the username and try again.');
    } else if (error.message === 'RATE_LIMITED') {
      showError('GitHub API rate limit reached. Please wait a moment and try again.');
    } else {
      showError('Something went wrong while contacting GitHub. Please try again shortly.');
    }
  } finally {
    if (requestId === latestRequestId) {
      setLoadingState(false);
      activeController = null;
    }
  }
}

function handleFormSubmit(event) {
  event.preventDefault();
  handleSearch(elements.input.value);
}

function bindSuggestionButtons() {
  const suggestionButtons = elements.searchFeedback.querySelectorAll('.inline-suggestion');

  suggestionButtons.forEach((button) => {
    button.addEventListener('click', handleSuggestionClick);
  });
}

function handleSuggestionClick(event) {
  const username = event.currentTarget.dataset.username;
  if (!username) return;

  elements.input.value = username;
  handleSearch(username);
}

function init() {
  elements.form.addEventListener('submit', handleFormSubmit);
  bindSuggestionButtons();

  elements.input.addEventListener('input', () => {
    hideError();

    if (!elements.input.value.trim()) {
      elements.searchFeedback.innerHTML = FEEDBACK_DEFAULT_HTML;
      bindSuggestionButtons();
      showEmptyState();
    }
  });

  const defaultUser = 'octocat';
  elements.input.value = defaultUser;
  handleSearch(defaultUser);
}

document.addEventListener('DOMContentLoaded', init);
