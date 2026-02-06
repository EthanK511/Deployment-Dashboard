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
   - Create a GitHub Personal Access Token at: https://github.com/settings/tokens
   - Required permissions: `repo` and `pages` (or `public_repo` for public repos only)
   - Enter your token in the dashboard and click "Connect"

4. **Manage Your Deployments**
   - View all repositories and their Pages status
   - Enable Pages for any repository with one click
   - Disable Pages when you no longer need them
   - Visit live sites directly from the dashboard

## Usage

### Creating a Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a descriptive name like "Pages Dashboard"
4. Select scopes:
   - `repo` (Full control of private repositories)
   - `pages` (Read and write GitHub Pages)
5. Generate and copy the token

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
- Verify your token has correct permissions
- Check if the token hasn't expired
- Ensure you copied the entire token

**Can't Enable Pages**
- Repository must have at least one branch
- Check that Pages isn't already enabled
- Verify you have admin permissions on the repository

**Loading Issues**
- Check your internet connection
- Verify GitHub API is accessible
- Look for error messages in the status bar

## License

MIT License - Feel free to use and modify as needed.