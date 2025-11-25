// Notification utilities for push notifications
import { useChatStore } from '../store/useChatStore';

export const isNotificationSupported = () => {
  return 'Notification' in window && 'serviceWorker' in navigator;
};

export const getNotificationPermission = () => {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
};

export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) {
    return { granted: false, error: 'Notifications not supported' };
  }

  try {
    const permission = await Notification.requestPermission();
    return { 
      granted: permission === 'granted', 
      permission 
    };
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return { granted: false, error: error.message };
  }
};

export const createNotification = (title, options = {}) => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return null;
  }

  const defaultOptions = {
    icon: '/chat.svg',
    badge: '/chat.svg',
    vibrate: [200, 100, 200],
    requireInteraction: false,
    ...options
  };

  try {
    const notification = new Notification(title, defaultOptions);
    
    // Add click handler to focus window and close notification
    notification.onclick = () => {
      window.focus();
      notification.close();
      
      // If there's a specific chat to open, we could navigate here
      if (options.data?.chatId) {
        console.log('Notification clicked for chat:', options.data.chatId);
      }
    };
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

export const createMessageNotification = (message, senderName, chatType = 'user') => {
  const isGroup = chatType === 'group';
  const icon = message.senderId?.profilePic || '/avatar.png';
  const settings = getNotificationSettings();
  
  let body = message.text || '';
  if (message.image) body = '📷 Image';
  if (message.file) {
    if (message.file.type?.startsWith('audio/')) {
      body = '🎵 Voice message';
    } else if (message.file.type?.startsWith('video/')) {
      body = '🎬 Video';
    } else {
      body = '📎 ' + message.file.name;
    }
  }

  // Hide message content if preview is disabled
  if (!settings.preview) {
    body = 'New message';
  }

  const title = isGroup ? `${senderName} (Group)` : senderName;

  // Use message ID in tag to make each notification unique
  // This prevents notifications from being silently replaced
  const notificationTag = `message-${message._id || Date.now()}`;
  
  console.log('Creating notification:', {
    title,
    body,
    tag: notificationTag,
    chatId: message.receiverId || message.groupId
  });

  return createNotification(title, {
    body,
    icon,
    badge: '/chat.svg',
    tag: notificationTag,
    data: {
      chatId: message.receiverId || message.groupId,
      messageId: message._id,
      isGroup,
      url: '/'
    },
    requireInteraction: false,
    silent: false
  });
};

export const isBadgeSupported = () => {
  return 'setAppBadge' in navigator && 'clearAppBadge' in navigator;
};

export const setBadgeCount = async (count) => {
  if (!isBadgeSupported()) return;

  try {
    if (count > 0) {
      await navigator.setAppBadge(count);
    } else {
      await navigator.clearAppBadge();
    }
  } catch (error) {
    console.error('Error setting badge:', error);
  }
};

export const clearBadge = async () => {
  if (!isBadgeSupported()) return;

  try {
    await navigator.clearAppBadge();
  } catch (error) {
    console.error('Error clearing badge:', error);
  }
};

export const shouldShowNotification = (message, currentChatId, authUserId) => {
  const senderId = message.senderId?._id || message.senderId;
  
  // Don't show notification for own messages
  if (senderId === authUserId) {
    console.log('Blocking notification: own message');
    return false;
  }

  // Check if notifications are enabled
  if (Notification.permission !== 'granted') {
    console.log('Blocking notification: permission not granted');
    return false;
  }

  console.log('Notification allowed');
  return true;
};

export const isAppInBackground = () => {
  return document.hidden || !document.hasFocus();
};

export const getNotificationSettings = () => {
  const settings = localStorage.getItem('notificationSettings');
  if (settings) {
    return JSON.parse(settings);
  }
  
  // Default settings
  return {
    enabled: true,
    sound: true,
    preview: true,
    badge: true,
    doNotDisturb: false
  };
};

export const saveNotificationSettings = (settings) => {
  localStorage.setItem('notificationSettings', JSON.stringify(settings));
};

export const registerServiceWorkerNotifications = async () => {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    console.log('Service Worker registered for notifications:', registration);
    
    // Add notification click handler
    if ('Notification' in window) {
      // Handle notification clicks when app is open
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
          const { chatId, isGroup } = event.data;
          console.log('Notification clicked, navigate to:', chatId, isGroup);
          
          window.focus();

          const store = useChatStore.getState();
          if (isGroup) {
             const group = store.groups.find(g => g._id === chatId);
             if (group) store.setSelectedChat(group);
          } else {
             const user = store.users.find(u => u._id === chatId);
             if (user) store.setSelectedChat(user);
          }
        }
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error registering service worker:', error);
    return false;
  }
};

// Test notification function
export const showTestNotification = () => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    console.warn('Notifications not available or not granted');
    return false;
  }

  try {
    const notification = new Notification('Test Notification', {
      body: 'This is a test notification from Tezzeract Chat!',
      icon: '/chat.svg',
      badge: '/chat.svg',
      vibrate: [200, 100, 200],
      tag: 'test-notification',
      requireInteraction: false
    });

    notification.onclick = () => {
      console.log('Test notification clicked');
      window.focus();
      notification.close();
    };

    return true;
  } catch (error) {
    console.error('Error showing test notification:', error);
    return false;
  }
};
