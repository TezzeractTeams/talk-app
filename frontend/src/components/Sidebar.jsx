import { useEffect, useState, useMemo } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { UserPlus, ChevronLeft, ChevronRight, Image as ImageIcon, MessageSquare, Search, Pin, MoreVertical, X } from "lucide-react";
import CreateGroupModal from "./CreateGroupModal";

const Sidebar = () => {
  const getUsers = useChatStore((state) => state.getUsers);
  const getGroups = useChatStore((state) => state.getGroups);
  const users = useChatStore((state) => state.users);
  const groups = useChatStore((state) => state.groups);
  const selectedChat = useChatStore((state) => state.selectedChat);
  const setSelectedChat = useChatStore((state) => state.setSelectedChat);
  const isUsersLoading = useChatStore((state) => state.isUsersLoading);
  const isGroupsLoading = useChatStore((state) => state.isGroupsLoading);
  const unreadCounts = useChatStore((state) => state.unreadCounts);
  const lastMessageTimes = useChatStore((state) => state.lastMessageTimes);
  const lastMessages = useChatStore((state) => state.lastMessages);

  const { onlineUsers, authUser } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [open, setOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [pinnedChats, setPinnedChats] = useState(() => {
    const saved = localStorage.getItem("pinnedChats");
    return saved ? JSON.parse(saved) : [];
  });
  const [contextMenu, setContextMenu] = useState(null);

  // Force sidebar to be open on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setOpen(true);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    getUsers();
    getGroups();
  }, [getUsers, getGroups]);

  // Save pinned chats to localStorage
  useEffect(() => {
    localStorage.setItem("pinnedChats", JSON.stringify(pinnedChats));
  }, [pinnedChats]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [contextMenu]);

  // Helper to format relative time
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return "now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // Toggle pin for a chat
  const togglePin = (chatId) => {
    setPinnedChats(prev => 
      prev.includes(chatId) 
        ? prev.filter(id => id !== chatId)
        : [...prev, chatId]
    );
  };

  // Helper to format last message preview
  const formatLastMessage = (chatId, isGroup, currentLastMessages) => {
    const lastMsg = currentLastMessages?.[chatId];
    if (!lastMsg) return null;

    let senderName = "Unknown";
    if (isGroup) {

      const group = groups.find((g) => g._id === chatId);

      const actualSenderId = lastMsg.senderId?._id || lastMsg.senderId; // Handle senderId being object or string

      const sender = group?.members.find((member) => {

        return member._id === actualSenderId;
      });

      senderName = sender?.fullName || "Unknown";
    } else {
      const sender = users.find((user) => user._id === lastMsg.senderId);
      senderName = sender?.fullName || "Unknown";
    }

    if (lastMsg.image && !lastMsg.text) {
      return (
        <div className="flex items-center gap-1">
          <ImageIcon className="w-3 h-3" />
          <span>{isGroup ? `${senderName}: Photo` : "Photo"}</span>
        </div>
      );
    }

    const messageText = lastMsg.text?.length > 30 
      ? lastMsg.text.substring(0, 30) + "..." 
      : lastMsg.text || ""; // Ensure it's not undefined/null

    return isGroup ? `${senderName}: ${messageText}` : messageText;
  };

  const combinedChats = useMemo(() => {
    let allChats = [
      ...users.map(user => ({
        ...user,
        type: 'user',
        chatId: user._id,
        name: user.fullName,
        lastMessage: lastMessages[user._id],
        lastMessageTime: lastMessageTimes[user._id],
        unreadCount: unreadCounts[user._id] || 0,
        isPinned: pinnedChats.includes(user._id),
      })),
      ...groups.map(group => ({
        ...group,
        type: 'group',
        chatId: group._id,
        name: group.name,
        lastMessage: lastMessages[group._id],
        lastMessageTime: lastMessageTimes[group._id],
        unreadCount: unreadCounts[group._id] || 0,
        isPinned: pinnedChats.includes(group._id),
      }))
    ];

    // Apply tab filter
    if (activeTab === "unread") {
      allChats = allChats.filter(chat => chat.unreadCount > 0);
    } else if (activeTab === "groups") {
      allChats = allChats.filter(chat => chat.type === 'group');
    } else if (activeTab === "dms") {
      allChats = allChats.filter(chat => chat.type === 'user');
    }

    // Apply search filter
    if (searchQuery.trim()) {
      allChats = allChats.filter(chat => 
        chat.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort: pinned first, then by unread, then by time
    return allChats.sort((a, b) => {
      // Pinned chats come first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      const aTime = a.lastMessageTime || 0;
      const bTime = b.lastMessageTime || 0;
      const aUnread = a.unreadCount;
      const bUnread = b.unreadCount;

      // Then unread chats
      if (aUnread > 0 && bUnread === 0) return -1;
      if (bUnread > 0 && aUnread === 0) return 1;
      
      // Finally by time
      return bTime - aTime;
    });
  }, [users, groups, unreadCounts, lastMessageTimes, lastMessages, pinnedChats, activeTab, searchQuery]);

  if (isUsersLoading || isGroupsLoading) return <SidebarSkeleton />;

  return (
    <>
      <aside
        className={`h-full border-r border-neutral-700 flex flex-col transition-all duration-300 ease-in-out bg-neutral-900 ${
          open ? "w-full md:w-80" : "w-16 md:w-20"
        }`}
      >
        {/* Header */}
        <div className="border-b border-neutral-700 bg-neutral-900">
          <div className="p-3 md:p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 shrink-0 text-neutral-200" />
              {open && (
                <span className="font-semibold text-neutral-100 whitespace-nowrap text-lg">
                  Messages
                </span>
              )}
            </div>
            <button
              onClick={() => setOpen(!open)}
              className="hidden md:flex p-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
            >
              {open ? (
                <ChevronLeft className="h-5 w-5 text-neutral-300" />
              ) : (
                <ChevronRight className="h-5 w-5 text-neutral-300" />
              )}
            </button>
          </div>

          {/* Search Bar */}
          {open && (
            <div className="px-3 md:px-4 pb-2 md:pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chats..."
                  className="w-full pl-9 pr-9 py-1.5 md:py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-100 placeholder-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Filter Tabs */}
          {open && (
            <div className="px-3 md:px-4 pb-2 md:pb-3 flex gap-1.5 md:gap-2 overflow-x-auto scrollbar-none">
              {[
                { id: "all", label: "All" },
                { id: "unread", label: "Unread" },
                { id: "dms", label: "DMs" },
                { id: "groups", label: "Groups" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-2.5 md:px-3 py-1 md:py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                      : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                  }`}
                >
                  {tab.label}
                  {tab.id === "unread" && combinedChats.filter(c => c.unreadCount > 0).length > 0 && (
                    <span className="ml-1 md:ml-1.5 px-1 md:px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
                      {combinedChats.filter(c => c.unreadCount > 0).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Create Group Button */}
          {open && (
            <div className="px-3 md:px-4 pb-2 md:pb-3">
              <button
                onClick={() => setShowCreateGroup(true)}
                className="w-full flex items-center justify-center gap-2 py-2 md:py-2.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40"
              >
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">New Group</span>
                <span className="sm:hidden">New</span>
              </button>
            </div>
          )}
        </div>

        {/* Chat List */}
        <div className="overflow-y-auto flex-1 py-1">
          {combinedChats.length === 0 && open && (
            <div className="text-center py-12 px-4">
              <MessageSquare className="h-12 w-12 text-neutral-600 mx-auto mb-3" />
              <p className="text-neutral-400 text-sm font-medium mb-1">
                {searchQuery ? "No chats found" : activeTab === "unread" ? "No unread messages" : "No chats yet"}
              </p>
              <p className="text-neutral-500 text-xs">
                {searchQuery ? "Try a different search" : "Start a conversation"}
              </p>
            </div>
          )}
          {combinedChats.map((chat) => {
            const unreadCount = unreadCounts[chat.chatId] || 0;
            const hasUnread = unreadCount > 0;
            const lastMessage = formatLastMessage(chat.chatId, chat.type === 'group', lastMessages);
            const isSelected = (selectedChat?._id === chat.chatId);
            const timestamp = formatTime(chat.lastMessageTime);

            return (
              <div
                key={chat.chatId}
                className="relative group"
                onContextMenu={(e) => {
                  if (open) {
                    e.preventDefault();
                    setContextMenu({ chatId: chat.chatId, x: e.clientX, y: e.clientY });
                  }
                }}
              >
                <button
                  onClick={() => {
                    setSelectedChat(chat);
                  }}
                  className={`w-full p-2 md:p-3 flex items-center gap-2 md:gap-3 transition-all relative ${
                    isSelected
                      ? "bg-gradient-to-r from-blue-600/20 to-blue-600/10 border-l-4 border-blue-500"
                      : hasUnread
                      ? "bg-neutral-800/30 hover:bg-neutral-800/50"
                      : "hover:bg-neutral-800/40"
                  } ${open ? "rounded-none" : "mx-2 rounded-lg"}`}
                >
                  {/* Pin indicator */}
                  {chat.isPinned && open && (
                    <Pin className="absolute top-2 left-2 h-3 w-3 text-blue-400 fill-blue-400" />
                  )}

                  <div className="relative shrink-0">
                    <img
                      src={chat.type === 'user' ? chat.profilePic || "/avatar.png" : chat.groupPic || "/avatar.png"}
                      alt={chat.name}
                      className={`w-10 h-10 md:w-12 md:h-12 rounded-full object-cover ring-2 transition-all ${
                        isSelected 
                          ? "ring-neutral-600" 
                          : hasUnread 
                          ? "ring-neutral-600" 
                          : "ring-neutral-800"
                      }`}
                    />
                    {chat.type === 'user' && onlineUsers.includes(chat.chatId) && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full ring-2 ring-neutral-900" />
                    )}
                    {chat.type === 'group' && (
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-neutral-700 rounded-full flex items-center justify-center text-[10px] text-neutral-300 ring-2 ring-neutral-900">
                        {chat.members?.length || 0}
                      </span>
                    )}
                  </div>

                  {open && (
                    <div className="text-left min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className={`truncate text-sm ${
                          hasUnread 
                            ? "text-neutral-100 font-bold" 
                            : "text-neutral-200 font-medium"
                        }`}>
                          {chat.type === 'user' ? chat.fullName : chat.name}
                        </div>
                        {timestamp && (
                          <span className={`text-xs shrink-0 ${
                            hasUnread ? "text-blue-400 font-semibold" : "text-neutral-500"
                          }`}>
                            {timestamp}
                          </span>
                        )}
                      </div>
                      <div className={`text-xs truncate ${
                        hasUnread
                          ? "text-neutral-300 font-medium"
                          : "text-neutral-400"
                      }`}>
                        {lastMessage || (chat.type === 'group' ? `${chat.members?.length || 0} members` : '')}
                      </div>
                    </div>
                  )}

                  {/* Unread Badge */}
                  {open && hasUnread && (
                    <div className="shrink-0">
                      <div className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center shadow-lg">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </div>
                    </div>
                  )}

                  {/* Unread Dot for Collapsed Sidebar */}
                  {!open && hasUnread && (
                    <span className="absolute top-2 right-2 w-3 h-3 bg-blue-500 rounded-full ring-2 ring-neutral-900" />
                  )}
                </button>

                {/* Context Menu Button */}
                {open && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setContextMenu({ 
                        chatId: chat.chatId, 
                        x: e.currentTarget.getBoundingClientRect().right - 150,
                        y: e.currentTarget.getBoundingClientRect().top 
                      });
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <MoreVertical className="h-4 w-4 text-neutral-300" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Context Menu */}
        {contextMenu && (
          <div
            className="fixed bg-neutral-800 border border-neutral-700 rounded-lg shadow-2xl py-2 z-[1000] min-w-[160px]"
            style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                togglePin(contextMenu.chatId);
                setContextMenu(null);
              }}
              className="w-full px-4 py-2 text-left text-sm text-neutral-200 hover:bg-neutral-700 flex items-center gap-3 rounded-lg"
            >
              <Pin className="h-4 w-4" />
              {pinnedChats.includes(contextMenu.chatId) ? "Unpin" : "Pin"}
            </button>
          </div>
        )}

        {/* User Profile at Bottom */}
        {open && authUser && (
          <div className="border-t border-neutral-700 p-2 md:p-3 bg-gradient-to-t from-neutral-900 to-neutral-900/80">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="relative">
                <img
                  src={authUser.profilePic || "/avatar.png"}
                  alt={authUser.fullName}
                  className="w-9 h-9 md:w-11 md:h-11 rounded-full object-cover shrink-0 ring-2 ring-green-500/50"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 md:w-3.5 md:h-3.5 bg-green-500 rounded-full ring-2 ring-neutral-900" />
              </div>
              <div className="text-left min-w-0 flex-1">
                <div className="font-semibold text-neutral-100 truncate text-sm">
                  {authUser.fullName}
                </div>
                <div className="text-xs text-green-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  Active now
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {showCreateGroup && <CreateGroupModal onClose={() => setShowCreateGroup(false)} />}
    </>
  );
};

export default Sidebar;