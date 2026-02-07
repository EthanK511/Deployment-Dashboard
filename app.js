class PagesDeploymentController {
    constructor() {
        this.apiToken = null;
        this.userLogin = null;
        this.baseApiUrl = 'https://api.github.com';
        this.storageKey = 'github_pages_token';
        this.initializeEventHandlers();
        this.checkForSavedToken();
    }

    initializeEventHandlers() {
        document.getElementById('connectBtn').addEventListener('click', () => this.authenticate());
        document.getElementById('refreshBtn').addEventListener('click', () => this.loadAllDeployments());
        document.getElementById('clearTokenBtn').addEventListener('click', () => this.clearSavedToken());
        document.getElementById('tokenField').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.authenticate();
        });
        
        window.addEventListener('beforeunload', () => {
            this.apiToken = null;
            this.userLogin = null;
        });
    }

    checkForSavedToken() {
        try {
            const savedToken = localStorage.getItem(this.storageKey);
            if (savedToken) {
                document.getElementById('tokenField').value = savedToken;
                document.getElementById('rememberToken').checked = true;
                this.showStatus('Saved token found. Click Connect to authenticate.', 'success');
            }
        } catch (error) {
            console.log('Could not access localStorage:', error);
        }
    }

    saveToken(token) {
        const rememberCheckbox = document.getElementById('rememberToken');
        if (rememberCheckbox.checked) {
            try {
                localStorage.setItem(this.storageKey, token);
            } catch (error) {
                console.log('Could not save token to localStorage:', error);
            }
        }
    }

    clearSavedToken() {
        if (confirm('Are you sure you want to clear the saved token? You will need to re-enter it next time.')) {
            try {
                localStorage.removeItem(this.storageKey);
                document.getElementById('rememberToken').checked = false;
                this.showStatus('Saved token cleared', 'success');
            } catch (error) {
                console.log('Could not clear token from localStorage:', error);
            }
        }
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
            
            // Save token if remember checkbox is checked
            this.saveToken(token);
            
            tokenInput.style.display = 'none';
            document.getElementById('connectBtn').style.display = 'none';
            document.getElementById('rememberToken').parentElement.style.display = 'none';
            document.getElementById('buttonGroup').style.display = 'flex';
            
            // Update user info in header
            const userInfoElement = document.getElementById('userInfo');
            userInfoElement.textContent = `@${this.userLogin}`;
            userInfoElement.style.display = 'block';
            
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
            
            // Update repository count in header
            const repoCountElement = document.getElementById('repoCount');
            repoCountElement.textContent = `${allRepos.length} repositories`;
            repoCountElement.style.display = 'block';
            
            // Clear status bar
            const statusBar = document.getElementById('statusBar');
            statusBar.className = 'status-bar';
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

    async loadBranchesForRepo(repo) {
        try {
            const branches = await this.makeApiCall(`/repos/${repo.owner.login}/${repo.name}/branches`);
            const branchSelect = document.getElementById(`branch-${repo.id}`);
            
            if (branchSelect && branches.length > 0) {
                branchSelect.innerHTML = branches.map(branch => 
                    `<option value="${branch.name}" ${branch.name === repo.default_branch ? 'selected' : ''}>
                        ${branch.name}
                    </option>`
                ).join('');
            }
        } catch (error) {
            console.log(`Could not load branches for ${repo.name}:`, error);
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
                const buildMethodSelect = document.getElementById(`build-method-${repo.id}`);
                const branchConfig = document.getElementById(`branch-config-${repo.id}`);
                const pathConfig = document.getElementById(`path-config-${repo.id}`);
                
                if (enableBtn) {
                    enableBtn.addEventListener('click', () => this.enablePages(repo));
                }
                
                // Handle build method changes
                if (buildMethodSelect) {
                    buildMethodSelect.addEventListener('change', (e) => {
                        const isWorkflow = e.target.value === 'workflow';
                        if (branchConfig) branchConfig.style.display = isWorkflow ? 'none' : 'block';
                        if (pathConfig) pathConfig.style.display = isWorkflow ? 'none' : 'block';
                    });
                }
                
                // Load branches for the repository
                this.loadBranchesForRepo(repo);
            } else {
                const disableBtn = document.getElementById(`disable-${repo.id}`);
                const updateBtn = document.getElementById(`update-${repo.id}`);
                const buildMethodSelect = document.getElementById(`build-method-${repo.id}`);
                const branchConfig = document.getElementById(`branch-config-${repo.id}`);
                const pathConfig = document.getElementById(`path-config-${repo.id}`);
                
                if (disableBtn) {
                    disableBtn.addEventListener('click', () => this.disablePages(repo));
                }
                
                if (updateBtn) {
                    updateBtn.addEventListener('click', () => this.updatePages(repo));
                }
                
                // Handle build method changes
                if (buildMethodSelect) {
                    buildMethodSelect.addEventListener('change', (e) => {
                        const isWorkflow = e.target.value === 'workflow';
                        if (branchConfig) branchConfig.style.display = isWorkflow ? 'none' : 'block';
                        if (pathConfig) pathConfig.style.display = isWorkflow ? 'none' : 'block';
                    });
                }
                
                // Load branches for the repository
                this.loadBranchesForRepo(repo);
            }
        });
    }

    createRepoCard(repo) {
        const statusClass = repo.hasPagesEnabled ? 'active' : 'inactive';
        
        let linksRowHtml = '';
        let actionButtonsHtml = '';
        let configurationHtml = '';

        if (repo.hasPagesEnabled && repo.pagesInfo) {
            // Active/deployed card layout
            const sourceInfo = repo.pagesInfo.source 
                ? `${repo.pagesInfo.source.branch} / ${repo.pagesInfo.source.path || '/'}` 
                : 'N/A';
            
            const currentBranch = repo.pagesInfo.source?.branch || repo.default_branch || 'main';
            const currentPath = repo.pagesInfo.source?.path || '/';
            const buildType = repo.pagesInfo.build_type || 'legacy';
            
            linksRowHtml = `
                <div class="links-row">
                    <a href="${repo.html_url}" target="_blank" class="link-card">
                        <span>📂</span>
                        <span>Repo</span>
                    </a>
                    <a href="${repo.pagesInfo.html_url}" target="_blank" class="link-card">
                        <span>🔗</span>
                        <span>Link</span>
                    </a>
                    <div class="link-card source-card">
                        <span>📋</span>
                        <span>Source: ${sourceInfo}</span>
                    </div>
                </div>
            `;
            
            // Page Settings dropdown with full deployment settings and disable button
            actionButtonsHtml = `
                <details class="config-dropdown">
                    <summary class="config-dropdown-title">⚙️ Page Settings</summary>
                    <div class="config-dropdown-content">
                        <div class="config-group">
                            <label for="build-method-${repo.id}" class="config-label">Build Method:</label>
                            <select id="build-method-${repo.id}" class="config-select">
                                <option value="workflow" ${buildType === 'workflow' ? 'selected' : ''}>GitHub Actions</option>
                                <option value="legacy" ${buildType === 'legacy' ? 'selected' : ''}>Deploy from branch</option>
                            </select>
                            <div class="config-hint">GitHub Actions allows custom build workflows</div>
                        </div>
                        
                        <div id="branch-config-${repo.id}" class="config-group" style="display: ${buildType === 'workflow' ? 'none' : 'block'}">
                            <label for="branch-${repo.id}" class="config-label">Source Branch:</label>
                            <select id="branch-${repo.id}" class="config-select">
                                <option value="${currentBranch}" selected>${currentBranch}</option>
                            </select>
                        </div>
                        
                        <div id="path-config-${repo.id}" class="config-group" style="display: ${buildType === 'workflow' ? 'none' : 'block'}">
                            <label for="path-${repo.id}" class="config-label">Source Path:</label>
                            <select id="path-${repo.id}" class="config-select">
                                <option value="/" ${currentPath === '/' ? 'selected' : ''}>/ (root)</option>
                                <option value="/docs" ${currentPath === '/docs' ? 'selected' : ''}>/docs</option>
                            </select>
                            <div class="config-hint">Choose where your site files are located</div>
                        </div>
                        
                        <button id="update-${repo.id}" class="action-btn enable-btn full-width">💾 Update Settings</button>
                        <button id="disable-${repo.id}" class="action-btn disable-btn full-width">❌ Disable Pages</button>
                    </div>
                </details>
            `;
        } else {
            // Undeployed card layout
            linksRowHtml = `
                <div class="links-row">
                    <a href="${repo.html_url}" target="_blank" class="link-card">
                        <span>📂</span>
                        <span>Repo</span>
                    </a>
                </div>
            `;
            
            // Configuration section as dropdown with Enable button inside
            configurationHtml = `
                <details class="config-dropdown">
                    <summary class="config-dropdown-title">⚙️ Page Settings</summary>
                    <div class="config-dropdown-content">
                        <div class="config-group">
                            <label for="build-method-${repo.id}" class="config-label">Build Method:</label>
                            <select id="build-method-${repo.id}" class="config-select">
                                <option value="workflow">GitHub Actions</option>
                                <option value="legacy" selected>Deploy from branch</option>
                            </select>
                            <div class="config-hint">GitHub Actions allows custom build workflows</div>
                        </div>
                        
                        <div id="branch-config-${repo.id}" class="config-group">
                            <label for="branch-${repo.id}" class="config-label">Source Branch:</label>
                            <select id="branch-${repo.id}" class="config-select">
                                <option value="${repo.default_branch || 'main'}" selected>${repo.default_branch || 'main'}</option>
                            </select>
                        </div>
                        
                        <div id="path-config-${repo.id}" class="config-group">
                            <label for="path-${repo.id}" class="config-label">Source Path:</label>
                            <select id="path-${repo.id}" class="config-select">
                                <option value="/" selected>/ (root)</option>
                                <option value="/docs">/docs</option>
                            </select>
                            <div class="config-hint">Choose where your site files are located</div>
                        </div>
                        
                        <button id="enable-${repo.id}" class="action-btn enable-btn full-width">✅ Enable Pages</button>
                    </div>
                </details>
            `;
            
            actionButtonsHtml = '';
        }

        return `
            <div class="repo-card">
                <div class="repo-header">
                    <div class="repo-name">${repo.name}</div>
                    <div class="repo-header-right">
                        <span class="status-label">Status:</span>
                        <div class="status-indicator ${statusClass}"></div>
                        <span class="repo-visibility">${repo.private ? '🔒 Private' : '🌐 Public'}</span>
                    </div>
                </div>
                
                ${linksRowHtml}
                ${configurationHtml}
                ${actionButtonsHtml ? `<div class="repo-actions">${actionButtonsHtml}</div>` : ''}
            </div>
        `;
    }

    async enablePages(repo) {
        const btnId = `enable-${repo.id}`;
        const button = document.getElementById(btnId);
        
        if (!button) {
            console.error('Enable button not found');
            return;
        }
        
        button.disabled = true;
        button.textContent = '⏳ Enabling...';

        try {
            // Get selected configuration
            const buildMethodElement = document.getElementById(`build-method-${repo.id}`);
            if (!buildMethodElement) {
                throw new Error('Build method selector not found');
            }
            
            const buildMethod = buildMethodElement.value;

            let requestBody;
            if (buildMethod === 'workflow') {
                // For GitHub Actions, only set build_type
                requestBody = {
                    build_type: 'workflow'
                };
            } else {
                // For deploy from branch, include source configuration
                const branchElement = document.getElementById(`branch-${repo.id}`);
                const pathElement = document.getElementById(`path-${repo.id}`);
                
                if (!branchElement || !pathElement) {
                    throw new Error('Branch or path selector not found');
                }
                
                const branch = branchElement.value;
                const path = pathElement.value;
                
                requestBody = {
                    source: {
                        branch: branch,
                        path: path
                    },
                    build_type: 'legacy'
                };
            }

            await this.makeApiCall(`/repos/${repo.owner.login}/${repo.name}/pages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
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

    async updatePages(repo) {
        const btnId = `update-${repo.id}`;
        const button = document.getElementById(btnId);
        
        if (!button) {
            console.error('Update button not found');
            return;
        }
        
        button.disabled = true;
        button.textContent = '⏳ Updating...';

        try {
            // Get selected configuration
            const buildMethodElement = document.getElementById(`build-method-${repo.id}`);
            if (!buildMethodElement) {
                throw new Error('Build method selector not found');
            }
            
            const buildMethod = buildMethodElement.value;

            let requestBody;
            if (buildMethod === 'workflow') {
                // For GitHub Actions, only set build_type
                requestBody = {
                    build_type: 'workflow'
                };
            } else {
                // For deploy from branch, include source configuration
                const branchElement = document.getElementById(`branch-${repo.id}`);
                const pathElement = document.getElementById(`path-${repo.id}`);
                
                if (!branchElement || !pathElement) {
                    throw new Error('Branch or path selector not found');
                }
                
                const branch = branchElement.value;
                const path = pathElement.value;
                
                requestBody = {
                    source: {
                        branch: branch,
                        path: path
                    },
                    build_type: 'legacy'
                };
            }

            await this.makeApiCall(`/repos/${repo.owner.login}/${repo.name}/pages`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            this.showStatus(`Pages settings updated for ${repo.name}`, 'success');
            await this.loadAllDeployments();
        } catch (error) {
            this.showStatus(`Failed to update Pages settings for ${repo.name}: ${error.message}`, 'error');
            button.disabled = false;
            button.textContent = '💾 Update Settings';
        }
    }

    showStatus(message, type) {
        const statusBar = document.getElementById('statusBar');
        statusBar.textContent = message;
        statusBar.className = `status-bar visible ${type}`;
    }
}

const controller = new PagesDeploymentController();
