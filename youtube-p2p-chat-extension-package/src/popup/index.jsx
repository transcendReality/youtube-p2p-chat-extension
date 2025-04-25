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
