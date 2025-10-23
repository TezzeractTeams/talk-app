import { Send, Bell, Volume2, Eye, Hash, Moon, TestTube } from "lucide-react";
import { useState, useEffect } from "react";
import { getNotificationSettings, saveNotificationSettings, getNotificationPermission, requestNotificationPermission, showTestNotification } from "../lib/notificationUtils";
import toast from "react-hot-toast";

const PREVIEW_MESSAGES = [
  { id: 1, content: "Hey! How's it going?", isSent: false },
  { id: 2, content: "I'm doing great! Just working on some new features.", isSent: true },
];

const SettingsPage = () => {
  const [notificationSettings, setNotificationSettings] = useState(getNotificationSettings());
  const [notificationPermission, setNotificationPermission] = useState(getNotificationPermission());

  useEffect(() => {
    saveNotificationSettings(notificationSettings);
  }, [notificationSettings]);

  const handleToggle = (key) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleRequestPermission = async () => {
    const result = await requestNotificationPermission();
    setNotificationPermission(result.permission || 'denied');
  };

  const handleTestNotification = () => {
    const success = showTestNotification();
    if (success) {
      toast.success('Test notification sent!');
    } else {
      toast.error('Failed to send test notification. Make sure notifications are enabled.');
    }
  };

  return (
    <div className="h-screen container mx-auto px-4 pt-20 max-w-5xl bg-neutral-900 text-neutral-100 overflow-y-auto">
      <div className="space-y-6 pb-10">
        <h2 className="text-lg font-semibold">Preview</h2>
        <div className="rounded-xl border border-neutral-700 overflow-hidden bg-neutral-800 shadow-lg">
          <div className="p-4 bg-neutral-900">
            <div className="max-w-lg mx-auto">
              {/* Mock Chat UI */}
              <div className="bg-neutral-800 rounded-xl shadow-sm overflow-hidden">
                {/* Chat Header */}
                <div className="px-4 py-3 border-b border-neutral-700 bg-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-neutral-600 flex items-center justify-center text-neutral-100 font-medium">
                      J
                    </div>
                    <div>
                      <h3 className="font-medium text-sm text-neutral-100">John Doe</h3>
                      <p className="text-xs text-neutral-400">Online</p>
                    </div>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="p-4 space-y-4 min-h-[200px] max-h-[200px] overflow-y-auto bg-neutral-900">
                  {PREVIEW_MESSAGES.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isSent ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`
                          max-w-[80%] rounded-xl p-3 shadow-sm
                          ${message.isSent ? "bg-neutral-600 text-neutral-100" : "bg-neutral-700 text-neutral-100"}
                        `}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p
                          className={`
                            text-[10px] mt-1.5
                            ${message.isSent ? "text-neutral-100/70" : "text-neutral-400"}
                          `}
                        >
                          12:00 PM
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t border-neutral-700 bg-neutral-800">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 text-sm h-10 px-3 rounded-lg bg-neutral-900 text-neutral-100 border border-neutral-600 focus:outline-none focus:ring-1 focus:border-neutral-500 focus:ring-neutral-500"
                      placeholder="Type a message..."
                      value="This is a preview"
                      readOnly
                    />
                    <button className="flex items-center justify-center px-4 py-2 bg-neutral-600 hover:bg-neutral-700 text-neutral-100 text-sm font-medium rounded-lg transition-colors h-10 min-h-0">
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="space-y-4 mt-8">
          <h2 className="text-lg font-semibold">Notification Settings</h2>
          
          {/* Permission Status */}
          {notificationPermission !== 'granted' && (
            <div className="rounded-xl border border-neutral-700 bg-neutral-800 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-yellow-400" />
                  <div>
                    <h3 className="font-medium text-sm">Browser Notifications</h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {notificationPermission === 'denied' 
                        ? 'Notifications are blocked. Please enable them in browser settings.' 
                        : 'Enable notifications to receive alerts when you get new messages.'}
                    </p>
                  </div>
                </div>
                {notificationPermission === 'default' && (
                  <button
                    onClick={handleRequestPermission}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Enable
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Test Notification */}
          {notificationPermission === 'granted' && (
            <div className="rounded-xl border border-neutral-700 bg-neutral-800 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TestTube className="w-5 h-5 text-green-400" />
                  <div>
                    <h3 className="font-medium text-sm">Test Notifications</h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Send a test notification to check if notifications are working
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleTestNotification}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Send Test
                </button>
              </div>
            </div>
          )}

          {/* Notification Controls */}
          <div className="rounded-xl border border-neutral-700 bg-neutral-800 divide-y divide-neutral-700">
            {/* Enable Notifications */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="font-medium text-sm">Enable Notifications</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">Show desktop notifications for new messages</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.enabled}
                  onChange={() => handleToggle('enabled')}
                  className="sr-only peer"
                  disabled={notificationPermission !== 'granted'}
                />
                <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
              </label>
            </div>

            {/* Sound */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-green-400" />
                <div>
                  <h3 className="font-medium text-sm">Notification Sound</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">Play sound when receiving messages</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.sound}
                  onChange={() => handleToggle('sound')}
                  className="sr-only peer"
                  disabled={!notificationSettings.enabled}
                />
                <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
              </label>
            </div>

            {/* Message Preview */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="font-medium text-sm">Message Preview</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">Show message content in notifications</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.preview}
                  onChange={() => handleToggle('preview')}
                  className="sr-only peer"
                  disabled={!notificationSettings.enabled}
                />
                <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
              </label>
            </div>

            {/* Badge Count */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Hash className="w-5 h-5 text-red-400" />
                <div>
                  <h3 className="font-medium text-sm">Badge Count</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">Show unread count on app icon</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.badge}
                  onChange={() => handleToggle('badge')}
                  className="sr-only peer"
                  disabled={!notificationSettings.enabled}
                />
                <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
              </label>
            </div>

            {/* Do Not Disturb */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-medium text-sm">Do Not Disturb</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">Mute all notifications temporarily</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.doNotDisturb}
                  onChange={() => handleToggle('doNotDisturb')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Info Box */}
          <div className="rounded-xl border border-blue-700/30 bg-blue-900/20 p-4">
            <h3 className="font-medium text-sm text-blue-300 mb-2">📱 Mobile Lock Screen Notifications</h3>
            <ul className="text-xs text-neutral-300 space-y-1 list-disc list-inside">
              <li><strong>iOS:</strong> Install the app to your home screen to receive lock screen notifications</li>
              <li><strong>Android:</strong> Notifications work in both browser and installed app</li>
              <li>Ensure your device notification settings allow notifications from this app</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SettingsPage;
