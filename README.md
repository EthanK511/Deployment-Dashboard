# GitHub Pages Control Center

A streamlined dashboard for managing all your GitHub Pages deployments from one unified interface.

## Features

- 🔍 **View All Repositories**: See all your repos and their Pages status in one place
- ⚡ **Enable/Disable Pages**: Quick controls to activate or deactivate GitHub Pages
- 🌐 **Live URLs**: Direct links to visit your deployed sites
- 📊 **Deployment Status**: Visual indicators for active/inactive deployments
- 🔧 **Source Configuration**: View which branch and path each site uses
- 🎨 **Modern UI**: Clean, responsive interface with dark theme

## Quick Start

1. **Clone or Download** this repository

2. **Open the Dashboard**
   - Simply open `index.html` in your web browser
   - Or serve it with any web server (e.g., `python -m http.server`)

3. **Authenticate**
   - Create a GitHub Personal Access Token (see detailed instructions below)
   - Enter your token in the dashboard and click "Connect"

4. **Manage Your Deployments**
   - View all repositories and their Pages status
   - Enable Pages for any repository with one click
   - Disable Pages when you no longer need them
   - Visit live sites directly from the dashboard

## Usage

### Creating a Personal Access Token

You have two options for creating a GitHub token: **Fine-grained tokens** (recommended) or **Classic tokens**. Choose one of the options below.

#### Option 1: Fine-Grained Personal Access Token (Recommended)

Fine-grained tokens provide more granular control over permissions and are more secure.

1. Go to GitHub Settings → Developer settings → Personal access tokens → [Fine-grained tokens](https://github.com/settings/personal-access-tokens/new)
2. Click "Generate new token"
3. Configure the token:
   - **Token name**: Give it a descriptive name like "Pages Dashboard"
   - **Expiration**: Choose your preferred expiration (90 days recommended)
   - **Repository access**: Select "All repositories" or choose specific repositories
4. Under **Permissions**, expand "Repository permissions" and set:
   - **Actions**: Read and write (for workflow management)
   - **Administration**: Read and write (required for enabling/disabling Pages)
   - **Contents**: Read and write (access to code and branches)
   - **Metadata**: Read-only (automatically selected, required)
   - **Pages**: Read and write (**CRITICAL** - required to enable/disable Pages)
5. Click "Generate token" and copy it immediately (you won't see it again!)

**Required Fine-Grained Permissions Summary:**
- ✅ **Administration** (Read and write) - Manage repository settings
- ✅ **Contents** (Read and write) - Access code, branches, and commits
- ✅ **Metadata** (Read-only) - Required for basic repository data
- ✅ **Pages** (Read and write) - **CRITICAL** for enabling/disabling Pages

**Optional but helpful:**
- **Actions** (Read and write) - If managing GitHub Actions
- **Deployments** (Read and write) - For deployment status

#### Option 2: Classic Personal Access Token

Classic tokens have broader permissions but are simpler to configure.

1. Go to GitHub Settings → Developer settings → Personal access tokens → [Tokens (classic)](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Configure the token:
   - **Note**: Give it a descriptive name like "Pages Dashboard"
   - **Expiration**: Choose your preferred expiration
4. Select the following scopes:
   - ✅ **`repo`** (Full control of private repositories) - **REQUIRED**
     - This includes: `repo:status`, `repo_deployment`, `public_repo`, `repo:invite`, `security_events`
   - ✅ **`workflow`** (Update GitHub Action workflows) - Optional, for Actions management
5. Click "Generate token" and copy it immediately

**Required Classic Token Scopes Summary:**
- ✅ **`repo`** - Full control of repositories (**CRITICAL** - includes Pages access)

**Note on Classic Tokens:** The `repo` scope provides access to manage GitHub Pages. There is no separate `pages` scope in classic tokens - Pages management is included in the `repo` scope.

**Common Issue:** If you see a 403 error when enabling Pages, ensure:
- For fine-grained tokens: You have **Pages** permission set to "Read and write"
- For classic tokens: You have the **`repo`** scope selected
- The token has access to the specific repository (check Repository access settings)

### Dashboard Interface

- **Repository Cards**: Each card shows a repository with its Pages status
- **Active Indicator**: Green pulsing dot = Pages is active, Gray = Pages disabled
- **Enable Pages**: Click to activate GitHub Pages using the default branch
- **Disable Pages**: Remove the Pages deployment
- **Visit Site**: Open the live GitHub Pages site in a new tab

## Technical Details

- **Pure Frontend**: No backend required, runs entirely in the browser
- **GitHub REST API**: Uses REST API with v3 compatibility mode for all operations
- **Responsive Design**: Works on desktop and mobile devices
- **No Dependencies**: Built with vanilla HTML, CSS, and JavaScript

## Security Notes

- Your token is stored only in memory during the session
- Never commit your token to version control
- Use tokens with minimal required permissions
- Tokens are sent only to GitHub's API

## Browser Requirements

- Modern browser with ES6+ support (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- Internet connection for GitHub API access

## Troubleshooting

**Authentication Failed**
- Verify your token has correct permissions (see token creation guide above)
- For fine-grained tokens: Ensure Pages permission is set to "Read and write"
- For classic tokens: Ensure `repo` scope is selected
- Check if the token hasn't expired
- Ensure you copied the entire token

**403 Error: "Failed to enable Pages"**
- **Most common cause**: Missing or insufficient permissions
- For fine-grained tokens: You MUST have **Pages** permission set to "Read and write"
- For classic tokens: You MUST have the **`repo`** scope selected
- Ensure the token has access to the specific repository
- Verify you have admin access to the repository
- Check that your token hasn't expired

**Can't Enable Pages**
- Repository must have at least one branch with content
- Check that Pages isn't already enabled
- Verify you have admin permissions on the repository
- Ensure your token has the required permissions (see 403 error above)

**Loading Issues**
- Check your internet connection
- Verify GitHub API is accessible
- Look for error messages in the status bar

## License

MIT License - Feel free to use and modify as needed.