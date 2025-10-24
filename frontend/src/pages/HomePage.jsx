import { useChatStore } from "../store/useChatStore";
import { useState, useEffect } from "react";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";
import NotificationPrompt from "../components/NotificationPrompt";
import PullToRefresh from "../components/PullToRefresh";
import { getNotificationPermission } from "../lib/notificationUtils";
import toast from "react-hot-toast";

const HomePage = () => {
  const { selectedChat, getUsers, getGroups, getMessages } = useChatStore();
  const [showSidebar, setShowSidebar] = useState(true);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

  useEffect(() => {
    // Show notification prompt after a short delay if not already prompted and permission is default
    const prompted = localStorage.getItem('notificationPrompted');
    const permission = getNotificationPermission();
    
    if (prompted !== 'true' && permission === 'default') {
      const timer = setTimeout(() => {
        setShowNotificationPrompt(true);
      }, 3000); // Show after 3 seconds
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleRefresh = async () => {
    try {
      // Refresh users and groups
      await Promise.all([getUsers(), getGroups()]);
      
      // If a chat is selected, refresh its messages
      if (selectedChat) {
        const isGroup = selectedChat.type === 'group';
        await getMessages(selectedChat._id, isGroup);
      }
      
      toast.success('Refreshed!');
    } catch (error) {
      console.error('Refresh error:', error);
      toast.error('Failed to refresh');
    }
  };

  return (
    <div className="h-screen pt-14 md:pt-16">
      <div className="h-full bg-neutral-900">
        {/* Notification Prompt */}
        {showNotificationPrompt && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-lg px-4">
            <NotificationPrompt onClose={() => setShowNotificationPrompt(false)} />
          </div>
        )}
        
        {/* Pull to Refresh - only active on mobile */}
        <PullToRefresh onRefresh={handleRefresh}>
          <div className="flex h-full overflow-hidden relative">
            {/* Sidebar - hidden on mobile when chat is selected */}
            <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} md:relative absolute md:static inset-0 z-20 md:z-0`}>
              <Sidebar />
            </div>

            {/* Chat Container - takes full width on mobile when visible */}
            <div className={`${!selectedChat ? 'hidden md:flex' : 'flex'} flex-1`}>
              {!selectedChat ? <NoChatSelected /> : <ChatContainer setShowSidebar={setShowSidebar} />}
            </div>
          </div>
        </PullToRefresh>
      </div>
    </div>
  );
};
export default HomePage;