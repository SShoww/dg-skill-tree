# MCP Integration Guide for DG Skill Tree

This guide explains how to configure Model Context Protocol (MCP) servers for your AI client (Claude Desktop, Cursor, or VS Code) to interact with this project.

---

## 1. Claude Desktop Setup
Claude Desktop reads configurations from a JSON file.

### Location on Windows:
Press `Win + R`, type `%APPDATA%\Claude\`, and press Enter. Open the file named `claude_desktop_config.json`. If it does not exist, create a new text file and rename it to `claude_desktop_config.json`.

### Configuration:
Add the following JSON payload. Make sure to replace `YOUR_GITHUB_TOKEN` with a GitHub Personal Access Token (PAT) with `repo` scopes:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "YOUR_GITHUB_TOKEN"
      }
    },
    "puppeteer": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-puppeteer"
      ]
    },
    "vercel": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://mcp.vercel.com"
      ]
    }
  }
}
```

> [!IMPORTANT]
> You must **completely exit** and restart the Claude Desktop application for the settings to apply.

---

## 2. Cursor IDE Setup
In Cursor, you can add MCP servers directly via the Settings GUI.

1. Open Cursor and navigate to **Settings** (Gear icon in the top right, or `Ctrl + Shift + J`).
2. Go to **Features** -> **MCP**.
3. Click **+ Add New MCP Server** for each of the following:

### GitHub Server
*   **Name**: `GitHub`
*   **Type**: `command`
*   **Command**: `npx -y @modelcontextprotocol/server-github`
*   **Environment Variables**: Add `GITHUB_PERSONAL_ACCESS_TOKEN` as the key and your GitHub token as the value.

### Puppeteer Server (Web UI Testing/Scraping)
*   **Name**: `Puppeteer`
*   **Type**: `command`
*   **Command**: `npx -y @modelcontextprotocol/server-puppeteer`

### Vercel Server (Deployment management)
*   **Name**: `Vercel`
*   **Type**: `SSE`
*   **URL**: `https://mcp.vercel.com`

---

## 3. How to Generate your GitHub Token
To allow the GitHub MCP server to interact with your repository:
1. Go to your [GitHub Settings > Developer Settings](https://github.com/settings/tokens).
2. Click **Generate new token (classic)**.
3. Select the `repo` scope checkbox (this permits reading code, committing, and pushing).
4. Click **Generate token**, copy the token value, and paste it into your configuration.
