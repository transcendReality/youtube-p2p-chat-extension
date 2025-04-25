# YouTube P2P Chat Browser Extension - Implementation Guide

This document provides a comprehensive guide for implementing the YouTube P2P Chat Browser Extension, including setup instructions, architecture overview, and implementation details for each component.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Development Environment Setup](#development-environment-setup)
4. [Implementation Steps](#implementation-steps)
5. [Testing](#testing)
6. [Deployment](#deployment)
7. [Security Considerations](#security-considerations)
8. [Future Enhancements](#future-enhancements)

## Project Overview

The YouTube P2P Chat Browser Extension injects a peer-to-peer WebSocket/WebRTC chat interface into YouTube pages, allowing users watching the same video to communicate directly without a centralized server. The extension stores past conversation logs locally using IndexedDB and provides fuzzy-searchable chat history.

### Key Features

- Real-time P2P chat on YouTube pages
- WebRTC communication with WebSocket fallback
- Local storage of chat history using IndexedDB
- Fuzzy-searchable chat logs
- Responsive and draggable chat interface
- Anonymous identity with optional nicknames
- Cross-browser compatibility (Chrome, Firefox)

## Architecture

The extension follows a modular architecture with the following components:

### 1. Browser Extension Core

- **Manifest V3 Configuration**: Defines permissions, content scripts, and background service worker
- **Content Script**: Injects chat interface into YouTube pages and handles UI interactions
- **Background Service Worker**: Manages P2P connections and message relay

### 2. Real-Time Chat Engine (P2P Layer)

- **PeerJS Integration**: Abstracts WebRTC for peer-to-peer communication
- **WebSocket Fallback**: Uses Socket.IO for fallback communication when WebRTC fails
- **Signaling Server**: Facilitates peer discovery and connection establishment

### 3. Persistent Chat Log

- **IndexedDB Storage**: Uses Dexie.js to store messages locally
- **Message Schema**: Structured data format for chat messages
- **Search Functionality**: Implements fuzzy search with Fuse.js

### 4. Frontend/UI Layer

- **React Components**: Modular UI components for the chat interface
- **TailwindCSS Styling**: Responsive design with utility-first CSS
- **Draggable Interface**: Allows repositioning the chat panel

### 5. User Identity Management

- **UUID-based Identity**: Anonymous user identification
- **Optional Nicknames**: User-defined display names

## Development Environment Setup

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

## Implementation Steps

### 1. Project Structure Setup

Create the following directory structure:

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
├── vite.config.js         # Vite configuration
├── tailwind.config.js     # TailwindCSS configuration
└── package.json           # Project dependencies
```

### 2. Manifest Configuration

Create `src/manifest.json` with the following configuration:

```json
{
  "manifest_version": 3,
  "name": "YouTube P2P Chat",
  "version": "1.0.0",
  "description": "Peer-to-peer chat interface for YouTube",
  "permissions": ["storage", "scripting", "activeTab"],
  "host_permissions": ["https://www.youtube.com/*"],
  "background": {
    "service_worker": "background/index.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["https://www.youtube.com/*"],
      "js": ["content/index.js"]
    }
  ],
  "action": {
    "default_popup": "popup/index.html",
    "default_icon": {
      "16": "assets/icon16.png",
      "48": "assets/icon48.png",
      "128": "assets/icon128.png"
    }
  },
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self';"
  }
}
```

### 3. Background Service Worker Implementation

Create `src/background/index.js` to handle P2P connections and message relay:

```javascript
// Background service worker for YouTube P2P Chat Extension
// Handles P2P connections and message relay

import { v4 as uuidv4 } from 'uuid';

// Store active connections
const connections = {};
let peerId = null;
let peerServer = null;

// Initialize when extension is installed or updated
chrome.runtime.onInstalled.addListener(async () => {
  console.log('YouTube P2P Chat Extension installed');
  
  // Generate or retrieve user ID
  const storedData = await chrome.storage.local.get(['userId']);
  if (!storedData.userId) {
    const userId = uuidv4();
    await chrome.storage.local.set({ userId });
    console.log('New user ID generated:', userId);
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);
  
  if (message.type === 'INIT_P2P') {
    // Initialize P2P connection for a specific YouTube video
    initializeP2P(message.videoId)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Indicates async response
  }
  
  if (message.type === 'SEND_MESSAGE') {
    // Send message to peers
    sendMessageToPeers(message.data)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Indicates async response
  }
  
  if (message.type === 'JOIN_ROOM') {
    // Join existing chat room
    joinRoom(message.roomId)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Indicates async response
  }
});

// Initialize P2P connection
async function initializeP2P(videoId) {
  try {
    // This would be implemented with actual PeerJS code
    // For this example, we're showing the structure
    peerId = uuidv4();
    
    // In a real implementation, this would initialize PeerJS
    // const peer = new Peer(peerId, {
    //   host: 'your-peerserver.com',
    //   port: 443,
    //   secure: true
    // });
    
    // Create a room ID based on the video ID
    const roomId = `yt-${videoId}-${uuidv4().substring(0, 8)}`;
    
    // Store room info
    await chrome.storage.local.set({ 
      currentRoom: roomId,
      currentVideo: videoId
    });
    
    return { 
      success: true, 
      peerId, 
      roomId 
    };
  } catch (error) {
    console.error('Failed to initialize P2P:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Send message to all connected peers
async function sendMessageToPeers(messageData) {
  try {
    // In a real implementation, this would use PeerJS to send data
    // Object.values(connections).forEach(conn => {
    //   conn.send(messageData);
    // });
    
    // Store message in local database
    // This would be handled by a storage service in real implementation
    
    return { success: true };
  } catch (error) {
    console.error('Failed to send message:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Join an existing chat room
async function joinRoom(roomId) {
  try {
    // In a real implementation, this would connect to peers in the room
    
    // Store current room
    await chrome.storage.local.set({ currentRoom: roomId });
    
    return { 
      success: true, 
      roomId 
    };
  } catch (error) {
    console.error('Failed to join room:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Handle extension unload
self.addEventListener('unload', () => {
  // Clean up connections
  // In a real implementation, this would close PeerJS connections
});
```

### 4. Content Script Implementation

Create `src/content/index.js` to inject the chat interface into YouTube pages:

```javascript
// Content script for YouTube P2P Chat Extension
// Injects chat interface into YouTube pages and handles UI interactions

// Wait for page to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize MutationObserver to detect YouTube SPA navigation
  initMutationObserver();
});

// Initialize immediately for cases where DOMContentLoaded already fired
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  initMutationObserver();
}

// Set up MutationObserver to detect YouTube page changes
function initMutationObserver() {
  const observer = new MutationObserver((mutations) => {
    // Check if we're on a YouTube video page
    if (window.location.pathname.includes('/watch')) {
      // Extract video ID from URL
      const videoId = new URLSearchParams(window.location.search).get('v');
      if (videoId) {
        // Check if chat interface already exists
        if (!document.getElementById('yt-p2p-chat')) {
          injectChatInterface(videoId);
        }
      }
    } else {
      // Remove chat interface if not on a video page
      const chatContainer = document.getElementById('yt-p2p-chat');
      if (chatContainer) {
        chatContainer.remove();
      }
    }
  });

  // Start observing document body for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Initial check in case we're already on a video page
  if (window.location.pathname.includes('/watch')) {
    const videoId = new URLSearchParams(window.location.search).get('v');
    if (videoId && !document.getElementById('yt-p2p-chat')) {
      injectChatInterface(videoId);
    }
  }
}

// Inject chat interface into YouTube page
function injectChatInterface(videoId) {
  console.log('Injecting chat interface for video:', videoId);
  
  // Create chat container
  const chatContainer = document.createElement('div');
  chatContainer.id = 'yt-p2p-chat';
  chatContainer.className = 'yt-p2p-chat-container';
  
  // Set initial styles
  chatContainer.style.position = 'fixed';
  chatContainer.style.bottom = '20px';
  chatContainer.style.right = '20px';
  chatContainer.style.width = '300px';
  chatContainer.style.height = '400px';
  chatContainer.style.backgroundColor = '#ffffff';
  chatContainer.style.border = '1px solid #cccccc';
  chatContainer.style.borderRadius = '8px';
  chatContainer.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
  chatContainer.style.zIndex = '9999';
  chatContainer.style.overflow = 'hidden';
  chatContainer.style.display = 'flex';
  chatContainer.style.flexDirection = 'column';
  
  // Add chat header
  const chatHeader = document.createElement('div');
  chatHeader.className = 'yt-p2p-chat-header';
  chatHeader.style.padding = '10px';
  chatHeader.style.backgroundColor = '#f9f9f9';
  chatHeader.style.borderBottom = '1px solid #eeeeee';
  chatHeader.style.display = 'flex';
  chatHeader.style.justifyContent = 'space-between';
  chatHeader.style.alignItems = 'center';
  chatHeader.style.cursor = 'move'; // Indicate draggable
  
  const chatTitle = document.createElement('div');
  chatTitle.textContent = 'P2P Chat';
  chatTitle.style.fontWeight = 'bold';
  
  const closeButton = document.createElement('button');
  closeButton.textContent = '×';
  closeButton.style.background = 'none';
  closeButton.style.border = 'none';
  closeButton.style.fontSize = '20px';
  closeButton.style.cursor = 'pointer';
  closeButton.style.color = '#666666';
  closeButton.onclick = () => {
    chatContainer.remove();
  };
  
  chatHeader.appendChild(chatTitle);
  chatHeader.appendChild(closeButton);
  
  // Add chat messages area
  const messagesArea = document.createElement('div');
  messagesArea.className = 'yt-p2p-chat-messages';
  messagesArea.style.flex = '1';
  messagesArea.style.overflowY = 'auto';
  messagesArea.style.padding = '10px';
  
  // Add chat input area
  const inputArea = document.createElement('div');
  inputArea.className = 'yt-p2p-chat-input';
  inputArea.style.padding = '10px';
  inputArea.style.borderTop = '1px solid #eeeeee';
  inputArea.style.display = 'flex';
  
  const messageInput = document.createElement('input');
  messageInput.type = 'text';
  messageInput.placeholder = 'Type a message...';
  messageInput.style.flex = '1';
  messageInput.style.padding = '8px';
  messageInput.style.border = '1px solid #dddddd';
  messageInput.style.borderRadius = '4px';
  messageInput.style.marginRight = '8px';
  
  const sendButton = document.createElement('button');
  sendButton.textContent = 'Send';
  sendButton.style.padding = '8px 12px';
  sendButton.style.backgroundColor = '#065fd4';
  sendButton.style.color = 'white';
  sendButton.style.border = 'none';
  sendButton.style.borderRadius = '4px';
  sendButton.style.cursor = 'pointer';
  
  inputArea.appendChild(messageInput);
  inputArea.appendChild(sendButton);
  
  // Assemble chat interface
  chatContainer.appendChild(chatHeader);
  chatContainer.appendChild(messagesArea);
  chatContainer.appendChild(inputArea);
  
  // Add to page
  document.body.appendChild(chatContainer);
  
  // Initialize P2P connection
  initializeP2P(videoId, messagesArea);
  
  // Make chat window draggable
  makeDraggable(chatContainer, chatHeader);
  
  // Set up send button functionality
  sendButton.onclick = () => sendMessage(messageInput, messagesArea);
  messageInput.onkeypress = (e) => {
    if (e.key === 'Enter') {
      sendMessage(messageInput, messagesArea);
    }
  };
}

// Initialize P2P connection for chat
function initializeP2P(videoId, messagesArea) {
  // Send message to background script to initialize P2P
  chrome.runtime.sendMessage(
    { type: 'INIT_P2P', videoId },
    (response) => {
      if (response && response.success) {
        console.log('P2P initialized:', response);
        
        // Display room info in chat
        const roomMessage = document.createElement('div');
        roomMessage.className = 'yt-p2p-system-message';
        roomMessage.style.padding = '5px';
        roomMessage.style.margin = '5px 0';
        roomMessage.style.backgroundColor = '#f0f0f0';
        roomMessage.style.borderRadius = '4px';
        roomMessage.style.fontSize = '12px';
        roomMessage.style.textAlign = 'center';
        roomMessage.textContent = `Room ID: ${response.roomId}`;
        
        messagesArea.appendChild(roomMessage);
        
        // Listen for incoming messages from background
        chrome.runtime.onMessage.addListener((message) => {
          if (message.type === 'CHAT_MESSAGE') {
            displayMessage(messagesArea, message.data);
          }
        });
      } else {
        console.error('Failed to initialize P2P:', response?.error);
        
        // Display error in chat
        const errorMessage = document.createElement('div');
        errorMessage.className = 'yt-p2p-error-message';
        errorMessage.style.padding = '5px';
        errorMessage.style.margin = '5px 0';
        errorMessage.style.backgroundColor = '#ffebee';
        errorMessage.style.color = '#c62828';
        errorMessage.style.borderRadius = '4px';
        errorMessage.style.fontSize = '12px';
        errorMessage.style.textAlign = 'center';
        errorMessage.textContent = 'Failed to connect to chat. Please try again.';
        
        messagesArea.appendChild(errorMessage);
      }
    }
  );
}

// Send chat message
function sendMessage(inputElement, messagesArea) {
  const messageText = inputElement.value.trim();
  if (!messageText) return;
  
  // Get user info
  chrome.storage.local.get(['userId', 'nickname'], (data) => {
    const messageData = {
      userId: data.userId,
      nickname: data.nickname || 'Anonymous',
      text: messageText,
      timestamp: Date.now()
    };
    
    // Send to background script
    chrome.runtime.sendMessage(
      { type: 'SEND_MESSAGE', data: messageData },
      (response) => {
        if (response && response.success) {
          // Display own message in chat
          displayMessage(messagesArea, messageData, true);
          
          // Clear input
          inputElement.value = '';
        } else {
          console.error('Failed to send message:', response?.error);
          
          // Display error in chat
          const errorMessage = document.createElement('div');
          errorMessage.className = 'yt-p2p-error-message';
          errorMessage.style.padding = '5px';
          errorMessage.style.margin = '5px 0';
          errorMessage.style.backgroundColor = '#ffebee';
          errorMessage.style.color = '#c62828';
          errorMessage.style.borderRadius = '4px';
          errorMessage.style.fontSize = '12px';
          errorMessage.style.textAlign = 'center';
          errorMessage.textContent = 'Failed to send message. Please try again.';
          
          messagesArea.appendChild(errorMessage);
        }
      }
    );
  });
}

// Display chat message
function displayMessage(messagesArea, messageData, isOwnMessage = false) {
  const messageElement = document.createElement('div');
  messageElement.className = isOwnMessage ? 'yt-p2p-own-message' : 'yt-p2p-peer-message';
  messageElement.style.padding = '8px';
  messageElement.style.margin = '5px 0';
  messageElement.style.borderRadius = '8px';
  messageElement.style.maxWidth = '80%';
  messageElement.style.wordBreak = 'break-word';
  
  if (isOwnMessage) {
    messageElement.style.backgroundColor = '#e3f2fd';
    messageElement.style.marginLeft = 'auto';
  } else {
    messageElement.style.backgroundColor = '#f5f5f5';
    messageElement.style.marginRight = 'auto';
  }
  
  const nameSpan = document.createElement('div');
  nameSpan.className = 'yt-p2p-message-name';
  nameSpan.style.fontWeight = 'bold';
  nameSpan.style.fontSize = '12px';
  nameSpan.style.marginBottom = '3px';
  nameSpan.textContent = messageData.nickname || 'Anonymous';
  
  const textSpan = document.createElement('div');
  textSpan.className = 'yt-p2p-message-text';
  textSpan.textContent = messageData.text;
  
  const timeSpan = document.createElement('div');
  timeSpan.className = 'yt-p2p-message-time';
  timeSpan.style.fontSize = '10px';
  timeSpan.style.color = '#757575';
  timeSpan.style.textAlign = 'right';
  timeSpan.style.marginTop = '3px';
  timeSpan.textContent = new Date(messageData.timestamp).toLocaleTimeString();
  
  messageElement.appendChild(nameSpan);
  messageElement.appendChild(textSpan);
  messageElement.appendChild(timeSpan);
  
  messagesArea.appendChild(messageElement);
  
  // Scroll to bottom
  messagesArea.scrollTop = messagesArea.scrollHeight;
}

// Make an element draggable
function makeDraggable(element, handle) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  
  handle.onmousedown = dragMouseDown;
  
  function dragMouseDown(e) {
    e.preventDefault();
    // Get mouse position at startup
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }
  
  function elementDrag(e) {
    e.preventDefault();
    // Calculate new position
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // Set element's new position
    element.style.top = (element.offsetTop - pos2) + "px";
    element.style.left = (element.offsetLeft - pos1) + "px";
    // Ensure element stays within viewport
    const rect = element.getBoundingClientRect();
    if (rect.left < 0) element.style.left = "0px";
    if (rect.top < 0) element.style.top = "0px";
    if (rect.right > window.innerWidth) element.style.left = (window.innerWidth - rect.width) + "px";
    if (rect.bottom > window.innerHeight) element.style.top = (window.innerHeight - rect.height) + "px";
  }
  
  function closeDragElement() {
    // Stop moving when mouse button is released
    document.onmouseup = null;
    document.onmousemove = null;
  }
}
```

### 5. P2P Service Implementation

Create `src/services/p2p-service.js` to handle WebRTC connections:

```javascript
// P2P Service for YouTube P2P Chat Extension
// Handles WebRTC connections using PeerJS with WebSocket fallback

import { Peer } from 'peerjs';
import { v4 as uuidv4 } from 'uuid';
import { io } from 'socket.io-client';
import { saveMessage, getMessagesForRoom } from './storage-service';

class P2PService {
  constructor() {
    this.peerId = null;
    this.peer = null;
    this.connections = {};
    this.roomId = null;
    this.videoId = null;
    this.socket = null;
    this.messageCallbacks = [];
    this.useWebSocketFallback = false;
    this.serverUrl = 'https://your-peerserver.com'; // Replace with actual server URL
  }

  // Initialize P2P connection
  async initialize(videoId) {
    try {
      this.videoId = videoId;
      
      // Generate or retrieve peer ID
      const storedData = await chrome.storage.local.get(['peerId']);
      this.peerId = storedData.peerId || uuidv4();
      
      // Save peer ID if new
      if (!storedData.peerId) {
        await chrome.storage.local.set({ peerId: this.peerId });
      }
      
      // Create room ID based on video ID
      this.roomId = `yt-${videoId}-${uuidv4().substring(0, 8)}`;
      
      // Initialize PeerJS
      await this.initializePeerJS();
      
      return {
        success: true,
        peerId: this.peerId,
        roomId: this.roomId
      };
    } catch (error) {
      console.error('Failed to initialize P2P:', error);
      
      // Try WebSocket fallback
      if (!this.useWebSocketFallback) {
        this.useWebSocketFallback = true;
        return this.initializeWebSocketFallback();
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Initialize PeerJS for WebRTC
  async initializePeerJS() {
    return new Promise((resolve, reject) => {
      this.peer = new Peer(this.peerId, {
        host: this.serverUrl,
        port: 443,
        secure: true,
        debug: 2
      });
      
      this.peer.on('open', (id) => {
        console.log('PeerJS connection established with ID:', id);
        this.setupPeerEventListeners();
        resolve();
      });
      
      this.peer.on('error', (error) => {
        console.error('PeerJS error:', error);
        reject(error);
      });
    });
  }
  
  // Set up PeerJS event listeners
  setupPeerEventListeners() {
    this.peer.on('connection', (conn) => {
      this.handleConnection(conn);
    });
  }
  
  // Handle new peer connection
  handleConnection(conn) {
    this.connections[conn.peer] = conn;
    
    conn.on('open', () => {
      console.log('Connection established with peer:', conn.peer);
    });
    
    conn.on('data', (data) => {
      console.log('Received data from peer:', data);
      this.handleIncomingMessage(data);
    });
    
    conn.on('close', () => {
      console.log('Connection closed with peer:', conn.peer);
      delete this.connections[conn.peer];
    });
    
    conn.on('error', (error) => {
      console.error('Connection error with peer:', conn.peer, error);
      delete this.connections[conn.peer];
    });
  }
  
  // Connect to a specific peer
  connectToPeer(remotePeerId) {
    if (this.connections[remotePeerId]) {
      return this.connections[remotePeerId];
    }
    
    const conn = this.peer.connect(remotePeerId, {
      reliable: true
    });
    
    this.handleConnection(conn);
    return conn;
  }
  
  // Initialize WebSocket fallback
  async initializeWebSocketFallback() {
    try {
      this.socket = io(this.serverUrl, {
        query: {
          peerId: this.peerId,
          roomId: this.roomId
        }
      });
      
      this.setupSocketEventListeners();
      
      return {
        success: true,
        peerId: this.peerId,
        roomId: this.roomId,
        usingFallback: true
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket fallback:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Set up Socket.IO event listeners
  setupSocketEventListeners() {
    this.socket.on('connect', () => {
      console.log('Socket.IO connection established');
      this.socket.emit('join-room', this.roomId, this.peerId);
    });
    
    this.socket.on('user-connected', (peerId) => {
      console.log('User connected via WebSocket:', peerId);
    });
    
    this.socket.on('user-disconnected', (peerId) => {
      console.log('User disconnected via WebSocket:', peerId);
    });
    
    this.socket.on('chat-message', (data) => {
      console.log('Received message via WebSocket:', data);
      this.handleIncomingMessage(data);
    });
    
    this.socket.on('error', (error) => {
      console.error('Socket.IO error:', error);
    });
  }
  
  // Send message to peers
  async sendMessage(messageData) {
    try {
      // Save message to local storage
      await saveMessage(messageData);
      
      if (this.useWebSocketFallback) {
        // Send via WebSocket
        this.socket.emit('chat-message', {
          roomId: this.roomId,
          ...messageData
        });
      } else {
        // Send via WebRTC
        Object.values(this.connections).forEach(conn => {
          if (conn.open) {
            conn.send(messageData);
          }
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Failed to send message:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Join existing chat room
  async joinRoom(roomId) {
    try {
      this.roomId = roomId;
      
      if (this.useWebSocketFallback) {
        // Join room via WebSocket
        this.socket.emit('join-room', roomId, this.peerId);
      } else {
        // In a real implementation, this would connect to peers in the room
        // This would require a signaling server to exchange peer IDs
      }
      
      // Load previous messages
      const messages = await getMessagesForRoom(roomId);
      
      return {
        success: true,
        roomId,
        messages
      };
    } catch (error) {
      console.error('Failed to join room:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Handle incoming message
  handleIncomingMessage(data) {
    // Save message to local storage
    saveMessage(data);
    
    // Notify all registered callbacks
    this.messageCallbacks.forEach(callback => {
      callback(data);
    });
  }
  
  // Register callback for incoming messages
  onMessage(callback) {
    this.messageCallbacks.push(callback);
  }
  
  // Clean up connections
  cleanup() {
    if (this.peer) {
      this.peer.destroy();
    }
    
    if (this.socket) {
      this.socket.disconnect();
    }
    
    this.connections = {};
  }
}

// Export singleton instance
const p2pService = new P2PService();
export default p2pService;
```

### 6. Storage Service Implementation

Create `src/services/storage-service.js` to handle local storage:

```javascript
// Storage Service for YouTube P2P Chat Extension
// Handles local storage using Dexie.js (IndexedDB wrapper)

import Dexie from 'dexie';
import Fuse from 'fuse.js';
import DOMPurify from 'dompurify';

// Initialize Dexie database
const db = new Dexie('YouTubeP2PChat');
db.version(1).stores({
  messages: '++id, roomId, userId, timestamp',
  rooms: 'id, name, createdAt',
  users: 'id, nickname, lastSeen'
});

// Save message to local storage
export async function saveMessage(messageData) {
  try {
    // Sanitize message text
    const sanitizedMessage = {
      ...messageData,
      text: DOMPurify.sanitize(messageData.text)
    };
    
    // Add to database
    const id = await db.messages.add({
      roomId: messageData.roomId,
      userId: messageData.userId,
      nickname: messageData.nickname || 'Anonymous',
      text: sanitizedMessage.text,
      timestamp: messageData.timestamp || Date.now()
    });
    
    return { success: true, id };
  } catch (error) {
    console.error('Failed to save message:', error);
    return { success: false, error: error.message };
  }
}

// Get messages for a specific room
export async function getMessagesForRoom(roomId, limit = 50) {
  try {
    const messages = await db.messages
      .where('roomId')
      .equals(roomId)
      .reverse() // Newest first
      .limit(limit)
      .toArray();
    
    // Return in chronological order
    return messages.reverse();
  } catch (error) {
    console.error('Failed to get messages:', error);
    return [];
  }
}

// Search messages using Fuse.js
export async function searchMessages(roomId, query) {
  try {
    // Get messages for the room
    const messages = await db.messages
      .where('roomId')
      .equals(roomId)
      .toArray();
    
    // Configure Fuse for fuzzy search
    const fuse = new Fuse(messages, {
      keys: ['text', 'nickname'],
      includeScore: true,
      threshold: 0.4
    });
    
    // Perform search
    const results = fuse.search(query);
    
    // Return items sorted by timestamp
    return results
      .map(result => result.item)
      .sort((a, b) => a.timestamp - b.timestamp);
  } catch (error) {
    console.error('Failed to search messages:', error);
    return [];
  }
}

// Save room information
export async function saveRoom(roomData) {
  try {
    await db.rooms.put({
      id: roomData.id,
      name: roomData.name || `Room for ${roomData.videoId}`,
      videoId: roomData.videoId,
      createdAt: roomData.createdAt || Date.now(),
      lastActive: Date.now()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Failed to save room:', error);
    return { success: false, error: error.message };
  }
}

// Get all rooms
export async function getRooms() {
  try {
    return await db.rooms
      .orderBy('lastActive')
      .reverse()
      .toArray();
  } catch (error) {
    console.error('Failed to get rooms:', error);
    return [];
  }
}

// Update user information
export async function updateUser(userData) {
  try {
    await db.users.put({
      id: userData.id,
      nickname: userData.nickname,
      lastSeen: Date.now()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Failed to update user:', error);
    return { success: false, error: error.message };
  }
}

// Get user information
export async function getUser(userId) {
  try {
    return await db.users.get(userId);
  } catch (error) {
    console.error('Failed to get user:', error);
    return null;
  }
}

// Clear old messages (optional cleanup)
export async function clearOldMessages(daysToKeep = 30) {
  try {
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    
    const count = await db.messages
      .where('timestamp')
      .below(cutoffTime)
      .delete();
    
    return { success: true, count };
  } catch (error) {
    console.error('Failed to clear old messages:', error);
    return { success: false, error: error.message };
  }
}

// Export database for direct access if needed
export { db };
```

### 7. React Components Implementation

Create `src/components/ChatComponents.jsx` for the UI layer:

```jsx
// React components for YouTube P2P Chat Extension
// Main UI components for the chat interface

import React, { useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import p2pService from '../services/p2p-service';
import { getMessagesForRoom, searchMessages, saveMessage } from '../services/storage-service';

// Main Chat Container Component
export const ChatContainer = ({ videoId, roomId }) => {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [nickname, setNickname] = useState('Anonymous');
  
  useEffect(() => {
    // Initialize chat when component mounts
    initializeChat();
    
    // Load user nickname
    chrome.storage.local.get(['nickname'], (data) => {
      if (data.nickname) {
        setNickname(data.nickname);
      }
    });
    
    // Clean up on unmount
    return () => {
      p2pService.cleanup();
    };
  }, []);
  
  // Initialize chat connection
  const initializeChat = async () => {
    try {
      let result;
      
      if (roomId) {
        // Join existing room
        result = await p2pService.joinRoom(roomId);
      } else {
        // Create new room for video
        result = await p2pService.initialize(videoId);
      }
      
      if (result.success) {
        setIsConnected(true);
        
        // Load previous messages
        const previousMessages = await getMessagesForRoom(result.roomId);
        setMessages(previousMessages);
        
        // Register message handler
        p2pService.onMessage((data) => {
          setMessages(prevMessages => [...prevMessages, data]);
        });
      } else {
        setError('Failed to connect to chat');
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    }
  };
  
  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    const results = await searchMessages(roomId || p2pService.roomId, searchQuery);
    setSearchResults(results);
  };
  
  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
    setSearchResults([]);
  };
  
  return (
    <div className="yt-p2p-chat-container">
      <ChatHeader 
        isConnected={isConnected} 
        roomId={roomId || p2pService.roomId}
        nickname={nickname}
        setNickname={setNickname}
      />
      
      <SearchBar 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearch={handleSearch}
        clearSearch={clearSearch}
      />
      
      {error && <ErrorMessage message={error} />}
      
      <MessageList 
        messages={isSearching ? searchResults : messages} 
        isSearchResults={isSearching}
      />
      
      <InputBox 
        nickname={nickname}
        roomId={roomId || p2pService.roomId}
        onMessageSent={(message) => {
          setMessages(prevMessages => [...prevMessages, message]);
        }}
      />
    </div>
  );
};

// Chat Header Component
const ChatHeader = ({ isConnected, roomId, nickname, setNickname }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempNickname, setTempNickname] = useState(nickname);
  
  const saveNickname = () => {
    const sanitizedNickname = DOMPurify.sanitize(tempNickname.trim());
    if (sanitizedNickname) {
      setNickname(sanitizedNickname);
      chrome.storage.local.set({ nickname: sanitizedNickname });
    }
    setIsSettingsOpen(false);
  };
  
  return (
    <div className="yt-p2p-chat-header">
      <div className="yt-p2p-chat-title">
        P2P Chat {isConnected ? '(Connected)' : '(Connecting...)'}
      </div>
      
      <div className="yt-p2p-chat-controls">
        <button 
          className="yt-p2p-settings-button"
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
        >
          ⚙️
        </button>
        
        <button className="yt-p2p-close-button">×</button>
      </div>
      
      {isSettingsOpen && (
        <div className="yt-p2p-settings-panel">
          <div className="yt-p2p-settings-item">
            <label>Nickname:</label>
            <input 
              type="text" 
              value={tempNickname}
              onChange={(e) => setTempNickname(e.target.value)}
            />
          </div>
          
          <div className="yt-p2p-settings-item">
            <label>Room ID:</label>
            <input type="text" value={roomId} readOnly />
            <button onClick={() => navigator.clipboard.writeText(roomId)}>
              Copy
            </button>
          </div>
          
          <div className="yt-p2p-settings-actions">
            <button onClick={saveNickname}>Save</button>
            <button onClick={() => setIsSettingsOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

// Search Bar Component
const SearchBar = ({ searchQuery, setSearchQuery, handleSearch, clearSearch }) => {
  return (
    <div className="yt-p2p-search-bar">
      <input
        type="text"
        placeholder="Search messages..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
      />
      
      {searchQuery ? (
        <button onClick={clearSearch}>Clear</button>
      ) : (
        <button onClick={handleSearch}>Search</button>
      )}
    </div>
  );
};

// Message List Component
const MessageList = ({ messages, isSearchResults }) => {
  const messagesEndRef = useRef(null);
  
  useEffect(() => {
    // Scroll to bottom when new messages arrive (but not for search results)
    if (!isSearchResults && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isSearchResults]);
  
  return (
    <div className="yt-p2p-chat-messages">
      {isSearchResults && messages.length === 0 && (
        <div className="yt-p2p-no-results">No messages found</div>
      )}
      
      {messages.map((message, index) => (
        <MessageItem key={index} message={message} />
      ))}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

// Individual Message Component
const MessageItem = ({ message }) => {
  // Check if this is the user's own message
  const [isOwnMessage, setIsOwnMessage] = useState(false);
  
  useEffect(() => {
    chrome.storage.local.get(['userId'], (data) => {
      setIsOwnMessage(data.userId === message.userId);
    });
  }, [message.userId]);
  
  return (
    <div className={`yt-p2p-message ${isOwnMessage ? 'yt-p2p-own-message' : 'yt-p2p-peer-message'}`}>
      <div className="yt-p2p-message-name">{message.nickname || 'Anonymous'}</div>
      <div className="yt-p2p-message-text">{message.text}</div>
      <div className="yt-p2p-message-time">
        {new Date(message.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
};

// Input Box Component
const InputBox = ({ nickname, roomId, onMessageSent }) => {
  const [messageText, setMessageText] = useState('');
  
  const sendMessage = async () => {
    if (!messageText.trim()) return;
    
    try {
      // Get user ID
      const { userId } = await chrome.storage.local.get(['userId']);
      
      // Create message object
      const messageData = {
        userId,
        nickname,
        roomId,
        text: messageText,
        timestamp: Date.now()
      };
      
      // Send via P2P service
      const result = await p2pService.sendMessage(messageData);
      
      if (result.success) {
        // Notify parent component
        onMessageSent(messageData);
        
        // Clear input
        setMessageText('');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };
  
  return (
    <div className="yt-p2p-chat-input">
      <input
        type="text"
        placeholder="Type a message..."
        value={messageText}
        onChange={(e) => setMessageText(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
      />
      
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

// Error Message Component
const ErrorMessage = ({ message }) => {
  return (
    <div className="yt-p2p-error-message">
      {message}
    </div>
  );
};
```

### 8. Popup Implementation

Create `src/popup/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>YouTube P2P Chat</title>
  <script type="module" src="./index.jsx"></script>
  <style>
    body {
      width: 300px;
      min-height: 200px;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    }
  </style>
</head>
<body>
  <div id="app"></div>
</body>
</html>
```

Create `src/popup/index.jsx`:

```jsx
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { getRooms, getUser, updateUser } from '../services/storage-service';

const Popup = () => {
  const [nickname, setNickname] = useState('Anonymous');
  const [rooms, setRooms] = useState([]);
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load user data and room history
    const loadData = async () => {
      try {
        // Get user ID from storage
        const userData = await chrome.storage.local.get(['userId', 'nickname']);
        
        if (userData.userId) {
          setUserId(userData.userId);
          
          if (userData.nickname) {
            setNickname(userData.nickname);
          }
          
          // Get user's room history
          const roomHistory = await getRooms();
          setRooms(roomHistory);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Save nickname
  const saveNickname = async () => {
    try {
      await chrome.storage.local.set({ nickname });
      
      if (userId) {
        await updateUser({
          id: userId,
          nickname
        });
      }
      
      alert('Nickname saved!');
    } catch (error) {
      console.error('Failed to save nickname:', error);
      alert('Failed to save nickname');
    }
  };
  
  // Join room
  const joinRoom = async (roomId) => {
    try {
      // Get current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Check if we're on YouTube
      if (tab.url.includes('youtube.com/watch')) {
        // Send message to content script
        chrome.tabs.sendMessage(tab.id, {
          type: 'JOIN_ROOM',
          roomId
        });
        
        window.close();
      } else {
        alert('Please navigate to a YouTube video page first');
      }
    } catch (error) {
      console.error('Failed to join room:', error);
      alert('Failed to join room');
    }
  };
  
  // Join room by ID
  const joinRoomById = () => {
    const roomId = prompt('Enter room ID:');
    if (roomId) {
      joinRoom(roomId);
    }
  };

  return (
    <div className="popup-container" style={{ padding: '16px' }}>
      <h1 style={{ fontSize: '18px', marginBottom: '16px' }}>YouTube P2P Chat</h1>
      
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="nickname-section" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>Your Nickname:</label>
            <div style={{ display: 'flex' }}>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                style={{ flex: 1, marginRight: '8px', padding: '4px' }}
              />
              <button onClick={saveNickname} style={{ padding: '4px 8px' }}>Save</button>
            </div>
          </div>
          
          <div className="rooms-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h2 style={{ fontSize: '16px', margin: 0 }}>Recent Rooms</h2>
              <button onClick={joinRoomById} style={{ padding: '4px 8px' }}>Join Room</button>
            </div>
            
            {rooms.length === 0 ? (
              <p>No recent rooms</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {rooms.map((room) => (
                  <li key={room.id} style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div>{room.name}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {new Date(room.lastActive).toLocaleString()}
                        </div>
                      </div>
                      <button onClick={() => joinRoom(room.id)} style={{ padding: '4px 8px' }}>
                        Join
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="info-section" style={{ marginTop: '16px', fontSize: '12px', color: '#666' }}>
            <p>Visit a YouTube video page and the chat interface will appear automatically.</p>
          </div>
        </>
      )}
    </div>
  );
};

// Render the popup
const container = document.getElementById('app');
const root = createRoot(container);
root.render(<Popup />);
```

### 9. Build Configuration

Create `vite.config.js`:

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './src/manifest.json';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        popup: 'src/popup/index.html',
      },
    },
  },
});
```

Create `tailwind.config.js`:

```javascript
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

## Testing

### Manual Testing Checklist

1. **Extension Installation**
   - Load unpacked extension in Chrome/Firefox
   - Verify extension icon appears in toolbar

2. **YouTube Page Injection**
   - Navigate to a YouTube video page
   - Verify chat interface appears
   - Check if interface is draggable
   - Test close button functionality

3. **P2P Connection**
   - Verify room ID is generated
   - Test connection between multiple browsers
   - Check WebSocket fallback functionality

4. **Message Sending/Receiving**
   - Send messages from different browsers
   - Verify messages appear in all connected clients
   - Check message formatting and timestamps

5. **Storage Persistence**
   - Send messages and reload page
   - Verify previous messages are loaded
   - Test across browser restarts

6. **Search Functionality**
   - Send various messages
   - Test search with different keywords
   - Verify fuzzy search capabilities

7. **User Identity**
   - Set nickname in popup
   - Verify nickname appears in messages
   - Test persistence across sessions

## Deployment

### Chrome Web Store

1. Build the extension:
   ```bash
   npm run build
   ```

2. Create a ZIP file of the `dist` folder

3. Go to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard)

4. Click "Add new item" and upload the ZIP file

5. Fill in the required information:
   - Description
   - Screenshots (at least 1280x800)
   - Promotional images
   - Privacy policy

6. Submit for review

### Firefox Add-ons

1. Build the extension:
   ```bash
   npm run build
   ```

2. Create a ZIP file of the `dist` folder

3. Go to the [Firefox Add-on Developer Hub](https://addons.mozilla.org/en-US/developers/)

4. Click "Submit a New Add-on" and upload the ZIP file

5. Fill in the required information:
   - Description
   - Screenshots
   - Privacy policy

6. Submit for review

## Security Considerations

1. **Content Security Policy**
   - Restrict script sources to extension only
   - Prevent inline script execution
   - Limit external resource loading

2. **Input Sanitization**
   - Use DOMPurify to sanitize all user input
   - Prevent XSS attacks in chat messages

3. **Permission Scope**
   - Limit host permissions to YouTube only
   - Request minimal required permissions

4. **Data Storage**
   - Store sensitive data securely
   - Implement optional encryption for messages

## Future Enhancements

1. **Message Reactions/Threading**
   - Add emoji reactions to messages
   - Implement threaded replies

2. **Offline Mode**
   - Cache unsent messages when offline
   - Sync when connection is restored

3. **Cloud Storage Option**
   - Add Firebase/Supabase integration
   - Enable cross-device synchronization

4. **Enhanced Security**
   - Implement end-to-end encryption
   - Add message expiration options

5. **UI Customization**
   - Allow user-chosen themes
   - Customize chat panel size and position

6. **Moderation Tools**
   - Add user blocking functionality
   - Implement basic content filtering
