import React, { useState, useRef, useEffect } from 'react';
import { SendIcon, PaperclipIcon, VideoIcon, PhoneIcon, XIcon, MicIcon, CameraIcon, BellIcon, UsersIcon, PlusIcon, MailIcon, EditIcon, MenuIcon, HomeIcon, MessageSquareIcon, UserIcon, InfoIcon, TrashIcon, SquareIcon, CheckIcon, GiftIcon, ShieldIcon, CrownIcon, MapPinIcon, CoffeeIcon, LockIcon, LogOutIcon, HeartIcon, GlobeIcon, AlertCircleIcon, SearchIcon, HistoryIcon } from './components/Icons';
import { ChatMessage } from './components/ChatMessage';
import { LiveCallInterface } from './components/LiveCallInterface';
import { Message, User, PremiumRequest } from './types';
import { blobToBase64 } from './utils/audioUtils';

// --- Constants & Keys ---
const GLOBAL_CHAT_ID = 'global_lounge';
const VIEW_ABOUT = 'view_about';
const VIEW_ADMIN = 'view_admin';
const API_URL = 'http://localhost:5000/api'; // Local Node Server

// --- Admin Credentials ---
const ADMIN_EMAIL = "mulukengashaw@gmail.com";
const ADMIN_PASS = "mulu.@1994";

const MAX_STORY_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export default function App() {
  // --- STATE ---
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [chats, setChats] = useState<Record<string, Message[]>>({});
  
  // Auth State
  const [authStep, setAuthStep] = useState<'auth' | 'profile'>('auth');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authLoading, setAuthLoading] = useState(false);
  
  // Basic Auth Form
  const [authName, setAuthName] = useState('');
  const [authGender, setAuthGender] = useState<'male' | 'female'>('male');
  const [authAge, setAuthAge] = useState<string>('');
  const [authLocation, setAuthLocation] = useState('');
  
  // Pre-filled with Admin Credentials for convenience
  const [authEmail, setAuthEmail] = useState(ADMIN_EMAIL);
  const [authPassword, setAuthPassword] = useState(ADMIN_PASS);

  // Profile Form
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [profileAvatar, setProfileAvatar] = useState<string>('');
  const [profileBio, setProfileBio] = useState('');
  const [profileMusic, setProfileMusic] = useState('');
  const [profileTradition, setProfileTradition] = useState('');
  
  // Modals
  const [viewingProfile, setViewingProfile] = useState<User | null>(null);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);

  // Premium Request Flow
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const receiptInputRef = useRef<HTMLInputElement>(null);

  // Admin Search & History & Premium Requests
  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  const [viewingHistoryUser, setViewingHistoryUser] = useState<User | null>(null);
  const [userHistoryMessages, setUserHistoryMessages] = useState<Message[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [premiumRequests, setPremiumRequests] = useState<PremiumRequest[]>([]);

  // App Navigation & Interaction
  const [activeContactId, setActiveContactId] = useState<string>('');
  const [inputText, setInputText] = useState('');
  const [isLiveOpen, setIsLiveOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ base64: string, preview: string } | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'home' | 'chats' | 'profile'>('home');

  // Features
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [viewingStory, setViewingStory] = useState<{user: User, index: number} | null>(null);
  const [storyError, setStoryError] = useState<string | null>(null);
  const touchStartX = useRef(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const storyInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // --- INITIALIZATION & POLLING ---
  
  useEffect(() => {
    // Initial fetch
    fetchProfiles();
    
    // Poll for updates (Simulation of Realtime)
    const interval = setInterval(() => {
        fetchProfiles();
        if (currentChatId) fetchMessages(currentChatId);
    }, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, [activeContactId, currentUser]); // Refetch messages when contact changes

  // Check premium status on load if user is logged in
  useEffect(() => {
      if (currentUser && !currentUser.isPremium) {
          checkPremiumStatus(currentUser.id);
      }
      if (currentUser?.id === 'admin') {
          fetchPremiumRequests();
      }
  }, [currentUser, isPremiumModalOpen]);

  const checkPremiumStatus = async (userId: string) => {
      try {
          const res = await fetch(`${API_URL}/premium-request/status/${userId}`);
          if (res.ok) {
              const data = await res.json();
              if (data.status === 'pending') setHasPendingRequest(true);
              else setHasPendingRequest(false);
          }
      } catch (e) { console.error("Status check failed", e); }
  };

  const fetchPremiumRequests = async () => {
      try {
          const res = await fetch(`${API_URL}/admin/premium-requests`);
          if (res.ok) {
              const data = await res.json();
              setPremiumRequests(data);
          }
      } catch (e) { console.error("Fetch requests failed", e); }
  };

  const mapApiUserToUser = (u: any): User => ({
      id: u.id,
      name: u.name || 'Unknown',
      email: u.email,
      avatar: u.avatar || 'https://via.placeholder.com/150',
      status: u.status || 'online',
      gender: u.gender || 'male',
      age: u.age || 25,
      location: u.location || '',
      bio: u.bio,
      music: u.music,
      tradition: u.tradition,
      isPremium: !!u.is_premium,
      stories: u.stories || [],
      gifts: u.gifts || [],
      messagesCountToday: u.messages_count_today || 0, 
      storiesCountToday: u.stories_count_today || 0,
      lastMessageDate: u.last_message_date,
      lastStoryDate: u.last_story_date
  });

  const fetchProfiles = async () => {
    try {
        const res = await fetch(`${API_URL}/users`);
        if (res.ok) {
            const data = await res.json();
            setAllUsers(data.map(mapApiUserToUser));
            
            // Sync current user state
            if (currentUser) {
                const me = data.find((u: any) => u.id === currentUser.id);
                if (me) setCurrentUser(mapApiUserToUser(me));
            }
        }
    } catch (e) { console.error("API Error", e); }
  };

  const fetchMessages = async (chatId: string) => {
    try {
        const res = await fetch(`${API_URL}/messages/${chatId}`);
        if (res.ok) {
            const data = await res.json();
            const formattedMessages: Message[] = data.map((msg: any) => ({
                id: msg.id.toString(),
                role: msg.sender_id === currentUser?.id ? 'user' : 'model', 
                text: msg.text || '',
                image: msg.image,
                audio: msg.audio,
                timestamp: new Date(msg.created_at),
                senderId: msg.sender_id,
                reactions: [] // Reactions would need a separate DB table
            }));

            setChats(prev => ({ ...prev, [chatId]: formattedMessages }));
        }
    } catch (e) { console.error("Fetch Messages Error", e); }
  };

  const fetchUserHistory = async (userId: string) => {
      setIsHistoryLoading(true);
      try {
          const res = await fetch(`${API_URL}/admin/history/${userId}`);
          if (res.ok) {
              const data = await res.json();
              const formattedMessages: Message[] = data.map((msg: any) => ({
                id: msg.id.toString(),
                role: 'user', 
                text: msg.text || '',
                image: msg.image,
                audio: msg.audio,
                timestamp: new Date(msg.created_at),
                senderId: msg.sender_id,
                chat_id: msg.chat_id // Added mapping for chat_id
              }));
              setUserHistoryMessages(formattedMessages);
          }
      } catch (e) {
          console.error("Fetch History Error", e);
      } finally {
          setIsHistoryLoading(false);
      }
  };

  // --- Helpers & Effects ---

  const visibleContacts = allUsers.filter(user => {
    if (!currentUser) return false;
    if (currentUser.id === 'admin') return true; 
    if (user.id === currentUser.id) return false;
    return currentUser.gender === 'male' ? user.gender === 'female' : user.gender === 'male';
  });

  const contactsWithStories = visibleContacts.filter(u => u.stories && u.stories.length > 0);
  const isGlobalChat = activeContactId === GLOBAL_CHAT_ID;
  const isAboutPage = activeContactId === VIEW_ABOUT;
  const isAdminPage = activeContactId === VIEW_ADMIN;
  
  const activeContact = allUsers.find(u => u.id === activeContactId);
  const isAdmin = currentUser?.id === 'admin'; 
  
  const getChatIdForContact = (contactId: string) => {
    if (contactId === GLOBAL_CHAT_ID) return GLOBAL_CHAT_ID;
    if (!currentUser) return null;
    return [currentUser.id, contactId].sort().join('_');
  };

  const currentChatId = activeContactId ? getChatIdForContact(activeContactId) : null;
  const currentMessages = currentChatId ? (chats[currentChatId] || []) : [];

  useEffect(() => {
    if (currentChatId) fetchMessages(currentChatId);
  }, [currentChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages, activeContactId]);

  useEffect(() => {
      if (activeContactId) setIsMobileMenuOpen(false);
  }, [activeContactId]);

  useEffect(() => {
    if (storyError) {
      const timer = setTimeout(() => setStoryError(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [storyError]);


  // --- AUTH ACTIONS ---

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);

    try {
        if (authEmail === ADMIN_EMAIL && authPassword === ADMIN_PASS) {
             const adminUser: User = {
                id: 'admin',
                name: 'System Admin',
                avatar: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
                status: 'online',
                gender: 'male',
                age: 99,
                location: 'HQ',
                bio: 'Administrator',
                isPremium: true,
                stories: []
            };
            setCurrentUser(adminUser);
            setActiveContactId(VIEW_ADMIN);
            setAuthLoading(false);
            return;
        }

        if (authMode === 'signup') {
            // Move to profile step to collect more info before create
             setAuthStep('profile');
        } else {
            // Login
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: authEmail, password: authPassword })
            });
            
            if (res.ok) {
                const user = await res.json();
                setCurrentUser(mapApiUserToUser(user));
            } else {
                alert("Invalid email or password");
            }
        }
    } catch (error: any) {
        alert("Connection error: " + error.message);
    } finally {
        setAuthLoading(false);
    }
  };

  const handleProfileComplete = async (e: React.FormEvent) => {
      e.preventDefault();
      setAuthLoading(true);

      const defaultAvatar = authGender === 'male' 
        ? `https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&h=400&fit=crop&crop=faces&q=80` 
        : `https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=faces&q=80`;

      const newUser = {
        id: Date.now().toString(), // Simple ID generation
        email: authEmail,
        password: authPassword,
        name: authName,
        gender: authGender,
        age: parseInt(authAge) || 25,
        location: authLocation || 'Addis Ababa',
        avatar: profileAvatar || defaultAvatar,
        bio: profileBio || `New to Yene Love.`,
        music: profileMusic,
        tradition: profileTradition
      };

      try {
          const res = await fetch(`${API_URL}/signup`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newUser)
          });

          if (res.ok) {
              const createdUser = await res.json();
              setCurrentUser(mapApiUserToUser(createdUser));
              setAuthStep('auth');
          } else {
              alert("Signup failed. Email might be in use.");
          }
      } catch (err) {
          console.error(err);
      }
      setAuthLoading(false);
  };

  const handleLogout = async () => {
    setCurrentUser(null);
    setActiveContactId('');
    setAuthStep('auth');
    setAuthMode('login');
  };

  // --- PROFILE ACTIONS ---

  const openEditProfile = (targetUser?: User) => {
    const userToEdit = targetUser || currentUser;
    if (!userToEdit) return;

    setAuthName(userToEdit.name);
    setAuthAge(userToEdit.age.toString());
    setAuthLocation(userToEdit.location);
    setProfileBio(userToEdit.bio || '');
    setProfileMusic(userToEdit.music || '');
    setProfileTradition(userToEdit.tradition || '');
    setProfileAvatar(userToEdit.avatar);
    
    setViewingProfile(userToEdit); 
    setIsEditProfileOpen(true);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingProfile) return;

    const updates = {
      name: authName,
      age: parseInt(authAge),
      location: authLocation,
      bio: profileBio,
      music: profileMusic,
      tradition: profileTradition,
      avatar: profileAvatar
    };

    const res = await fetch(`${API_URL}/users/${viewingProfile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
    });

    if (res.ok) {
        setIsEditProfileOpen(false);
        fetchProfiles();
        if (currentUser?.id === viewingProfile.id) {
            setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
        }
    } else {
        alert("Failed to update profile");
    }
  };

  // --- MESSAGING ACTIONS ---

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  };

  const handleSendMessage = async (audioBase64?: string) => {
    if ((!inputText.trim() && !selectedImage && !audioBase64) || !currentUser || !currentChatId) return;

    const newMessage = {
        chat_id: currentChatId,
        sender_id: currentUser.id,
        text: audioBase64 ? '🎤 Voice Message' : inputText,
        image: selectedImage?.base64,
        audio: audioBase64
    };

    const res = await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMessage)
    });

    if (res.ok) {
        // Update limits locally for UI response
        // In real app, backend calculates limits
        setInputText('');
        setSelectedImage(null);
        fetchMessages(currentChatId); // Refresh
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
      // Not implemented in backend for this demo, usually DELETE /api/messages/:id
      // For now just UI remove
      setChats(prev => {
          if (!currentChatId) return prev;
          return {
              ...prev,
              [currentChatId]: prev[currentChatId].filter(m => m.id !== messageId)
          };
      });
  };

  // --- STORY ACTIONS ---

  const handleStoryFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      setStoryError(null);
      if (!currentUser) return;
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (file.size > MAX_STORY_SIZE_BYTES) {
          setStoryError(`File too large (Max 5MB).`);
          return;
        }

        try {
          const base64 = await blobToBase64(file);
          const storyUrl = `data:${file.type};base64,${base64}`;
          const newStories = [storyUrl, ...(currentUser.stories || [])];
          
          const res = await fetch(`${API_URL}/users/${currentUser.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ stories: newStories })
          });

          if (res.ok) {
             setCurrentUser({ ...currentUser, stories: newStories });
             fetchProfiles();
          } else {
              setStoryError("Database error uploading story.");
          }
        } catch (err) {
          console.error("Error upload story", err);
          setStoryError("Failed to upload story.");
        }
      }
      if (storyInputRef.current) storyInputRef.current.value = '';
  };

  // --- RECORDING ACTIONS ---

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      setRecordingDuration(0);
      setIsRecording(true);
      recordTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      mediaRecorder.start();
    } catch (err) {
      console.error("Error accessing microphone", err);
      alert("Could not access microphone");
    }
  };

  const stopRecordingAndSend = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' }); 
          const base64Audio = await blobToBase64(audioBlob);
          handleSendMessage(base64Audio);
          cleanupRecording();
      };
      mediaRecorderRef.current.stop();
    }
  };

  const cancelRecording = () => {
     if (mediaRecorderRef.current) {
         mediaRecorderRef.current.onstop = null; 
         mediaRecorderRef.current.stop();
     }
     cleanupRecording();
  };

  const cleanupRecording = () => {
      setIsRecording(false);
      setRecordingDuration(0);
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());
      mediaRecorderRef.current = null;
      audioChunksRef.current = [];
  };

  // --- ADMIN & PREMIUM ---

  const adminTogglePremium = async (user: User) => {
      const res = await fetch(`${API_URL}/users/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_premium: !user.isPremium })
      });
      if (res.ok) fetchProfiles();
  };

  const adminDeleteUser = async (userId: string) => {
      if(!confirm("Are you sure you want to permanently delete this user? This cannot be undone.")) return;
      
      const res = await fetch(`${API_URL}/users/${userId}`, {
          method: 'DELETE'
      });
      if (res.ok) {
          fetchProfiles();
          setViewingProfile(null);
      } else {
          alert("Failed to delete user.");
      }
  };
  
  const adminSendGift = async (gift: string) => {
      if (!viewingProfile) return;
      const newGifts = [...(viewingProfile.gifts || []), gift];
      
      const res = await fetch(`${API_URL}/users/${viewingProfile.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gifts: newGifts })
      });

      if (res.ok) {
          fetchProfiles();
          setIsGiftModalOpen(false);
          setViewingProfile(null);
      }
  };

  const handleReceiptSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
          const base64 = await blobToBase64(file);
          setReceiptImage(`data:${file.type};base64,${base64}`);
      } catch(err) {
          console.error(err);
      }
    }
  };

  const handleSubmitReceipt = async () => {
      if (!currentUser || !receiptImage) return;
      setIsUploadingReceipt(true);
      
      try {
          const res = await fetch(`${API_URL}/premium-request`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id: currentUser.id, receipt_image: receiptImage })
          });

          if (res.ok) {
              setHasPendingRequest(true);
              setReceiptImage(null);
          } else {
              alert("Failed to submit request.");
          }
      } catch (e) {
          alert("Error submitting request.");
      } finally {
          setIsUploadingReceipt(false);
      }
  };

  const adminApproveRequest = async (request: PremiumRequest) => {
      if (!confirm("Confirm payment verification and unlock premium?")) return;
      try {
          const res = await fetch(`${API_URL}/admin/approve-premium/${request.id}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: request.user_id })
          });
          if (res.ok) fetchPremiumRequests();
      } catch (e) { console.error(e); }
  };

  const adminRejectRequest = async (request: PremiumRequest) => {
      if (!confirm("Reject this payment receipt?")) return;
      try {
          const res = await fetch(`${API_URL}/admin/reject-premium/${request.id}`, { method: 'POST' });
          if (res.ok) fetchPremiumRequests();
      } catch (e) { console.error(e); }
  };

  const handleViewHistory = async (user: User) => {
      setViewingHistoryUser(user);
      fetchUserHistory(user.id);
  };

  // --- FILE HELPERS ---
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const base64 = await blobToBase64(file);
      setSelectedImage({ base64, preview: URL.createObjectURL(file) });
    }
  };

  const formatDuration = (sec: number) => {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // --- RENDERERS ---

  const renderReceiptViewer = () => {
    if (!viewingReceipt) return null;
    return (
      <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in" onClick={() => setViewingReceipt(null)}>
        <div className="relative max-w-4xl max-h-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
           <div className="relative">
             <img src={viewingReceipt} alt="Receipt Full" className="max-w-full max-h-[85vh] rounded-lg shadow-2xl border border-white/10" />
             <button className="absolute -top-4 -right-4 p-2 bg-red-600 text-white rounded-full hover:bg-red-500 shadow-lg border border-white/10" onClick={() => setViewingReceipt(null)}><XIcon className="w-6 h-6"/></button>
           </div>
           <a 
             href={viewingReceipt} 
             download={`receipt_${Date.now()}.png`}
             className="mt-4 px-6 py-2 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors shadow-lg flex items-center gap-2"
           >
             Download Receipt
           </a>
        </div>
      </div>
    );
  };

  const renderProfileModal = () => {
      const targetUser = viewingProfile;
      if (!targetUser) return null;
      const isEditing = isEditProfileOpen;

      return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-[#1c1c1e] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative">
                  <div className="h-32 bg-gradient-to-r from-emerald-800 to-amber-800 relative">
                       <button onClick={() => { setIsEditProfileOpen(false); setViewingProfile(null); }} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white backdrop-blur-md transition-colors"><XIcon className="w-5 h-5"/></button>
                  </div>
                  <div className="px-8 pb-8 -mt-16 flex flex-col items-center">
                       <div className="relative mb-4">
                           <div className="w-32 h-32 rounded-full border-4 border-[#1c1c1e] overflow-hidden bg-black">
                               <img src={isEditing ? (profileAvatar || targetUser.avatar) : targetUser.avatar} alt="Profile" className="w-full h-full object-cover" />
                           </div>
                           {isEditing && (
                             <div className="absolute bottom-1 right-1 bg-emerald-500 p-2 rounded-full border-2 border-[#1c1c1e] cursor-pointer hover:bg-emerald-400" onClick={() => avatarInputRef.current?.click()}>
                                <CameraIcon className="w-4 h-4 text-white" />
                             </div>
                           )}
                       </div>

                       {isEditing ? (
                           <form onSubmit={handleEditSave} className="w-full space-y-4">
                               <div className="text-center mb-4"><h3 className="text-xl font-bold text-white">Edit Profile</h3></div>
                               <div><label className="text-xs text-gray-400 uppercase font-semibold">Name</label><input type="text" value={authName} onChange={e => setAuthName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none" required/></div>
                               <div className="grid grid-cols-2 gap-3">
                                   <div><label className="text-xs text-gray-400 uppercase font-semibold">Age</label><input type="number" value={authAge} onChange={e => setAuthAge(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none" required/></div>
                                   <div><label className="text-xs text-gray-400 uppercase font-semibold">City</label><input type="text" value={authLocation} onChange={e => setAuthLocation(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none" required/></div>
                               </div>
                               <div><label className="text-xs text-gray-400 uppercase font-semibold">Bio</label><textarea value={profileBio} onChange={e => setProfileBio(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none h-20" required/></div>
                               <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-500 transition-colors mt-2">Save Changes</button>
                           </form>
                       ) : (
                           <div className="w-full text-center space-y-4">
                               <div>
                                   <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                                       {targetUser.name}, {targetUser.age}
                                       {targetUser.isPremium && <CrownIcon className="w-5 h-5 text-yellow-400"/>}
                                   </h2>
                                   <p className="text-emerald-400 font-medium">{targetUser.location}</p>
                                   <p className="text-xs text-gray-500">{targetUser.email}</p>
                                   {(targetUser.gifts && targetUser.gifts.length > 0) && (
                                       <div className="flex justify-center flex-wrap gap-1 mt-2">
                                           {targetUser.gifts.map((g, i) => (
                                               <span key={i} className="text-xl animate-pulse" title="Gift">{g}</span>
                                           ))}
                                       </div>
                                   )}
                               </div>
                               <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-sm text-gray-200 leading-relaxed">"{targetUser.bio}"</div>
                               {isAdmin && (
                                   <div className="grid grid-cols-3 gap-2 mt-4">
                                       <button onClick={() => openEditProfile(targetUser)} className="bg-blue-600/20 text-blue-400 py-2 rounded-xl text-xs font-bold hover:bg-blue-600/30">Edit</button>
                                       <button onClick={() => adminTogglePremium(targetUser)} className={`py-2 rounded-xl text-xs font-bold ${targetUser.isPremium ? 'bg-red-600/20 text-red-400' : 'bg-yellow-600/20 text-yellow-400'}`}>{targetUser.isPremium ? 'Revoke VIP' : 'Grant VIP'}</button>
                                       <button onClick={() => { setViewingProfile(targetUser); setIsGiftModalOpen(true); }} className="bg-pink-600/20 text-pink-400 py-2 rounded-xl text-xs font-bold hover:bg-pink-600/30">Gift</button>
                                       <button onClick={() => { setViewingProfile(null); handleViewHistory(targetUser); }} className="col-span-2 bg-gray-600/20 text-gray-300 py-2 rounded-xl text-xs font-bold hover:bg-gray-600/30 flex items-center justify-center gap-2"><HistoryIcon className="w-3 h-3"/> View History</button>
                                       <button onClick={() => adminDeleteUser(targetUser.id)} className="col-span-1 bg-red-900/30 text-red-500 py-2 rounded-xl text-xs font-bold hover:bg-red-900/50 flex items-center justify-center gap-1 border border-red-900/50"><TrashIcon className="w-3 h-3"/> Delete</button>
                                   </div>
                               )}
                               <button onClick={() => { setIsEditProfileOpen(false); setViewingProfile(null); }} className="w-full bg-white/10 text-white font-semibold py-3 rounded-xl hover:bg-white/20 transition-colors mt-2">Close</button>
                           </div>
                       )}
                  </div>
              </div>
          </div>
      );
  };

  const renderHistoryModal = () => {
      if (!viewingHistoryUser) return null;

      return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-[#1c1c1e] w-full max-w-4xl h-[80vh] rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col">
                   <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#2c2c2e]">
                       <div className="flex items-center gap-3">
                           <img src={viewingHistoryUser.avatar} className="w-10 h-10 rounded-full object-cover" />
                           <div>
                               <h3 className="text-white font-bold">{viewingHistoryUser.name} - History Log</h3>
                               <p className="text-gray-400 text-xs">{viewingHistoryUser.email}</p>
                           </div>
                       </div>
                       <button onClick={() => { setViewingHistoryUser(null); setUserHistoryMessages([]); }} className="p-2 hover:bg-white/10 rounded-full"><XIcon className="w-6 h-6 text-white"/></button>
                   </div>
                   
                   <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
                       {/* Stories Column */}
                       <div className="w-full md:w-1/3">
                           <h4 className="text-emerald-400 font-bold mb-4 uppercase text-xs tracking-wider">Stories Uploaded</h4>
                           <div className="grid grid-cols-2 gap-2">
                               {viewingHistoryUser.stories && viewingHistoryUser.stories.length > 0 ? (
                                   viewingHistoryUser.stories.map((s, i) => (
                                       <div key={i} className="aspect-square rounded-lg overflow-hidden border border-white/10">
                                           <img src={s} className="w-full h-full object-cover" />
                                       </div>
                                   ))
                               ) : <p className="text-gray-500 text-sm">No stories posted.</p>}
                           </div>
                       </div>

                       {/* Messages Column */}
                       <div className="w-full md:w-2/3 flex flex-col">
                           <h4 className="text-blue-400 font-bold mb-4 uppercase text-xs tracking-wider">Message History</h4>
                           <div className="flex-1 bg-black/20 rounded-xl p-4 overflow-y-auto custom-scrollbar border border-white/5 space-y-4">
                               {isHistoryLoading ? (
                                   <div className="text-center text-gray-500 mt-10">Loading history...</div>
                               ) : userHistoryMessages.length > 0 ? (
                                   userHistoryMessages.map((msg, i) => (
                                       <div key={i} className="bg-white/5 p-3 rounded-lg border border-white/5">
                                           <div className="flex justify-between items-center mb-1">
                                               <span className="text-xs text-gray-500">{msg.timestamp.toLocaleString()}</span>
                                               <span className="text-xs bg-gray-800 px-2 py-0.5 rounded text-gray-300">Chat ID: {msg.chat_id || 'Unknown'}</span>
                                           </div>
                                           {msg.text && <p className="text-gray-200 text-sm">{msg.text}</p>}
                                           {msg.image && <img src={`data:image/jpeg;base64,${msg.image}`} className="mt-2 h-20 rounded object-cover"/>}
                                           {msg.audio && <div className="mt-2 text-xs text-emerald-500">🎤 Audio Message</div>}
                                       </div>
                                   ))
                               ) : (
                                   <div className="text-center text-gray-500 mt-10">No message history found.</div>
                               )}
                           </div>
                       </div>
                   </div>
              </div>
          </div>
      );
  };

  const renderStoryViewer = () => {
    if (!viewingStory) return null;
    const { user, index } = viewingStory;
    const storyImg = user.stories?.[index];

    const goToNext = (e: any) => {
        e.stopPropagation();
        if (user.stories && index < user.stories.length - 1) {
            setViewingStory({ user, index: index + 1 });
        } else {
             const currentIdx = visibleContacts.findIndex(u => u.id === user.id);
             if (currentIdx !== -1 && currentIdx < visibleContacts.length - 1) {
                 setViewingStory({ user: visibleContacts[currentIdx + 1], index: 0 });
             } else {
                 setViewingStory(null);
             }
        }
    };
    
    const goToPrev = (e: any) => {
        e.stopPropagation();
        if (index > 0) {
            setViewingStory({ user, index: index - 1 });
        } else {
            const currentIdx = visibleContacts.findIndex(u => u.id === user.id);
            if (currentIdx > 0) {
                const prevUser = visibleContacts[currentIdx - 1];
                setViewingStory({ user: prevUser, index: (prevUser.stories?.length || 1) - 1 });
            } else {
                setViewingStory(null);
            }
        }
    };

    return (
      <div 
        className="fixed inset-0 z-[70] bg-black flex flex-col items-center justify-center animate-fade-in touch-none"
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => { 
           const diff = touchStartX.current - e.changedTouches[0].clientX;
           if (Math.abs(diff) > 50) diff > 0 ? goToNext(e) : goToPrev(e); 
        }}
      >
        <div className="absolute top-4 left-4 right-4 z-30 flex space-x-1.5">
          {user.stories?.map((_, i) => (
            <div key={i} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
               <div className={`h-full bg-white transition-all duration-300 ${i <= index ? 'w-full' : 'w-0'}`}></div>
            </div>
          ))}
        </div>
        <div className="absolute top-8 left-4 right-4 flex justify-between items-center z-30 mt-2">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={(e) => { e.stopPropagation(); setViewingProfile(user); setViewingStory(null); }}>
                <img src={user.avatar} className="w-9 h-9 rounded-full border border-white/30" alt="Avatar"/>
                <div className="flex flex-col">
                  <span className="text-white text-sm font-semibold drop-shadow-md">{user.name}</span>
                </div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setViewingStory(null); }} className="p-2 bg-black/20 hover:bg-black/40 rounded-full backdrop-blur-md transition-colors"><XIcon className="text-white w-6 h-6" /></button>
        </div>
        <img src={storyImg} alt="Story" className="max-h-full max-w-full object-contain pointer-events-none select-none" />
        <div className="absolute inset-y-0 left-0 w-1/3 z-20" onClick={goToPrev}></div>
        <div className="absolute inset-y-0 right-0 w-1/3 z-20" onClick={goToNext}></div>
      </div>
    );
  };

  const renderPremiumModal = () => (
      isPremiumModalOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
            <div className="relative w-full max-w-md bg-gradient-to-br from-gray-900 to-black rounded-3xl p-1 border border-yellow-500/30 shadow-[0_0_50px_rgba(234,179,8,0.2)]">
                <div className="bg-[#1c1c1e] rounded-[22px] p-6 md:p-8 flex flex-col items-center text-center overflow-hidden relative min-h-[500px]">
                    <button onClick={() => { setIsPremiumModalOpen(false); setReceiptImage(null); }} className="absolute top-4 right-4 text-gray-400 hover:text-white"><XIcon className="w-6 h-6"/></button>
                    <CrownIcon className="w-10 h-10 text-yellow-400 mb-6" />
                    <h2 className="text-2xl font-bold text-white mb-2">Premium Verification</h2>
                    <p className="text-gray-400 text-sm mb-6">Unlock unlimited features.</p>
                    
                    {hasPendingRequest ? (
                        <div className="bg-white/5 border border-yellow-500/50 rounded-xl p-6 w-full animate-pulse">
                            <h3 className="text-yellow-400 font-bold text-lg mb-2">Verification Pending</h3>
                            <p className="text-gray-300 text-sm">Your payment receipt has been submitted and is currently being reviewed by our Admin team. You will be upgraded automatically upon approval.</p>
                        </div>
                    ) : (
                        <div className="w-full space-y-4 text-left">
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                <p className="text-xs text-gray-400 uppercase font-bold mb-2">Payment Instructions</p>
                                <p className="text-white text-sm mb-1">1. Transfer <span className="text-yellow-400 font-bold">299 ETB</span> to:</p>
                                <p className="text-white text-sm font-mono bg-black/30 p-2 rounded">CBE: 1000123456789 (Yene Love Inc)</p>
                                <p className="text-white text-sm font-mono bg-black/30 p-2 rounded mt-1">Telebirr: 0911234567</p>
                                <p className="text-white text-sm mt-3">2. Upload a screenshot of the transaction receipt below.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-gray-400 uppercase font-bold">Upload Receipt</label>
                                <div 
                                    onClick={() => receiptInputRef.current?.click()}
                                    className="border-2 border-dashed border-white/20 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors h-32"
                                >
                                    {receiptImage ? (
                                        <img src={receiptImage} alt="Receipt" className="h-full object-contain" />
                                    ) : (
                                        <>
                                            <PaperclipIcon className="w-6 h-6 text-gray-500 mb-2" />
                                            <span className="text-gray-500 text-xs">Tap to upload screenshot</span>
                                        </>
                                    )}
                                </div>
                                <input type="file" ref={receiptInputRef} className="hidden" accept="image/*" onChange={handleReceiptSelect} />
                            </div>

                            <button 
                                onClick={handleSubmitReceipt}
                                disabled={!receiptImage || isUploadingReceipt}
                                className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform ${!receiptImage ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-yellow-500 text-black hover:scale-105'}`}
                            >
                                {isUploadingReceipt ? 'Submitting...' : 'Submit Receipt for Verification'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
      ) : null
  );

  const renderGiftModal = () => (
      isGiftModalOpen ? (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
              <div className="bg-[#1c1c1e] p-6 rounded-2xl border border-white/10 text-center w-80">
                  <h3 className="text-xl font-bold text-white mb-4">Send a Gift</h3>
                  <div className="grid grid-cols-4 gap-4 mb-6">
                      {['🎁', '🌹', '💎', '☕', '🧁', '👑', '🕊️', '🦄'].map(gift => (
                          <button key={gift} onClick={() => adminSendGift(gift)} className="text-3xl hover:scale-125 transition-transform p-2 bg-white/5 rounded-lg">{gift}</button>
                      ))}
                  </div>
                  <button onClick={() => setIsGiftModalOpen(false)} className="text-gray-400 text-sm hover:text-white">Cancel</button>
              </div>
          </div>
      ) : null
  );

  // --- MAIN RENDER ---

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050505] text-white p-4 relative overflow-hidden font-sans">
        <div className="w-full max-w-md bg-black/40 backdrop-blur-2xl border border-white/5 rounded-3xl shadow-2xl p-8 z-10">
           <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-2">Yene Love</h1>
              <p className="text-gray-400">Secure. Permanent. Real.</p>
           </div>
           {authStep === 'auth' ? (
             <form onSubmit={handleAuth} className="space-y-4">
               <div className="flex space-x-2 mb-4">
                  <button type="button" onClick={() => setAuthMode('login')} className={`flex-1 py-2 text-sm font-bold border-b-2 ${authMode === 'login' ? 'border-emerald-500 text-white' : 'border-transparent text-gray-500'}`}>Login</button>
                  <button type="button" onClick={() => setAuthMode('signup')} className={`flex-1 py-2 text-sm font-bold border-b-2 ${authMode === 'signup' ? 'border-emerald-500 text-white' : 'border-transparent text-gray-500'}`}>Sign Up</button>
               </div>
               <input type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" placeholder="Email" required />
               <input type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" placeholder="Password" required />
               <button type="submit" disabled={authLoading} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-500">{authLoading ? 'Loading...' : (authMode === 'login' ? 'Enter' : 'Start')}</button>
             </form>
           ) : (
             <form onSubmit={handleProfileComplete} className="space-y-4">
               <input type="text" value={authName} onChange={e => setAuthName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" placeholder="Name" required />
               <div className="flex gap-2">
                 <input type="number" value={authAge} onChange={e => setAuthAge(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" placeholder="Age" required />
                 <input type="text" value={authLocation} onChange={e => setAuthLocation(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" placeholder="City" required />
               </div>
               <div className="flex gap-2">
                   <button type="button" onClick={() => setAuthGender('male')} className={`flex-1 py-3 rounded-xl border ${authGender === 'male' ? 'bg-emerald-600 border-emerald-500' : 'bg-white/5 border-white/10'}`}>Male</button>
                   <button type="button" onClick={() => setAuthGender('female')} className={`flex-1 py-3 rounded-xl border ${authGender === 'female' ? 'bg-amber-600 border-amber-500' : 'bg-white/5 border-white/10'}`}>Female</button>
               </div>
               <button type="submit" disabled={authLoading} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl">{authLoading ? 'Saving...' : 'Complete Profile'}</button>
             </form>
           )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#08080a] text-gray-100 overflow-hidden font-sans relative">
      {(isEditProfileOpen || viewingProfile) && renderProfileModal()}
      {viewingHistoryUser && renderHistoryModal()}
      {renderPremiumModal()}
      {renderStoryViewer()}
      {renderReceiptViewer()}
      {renderGiftModal()}
      {storyError && (
        <div className="fixed top-20 md:top-6 left-1/2 transform -translate-x-1/2 z-[70] bg-red-500/90 text-white px-6 py-3 rounded-full shadow-2xl backdrop-blur-md flex items-center space-x-2 animate-bounce">
            <AlertCircleIcon className="w-5 h-5" />
            <span className="font-medium text-sm">{storyError}</span>
        </div>
      )}
      
      {activeContact && !isGlobalChat && !isAboutPage && !isAdminPage && (
        <LiveCallInterface 
          isOpen={isLiveOpen} 
          onClose={() => setIsLiveOpen(false)} 
          contactName={activeContact.name}
          contactBio={`Age: ${activeContact.age}. Location: ${activeContact.location}. ${activeContact.bio || ''}`}
          voiceName={activeContact.voice}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-80 bg-[#0c0c0e] border-r border-white/5 flex flex-col md:relative ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} transition-transform duration-300`}>
          <div className="p-6 border-b border-white/5 flex justify-between items-center">
             <h1 className="text-xl font-bold text-white">Yene Love</h1>
             <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden"><XIcon className="w-6 h-6"/></button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
             {isAdmin && (
                  <div onClick={() => { setActiveContactId(VIEW_ADMIN); setIsMobileMenuOpen(false); }} className={`flex items-center p-3 rounded-xl cursor-pointer ${activeContactId === VIEW_ADMIN ? 'bg-white/10' : 'hover:bg-white/5'}`}>
                     <ShieldIcon className="w-5 h-5 text-blue-400 mr-3"/>
                     <div><p className="text-sm font-bold text-white">Admin Dashboard</p></div>
                  </div>
             )}
             {!isAdmin && (
                 <div onClick={() => setActiveContactId(GLOBAL_CHAT_ID)} className={`flex items-center p-3 rounded-xl cursor-pointer ${activeContactId === GLOBAL_CHAT_ID ? 'bg-white/10' : 'hover:bg-white/5'}`}>
                     <UsersIcon className="w-5 h-5 text-indigo-400 mr-3"/>
                     <div><p className="text-sm font-bold text-white">Habesha Lounge</p></div>
                 </div>
             )}
             {visibleContacts.map(contact => (
                <div key={contact.id} onClick={() => setActiveContactId(contact.id)} className={`flex items-center p-3 rounded-xl cursor-pointer ${activeContactId === contact.id ? 'bg-white/10' : 'hover:bg-white/5'}`}>
                    <img src={contact.avatar} className="w-10 h-10 rounded-full mr-3 object-cover"/>
                    <div>
                        <p className="text-sm font-bold text-white">{contact.name}</p>
                        <p className="text-xs text-gray-500">{contact.location}</p>
                    </div>
                </div>
             ))}
             {!isAdmin && (
              <div onClick={() => setActiveContactId(VIEW_ABOUT)} className={`flex items-center p-3 rounded-xl cursor-pointer ${activeContactId === VIEW_ABOUT ? 'bg-white/10' : 'hover:bg-white/5'}`}>
                 <InfoIcon className="w-5 h-5 text-gray-400 mr-3"/>
                 <p className="text-sm font-bold text-white">About Yene Love</p>
              </div>
             )}
          </div>
          <div className="p-4 border-t border-white/5 bg-black/20">
             <div className="flex justify-between items-center">
                 <div className="flex items-center gap-2 cursor-pointer" onClick={() => openEditProfile()}>
                     <img src={currentUser.avatar} className="w-8 h-8 rounded-full object-cover"/>
                     <span className="text-sm font-bold">{currentUser.name}</span>
                 </div>
                 <button onClick={handleLogout}><LogOutIcon className="w-4 h-4 text-red-400"/></button>
             </div>
          </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative bg-[#050505]">
          <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#08080a]">
              <div className="flex items-center gap-4">
                  <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden"><MenuIcon className="w-6 h-6"/></button>
                  {activeContact ? (
                      <span className="font-bold text-lg">{activeContact.name}</span>
                  ) : isAdminPage ? (
                      <span className="font-bold text-lg">Dashboard</span>
                  ) : isAboutPage ? (
                      <span className="font-bold text-lg">About</span>
                  ) : (
                      <span className="font-bold text-lg">{isGlobalChat ? 'Habesha Lounge' : 'Home'}</span>
                  )}
              </div>
          </div>

          {isAdminPage ? (
              <div className="flex-1 overflow-y-auto p-4 md:p-10 relative z-10 custom-scrollbar animate-fade-in">
                  <header className="flex justify-between items-center mb-8">
                      <h1 className="text-3xl font-bold text-white flex items-center gap-3"><ShieldIcon className="w-8 h-8 text-blue-500" />Admin Control Panel</h1>
                  </header>
                  
                  {/* Premium Requests Section */}
                  <div className="mb-10">
                      <h2 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2"><CrownIcon className="w-5 h-5"/> Pending Premium Requests ({premiumRequests.length})</h2>
                      {premiumRequests.length === 0 ? (
                          <div className="bg-white/5 p-4 rounded-xl text-gray-500 text-sm">No pending requests.</div>
                      ) : (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              {premiumRequests.map(req => (
                                  <div key={req.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-4 items-start relative overflow-hidden group">
                                      {/* Highlight glow */}
                                      <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500"></div>
                                      
                                      <div className="relative group-hover:scale-105 transition-transform cursor-zoom-in" onClick={() => setViewingReceipt(req.receipt_image)} title="View Receipt">
                                          <img 
                                            src={req.receipt_image} 
                                            alt="Receipt" 
                                            className="w-24 h-32 object-cover rounded-lg border border-white/20 bg-black" 
                                          />
                                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                              <SearchIcon className="w-6 h-6 text-white" />
                                          </div>
                                      </div>

                                      <div className="flex-1 flex flex-col justify-between h-32">
                                          <div>
                                              <div className="flex items-center gap-2 mb-1">
                                                  <img src={req.avatar || 'https://via.placeholder.com/40'} className="w-6 h-6 rounded-full"/>
                                                  <span className="font-bold text-white">{req.name}</span>
                                              </div>
                                              <p className="text-xs text-gray-400 mb-1">{req.email}</p>
                                              <p className="text-xs text-gray-500">{new Date(req.created_at).toLocaleDateString()}</p>
                                          </div>
                                          <div className="flex gap-2 mt-2">
                                              <button onClick={() => adminApproveRequest(req)} className="flex-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-600/50 py-1.5 rounded text-xs font-bold transition-all">Approve</button>
                                              <button onClick={() => adminRejectRequest(req)} className="flex-1 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-600/50 py-1.5 rounded text-xs font-bold transition-all">Reject</button>
                                          </div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>

                  <div className="border-t border-white/10 my-8"></div>

                  {/* Search and User List */}
                  <h2 className="text-xl font-bold text-white mb-4">Manage Users</h2>
                  <div className="mb-8 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <SearchIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input 
                          type="text" 
                          placeholder="Search users by name or email..." 
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={adminSearchTerm}
                          onChange={(e) => setAdminSearchTerm(e.target.value)}
                      />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {allUsers
                          .filter(u => u.id !== 'admin')
                          .filter(u => {
                              const search = adminSearchTerm.toLowerCase();
                              return u.name.toLowerCase().includes(search) || (u.email && u.email.toLowerCase().includes(search));
                          })
                          .map(user => (
                          <div key={user.id} className="bg-white/5 border border-white/5 rounded-2xl p-5 hover:border-white/20 transition-all group">
                              <div className="flex items-center space-x-4 mb-4">
                                  <img src={user.avatar} alt={user.name} className="w-14 h-14 rounded-full object-cover border-2 border-white/10" />
                                  <div className="overflow-hidden">
                                      <h3 className="text-white font-bold flex items-center gap-2 truncate">{user.name} {user.isPremium && <CrownIcon className="w-4 h-4 text-yellow-400" />}</h3>
                                      <p className="text-gray-400 text-xs truncate">{user.email}</p>
                                  </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                  <button onClick={() => { setViewingProfile(user); setIsEditProfileOpen(true); }} className="bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg text-xs font-semibold">Edit</button>
                                  <button onClick={() => adminTogglePremium(user)} className={`py-2 rounded-lg text-xs font-semibold ${user.isPremium ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'}`}>{user.isPremium ? 'Revoke VIP' : 'Grant VIP'}</button>
                                  <button onClick={() => { setViewingProfile(user); setIsGiftModalOpen(true); }} className="col-span-1 bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-300 py-2 rounded-lg text-xs font-semibold">Gift</button>
                                  <button onClick={() => handleViewHistory(user)} className="col-span-1 bg-blue-600/20 text-blue-300 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 hover:bg-blue-600/30"><HistoryIcon className="w-3 h-3"/> History</button>
                                  <button onClick={() => adminDeleteUser(user.id)} className="col-span-2 mt-1 bg-red-900/30 text-red-400 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 hover:bg-red-900/50 border border-red-900/50"><TrashIcon className="w-3 h-3"/> Delete User</button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          ) : isAboutPage ? (
              <div className="flex-1 overflow-y-auto p-4 md:p-10 relative z-10 custom-scrollbar animate-fade-in text-center">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-tr from-green-500 via-yellow-400 to-red-500 rounded-2xl flex items-center justify-center shadow-2xl rotate-3 mb-8 mt-10">
                      <HeartIcon className="w-12 h-12 text-white fill-current" />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">About <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-yellow-400 to-red-400">Yene Love</span></h1>
                  <p className="text-xl text-gray-300 font-light max-w-2xl mx-auto">Connecting Hearts. Celebrating Culture.</p>
              </div>
          ) : !activeContactId ? (
              <div className="flex-1 overflow-y-auto p-4 md:p-10 relative z-10 custom-scrollbar">
                 <section className="mb-12">
                    <div className="flex justify-between items-center mb-4">
                       <h3 className="text-lg font-bold text-white">Stories</h3>
                    </div>
                    <div className="flex space-x-4 overflow-x-auto pb-4 custom-scrollbar">
                       <div className="flex flex-col items-center space-y-2 cursor-pointer flex-shrink-0">
                          <input type="file" ref={storyInputRef} className="hidden" accept="image/*" onChange={handleStoryFileSelect} />
                          <div onClick={() => storyInputRef.current?.click()} className="w-16 h-16 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors relative">
                             {currentUser.stories?.[0] ? <img src={currentUser.stories[0]} className="w-full h-full rounded-full object-cover opacity-50" /> : <PlusIcon className="w-6 h-6 text-gray-400" />}
                             <div className="absolute bottom-0 right-0 bg-emerald-500 rounded-full p-0.5"><PlusIcon className="w-3 h-3 text-white" /></div>
                          </div>
                          <span className="text-xs text-gray-400">Your Story</span>
                       </div>
                       {contactsWithStories.map((contact, idx) => (
                          <div key={idx} className="flex flex-col items-center space-y-2 cursor-pointer flex-shrink-0" onClick={() => setViewingStory({user: contact, index: 0})}>
                             <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-yellow-400 via-red-500 to-emerald-500">
                                <img src={contact.avatar} className="w-full h-full rounded-full object-cover border-2 border-[#08080a]" />
                             </div>
                             <span className="text-xs text-gray-300 w-16 truncate text-center">{contact.name.split(' ')[0]}</span>
                          </div>
                       ))}
                    </div>
                 </section>
                 {/* Feed Content */}
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {visibleContacts.map(contact => (
                        <div key={contact.id} onClick={() => setActiveContactId(contact.id)} className="group relative h-80 rounded-3xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1">
                            <img src={contact.avatar} className="absolute inset-0 w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90"></div>
                            <div className="absolute bottom-0 left-0 right-0 p-5">
                                <h3 className="text-xl font-bold text-white">{contact.name}, {contact.age}</h3>
                                <p className="text-gray-300 text-xs mb-2">{contact.location}</p>
                            </div>
                        </div>
                    ))}
                 </div>
              </div>
          ) : (
              // CHAT INTERFACE
              <>
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                     {currentMessages.length === 0 && (
                         <div className="flex flex-col items-center justify-center h-full opacity-50">
                             <CoffeeIcon className="w-12 h-12 text-gray-500 mb-2"/>
                             <p>Start chatting with {activeContact?.name}</p>
                         </div>
                     )}
                     {currentMessages.map((msg, i) => (
                         <ChatMessage 
                            key={i} 
                            message={msg} 
                            userAvatar={currentUser.avatar} 
                            contactAvatar={activeContact?.avatar || ''} 
                            onDelete={() => handleDeleteMessage(msg.id)}
                            onReact={(id, emoji) => console.log('Reacted')}
                            currentUserId={currentUser.id}
                         />
                     ))}
                     <div ref={messagesEndRef} />
                  </div>
                  <div className="p-4 border-t border-white/5 bg-[#08080a]">
                      {selectedImage && <div className="flex items-center mb-4 space-x-3 bg-white/5 p-2 rounded-xl w-fit"><img src={selectedImage.preview} alt="Selected" className="h-16 w-16 object-cover rounded-lg" /><button onClick={() => setSelectedImage(null)}><XIcon className="w-4 h-4 text-gray-400" /></button></div>}
                      <div className="flex items-center gap-2 max-w-4xl mx-auto">
                           <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
                           <button onClick={() => fileInputRef.current?.click()} className="p-3 text-gray-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-xl transition-all"><PaperclipIcon className="w-6 h-6" /></button>
                          
                          <div className={`flex-1 relative rounded-2xl border transition-all flex items-center ${isRecording ? 'border-red-900/50 bg-red-900/10' : 'bg-white/5 border-white/10'}`}>
                              {isRecording ? (
                                  <div className="flex-1 flex items-center justify-between px-4 py-3.5">
                                      <div className="flex items-center space-x-3">
                                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                          <span className="text-white font-mono font-medium">{formatDuration(recordingDuration)}</span>
                                      </div>
                                      <button onClick={cancelRecording}><TrashIcon className="w-5 h-5 text-gray-400 hover:text-red-400" /></button>
                                  </div>
                              ) : (
                                  <>
                                      <textarea 
                                          value={inputText} 
                                          onChange={handleInputChange} 
                                          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} 
                                          placeholder="Message..." 
                                          className="bg-transparent w-full outline-none text-white resize-none h-12 py-3 px-4" 
                                      />
                                      {!inputText && <button onClick={startRecording} className="mr-3 text-gray-500 hover:text-red-400"><MicIcon className="w-5 h-5"/></button>}
                                  </>
                              )}
                          </div>

                          {isRecording ? (
                              <button onClick={stopRecordingAndSend} className="p-3 bg-red-500 rounded-full"><SendIcon className="w-5 h-5 text-white"/></button>
                          ) : (
                              <button onClick={() => handleSendMessage()} disabled={!inputText.trim() && !selectedImage} className="p-3 bg-emerald-600 rounded-full disabled:opacity-50"><SendIcon className="w-5 h-5 text-white"/></button>
                          )}
                      </div>
                  </div>
              </>
          )}
      </main>
    </div>
  );
}