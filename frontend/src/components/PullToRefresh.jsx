import { useState, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';

const PullToRefresh = ({ onRefresh, children }) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canPull, setCanPull] = useState(false);
  
  const startY = useRef(0);
  const containerRef = useRef(null);
  
  const threshold = 80; // Distance to trigger refresh
  const maxPull = 120; // Maximum pull distance

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let startYPosition = 0;
    let currentY = 0;
    let isDragging = false;

    const isScrolledToTop = () => {
      // Check if window is at top OR if container is at top
      return window.scrollY === 0 || container.scrollTop === 0;
    };

    const handleTouchStart = (e) => {
      // Only allow pull-to-refresh if at the top
      if (isScrolledToTop() && !isRefreshing) {
        startYPosition = e.touches[0].clientY;
        setCanPull(true);
      }
    };

    const handleTouchMove = (e) => {
      if (!canPull || isRefreshing) return;

      currentY = e.touches[0].clientY;
      const diff = currentY - startYPosition;

      // Only pull down, not up, and only when at top
      if (diff > 0 && isScrolledToTop()) {
        isDragging = true;
        
        // Prevent default scrolling when pulling
        if (diff > 10) {
          e.preventDefault();
        }
        
        // Apply resistance to the pull
        const resistance = 0.5;
        const distance = Math.min(diff * resistance, maxPull);
        setPullDistance(distance);
      }
    };

    const handleTouchEnd = async () => {
      if (!canPull || isRefreshing) {
        setCanPull(false);
        return;
      }

      if (isDragging && pullDistance > threshold) {
        setIsRefreshing(true);
        
        try {
          if (onRefresh) {
            await onRefresh();
          } else {
            // Default behavior: reload the page
            await new Promise(resolve => setTimeout(resolve, 1000));
            window.location.reload();
          }
        } catch (error) {
          console.error('Refresh error:', error);
        } finally {
          setIsRefreshing(false);
        }
      }
      
      // Reset states
      setPullDistance(0);
      setCanPull(false);
      isDragging = false;
    };

    // Add event listeners
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Cleanup
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [canPull, pullDistance, isRefreshing, onRefresh, threshold, maxPull]);

  // Calculate rotation and opacity for the icon
  const rotation = (pullDistance / threshold) * 360;
  const opacity = Math.min(pullDistance / threshold, 1);
  const shouldShowRefreshIcon = pullDistance > 10 || isRefreshing;

  return (
    <div ref={containerRef} className="relative h-full">
      {/* Pull to refresh indicator */}
      {shouldShowRefreshIcon && (
        <div
          className="absolute left-0 right-0 flex items-center justify-center z-50 pointer-events-none transition-all duration-200"
          style={{
            top: isRefreshing ? '60px' : `${pullDistance}px`,
            opacity: isRefreshing ? 1 : opacity,
          }}
        >
          <div className="bg-neutral-800 rounded-full p-3 shadow-lg border border-neutral-700">
            <RefreshCw
              className={`w-5 h-5 text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`}
              style={{
                transform: isRefreshing ? 'none' : `rotate(${rotation}deg)`,
                transition: isRefreshing ? 'none' : 'transform 0.1s ease-out',
              }}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div
        className="h-full"
        style={{
          transform: isRefreshing ? 'translateY(0)' : `translateY(${Math.min(pullDistance * 0.3, 30)}px)`,
          transition: isRefreshing || pullDistance === 0 ? 'transform 0.3s ease-out' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
