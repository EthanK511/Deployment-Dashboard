class PagesDeploymentController {
    constructor() {
        this.apiToken = null;
        this.userLogin = null;
        this.baseApiUrl = 'https://api.github.com';
        this.initializeEventHandlers();
    }

    initializeEventHandlers() {
        document.getElementById('connectBtn').addEventListener('click', () => this.authenticate());
        document.getElementById('refreshBtn').addEventListener('click', () => this.loadAllDeployments());
        document.getElementById('tokenField').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.authenticate();
        });
        
        window.addEventListener('beforeunload', () => {
            this.apiToken = null;
            this.userLogin = null;
        });
    }

    async authenticate() {
        const tokenInput = document.getElementById('tokenField');
        const token = tokenInput.value.trim();
        
        if (!token) {
            this.showStatus('Please provide a valid token', 'error');
            return;
        }

        this.apiToken = token;
        this.showStatus('Authenticating...', 'success');

        try {
            const userData = await this.makeApiCall('/user');
            this.userLogin = userData.login;
            
            tokenInput.style.display = 'none';
            document.getElementById('connectBtn').style.display = 'none';
            document.getElementById('refreshBtn').style.display = 'block';
            
            this.showStatus(`Connected as ${this.userLogin}`, 'success');
            await this.loadAllDeployments();
        } catch (error) {
            this.showStatus(`Authentication failed: ${error.message}`, 'error');
            this.apiToken = null;
        }
    }

    async makeApiCall(endpoint, options = {}) {
        const response = await fetch(`${this.baseApiUrl}${endpoint}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${this.apiToken}`,
                'Accept': 'application/vnd.github.v3+json',
                ...options.headers
            }
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    async loadAllDeployments() {
        this.showStatus('Loading repositories...', 'success');
        const gridElement = document.getElementById('deploymentGrid');
        gridElement.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Fetching your repositories...</p></div>';

        try {
            let allRepos = [];
            let currentPage = 1;
            let hasMorePages = true;

            while (hasMorePages) {
                const repos = await this.makeApiCall(`/user/repos?per_page=100&page=${currentPage}&sort=updated`);
                if (repos.length === 0) {
                    hasMorePages = false;
                } else {
                    allRepos = allRepos.concat(repos);
                    currentPage++;
                }
            }

            this.showStatus(`Found ${allRepos.length} repositories. Checking Pages status...`, 'success');
            
            const repoWithPagesData = await Promise.all(
                allRepos.map(repo => this.getRepoWithPagesInfo(repo))
            );

            this.renderDeployments(repoWithPagesData);
            this.showStatus(`Displaying ${allRepos.length} repositories`, 'success');
        } catch (error) {
            this.showStatus(`Error loading data: ${error.message}`, 'error');
            gridElement.innerHTML = '<div class="initial-message"><p>❌ Failed to load repositories</p></div>';
        }
    }

    async getRepoWithPagesInfo(repoData) {
        try {
            const pagesInfo = await this.makeApiCall(`/repos/${repoData.owner.login}/${repoData.name}/pages`);
            return { ...repoData, pagesInfo, hasPagesEnabled: true };
        } catch (error) {
            return { ...repoData, pagesInfo: null, hasPagesEnabled: false };
        }
    }

    renderDeployments(repositories) {
        const gridElement = document.getElementById('deploymentGrid');
        
        if (repositories.length === 0) {
            gridElement.innerHTML = '<div class="initial-message"><p>No repositories found</p></div>';
            return;
        }

        gridElement.innerHTML = repositories.map(repo => this.createRepoCard(repo)).join('');
        
        repositories.forEach(repo => {
            if (!repo.hasPagesEnabled) {
                const enableBtn = document.getElementById(`enable-${repo.id}`);
                if (enableBtn) {
                    enableBtn.addEventListener('click', () => this.enablePages(repo));
                }
            } else {
                const disableBtn = document.getElementById(`disable-${repo.id}`);
                const viewBtn = document.getElementById(`view-${repo.id}`);
                
                if (disableBtn) {
                    disableBtn.addEventListener('click', () => this.disablePages(repo));
                }
                if (viewBtn && repo.pagesInfo) {
                    viewBtn.addEventListener('click', () => window.open(repo.pagesInfo.html_url, '_blank'));
                }
            }
        });
    }

    createRepoCard(repo) {
        const statusClass = repo.hasPagesEnabled ? 'active' : 'inactive';
        const statusText = repo.hasPagesEnabled ? 'Active' : 'Not Configured';
        
        let pagesUrlHtml = '';
        let sourceInfoHtml = '';
        let actionButtonsHtml = '';

        if (repo.hasPagesEnabled && repo.pagesInfo) {
            pagesUrlHtml = `<a href="${repo.pagesInfo.html_url}" target="_blank" class="pages-url">${repo.pagesInfo.html_url}</a>`;
            
            if (repo.pagesInfo.source) {
                sourceInfoHtml = `
                    <div class="source-info">
                        <strong>Source:</strong> ${repo.pagesInfo.source.branch} / ${repo.pagesInfo.source.path || '/'}
                    </div>
                `;
            }
            
            actionButtonsHtml = `
                <button id="view-${repo.id}" class="action-btn view-btn">🔗 Visit Site</button>
                <button id="disable-${repo.id}" class="action-btn disable-btn">❌ Disable Pages</button>
            `;
        } else {
            actionButtonsHtml = `
                <button id="enable-${repo.id}" class="action-btn enable-btn">✅ Enable Pages</button>
            `;
        }

        return `
            <div class="repo-card">
                <div class="repo-header">
                    <div>
                        <div class="repo-name">${repo.name}</div>
                        <div style="font-size: 12px; color: #999;">${repo.owner.login}</div>
                    </div>
                    <span class="repo-visibility">${repo.private ? '🔒 Private' : '🌐 Public'}</span>
                </div>
                
                <div class="pages-status">
                    <div class="status-indicator ${statusClass}"></div>
                    <span>Pages: ${statusText}</span>
                </div>
                
                ${pagesUrlHtml}
                ${sourceInfoHtml}
                
                <div class="repo-actions">
                    ${actionButtonsHtml}
                </div>
            </div>
        `;
    }

    async enablePages(repo) {
        const btnId = `enable-${repo.id}`;
        const button = document.getElementById(btnId);
        button.disabled = true;
        button.textContent = '⏳ Enabling...';

        try {
            await this.makeApiCall(`/repos/${repo.owner.login}/${repo.name}/pages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    source: {
                        branch: repo.default_branch || 'main',
                        path: '/'
                    }
                })
            });

            this.showStatus(`Pages enabled for ${repo.name}`, 'success');
            await this.loadAllDeployments();
        } catch (error) {
            this.showStatus(`Failed to enable Pages for ${repo.name}: ${error.message}`, 'error');
            button.disabled = false;
            button.textContent = '✅ Enable Pages';
        }
    }

    async disablePages(repo) {
        if (!confirm(`Are you sure you want to disable GitHub Pages for ${repo.name}?`)) {
            return;
        }

        const btnId = `disable-${repo.id}`;
        const button = document.getElementById(btnId);
        button.disabled = true;
        button.textContent = '⏳ Disabling...';

        try {
            await this.makeApiCall(`/repos/${repo.owner.login}/${repo.name}/pages`, {
                method: 'DELETE'
            });

            this.showStatus(`Pages disabled for ${repo.name}`, 'success');
            await this.loadAllDeployments();
        } catch (error) {
            this.showStatus(`Failed to disable Pages for ${repo.name}: ${error.message}`, 'error');
            button.disabled = false;
            button.textContent = '❌ Disable Pages';
        }
    }

    showStatus(message, type) {
        const statusBar = document.getElementById('statusBar');
        statusBar.textContent = message;
        statusBar.className = `status-bar visible ${type}`;
    }
}

const controller = new PagesDeploymentController();
