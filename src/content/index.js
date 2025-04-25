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
