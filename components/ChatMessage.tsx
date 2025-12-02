import React, { useState, useRef, useEffect } from 'react';
import { Message, Reaction } from '../types';
import { TrashIcon } from './Icons';

interface ChatMessageProps {
  message: Message;
  userAvatar: string;
  contactAvatar: string;
  onDelete: (messageId: string) => void;
  onReact: (messageId: string, emoji: string) => void;
  currentUserId: string;
}

const REACTION_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, userAvatar, contactAvatar, onDelete, onReact, currentUserId }) => {
  const isUser = message.role === 'user';
  
  // Swipe State
  const [translateX, setTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const initialTranslateX = useRef<number>(0);
  
  // Reaction State
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const SWIPE_THRESHOLD = -40; 
  const MAX_SWIPE = -80; 

  // --- Handlers ---
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    initialTranslateX.current = translateX; // Capture current position (0 or -80)
    setIsSwiping(true);

    // Start Long Press Timer for Reactions
    longPressTimer.current = setTimeout(() => {
        setShowReactionPicker(true);
        if (navigator.vibrate) navigator.vibrate(50); // Haptic feedback
        setIsSwiping(false); // Stop swiping logic if long press triggers
    }, 500);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    
    const diffX = currentX - touchStartX.current;
    const diffY = currentY - touchStartY.current;

    // If moved significantly, cancel long press
    if (Math.abs(diffX) > 10 || Math.abs(diffY) > 10) {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    }

    // If vertical scroll is dominant, ignore horizontal swipe
    if (Math.abs(diffY) > Math.abs(diffX)) return;

    // Calculate new position based on start position + delta
    let newTranslateX = initialTranslateX.current + diffX;

    // Clamp values
    if (newTranslateX > 0) newTranslateX = 0; // Prevent swiping right past 0
    
    // Add resistance if pulling past MAX_SWIPE
    if (newTranslateX < MAX_SWIPE) {
       newTranslateX = MAX_SWIPE + (newTranslateX - MAX_SWIPE) * 0.2;
    }

    setTranslateX(newTranslateX);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
    }

    setIsSwiping(false);
    touchStartX.current = null;
    touchStartY.current = null;

    // If reaction picker is open, don't snap swipe
    if (showReactionPicker) return;

    // Snap to open or close based on threshold
    if (translateX < SWIPE_THRESHOLD) {
      setTranslateX(MAX_SWIPE); // Snap Open
    } else {
      setTranslateX(0); // Snap Closed
    }
  };

  const resetSwipe = () => {
      if (translateX !== 0) setTranslateX(0);
  };

  // Close reaction picker when clicking outside
  useEffect(() => {
      const handleClickOutside = () => setShowReactionPicker(false);
      if (showReactionPicker) {
          document.addEventListener('click', handleClickOutside);
      }
      return () => document.removeEventListener('click', handleClickOutside);
  }, [showReactionPicker]);

  const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      setShowReactionPicker(true);
  };

  const handleReactionClick = (emoji: string) => {
      onReact(message.id, emoji);
      setShowReactionPicker(false);
      resetSwipe();
  };

  const formatTime = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    
    // Explicitly use 12-hour format e.g., "10:30 AM"
    const timeOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
    const timeString = date.toLocaleTimeString([], timeOptions);
    
    if (isToday) return timeString;
    
    const isThisYear = date.getFullYear() === now.getFullYear();
    const dateOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', ...(isThisYear ? {} : { year: 'numeric' }) };
    return `${date.toLocaleDateString([], dateOptions)} • ${timeString}`;
  };

  // Group reactions for display
  const reactionCounts = (message.reactions || []).reduce((acc, reaction) => {
      acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
      return acc;
  }, {} as Record<string, number>);

  const hasMyReaction = (emoji: string) => {
      return message.reactions?.some(r => r.emoji === emoji && r.userId === currentUserId);
  };

  return (
    <div className="relative w-full mb-6 select-none group overflow-hidden">
      
      {/* Delete Background Action */}
      <div className={`absolute inset-y-0 right-0 flex items-center justify-end pr-4 ${isUser ? 'w-[70%]' : 'w-full'} pointer-events-none`}>
         <div 
            className="bg-red-600 h-full flex items-center justify-center rounded-2xl w-20 shadow-inner pointer-events-auto cursor-pointer transition-opacity duration-300 active:scale-95"
            style={{ opacity: Math.abs(translateX) > 20 ? 1 : 0 }}
            onClick={(e) => { 
                e.stopPropagation(); 
                if (navigator.vibrate) navigator.vibrate(50);
                onDelete(message.id); 
            }}
         >
             <TrashIcon className="w-6 h-6 text-white" />
         </div>
      </div>

      {/* Swipeable Message Content */}
      <div 
        className={`relative w-full transition-transform duration-300 ease-out ${isUser ? 'flex justify-end' : 'flex justify-start'}`}
        style={{ transform: `translateX(${translateX}px)`, transition: isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onContextMenu={handleContextMenu}
        onClick={resetSwipe}
      >
        <div className={`flex max-w-[85%] md:max-w-[70%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-3`}>
          
          {/* Avatar */}
          <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden shadow-lg border border-white/10">
            <img 
              src={isUser ? userAvatar : contactAvatar} 
              alt="Avatar" 
              className="w-full h-full object-cover pointer-events-none"
            />
          </div>

          {/* Bubble Container */}
          <div className="relative">
              {/* Reaction Picker Popover */}
              {showReactionPicker && (
                  <div className={`absolute z-50 bottom-full mb-2 ${isUser ? 'right-0' : 'left-0'} bg-[#1c1c1e] border border-white/10 rounded-full shadow-2xl p-2 flex space-x-1 animate-fade-in-up`}>
                      {REACTION_OPTIONS.map(emoji => (
                          <button 
                            key={emoji}
                            onClick={(e) => { e.stopPropagation(); handleReactionClick(emoji); }}
                            className={`w-9 h-9 flex items-center justify-center rounded-full text-xl hover:bg-white/10 hover:scale-125 transition-all ${hasMyReaction(emoji) ? 'bg-white/10' : ''}`}
                          >
                              {emoji}
                          </button>
                      ))}
                  </div>
              )}

              {/* Bubble */}
              <div className={`relative px-5 py-4 rounded-2xl shadow-sm ${
                isUser 
                  ? 'bg-indigo-600 text-white rounded-br-none' 
                  : 'bg-gray-800 border border-gray-700 text-gray-100 rounded-bl-none'
              }`}>
                
                {message.image && (
                  <div className="mb-3 rounded-lg overflow-hidden border border-white/10">
                    <img src={`data:image/jpeg;base64,${message.image}`} alt="Attachment" className="max-w-full h-auto object-cover max-h-60 pointer-events-none" />
                  </div>
                )}

                {message.audio && (
                  <div className="mb-2 min-w-[200px] flex items-center justify-center bg-black/20 rounded-lg p-1">
                    <audio controls src={`data:audio/webm;base64,${message.audio}`} className="w-full h-8 outline-none" />
                  </div>
                )}

                {message.text && (
                  <div className="text-sm md:text-base whitespace-pre-wrap leading-relaxed">
                    {message.text}
                  </div>
                )}

                <div className={`text-[10px] mt-2 opacity-60 flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {formatTime(message.timestamp)}
                </div>
              </div>

              {/* Reactions Display */}
              {Object.keys(reactionCounts).length > 0 && (
                  <div className={`absolute -bottom-5 ${isUser ? 'right-0' : 'left-0'} flex items-center space-x-1`}>
                      {Object.entries(reactionCounts).map(([emoji, count]) => (
                          <div 
                             key={emoji} 
                             onClick={(e) => { e.stopPropagation(); handleReactionClick(emoji); }}
                             className={`bg-[#2c2c2e] border border-white/5 shadow-md rounded-full px-2 py-0.5 flex items-center space-x-1 cursor-pointer transition-transform hover:scale-110 ${hasMyReaction(emoji) ? 'border-indigo-500/50 bg-indigo-500/10' : ''}`}
                          >
                              <span className="text-xs">{emoji}</span>
                              <span className="text-[10px] text-gray-400 font-bold">{count}</span>
                          </div>
                      ))}
                  </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};
