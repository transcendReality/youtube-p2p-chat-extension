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
