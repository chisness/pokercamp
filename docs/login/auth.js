/* global fetch */
/* global localStorage */

const AUTH_SERVER_URL = 'https://staff-dev1.poker.camp:9443';

function checkAndHandleToken() {
    // Check URL parameters for token
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');

    if (tokenFromUrl) {
        // Cache the token from URL
        localStorage.setItem('github_oauth_token', tokenFromUrl);
        // Clear the URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Check for cached token
    const cachedToken = localStorage.getItem('github_oauth_token');

    if (cachedToken) {
        // Use the cached token to get user info
        fetchUserInfo(cachedToken);
    } else {
        // No token available, redirect to login
        window.location.href = `${AUTH_SERVER_URL}/login`;
    }
}

function fetchUserInfo(token) {
    fetch('https://api.github.com/user', {
        headers: {
            'Authorization': `token ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch user info');
        }
        return response.json();
    })
    .then(data => {
        localStorage.setItem('github_username', data.login);  // Store the username
        document.getElementById('user-bar').innerHTML = `
            <img src="${data.avatar_url}" alt="Profile picture">
            <span>${data.login}</span>
            <div class="dropdown">
                <span>▼</span>
                <div class="dropdown-content">
                    <a href="javascript:logout()">Logout</a>
                </div>
            </div>
        `;
    })
    .catch(error => {
        console.error('Error fetching user data:', error);
        document.getElementById('content').innerHTML = 'Error fetching user data. <a href="javascript:logout()">Please try logging in again</a>.';
        logout();
    });
}

function logout() {
            localStorage.removeItem('github_oauth_token');
            window.location.href = '/rps-recurse';
        }

// Run the auth check when the page loads
checkAndHandleToken();
