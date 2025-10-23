import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { LogOut, Settings, User, Bell } from "lucide-react";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();
  const { unreadCounts } = useChatStore();

  // Calculate total unread messages
  const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  return (
    <header className="bg-white/80 dark:bg-neutral-900/80 border-b border-neutral-200 dark:border-neutral-700 fixed w-full top-0 z-40 backdrop-blur-lg">
      <div className="container mx-auto px-3 md:px-4 h-14 md:h-16">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-4 md:gap-8">
            <Link 
              to="/" 
              className="flex items-center gap-2 md:gap-2.5 hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center justify-center">
                <img 
                  src="/TezzeractLogo.svg" 
                  alt="Tezzeract Logo" 
                  className="w-5 h-5 md:w-6 md:h-6"
                />
              </div>
              <h1 className="text-base md:text-lg font-bold text-neutral-900 dark:text-neutral-100">
                Tezzeract Talk
              </h1>
            </Link>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            {authUser && (
              <>
                <Link 
                  to="/settings" 
                  className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Settings</span>
                </Link>

                {/* Notification Bell */}
                <Link 
                  to="/" 
                  className="relative flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  {totalUnread > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                      {totalUnread > 99 ? '99+' : totalUnread}
                    </span>
                  )}
                  <span className="hidden sm:inline">Chats</span>
                </Link>

                <Link 
                  to="/profile" 
                  className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Profile</span>
                </Link>

                <button 
                  onClick={logout}
                  className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;