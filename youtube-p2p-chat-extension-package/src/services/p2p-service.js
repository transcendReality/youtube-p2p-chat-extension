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
