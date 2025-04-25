# YouTube P2P Chat Browser Extension

A browser extension that injects a peer-to-peer WebSocket/WebRTC chat interface into YouTube pages, stores past conversation logs locally or in the cloud, and includes fuzzy-searchable chat history.

## Project Overview

This extension allows users to chat with others watching the same YouTube video through a peer-to-peer connection, without requiring a centralized server for message routing. The extension injects a chat interface into the YouTube page, establishes P2P connections using WebRTC (with WebSocket fallback), and stores chat history locally with search capabilities.

## Features

- Real-time P2P chat on YouTube pages
- WebRTC communication with WebSocket fallback
- Local storage of chat history using IndexedDB
- Fuzzy-searchable chat logs
- Responsive and draggable chat interface
- Anonymous identity with optional nicknames
- Cross-browser compatibility (Chrome, Firefox)

## Development Setup

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Chrome or Firefox browser

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/youtube-p2p-chat-extension.git
cd youtube-p2p-chat-extension
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Load the extension in your browser:

**Chrome:**
- Navigate to `chrome://extensions/`
- Enable "Developer mode"
- Click "Load unpacked"
- Select the `dist` folder

**Firefox:**
- Navigate to `about:debugging#/runtime/this-firefox`
- Click "Load Temporary Add-on..."
- Select the `manifest.json` file in the `dist` folder

## Project Structure

```
youtube-p2p-chat-extension/
├── src/
│   ├── assets/            # Icons and static assets
│   ├── background/        # Background service worker
│   ├── content/           # Content scripts
│   ├── popup/             # Extension popup
│   ├── components/        # React components
│   ├── services/          # Core services (P2P, storage)
│   ├── utils/             # Utility functions
│   └── manifest.json      # Extension manifest
├── public/                # Public assets
├── dist/                  # Build output
├── vite.config.js         # Vite configuration
└── package.json           # Project dependencies
```

## Technology Stack

- **Extension Framework**: Manifest V3
- **Build System**: Vite with vite-plugin-web-extension
- **P2P Communication**: PeerJS (WebRTC) with Socket.IO fallback
- **Storage**: Dexie.js (IndexedDB wrapper)
- **UI Framework**: React with TailwindCSS
- **Search**: Fuse.js for fuzzy search

## Building for Production

```bash
npm run build
```

The production-ready extension will be available in the `dist` folder.

## Deployment

### Chrome Web Store

1. Create a ZIP file of the `dist` folder
2. Go to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard)
3. Click "Add new item" and upload the ZIP file
4. Fill in the required information and submit for review

### Firefox Add-ons

1. Create a ZIP file of the `dist` folder
2. Go to the [Firefox Add-on Developer Hub](https://addons.mozilla.org/en-US/developers/)
3. Click "Submit a New Add-on" and upload the ZIP file
4. Fill in the required information and submit for review

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
