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
