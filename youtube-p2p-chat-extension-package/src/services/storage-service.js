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
