# 🔔 Push Notifications Testing Guide

This guide will help you test the push notification functionality on desktop and mobile devices, including lock screen notifications.

## ✅ Features Implemented

- ✅ Browser push notifications
- ✅ Lock screen notifications (mobile)
- ✅ Notification sounds
- ✅ Badge count on PWA icon
- ✅ Notification settings and preferences
- ✅ Do Not Disturb mode
- ✅ Message preview control
- ✅ Visual notification indicators in Navbar
- ✅ Test notification button

## 📋 Testing Checklist

### Desktop Testing (Chrome/Edge/Firefox)

1. **Enable Notifications**
   - Open the app in your browser
   - Navigate to Settings page
   - Click "Enable" button in the notification settings
   - Allow notifications when prompted by the browser

2. **Test Notification**
   - In Settings page, click "Send Test" button
   - You should see a test notification appear
   - Click the notification to focus the app

3. **Real Message Notifications**
   - Open the app in two different browsers (or use incognito mode)
   - Log in with different accounts
   - Send a message from one account
   - The other account should receive a notification

4. **Background Notifications**
   - Minimize or switch to a different tab
   - Send a message to your account
   - You should receive a notification even when the app is in the background

5. **Notification Settings**
   - Toggle "Notification Sound" - test if sound plays
   - Toggle "Message Preview" - test if message content is hidden
   - Toggle "Do Not Disturb" - test if notifications are muted
   - Toggle "Badge Count" - test if badge appears on app icon

6. **Badge Count**
   - Install the PWA (click install icon in address bar)
   - Pin the PWA to taskbar
   - Receive messages when app is closed
   - Badge count should appear on the app icon

### Mobile Testing (Android)

#### Browser Testing

1. **Chrome/Edge on Android**
   - Open the app in Chrome
   - Navigate to Settings
   - Enable notifications
   - Send a test notification
   - Lock your phone and send a message from another device
   - You should receive a notification on your lock screen

2. **Notification Settings**
   - Test all notification settings (sound, preview, DND)
   - Verify each setting works correctly

#### PWA Testing (Installed App)

1. **Install the PWA**
   - Open the app in Chrome
   - Tap menu (⋮) → "Add to Home screen"
   - Or look for "Install app" prompt
   - Name it and add to home screen

2. **Lock Screen Notifications**
   - Open the installed PWA
   - Log in and enable notifications
   - Close the app completely (swipe away from recent apps)
   - Lock your phone
   - Send a message from another device
   - You should see the notification on your lock screen
   - Notification should show:
     - Sender name
     - Message preview (if enabled)
     - App icon
   - Tap the notification to open the app

3. **Badge Count**
   - Close the app
   - Send multiple messages
   - The app icon should show a badge with unread count
   - Open the app to clear the badge

4. **Notification Actions**
   - Tap on a notification
   - App should open and focus on the relevant chat
   - Notification should be dismissed

### Mobile Testing (iOS)

**Note:** iOS Safari requires the PWA to be installed for lock screen notifications.

#### PWA Testing (Installed App)

1. **Install the PWA**
   - Open the app in Safari
   - Tap the Share button (📤)
   - Scroll and tap "Add to Home Screen"
   - Name it and add to home screen

2. **Enable Notifications**
   - Open the installed PWA from home screen
   - Navigate to Settings
   - Enable notifications
   - Allow notifications when prompted

3. **Lock Screen Notifications**
   - Close the app (swipe up from bottom or double-click home)
   - Lock your device
   - Send a message from another device
   - You should see the notification on your lock screen
   - Tap to open the app

4. **Badge Count**
   - Close the app
   - Send multiple messages
   - The app icon should show a badge with unread count
   - Open the app to clear the badge

## 🎛️ Notification Settings

### Available Settings

1. **Enable Notifications**
   - Master switch for all notifications
   - Must grant browser permission first

2. **Notification Sound**
   - Play a sound when receiving messages
   - Different sounds for direct messages and groups

3. **Message Preview**
   - Show message content in notification
   - Disable for privacy (shows "New message" instead)

4. **Badge Count**
   - Show unread count on app icon
   - Automatically syncs with unread messages

5. **Do Not Disturb**
   - Temporarily mute all notifications
   - Does not require revoking browser permission

## 🔧 Troubleshooting

### Notifications Not Showing

1. **Check browser permissions**
   - Make sure notifications are allowed in browser settings
   - Chrome: Settings → Privacy and Security → Site Settings → Notifications
   - Safari: Settings → Safari → Notifications

2. **Check app settings**
   - Go to Settings page in the app
   - Verify "Enable Notifications" is turned on
   - Check "Do Not Disturb" is not enabled

3. **Check device settings (Mobile)**
   - iOS: Settings → Notifications → [App Name]
   - Android: Settings → Apps → [App Name] → Notifications

4. **Service Worker**
   - Open browser DevTools
   - Go to Application → Service Workers
   - Verify service worker is registered
   - Try unregistering and refreshing

### Lock Screen Notifications Not Working (iOS)

- **Must install as PWA** - lock screen notifications only work for installed PWAs on iOS
- Check that notifications are enabled in iOS Settings
- Make sure the app is completely closed (not just in background)
- Verify you're logged in and enabled notifications in the app

### Badge Count Not Showing

- Badge API is only supported in Chromium-based browsers (Chrome, Edge)
- Not supported in Firefox or Safari
- Make sure "Badge Count" setting is enabled

### Sound Not Playing

- Check that "Notification Sound" setting is enabled
- Verify device is not on silent mode
- Check device volume settings
- Some browsers require user interaction before playing sounds

## 📱 Device-Specific Notes

### Android
- Notifications work in both browser and installed PWA
- Badge count works on most Android launchers
- Notification channels can be customized in system settings

### iOS
- **Lock screen notifications require PWA installation**
- Badge count works on home screen icon
- Notifications respect iOS notification settings
- Must use Safari for PWA installation

### Desktop
- Notifications work in all modern browsers
- Badge count works in Edge and Chrome (Windows/Mac)
- Notification permission persists across sessions

## 🎯 Test Scenarios

### Scenario 1: First-Time User
1. User opens app for first time
2. After 3 seconds, notification prompt appears
3. User clicks "Enable Notifications"
4. Browser permission dialog appears
5. User allows notifications
6. User receives a message
7. Notification appears with sound

### Scenario 2: Privacy-Conscious User
1. User enables notifications
2. User disables "Message Preview" in settings
3. User receives a message
4. Notification shows "New message" instead of content
5. User can still hear notification sound

### Scenario 3: Focus Mode
1. User is working and doesn't want interruptions
2. User enables "Do Not Disturb" in settings
3. User receives messages
4. No notifications or sounds appear
5. Badge count still updates
6. User disables DND when ready
7. Notifications resume

### Scenario 4: Mobile Lock Screen
1. User installs PWA on mobile
2. User enables notifications
3. User closes and locks device
4. User receives message from another device
5. Notification appears on lock screen
6. User taps notification
7. App opens to the relevant chat

## 🔐 Privacy & Security

- Notifications contain message content by default
- Users can disable preview for privacy
- Notifications automatically clear when read
- Badge count clears when app is opened
- No sensitive information in notification metadata
- Respects Do Not Disturb mode

## 📊 Monitoring & Debugging

### Console Logs
- Service worker registration
- Notification permission status
- Notification creation events
- Badge count updates
- Sound playback events

### DevTools Inspection
1. Open Chrome DevTools (F12)
2. Go to **Application** tab
3. Check **Service Workers** section
4. Check **Manifest** section
5. Go to **Console** for debug logs

## ✨ Best Practices

1. **Request permission contextually** - show prompt after user interacts with app
2. **Respect user preferences** - honor Do Not Disturb and other settings
3. **Clear notifications** - automatically clear when read
4. **Update badge count** - keep it in sync with actual unread messages
5. **Test on real devices** - emulators may not support all features
6. **Handle permission denial** - show helpful message if blocked

## 🚀 Next Steps

After testing, consider:
- Adding custom notification sounds
- Implementing notification grouping
- Adding quick reply actions
- Implementing push notification server (for background sync)
- Analytics for notification engagement

---

**Last Updated:** October 23, 2025  
**Version:** 1.0.0

