import { useState, useEffect } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { requestNotificationPermission, getNotificationPermission } from '../lib/notificationUtils';

const NotificationPrompt = ({ onClose }) => {
  const [permission, setPermission] = useState(getNotificationPermission());
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    // Check if we should show the prompt
    const prompted = localStorage.getItem('notificationPrompted');
    if (prompted === 'true' && permission !== 'default') {
      onClose?.();
    }
  }, [permission, onClose]);

  const handleEnable = async () => {
    setRequesting(true);
    const result = await requestNotificationPermission();
    
    if (result.granted) {
      setPermission('granted');
      localStorage.setItem('notificationPrompted', 'true');
      setTimeout(() => {
        onClose?.();
      }, 1000);
    } else {
      setPermission(result.permission || 'denied');
      localStorage.setItem('notificationPrompted', 'true');
    }
    
    setRequesting(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('notificationPrompted', 'true');
    onClose?.();
  };

  if (permission === 'granted') {
    return null;
  }

  if (permission === 'denied') {
    return (
      <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3">
          <BellOff className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-neutral-100 mb-1">Notifications Blocked</h3>
            <p className="text-sm text-neutral-300">
              To enable notifications, please allow them in your browser settings.
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-neutral-400 hover:text-neutral-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-4 animate-in slide-in-from-top">
      <div className="flex items-start gap-3">
        <Bell className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-neutral-100 mb-1">Enable Notifications</h3>
          <p className="text-sm text-neutral-300 mb-3">
            Get notified when you receive new messages, even when the app is closed.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleEnable}
              disabled={requesting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {requesting ? 'Requesting...' : 'Enable Notifications'}
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-neutral-100 text-sm font-medium rounded-lg transition-colors"
            >
              Not Now
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-neutral-400 hover:text-neutral-300"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default NotificationPrompt;
