import React, { useState, useRef, useEffect } from 'react';
import { SendIcon, PaperclipIcon, VideoIcon, PhoneIcon, XIcon, MicIcon, CameraIcon, BellIcon, UsersIcon, PlusIcon, MailIcon, EditIcon, MenuIcon, HomeIcon, MessageSquareIcon, UserIcon, InfoIcon, TrashIcon, SquareIcon, CheckIcon, GiftIcon, ShieldIcon } from './components/Icons';
import { ChatMessage } from './components/ChatMessage';
import { LiveCallInterface } from './components/LiveCallInterface';
import { Message, User } from './types';
import { blobToBase64 } from './utils/audioUtils';

// --- Assets & Icons for UI ---
const LogOutIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
);

const HeartIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
);

const CoffeeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
);

const MapPinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
);

const CrownIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>
);

const AlertCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
);

const LockIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
);

// --- Storage Keys ---
const STORAGE_KEY_USERS = 'yene_users_v1';
const STORAGE_KEY_CHATS = 'yene_chats_v1';
const STORAGE_KEY_UNREAD = 'yene_unread_v1';
const STORAGE_KEY_TYPING = 'yene_typing_v1';
const GLOBAL_CHAT_ID = 'global_lounge';
const VIEW_ABOUT = 'view_about';
const VIEW_ADMIN = 'view_admin';

// --- API URL ---
const API_URL = 'http://localhost:5000/api';

// --- Admin Credentials ---
const ADMIN_EMAIL = "mulukengashaw@gmail.com";
const ADMIN_PASS = "mulu.@1994";

// --- Constants ---
const MAX_STORY_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const DAILY_STORY_LIMIT_FREE = 1;
const DAILY_MESSAGE_LIMIT_FREE = 3;

// --- Mock Data (Fallback) ---
const INITIAL_USERS: User[] = [
  // Females
  { 
    id: 'f1', 
    name: 'Sara Yohannes', 
    avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=400&fit=crop&crop=faces&q=80', 
    status: 'online', 
    gender: 'female',
    age: 24,
    location: 'Addis Ababa, Ethiopia',
    bio: 'Student at AAU. I love reading and poetry.',
    music: 'Aster Aweke & Rophnan',
    tradition: 'Buna Ceremony on Sundays',
    voice: 'Kore',
    stories: ['https://images.unsplash.com/photo-1516527506990-2824d5537549?w=600&fit=crop&q=80', 'https://images.unsplash.com/photo-1595123550441-d377e017de6a?w=600&fit=crop&q=80'],
    gifts: ['🌹'],
    isPremium: true,
    messagesCountToday: 0,
    lastMessageDate: new Date().toISOString().split('T')[0]
  },
  { 
    id: 'f2', 
    name: 'Helen Bekele', 
    avatar: 'https://images.unsplash.com/photo-1523824921871-d6f1a15151f1?w=400&h=400&fit=crop&crop=faces&q=80', 
    status: 'busy', 
    gender: 'female',
    age: 27,
    location: 'Silver Spring, MD',
    bio: 'Nurse living in the DMV. Love Tizita music and hiking on weekends.',
    music: 'Tizita & Oldies',
    tradition: 'Genna Holiday',
    voice: 'Zephyr',
    stories: ['https://images.unsplash.com/photo-1605218427368-35b019b84178?w=600&fit=crop&q=80'],
    gifts: [],
    messagesCountToday: 0,
    lastMessageDate: new Date().toISOString().split('T')[0]
  },
  // Males
 
  { 
    id: 'm2', 
    name: 'Abel Tesfaye', 
    avatar: 'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400&h=400&fit=crop&crop=faces&q=80', 
    status: 'online', 
    gender: 'male',
    age: 28,
    location: 'Addis Ababa, Ethiopia',
    bio: 'Architect. Passionate about Ethiopian history and modern design.',
    music: 'Mulatu Astatke',
    tradition: 'Timket',
    voice: 'Charon',
    stories: [],
    gifts: [],
    messagesCountToday: 0,
    lastMessageDate: new Date().toISOString().split('T')[0]
  }
];

export default function App() {
  // State
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [chats, setChats] = useState<Record<string, Message[]>>({});
  const [unreadState, setUnreadState] = useState<Record<string, Record<string, boolean>>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  // Auth State
  const [authStep, setAuthStep] = useState<'auth' | 'profile'>('auth');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  
  // Basic Info
  const [authName, setAuthName] = useState('');
  const [authGender, setAuthGender] = useState<'male' | 'female'>('male');
  const [authAge, setAuthAge] = useState<string>('');
  const [authLocation, setAuthLocation] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  // Profile Completion & Editing Info
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [profileAvatar, setProfileAvatar] = useState<string>('');
  const [profileBio, setProfileBio] = useState('');
  const [profileMusic, setProfileMusic] = useState('');
  const [profileTradition, setProfileTradition] = useState('');
  
  // Profile View Modal
  const [viewingProfile, setViewingProfile] = useState<User | null>(null);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);

  // App State
  const [activeContactId, setActiveContactId] = useState<string>('');
  const [inputText, setInputText] = useState('');
  const [isLiveOpen, setIsLiveOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ base64: string, preview: string } | null>(null);
  
  // Mobile UI State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'home' | 'chats' | 'profile'>('home');

  // Typing Indicator State
  const [isContactTyping, setIsContactTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Story View State
  const [viewingStory, setViewingStory] = useState<{user: User, index: number} | null>(null);
  const [storyError, setStoryError] = useState<string | null>(null);
  const touchStartX = useRef(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const storyInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // --- Helper Functions ---
  
  const fetchUsersFromBackend = async () => {
    try {
      const response = await fetch(`${API_URL}/users`);
      if (response.ok) {
        const users = await response.json();
        setAllUsers(users);
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
        return true;
      }
    } catch (error) {
      console.error('Failed to fetch users from backend:', error);
    }
    return false;
  };

  // --- Initialization: Load from Backend ---
  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true);
      
      // Try to load users from backend
      const backendSuccess = await fetchUsersFromBackend();
      
      if (!backendSuccess) {
        // Fallback to local storage
        const storedUsers = localStorage.getItem(STORAGE_KEY_USERS);
        if (storedUsers) {
          setAllUsers(JSON.parse(storedUsers));
        } else {
          setAllUsers(INITIAL_USERS);
          localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(INITIAL_USERS));
        }
      }

      // Load chats and unread from local storage
      const storedChats = localStorage.getItem(STORAGE_KEY_CHATS);
      const storedUnread = localStorage.getItem(STORAGE_KEY_UNREAD);

      if (storedChats) {
        setChats(JSON.parse(storedChats));
      }

      if (storedUnread) {
        setUnreadState(JSON.parse(storedUnread));
      }
      
      setIsLoading(false);
    };

    initializeApp();
  }, []);

  // Clear errors after 3 seconds
  useEffect(() => {
    if (storyError) {
      const timer = setTimeout(() => setStoryError(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [storyError]);

  // --- Derived State ---
  const visibleContacts = allUsers.filter(user => {
    if (!currentUser) return false;
    if (currentUser.id === 'admin') return true; // Admin sees everyone
    if (user.id === currentUser.id) return false;
    // Opposite gender filter
    return currentUser.gender === 'male' ? user.gender === 'female' : user.gender === 'male';
  });

  // Include contacts with stories
  const contactsWithStories = visibleContacts.filter(u => u.stories && u.stories.length > 0);

  // Determine Active Contact or Global Room
  const isGlobalChat = activeContactId === GLOBAL_CHAT_ID;
  const isAboutPage = activeContactId === VIEW_ABOUT;
  const isAdminPage = activeContactId === VIEW_ADMIN;
  
  const activeContact = allUsers.find(u => u.id === activeContactId);
  const isAdmin = currentUser?.id === 'admin';
  
  // Chat ID Helper
  const getChatIdForContact = (contactId: string) => {
    if (contactId === GLOBAL_CHAT_ID) return GLOBAL_CHAT_ID;
    if (!currentUser) return null;
    return [currentUser.id, contactId].sort().join('_');
  };

  const currentChatId = activeContactId ? getChatIdForContact(activeContactId) : null;
  const currentMessages = currentChatId ? (chats[currentChatId] || []) : [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages, activeContactId, isContactTyping]);

  // Sync Mobile Tab with Active Contact
  useEffect(() => {
      if (activeContactId) {
          setIsMobileMenuOpen(false);
      }
  }, [activeContactId]);

  // --- Typing Indicator Logic (Cross-Tab) ---
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_TYPING) {
        try {
          const data = JSON.parse(e.newValue || '{}');
          if (activeContactId && data[activeContactId] === currentChatId) {
            setIsContactTyping(true);
          } else {
            setIsContactTyping(false);
          }
        } catch (err) {
          console.error("Error parsing typing state", err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [activeContactId, currentChatId]);

  // --- Voice Recording Logic ---
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

  const formatDuration = (sec: number) => {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // --- Core Handlers ---

  const saveUsers = (users: User[]) => {
    setAllUsers(users);
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  };

  const updateUserInList = (updatedUser: User) => {
    const newUsers = allUsers.map(u => u.id === updatedUser.id ? updatedUser : u);
    setAllUsers(newUsers);
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(newUsers));
    if (currentUser?.id === updatedUser.id) {
        setCurrentUser(updatedUser);
    }
  };

  const saveUnreadState = (newState: Record<string, Record<string, boolean>>) => {
      setUnreadState(newState);
      localStorage.setItem(STORAGE_KEY_UNREAD, JSON.stringify(newState));
  };

  // --- Auth Handlers ---

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // --- ADMIN LOGIN CHECK ---
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
        return;
    }

    if (authMode === 'signup') {
        if (authName.trim()) {
            setAuthStep('profile');
        }
    } else {
        // Regular user login via backend
        try {
            const loginResponse = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: authEmail, 
                    password: authPassword 
                })
            });

            if (loginResponse.ok) {
                const user = await loginResponse.json();
                setCurrentUser(user);
                
                // Update local users list
                const userExists = allUsers.find(u => u.id === user.id);
                if (!userExists) {
                    saveUsers([...allUsers, user]);
                }
                
                // Refresh users from backend
                fetchUsersFromBackend();
            } else {
                // Fallback to local storage
                const foundUser = allUsers.find(u => 
                    u.name.toLowerCase().includes(authEmail.split('@')[0].toLowerCase())
                );
                
                if (foundUser) {
                    setCurrentUser(foundUser);
                } else {
                    alert("User not found. Please sign up first.");
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            alert("Login failed. Please check your credentials.");
        }
    }
  };

  const handleProfileComplete = async (e: React.FormEvent) => {
      e.preventDefault();
      
      try {
          const defaultAvatar = authGender === 'male' 
            ? 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&h=400&fit=crop&crop=faces&q=80'
            : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=faces&q=80';

          const userData = {
              email: authEmail,
              password: authPassword,
              name: authName,
              gender: authGender,
              age: parseInt(authAge) || 25,
              location: authLocation || 'Addis Ababa',
              avatar: profileAvatar || defaultAvatar,
              bio: profileBio || `New to Yene Love. ${authLocation ? `From ${authLocation}.` : ''}`,
              music: profileMusic,
              tradition: profileTradition
          };

          const signupResponse = await fetch(`${API_URL}/signup`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(userData)
          });

          if (signupResponse.ok) {
              const newUser = await signupResponse.json();
              
              // Add to local state
              const updatedUsers = [...allUsers, newUser];
              saveUsers(updatedUsers);
              setCurrentUser(newUser);
              setAuthStep('auth');
              
              // Refresh from backend
              fetchUsersFromBackend();
              
              // Clear form
              setProfileAvatar('');
              setProfileBio('');
              setProfileMusic('');
              setProfileTradition('');
              
              alert('Registration successful! Welcome to Yene Love!');
          } else {
              const errorData = await signupResponse.json();
              throw new Error(errorData.error || 'Registration failed');
          }
      } catch (error: any) {
          console.error('Registration error:', error);
          alert(`Registration failed: ${error.message}`);
      }
  };

  // --- Profile Handlers ---
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

    if (!isAdmin) {
        setMobileTab('profile');
        setIsMobileMenuOpen(false);
    }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingProfile) return;

    try {
        const updates = {
            name: authName,
            age: parseInt(authAge) || viewingProfile.age,
            location: authLocation,
            bio: profileBio,
            music: profileMusic,
            tradition: profileTradition,
            avatar: profileAvatar
        };

        const response = await fetch(`${API_URL}/users/${viewingProfile.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });

        if (response.ok) {
            const updatedUser = { ...viewingProfile, ...updates };
            updateUserInList(updatedUser);
            setIsEditProfileOpen(false);
            
            // Refresh from backend
            fetchUsersFromBackend();
        } else {
            alert("Failed to update profile");
        }
    } catch (error) {
        console.error('Update error:', error);
        alert("Error updating profile");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveContactId('');
    setAuthStep('auth');
    setAuthMode('login');
    setIsMobileMenuOpen(false);
  };

  // --- Premium Logic ---
  const openPremiumModal = () => {
    if (!currentUser) return;
    setIsPremiumModalOpen(true);
  };

  const handleConfirmSubscription = () => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, isPremium: true };
    updateUserInList(updatedUser);
    setIsPremiumModalOpen(false);
  };

  // --- Admin Logic ---
  const adminTogglePremium = async (user: User) => {
      try {
          const response = await fetch(`${API_URL}/users/${user.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ isPremium: !user.isPremium })
          });

          if (response.ok) {
              const updatedUser = { ...user, isPremium: !user.isPremium };
              updateUserInList(updatedUser);
              fetchUsersFromBackend();
          }
      } catch (error) {
          console.error('Toggle premium error:', error);
      }
  };

  const adminDeleteUser = async (userId: string) => {
      if (window.confirm("Are you sure you want to delete this user? This cannot be undone.")) {
          try {
              const response = await fetch(`${API_URL}/users/${userId}`, {
                  method: 'DELETE'
              });

              if (response.ok) {
                  const newUsers = allUsers.filter(u => u.id !== userId);
                  saveUsers(newUsers);
                  setViewingProfile(null);
                  fetchUsersFromBackend();
              } else {
                  alert("Failed to delete user.");
              }
          } catch (error) {
              console.error('Delete error:', error);
              alert("Error deleting user");
          }
      }
  };
  
  const adminSendGift = async (gift: string) => {
      if (!viewingProfile) return;
      const updatedUser = {
          ...viewingProfile,
          gifts: [...(viewingProfile.gifts || []), gift]
      };
      updateUserInList(updatedUser);
      setIsGiftModalOpen(false);
      setViewingProfile(null);
  };

  // --- Image/File Handlers ---
  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
          setProfileAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Message Handlers ---
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);

    // Typing indicator
    if (currentChatId && currentUser && !isGlobalChat && !isAboutPage && !isAdminPage) {
      const typingData = JSON.parse(localStorage.getItem(STORAGE_KEY_TYPING) || '{}');
      typingData[currentUser.id] = currentChatId;
      localStorage.setItem(STORAGE_KEY_TYPING, JSON.stringify(typingData));

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = setTimeout(() => {
        const currentData = JSON.parse(localStorage.getItem(STORAGE_KEY_TYPING) || '{}');
        delete currentData[currentUser.id];
        localStorage.setItem(STORAGE_KEY_TYPING, JSON.stringify(currentData));
      }, 1500);
    }
  };

  const handleSendMessage = async (audioBase64?: string) => {
    if ((!inputText.trim() && !selectedImage && !audioBase64) || (!activeContact && !isGlobalChat) || !currentUser || !currentChatId) return;

    // Message limit logic
    if (!isAdmin) {
        const today = new Date().toISOString().split('T')[0];
        let dailyCount = currentUser.messagesCountToday || 0;
        
        if (currentUser.lastMessageDate !== today) {
            dailyCount = 0;
        }

        if (!currentUser.isPremium && dailyCount >= DAILY_MESSAGE_LIMIT_FREE) {
            setStoryError(`Daily message limit reached (${DAILY_MESSAGE_LIMIT_FREE}). Go Premium for unlimited chats!`);
            openPremiumModal();
            return;
        }

        const updatedUser = {
            ...currentUser,
            messagesCountToday: dailyCount + 1,
            lastMessageDate: today
        };
        updateUserInList(updatedUser);
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user', 
      text: audioBase64 ? '🎤 Voice Message' : inputText,
      timestamp: new Date(),
      image: selectedImage?.base64,
      audio: audioBase64,
      senderId: currentUser.id,
      senderName: currentUser.name,
      reactions: []
    };
    
    // Save to backend
    try {
        await fetch(`${API_URL}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: currentChatId,
                sender_id: currentUser.id,
                text: newMessage.text,
                image: newMessage.image,
                audio: newMessage.audio
            })
        });
    } catch (error) {
        console.error('Failed to save message to backend:', error);
    }

    // Update local state
    const updatedChats = {
        ...chats,
        [currentChatId]: [...(chats[currentChatId] || []), newMessage]
    };
    setChats(updatedChats);
    localStorage.setItem(STORAGE_KEY_CHATS, JSON.stringify(updatedChats));

    // Mark as unread for recipient
    if (!isGlobalChat && activeContactId && !isAdmin) {
        const recipientId = activeContactId;
        const recipientUnread = unreadState[recipientId] || {};
        
        const newUnreadState = {
            ...unreadState,
            [recipientId]: {
                ...recipientUnread,
                [currentChatId]: true
            }
        };
        saveUnreadState(newUnreadState);
    }

    // Clear typing status
    const typingData = JSON.parse(localStorage.getItem(STORAGE_KEY_TYPING) || '{}');
    delete typingData[currentUser.id];
    localStorage.setItem(STORAGE_KEY_TYPING, JSON.stringify(typingData));

    setInputText('');
    setSelectedImage(null);
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!currentChatId || !chats[currentChatId]) return;

    const updatedMessages = chats[currentChatId].filter(msg => msg.id !== messageId);
    
    const updatedChats = {
        ...chats,
        [currentChatId]: updatedMessages
    };

    setChats(updatedChats);
    localStorage.setItem(STORAGE_KEY_CHATS, JSON.stringify(updatedChats));
  };

  const handleMessageReaction = (messageId: string, emoji: string) => {
      if (!currentChatId || !chats[currentChatId] || !currentUser) return;

      const updatedMessages = chats[currentChatId].map(msg => {
          if (msg.id !== messageId) return msg;

          const reactions = msg.reactions || [];
          const existingReactionIndex = reactions.findIndex(r => r.userId === currentUser.id && r.emoji === emoji);

          let newReactions;
          if (existingReactionIndex >= 0) {
              newReactions = [...reactions];
              newReactions.splice(existingReactionIndex, 1);
          } else {
              newReactions = [...reactions, { emoji, userId: currentUser.id }];
          }

          return { ...msg, reactions: newReactions };
      });

      const updatedChats = {
          ...chats,
          [currentChatId]: updatedMessages
      };

      setChats(updatedChats);
      localStorage.setItem(STORAGE_KEY_CHATS, JSON.stringify(updatedChats));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const base64 = await blobToBase64(file);
        setSelectedImage({
          base64,
          preview: URL.createObjectURL(file)
        });
      } catch (err) {
        console.error("Error reading file", err);
      }
    }
  };

  // --- Story Upload Logic ---
  const handleStoryFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setStoryError(null);
    if (!currentUser) return;
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (file.size > MAX_STORY_SIZE_BYTES) {
        setStoryError(`File too large. Maximum size is ${MAX_STORY_SIZE_BYTES / (1024 * 1024)}MB.`);
        return;
      }

      if (!isAdmin) {
          const today = new Date().toISOString().split('T')[0];
          let currentCount = currentUser.storiesCountToday || 0;

          if (currentUser.lastStoryDate !== today) {
            currentCount = 0;
          }

          if (!currentUser.isPremium && currentCount >= DAILY_STORY_LIMIT_FREE) {
            setStoryError(`Free limit reached (1 story/day). Upgrade to Premium for more!`);
            openPremiumModal();
            return;
          }
      }

      try {
        const base64 = await blobToBase64(file);
        const storyUrl = `data:${file.type};base64,${base64}`;
        
        const today = new Date().toISOString().split('T')[0];
        const updatedUser = {
          ...currentUser,
          stories: [storyUrl, ...(currentUser.stories || [])],
          storiesCountToday: (currentUser.storiesCountToday || 0) + 1,
          lastStoryDate: today
        };
        
        updateUserInList(updatedUser);
        
      } catch (err) {
        console.error("Error upload story", err);
        setStoryError("Failed to upload story.");
      }
    }
    if (storyInputRef.current) storyInputRef.current.value = '';
  };

  // --- Story Navigation Logic ---
  const goToNextStory = () => {
    if (!viewingStory) return;
    const { user, index } = viewingStory;

    if (user.stories && index < user.stories.length - 1) {
       setViewingStory({ user, index: index + 1 });
       return;
    }

    const currentContactIndex = contactsWithStories.findIndex(u => u.id === user.id);
    if (currentContactIndex !== -1 && currentContactIndex < contactsWithStories.length - 1) {
       setViewingStory({ user: contactsWithStories[currentContactIndex + 1], index: 0 });
    } else {
       setViewingStory(null);
    }
  };

  const goToPrevStory = () => {
    if (!viewingStory) return;
    const { user, index } = viewingStory;

    if (index > 0) {
       setViewingStory({ user, index: index - 1 });
       return;
    }

    const currentContactIndex = contactsWithStories.findIndex(u => u.id === user.id);
    if (currentContactIndex > 0) {
       const prevUser = contactsWithStories[currentContactIndex - 1];
       setViewingStory({ user: prevUser, index: (prevUser.stories?.length || 1) - 1 });
    } else {
       setViewingStory(null);
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
  };
  
  const onTouchEnd = (e: React.TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX.current - touchEndX;
      
      if (Math.abs(diff) > 50) {
          if (diff > 0) {
              goToNextStory();
          } else {
              goToPrevStory();
          }
      }
  };

  // --- Render Modals ---
  
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
                       {/* Avatar */}
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
                               <div className="text-center mb-4"><h3 className="text-xl font-bold text-white">Edit Profile {isAdmin && "(Admin Mode)"}</h3></div>
                               <div><label className="text-xs text-gray-400 uppercase font-semibold">Name</label><input type="text" value={authName} onChange={e => setAuthName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:ring-1 focus:ring-emerald-500" required/></div>
                               <div className="grid grid-cols-2 gap-3">
                                   <div><label className="text-xs text-gray-400 uppercase font-semibold">Age</label><input type="number" value={authAge} onChange={e => setAuthAge(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:ring-1 focus:ring-emerald-500" required/></div>
                                   <div><label className="text-xs text-gray-400 uppercase font-semibold">City</label><input type="text" value={authLocation} onChange={e => setAuthLocation(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:ring-1 focus:ring-emerald-500" required/></div>
                               </div>
                               <div><label className="text-xs text-gray-400 uppercase font-semibold">Bio</label><textarea value={profileBio} onChange={e => setProfileBio(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:ring-1 focus:ring-emerald-500 h-20" required/></div>
                               <div className="grid grid-cols-2 gap-3">
                                   <div><label className="text-xs text-gray-400 uppercase font-semibold">Music</label><input type="text" value={profileMusic} onChange={e => setProfileMusic(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:ring-1 focus:ring-emerald-500"/></div>
                                   <div><label className="text-xs text-gray-400 uppercase font-semibold">Tradition</label><input type="text" value={profileTradition} onChange={e => setProfileTradition(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:ring-1 focus:ring-emerald-500"/></div>
                               </div>
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
                                   
                                   {(targetUser.gifts && targetUser.gifts.length > 0) && (
                                       <div className="flex justify-center flex-wrap gap-1 mt-2">
                                           {targetUser.gifts.map((g, i) => (
                                               <span key={i} className="text-xl animate-pulse" title="Gift">{g}</span>
                                           ))}
                                       </div>
                                   )}
                               </div>
                               <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-sm text-gray-200 leading-relaxed">
                                   "{targetUser.bio}"
                               </div>
                               <div className="grid grid-cols-2 gap-4 text-left">
                                   <div className="bg-white/5 p-3 rounded-xl">
                                       <span className="text-[10px] text-gray-500 uppercase tracking-wide block mb-1">Favorite Music</span>
                                       <p className="text-sm font-medium text-white">{targetUser.music || 'Not specified'}</p>
                                   </div>
                                   <div className="bg-white/5 p-3 rounded-xl">
                                       <span className="text-[10px] text-gray-500 uppercase tracking-wide block mb-1">Tradition</span>
                                       <p className="text-sm font-medium text-white">{targetUser.tradition || 'Not specified'}</p>
                                   </div>
                               </div>
                               
                               {isAdmin && (
                                   <div className="grid grid-cols-3 gap-2 mt-4">
                                       <button onClick={() => openEditProfile(targetUser)} className="bg-blue-600/20 text-blue-400 py-2 rounded-xl text-xs font-bold hover:bg-blue-600/30">Edit User</button>
                                       <button onClick={() => adminTogglePremium(targetUser)} className={`py-2 rounded-xl text-xs font-bold ${targetUser.isPremium ? 'bg-red-600/20 text-red-400' : 'bg-yellow-600/20 text-yellow-400'} hover:opacity-80`}>
                                           {targetUser.isPremium ? 'Remove Premium' : 'Grant Premium'}
                                       </button>
                                       <button onClick={() => setIsGiftModalOpen(true)} className="bg-pink-600/20 text-pink-400 py-2 rounded-xl text-xs font-bold hover:bg-pink-600/30">Send Gift</button>
                                   </div>
                               )}
                               
                               <button onClick={() => { setIsEditProfileOpen(false); setViewingProfile(null); }} className="w-full bg-white/10 text-white font-semibold py-3 rounded-xl hover:bg-white/20 transition-colors mt-2">Close</button>
                               {isAdmin && (
                                   <button onClick={() => adminDeleteUser(targetUser.id)} className="w-full text-red-500 text-xs py-2 hover:underline">Delete User</button>
                               )}
                           </div>
                       )}
                  </div>
              </div>
          </div>
      );
  };

  const renderGiftModal = () => {
      if (!isGiftModalOpen || !viewingProfile) return null;
      const gifts = ['🎁', '🌹', '💎', '☕', '🧁', '👑', '🕊️', '🦄'];
      
      return (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
              <div className="bg-[#1c1c1e] p-6 rounded-2xl border border-white/10 text-center w-80">
                  <h3 className="text-xl font-bold text-white mb-4">Send a Gift</h3>
                  <div className="grid grid-cols-4 gap-4 mb-6">
                      {gifts.map(gift => (
                          <button key={gift} onClick={() => adminSendGift(gift)} className="text-3xl hover:scale-125 transition-transform p-2 bg-white/5 rounded-lg">
                              {gift}
                          </button>
                      ))}
                  </div>
                  <button onClick={() => setIsGiftModalOpen(false)} className="text-gray-400 text-sm hover:text-white">Cancel</button>
              </div>
          </div>
      );
  };

  const renderPremiumModal = () => {
    if (!isPremiumModalOpen) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
            <div className="relative w-full max-w-md bg-gradient-to-br from-gray-900 to-black rounded-3xl p-1 border border-yellow-500/30 shadow-[0_0_50px_rgba(234,179,8,0.2)]">
                <div className="bg-[#1c1c1e] rounded-[22px] p-6 md:p-8 flex flex-col items-center text-center overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-yellow-500/10 to-transparent"></div>
                    <button onClick={() => setIsPremiumModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><XIcon className="w-6 h-6"/></button>
                    
                    <div className="w-20 h-20 bg-gradient-to-tr from-yellow-300 to-yellow-600 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-yellow-500/20 z-10">
                        <CrownIcon className="w-10 h-10 text-black fill-current" />
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2 z-10">Upgrade to Premium</h2>
                    <p className="text-gray-400 text-sm mb-8 z-10">Unlock the full Yene Love experience.</p>

                    <div className="w-full space-y-4 mb-8 z-10">
                        <div className="flex items-center space-x-3 text-left">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center"><CheckIcon className="w-4 h-4 text-yellow-400" /></div>
                            <span className="text-gray-200 text-sm">Unlimited Daily Messages</span>
                        </div>
                        <div className="flex items-center space-x-3 text-left">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center"><CheckIcon className="w-4 h-4 text-yellow-400" /></div>
                            <span className="text-gray-200 text-sm">Unlimited Story Uploads</span>
                        </div>
                        <div className="flex items-center space-x-3 text-left">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center"><CheckIcon className="w-4 h-4 text-yellow-400" /></div>
                            <span className="text-gray-200 text-sm">Gold Profile Badge</span>
                        </div>
                        <div className="flex items-center space-x-3 text-left">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center"><CheckIcon className="w-4 h-4 text-yellow-400" /></div>
                            <span className="text-gray-200 text-sm">Priority in Search</span>
                        </div>
                    </div>

                    <button 
                        onClick={handleConfirmSubscription}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold text-lg shadow-lg shadow-yellow-500/20 transition-all transform hover:scale-[1.02]"
                    >
                        Unlock Now • 299 ETB
                    </button>
                    <p className="text-xs text-gray-500 mt-4">One-time payment for lifetime access (Beta).</p>
                </div>
            </div>
        </div>
    );
  };

  const renderStoryViewer = () => {
    if (!viewingStory) return null;
    const { user, index } = viewingStory;
    const storyImg = user.stories?.[index];

    return (
      <div 
        className="fixed inset-0 z-[70] bg-black flex flex-col items-center justify-center animate-fade-in touch-none"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
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
                  <span className="text-white text-sm font-semibold drop-shadow-md flex items-center gap-1">
                    {user.name}
                    {user.isPremium && <CrownIcon className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
                  </span>
                  <span className="text-gray-200 text-xs drop-shadow-md">Story</span>
                </div>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); setViewingStory(null); }} 
              className="p-2 bg-black/20 hover:bg-black/40 rounded-full backdrop-blur-md transition-colors"
            >
                <XIcon className="text-white w-6 h-6" />
            </button>
        </div>

        <img src={storyImg} alt="Story" className="max-h-full max-w-full object-contain pointer-events-none select-none" />

        <div className="absolute inset-y-0 left-0 w-1/3 z-20" onClick={(e) => { e.stopPropagation(); goToPrevStory(); }}></div>
        <div className="absolute inset-y-0 right-0 w-1/3 z-20" onClick={(e) => { e.stopPropagation(); goToNextStory(); }}></div>
      </div>
    );
  };
  
  // --- ADMIN DASHBOARD RENDERER ---
  const renderAdminDashboard = () => (
      <div className="flex-1 overflow-y-auto p-4 md:p-10 relative z-10 custom-scrollbar animate-fade-in">
          <header className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <ShieldIcon className="w-8 h-8 text-blue-500" />
                  Admin Control Panel
              </h1>
              <div className="bg-blue-900/30 px-4 py-2 rounded-full border border-blue-500/30 text-blue-300 text-sm font-mono">
                  Superuser Mode
              </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {allUsers.filter(u => u.id !== 'admin').map(user => (
                  <div key={user.id} className="bg-white/5 border border-white/5 rounded-2xl p-5 hover:border-white/20 transition-all group">
                      <div className="flex items-center space-x-4 mb-4">
                          <img src={user.avatar} alt={user.name} className="w-14 h-14 rounded-full object-cover border-2 border-white/10" />
                          <div>
                              <h3 className="text-white font-bold flex items-center gap-2">
                                  {user.name}
                                  {user.isPremium && <CrownIcon className="w-4 h-4 text-yellow-400" />}
                              </h3>
                              <p className="text-gray-400 text-xs">{user.gender} • {user.age} • {user.location}</p>
                          </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-4 bg-black/20 p-2 rounded-lg">
                          <span>Msgs: {user.messagesCountToday || 0}</span>
                          <span>Stories: {user.storiesCountToday || 0}</span>
                          <span>Gifts: {user.gifts?.length || 0}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                          <button onClick={() => { setViewingProfile(user); setIsEditProfileOpen(true); }} className="bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg text-xs font-semibold">
                              Edit Profile
                          </button>
                          <button onClick={() => adminTogglePremium(user)} className={`py-2 rounded-lg text-xs font-semibold ${user.isPremium ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30' : 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30'}`}>
                              {user.isPremium ? 'Revoke VIP' : 'Grant VIP'}
                          </button>
                          <button onClick={() => { setViewingProfile(user); setIsGiftModalOpen(true); }} className="col-span-2 bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 text-pink-300 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border border-pink-500/20">
                              <GiftIcon className="w-3 h-3" /> Send Gift
                          </button>
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );

  const renderAboutPage = () => (
    <div className="flex-1 overflow-y-auto p-4 md:p-10 relative z-10 custom-scrollbar animate-fade-in">
        <div className="max-w-3xl mx-auto text-center space-y-8">
             <div className="w-24 h-24 mx-auto bg-gradient-to-tr from-green-500 via-yellow-400 to-red-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-yellow-500/20 rotate-3">
                <HeartIcon className="w-12 h-12 text-white fill-current" />
             </div>
             
             <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">About <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-yellow-400 to-red-400">Yene Love</span></h1>
                <p className="text-xl text-gray-300 font-light">Connecting Hearts. Celebrating Culture.</p>
             </div>
             
             <div className="pt-10 pb-20">
                 <p className="text-gray-500 text-sm">© 2024 Yene Love Inc. Made with ❤️ for Habesha.</p>
                 <p className="text-gray-600 text-xs mt-2">Version 1.2.0 (Beta)</p>
             </div>
        </div>
    </div>
  );

  // --- Check Message Limits helper for UI rendering ---
  const isMessageLimitReached = () => {
      if (!currentUser || currentUser.isPremium || isAdmin) return false;
      const today = new Date().toISOString().split('T')[0];
      if (currentUser.lastMessageDate !== today) return false;
      return (currentUser.messagesCountToday || 0) >= DAILY_MESSAGE_LIMIT_FREE;
  };
  const limitReached = isMessageLimitReached();

  // --- AUTH & PROFILE SCREENS ---
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050505] text-white p-4 relative overflow-hidden font-sans">
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-emerald-900/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-amber-900/20 rounded-full blur-[120px] animate-pulse" style={{animationDelay: '1s'}}></div>
        
        <div className="w-full max-w-5xl bg-black/40 backdrop-blur-2xl border border-white/5 rounded-3xl shadow-2xl flex overflow-hidden relative z-10 flex-col md:flex-row min-h-[600px]">
           <div className="hidden md:flex md:w-5/12 relative flex-col justify-between p-12 bg-gradient-to-br from-green-900/40 via-yellow-900/20 to-red-900/40">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1976&auto=format&fit=crop')] opacity-20 bg-cover bg-center mix-blend-overlay"></div>
              <div className="relative z-10">
                 <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/10 mb-6">
                   <HeartIcon className="w-6 h-6 text-red-500 fill-current" />
                 </div>
                 <h1 className="text-4xl font-bold mb-4 leading-tight">Find Your <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-yellow-400 to-red-400">Habesha Love</span></h1>
                 <p className="text-gray-400 text-sm max-w-sm">Join the #1 dating community for Ethiopians worldwide.</p>
              </div>
           </div>

           <div className="w-full md:w-7/12 p-8 md:p-12 flex flex-col justify-center bg-black/20">
              <div className="max-w-md mx-auto w-full">
                 {authStep === 'auth' && (
                   <>
                     <h2 className="text-2xl font-bold mb-6 text-center">Selam! Welcome.</h2>
                     <div className="flex space-x-6 mb-8 border-b border-white/10">
                        <button onClick={() => setAuthMode('login')} className={`pb-4 text-sm font-semibold tracking-wide transition-all ${authMode === 'login' ? 'text-white border-b-2 border-emerald-500' : 'text-gray-500 hover:text-gray-300'}`}>LOG IN</button>
                        <button onClick={() => setAuthMode('signup')} className={`pb-4 text-sm font-semibold tracking-wide transition-all ${authMode === 'signup' ? 'text-white border-b-2 border-emerald-500' : 'text-gray-500 hover:text-gray-300'}`}>SIGN UP</button>
                     </div>

                     <form onSubmit={handleAuth} className="space-y-4">
                        {authMode === 'signup' && (
                           <div className="space-y-4 animate-fade-in-up">
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Full Name</label>
                                <input type="text" value={authName} onChange={(e) => setAuthName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-2 focus:ring-emerald-500/50 outline-none" placeholder="Sara / Dawit" required />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div><label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Age</label><input type="number" value={authAge} onChange={(e) => setAuthAge(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none" placeholder="24" required /></div>
                                  <div><label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">City</label><input type="text" value={authLocation} onChange={(e) => setAuthLocation(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none" placeholder="Addis Ababa" required /></div>
                              </div>
                              <div>
                                 <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">I am a</label>
                                 <div className="grid grid-cols-2 gap-4">
                                    <button type="button" onClick={() => setAuthGender('male')} className={`py-3 rounded-xl border font-medium text-sm ${authGender === 'male' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-white/5 border-white/10 text-gray-400'}`}>Male</button>
                                    <button type="button" onClick={() => setAuthGender('female')} className={`py-3 rounded-xl border font-medium text-sm ${authGender === 'female' ? 'bg-amber-600 border-amber-500 text-white' : 'bg-white/5 border-white/10 text-gray-400'}`}>Female</button>
                                 </div>
                              </div>
                           </div>
                        )}
                        <div className="space-y-4">
                           <div><label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Email Address</label><input type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none" placeholder="name@example.com" required={authMode === 'login'} /></div>
                           <div><label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Password</label><input type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none" placeholder="••••••••" required /></div>
                        </div>
                        <button type="submit" className="w-full bg-gradient-to-r from-emerald-600 via-amber-500 to-red-600 text-white font-bold py-4 rounded-xl shadow-lg mt-6">{authMode === 'signup' ? 'Continue' : 'Sign In'}</button>
                     </form>
                   </>
                 )}
                 {authStep === 'profile' && (
                    <div className="animate-fade-in-right">
                       <h2 className="text-2xl font-bold mb-2 text-center">Complete Your Profile</h2>
                       <form onSubmit={handleProfileComplete} className="space-y-5">
                          <div className="flex justify-center mb-6">
                             <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                                <div className="w-24 h-24 rounded-full overflow-hidden bg-white/10 border-2 border-dashed border-white/30 flex items-center justify-center">
                                   {profileAvatar ? <img src={profileAvatar} alt="Profile" className="w-full h-full object-cover" /> : <CameraIcon className="w-8 h-8 text-gray-500" />}
                                </div>
                                <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarSelect}/>
                             </div>
                          </div>
                          <div><label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Bio</label><textarea value={profileBio} onChange={(e) => setProfileBio(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none h-20" placeholder="I love traveling..." required /></div>
                          <div className="grid grid-cols-2 gap-4">
                              <div><label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Favorite Music</label><input type="text" value={profileMusic} onChange={(e) => setProfileMusic(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none" placeholder="e.g. Teddy Afro" /></div>
                              <div><label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Favorite Tradition</label><input type="text" value={profileTradition} onChange={(e) => setProfileTradition(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none" placeholder="e.g. Coffee Ceremony" /></div>
                          </div>
                          <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg mt-4">Find My Match</button>
                       </form>
                    </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    );
  }

  // --- MAIN APP ---
  return (
    <div className="flex h-screen bg-[#08080a] text-gray-100 overflow-hidden font-sans selection:bg-emerald-500/30 relative">
      {/* Toast Notification for Errors */}
      {storyError && (
        <div className="fixed top-20 md:top-6 left-1/2 transform -translate-x-1/2 z-[70] bg-red-500/90 text-white px-6 py-3 rounded-full shadow-2xl backdrop-blur-md flex items-center space-x-2 animate-bounce">
            <AlertCircleIcon className="w-5 h-5" />
            <span className="font-medium text-sm">{storyError}</span>
        </div>
      )}

      {(isEditProfileOpen || viewingProfile) && renderProfileModal()}
      {viewingStory && renderStoryViewer()}
      {isPremiumModalOpen && renderPremiumModal()}
      {isGiftModalOpen && renderGiftModal()}
      
      {activeContact && !isGlobalChat && !isAboutPage && !isAdminPage && (
        <LiveCallInterface 
          isOpen={isLiveOpen} 
          onClose={() => setIsLiveOpen(false)} 
          contactName={activeContact.name}
          contactBio={`Age: ${activeContact.age}. Location: ${activeContact.location}. ${activeContact.bio || ''}`}
          voiceName={activeContact.voice}
        />
      )}

      {/* MOBILE HEADER (Visible only on small screens) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0c0c0e]/95 backdrop-blur-md border-b border-white/5 z-30 flex items-center justify-between px-4">
         <div className="flex items-center space-x-2">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-300">
               <MenuIcon className="w-6 h-6" />
            </button>
            <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-yellow-400 to-red-400">Yene Love</span>
         </div>
         <div className="relative p-2">
            <BellIcon className="w-6 h-6 text-gray-300" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
         </div>
      </div>

      {/* SIDEBAR / MOBILE DRAWER */}
      <aside className={`
          fixed inset-y-0 left-0 z-40 w-80 bg-[#0c0c0e] border-r border-white/5 flex flex-col transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0
          ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        {/* Desktop Sidebar Header */}
        <div className="hidden md:flex p-6 border-b border-white/5 justify-between items-center bg-gradient-to-r from-emerald-900/10 to-transparent">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveContactId('')}>
             <div className="w-8 h-8 bg-gradient-to-tr from-green-500 via-yellow-400 to-red-500 rounded-lg flex items-center justify-center shadow-lg shadow-yellow-500/20">
                <HeartIcon className="w-5 h-5 text-white fill-current" />
             </div>
             <h1 className="text-xl font-bold tracking-tight text-white">Yene Love</h1>
          </div>
        </div>
        
        {/* Mobile Sidebar Close Button */}
        <div className="md:hidden p-4 flex justify-end">
           <button onClick={() => setIsMobileMenuOpen(false)}><XIcon className="w-6 h-6 text-gray-400"/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
          {/* Admin Dashboard Entry (Only for Admin) */}
          {isAdmin && (
              <div 
                onClick={() => { setActiveContactId(VIEW_ADMIN); setIsMobileMenuOpen(false); }}
                className={`flex items-center p-3 rounded-xl cursor-pointer transition-all border border-transparent group mb-4 ${activeContactId === VIEW_ADMIN ? 'bg-white/10 border-white/5 shadow-md' : 'hover:bg-white/5'}`}
              >
                 <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center ring-2 ring-black/50">
                    <ShieldIcon className="w-6 h-6 text-white" />
                 </div>
                 <div className="ml-3.5 flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">Admin Dashboard</p>
                    <p className="text-xs text-blue-300">Manage Users</p>
                 </div>
              </div>
          )}

          {/* Global Chat Entry */}
          {!isAdmin && (
              <div 
                onClick={() => { setActiveContactId(GLOBAL_CHAT_ID); setIsMobileMenuOpen(false); }}
                className={`flex items-center p-3 rounded-xl cursor-pointer transition-all border border-transparent group mb-4 ${activeContactId === GLOBAL_CHAT_ID ? 'bg-white/10 border-white/5 shadow-md' : 'hover:bg-white/5'}`}
              >
                 <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center ring-2 ring-black/50">
                    <UsersIcon className="w-6 h-6 text-white" />
                 </div>
                 <div className="ml-3.5 flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">Habesha Lounge</p>
                    <p className="text-xs text-indigo-300">Global Community Chat</p>
                 </div>
              </div>
          )}

          {!isAdmin && <h2 className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-3 px-3 mt-2">Private Matches</h2>}
          
          {visibleContacts.length === 0 ? (
             <div className="px-4 py-8 text-center text-gray-600 text-sm">No matches found yet.</div>
          ) : (
            visibleContacts.map(contact => {
               const chatId = getChatIdForContact(contact.id);
               const isUnread = chatId && unreadState[currentUser.id]?.[chatId];

               return (
                <div key={contact.id} onClick={() => { setActiveContactId(contact.id); setIsMobileMenuOpen(false); }} className={`flex items-center p-3 rounded-xl cursor-pointer transition-all border border-transparent group relative ${activeContactId === contact.id ? 'bg-white/10 border-white/5 shadow-md' : 'hover:bg-white/5'}`}>
                    <div className="relative">
                        <img src={contact.avatar} alt={contact.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-black/50" />
                        <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-[#0c0c0e] rounded-full ${contact.status === 'online' ? 'bg-emerald-500' : 'bg-gray-500'}`}></span>
                        {contact.isPremium && <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-0.5 border border-black"><CrownIcon className="w-2.5 h-2.5 text-black" /></div>}
                    </div>
                    <div className="ml-3.5 flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                            <p className={`text-sm truncate ${isUnread ? 'font-bold text-white' : (activeContactId === contact.id ? 'font-semibold text-white' : 'font-medium text-gray-300 group-hover:text-white')}`}>
                                {contact.name}
                            </p>
                            {isUnread && <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>}
                        </div>
                        <p className={`text-xs truncate mt-0.5 ${isUnread ? 'text-gray-200 font-medium' : 'text-gray-500'}`}>
                           {isUnread ? 'New message' : contact.location}
                        </p>
                    </div>

                    {/* Mark Unread Action Button (Hidden for Admin) */}
                    {!isAdmin && (
                        <button 
                            onClick={(e) => toggleUnread(chatId!, e)}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-[#1c1c1e] text-gray-400 hover:text-white hover:bg-emerald-600 transition-all opacity-0 group-hover:opacity-100 shadow-lg z-10`}
                            title={isUnread ? "Mark as read" : "Mark as unread"}
                        >
                            <MailIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>
               );
            })
          )}

          {/* About Yene Love Button */}
          {!isAdmin && (
              <div className="mt-6 pt-4 border-t border-white/5 px-2">
                  <button 
                    onClick={() => { setActiveContactId(VIEW_ABOUT); setIsMobileMenuOpen(false); }}
                    className={`w-full text-left flex items-center space-x-3 px-3 py-3 rounded-xl transition-all ${activeContactId === VIEW_ABOUT ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                  >
                      <InfoIcon className="w-5 h-5" />
                      <span className="font-medium text-sm">About Yene Love</span>
                  </button>
              </div>
          )}
        </div>

        <div className="p-4 border-t border-white/5 bg-black/20 mb-16 md:mb-0">
            {!currentUser.isPremium && !isAdmin && (
              <button 
                onClick={openPremiumModal}
                className="w-full mb-3 py-2 px-3 bg-gradient-to-r from-yellow-600/20 to-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-center justify-center space-x-2 text-yellow-400 hover:bg-yellow-500/20 transition-all group"
              >
                <CrownIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold uppercase tracking-wide">Go Premium</span>
              </button>
            )}

            <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center space-x-3">
                    <div className="relative cursor-pointer" onClick={() => openEditProfile()}>
                       <img src={currentUser.avatar} alt="Me" className="w-8 h-8 rounded-full object-cover" />
                       {currentUser.isPremium && <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-[1px]"><CrownIcon className="w-2 h-2 text-black" /></div>}
                    </div>
                    <div className="flex flex-col"><span className="text-sm font-medium text-white">{currentUser.name}</span><span className="text-[10px] text-gray-500 uppercase">{currentUser.location}</span></div>
                </div>
                <div className="flex space-x-1">
                  <button onClick={() => openEditProfile()} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-emerald-400"><EditIcon className="w-4 h-4" /></button>
                  <button onClick={handleLogout} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-red-400"><LogOutIcon className="w-4 h-4" /></button>
                </div>
            </div>
        </div>
      </aside>

      {/* OVERLAY FOR MOBILE MENU */}
      {isMobileMenuOpen && (
         <div className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col bg-[#08080a] relative pt-16 md:pt-0 pb-16 md:pb-0 h-full`}>
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-emerald-900/10 to-transparent pointer-events-none"></div>

        {isAdminPage ? (
            renderAdminDashboard()
        ) : isAboutPage ? (
            renderAboutPage()
        ) : !activeContactId ? (
            // --- HOME PAGE (Discovery & Feed) ---
             <div className="flex-1 overflow-y-auto p-4 md:p-10 relative z-10 custom-scrollbar">
                 <header className="hidden md:flex justify-between items-center mb-10">
                    <div>
                       <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                         Selam, {currentUser.name}! 
                         {currentUser.isPremium && <CrownIcon className="w-6 h-6 text-yellow-400" />}
                       </h2>
                       <p className="text-gray-400 text-sm mt-1">Ready to find your konejo match today?</p>
                    </div>
                    <div className="flex items-center space-x-4">
                       <button className="p-3 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-white relative">
                          <BellIcon className="w-5 h-5" />
                          <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full"></span>
                       </button>
                    </div>
                 </header>

                 {/* Stories Section */}
                 <section className="mb-12">
                    <div className="flex justify-between items-center mb-4">
                       <h3 className="text-lg font-bold text-white">Stories</h3>
                       <div className="text-xs text-gray-500">
                         {currentUser.isPremium ? (
                           <span className="text-yellow-400 font-medium">Unlimited Uploads</span>
                         ) : (
                           <span>Free Limit: {currentUser.storiesCountToday || 0}/{DAILY_STORY_LIMIT_FREE} today</span>
                         )}
                       </div>
                    </div>
                    <div className="flex space-x-4 overflow-x-auto pb-4 custom-scrollbar">
                       {/* My Story Add */}
                       <div className="flex flex-col items-center space-y-2 cursor-pointer flex-shrink-0">
                          <input type="file" ref={storyInputRef} className="hidden" accept="image/*" onChange={handleStoryFileSelect} />
                          <div 
                            onClick={() => storyInputRef.current?.click()} 
                            className="w-16 h-16 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors relative"
                          >
                             {currentUser.stories?.[0] ? (
                               <img src={currentUser.stories[0]} alt="My Story" className="w-full h-full rounded-full object-cover opacity-50" />
                             ) : (
                               <PlusIcon className="w-6 h-6 text-gray-400" />
                             )}
                             <div className="absolute bottom-0 right-0 bg-emerald-500 rounded-full p-0.5 border-2 border-[#08080a]">
                                <PlusIcon className="w-3 h-3 text-white" />
                             </div>
                          </div>
                          <span className="text-xs text-gray-400">Your Story</span>
                       </div>
                       
                       {/* Other Stories */}
                       {contactsWithStories.map((contact, idx) => (
                          <div key={idx} className="flex flex-col items-center space-y-2 cursor-pointer flex-shrink-0" onClick={() => setViewingStory({user: contact, index: 0})}>
                             <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-yellow-400 via-red-500 to-emerald-500">
                                <img src={contact.avatar} alt={contact.name} className="w-full h-full rounded-full object-cover border-2 border-[#08080a]" />
                             </div>
                             <span className="text-xs text-gray-300 w-16 truncate text-center">{contact.name.split(' ')[0]}</span>
                          </div>
                       ))}
                    </div>
                 </section>

                 {/* Hero/Featured Section */}
                 <section className="mb-12 relative rounded-3xl overflow-hidden h-64 md:h-80 shadow-2xl group cursor-pointer">
                    <img src="https://images.unsplash.com/photo-1529325973309-d575e966e6c5?w=1200&fit=crop&q=80" alt="Featured" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 p-8">
                       <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full uppercase tracking-wide mb-3 inline-block">Featured Event</span>
                       <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">Addis Ababa Art & Coffee Night</h3>
                       <p className="text-gray-300 max-w-lg mb-6">Join over 500 Habeshas this Friday for an evening of poetry, jazz, and traditional Buna. Connect with your culture.</p>
                       <button className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors">RSVP Now</button>
                    </div>
                 </section>

                 <div className="mb-6 flex space-x-2 overflow-x-auto pb-2">
                    <button className="px-5 py-2 rounded-full bg-white text-black font-medium text-sm whitespace-nowrap">For You</button>
                    <button className="px-5 py-2 rounded-full bg-white/5 border border-white/10 text-gray-300 hover:text-white font-medium text-sm whitespace-nowrap">Online Now</button>
                    <button className="px-5 py-2 rounded-full bg-white/5 border border-white/10 text-gray-300 hover:text-white font-medium text-sm whitespace-nowrap">New Members</button>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <div onClick={() => setActiveContactId(GLOBAL_CHAT_ID)} className="group relative h-80 rounded-3xl overflow-hidden cursor-pointer shadow-lg bg-gradient-to-br from-indigo-900 to-purple-900 border border-white/10 hover:-translate-y-1 transition-all">
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                           <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4 backdrop-blur-md">
                              <UsersIcon className="w-8 h-8 text-white" />
                           </div>
                           <h3 className="text-xl font-bold text-white mb-1">Habesha Lounge</h3>
                           <p className="text-indigo-200 text-sm mb-4">Join the global conversation.</p>
                           <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm font-medium backdrop-blur-md transition-colors">Enter Room</button>
                        </div>
                    </div>

                    {visibleContacts.map(contact => (
                        <div key={contact.id} onClick={() => setActiveContactId(contact.id)} className="group relative h-80 rounded-3xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1">
                            <img src={contact.avatar} alt={contact.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90"></div>
                            <div className="absolute bottom-0 left-0 right-0 p-5">
                                <div className="flex justify-between items-center mb-1">
                                    <div className="flex items-center gap-1">
                                      <h3 className="text-xl font-bold text-white">{contact.name}, {contact.age}</h3>
                                      {contact.isPremium && <CrownIcon className="w-4 h-4 text-yellow-400" />}
                                    </div>
                                    <span className={`w-2.5 h-2.5 rounded-full ${contact.status === 'online' ? 'bg-emerald-500' : 'bg-gray-500'}`}></span>
                                </div>
                                <div className="flex items-center text-gray-300 text-xs mb-2"><MapPinIcon className="w-3 h-3 mr-1 text-emerald-400" />{contact.location}</div>
                                <p className="text-gray-400 text-xs line-clamp-2">{contact.bio}</p>
                            </div>
                        </div>
                    ))}
                 </div>
             </div>
        ) : (
            // --- CHAT INTERFACE ---
            <div className="flex flex-col h-full absolute inset-0 md:relative bg-[#050505] z-50 md:z-auto">
                <header className="flex items-center justify-between p-4 md:px-8 md:py-5 border-b border-white/5 bg-[#08080a]/95 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center space-x-4">
                        <button onClick={() => setActiveContactId('')} className="p-2 -ml-2 text-gray-400 hover:text-white rounded-full"><XIcon className="w-6 h-6" /></button>
                        {isGlobalChat ? (
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center"><UsersIcon className="w-5 h-5 text-white" /></div>
                                <div><h2 className="font-bold text-lg text-white">Habesha Lounge</h2><p className="text-xs text-gray-400">Global Public Chat</p></div>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setViewingProfile(activeContact || null)}>
                                <img src={activeContact?.avatar} alt={activeContact?.name} className="w-10 h-10 rounded-full object-cover" />
                                <div><h2 className="font-bold text-lg text-white leading-tight flex items-center gap-2">{activeContact?.name} {activeContact?.isPremium && <CrownIcon className="w-4 h-4 text-yellow-400" />}</h2><p className="text-xs text-gray-400">{activeContact?.location}</p></div>
                            </div>
                        )}
                    </div>
                    {!isGlobalChat && !isAdmin && (
                        <button onClick={() => setIsLiveOpen(true)} className="flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-3 md:px-5 py-2 md:py-2.5 rounded-full font-medium shadow-lg hover:scale-105 transition-all">
                          <VideoIcon className="w-5 h-5 md:w-4 md:h-4" /> <span className="hidden md:inline text-sm">Video Call</span>
                        </button>
                    )}
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth custom-scrollbar bg-[#050505]">
                {currentMessages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                        <CoffeeIcon className="w-12 h-12 text-gray-500" />
                        <p className="text-lg font-medium text-gray-300">{isGlobalChat ? 'Welcome to the Lounge' : `Start chatting with ${activeContact?.name}`}</p>
                    </div>
                )}
                {currentMessages.map((msg, index) => {
                    const isMe = (msg as any).senderId === currentUser.id;
                    const contactAvatar = isGlobalChat 
                        ? (allUsers.find(u => u.id === (msg as any).senderId)?.avatar || 'https://via.placeholder.com/40') 
                        : (activeContact?.avatar || '');

                    return (
                        <div key={index}>
                            {isGlobalChat && !isMe && <div className="text-[10px] text-gray-500 ml-12 mb-1">{(msg as any).senderName || 'Unknown'}</div>}
                            <ChatMessage 
                              message={{...msg, role: isMe ? 'user' : 'model'}} 
                              userAvatar={currentUser?.avatar || ''} 
                              contactAvatar={contactAvatar} 
                              onDelete={handleDeleteMessage}
                              onReact={handleMessageReaction}
                              currentUserId={currentUser.id}
                            />
                        </div>
                    );
                })}
                
                {/* Typing Indicator */}
                {isContactTyping && !isGlobalChat && (
                   <div className="flex justify-start w-full mb-2">
                       <div className="flex items-end gap-3">
                           <div className="w-8 h-8 rounded-full overflow-hidden">
                               <img src={activeContact?.avatar} alt="Typing..." className="w-full h-full object-cover"/>
                           </div>
                           <div className="bg-gray-800 border border-gray-700 px-4 py-3 rounded-2xl rounded-bl-none flex items-center space-x-1">
                               <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                               <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></div>
                               <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
                           </div>
                       </div>
                   </div>
                )}
                
                <div ref={messagesEndRef} />
                </div>

                <div className="p-3 md:p-6 bg-[#08080a] border-t border-white/5 z-20 pb-safe">
                    {/* Free Message Limit Indicator */}
                    {!currentUser.isPremium && !isAdmin && (
                        <div className="flex justify-between items-center mb-2 px-1">
                             <div className="text-xs text-gray-400 flex items-center gap-1">
                                 {limitReached ? <LockIcon className="w-3 h-3 text-red-500"/> : <MessageSquareIcon className="w-3 h-3"/>}
                                 <span className={limitReached ? "text-red-500 font-bold" : ""}>
                                     {currentUser.messagesCountToday || 0}/{DAILY_MESSAGE_LIMIT_FREE} daily messages
                                 </span>
                             </div>
                             <button onClick={openPremiumModal} className="text-xs text-yellow-400 hover:text-yellow-300 font-bold uppercase">Upgrade</button>
                        </div>
                    )}

                    {selectedImage && <div className="flex items-center mb-4 space-x-3 bg-white/5 p-2 rounded-xl w-fit"><img src={selectedImage.preview} alt="Selected" className="h-16 w-16 object-cover rounded-lg" /><button onClick={() => setSelectedImage(null)}><XIcon className="w-4 h-4 text-gray-400" /></button></div>}
                    
                    <div className="flex items-end space-x-2 md:space-x-3 max-w-5xl mx-auto">
                        {!isRecording && !limitReached && (
                          <>
                             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
                             <button onClick={() => fileInputRef.current?.click()} className="mb-1 p-2 md:p-3 text-gray-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-xl transition-all"><PaperclipIcon className="w-6 h-6" /></button>
                          </>
                        )}
                        
                        <div className={`flex-1 relative bg-[#131315] rounded-2xl border transition-all flex items-center ${limitReached ? 'border-red-900/50 bg-red-900/10' : 'border-white/5 focus-within:border-emerald-500/50'}`}>
                            {limitReached ? (
                                <div className="flex-1 px-4 py-3.5 flex items-center justify-between">
                                    <span className="text-gray-400 text-sm">Daily limit reached.</span>
                                    <button onClick={openPremiumModal} className="bg-yellow-500 text-black text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-yellow-400 transition-colors">
                                        UPGRADE
                                    </button>
                                </div>
                            ) : isRecording ? (
                              <div className="flex-1 flex items-center justify-between px-4 py-3.5">
                                 <div className="flex items-center space-x-3">
                                   <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                   <span className="text-white font-mono font-medium">{formatDuration(recordingDuration)}</span>
                                 </div>
                                 <button onClick={cancelRecording} className="text-gray-400 hover:text-red-400 p-1">
                                    <TrashIcon className="w-5 h-5" />
                                 </button>
                              </div>
                            ) : (
                                <>
                                  <textarea 
                                    value={inputText} 
                                    onChange={handleInputChange} 
                                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} 
                                    placeholder="Message..." 
                                    className="w-full bg-transparent border-none text-white py-3.5 px-4 focus:ring-0 outline-none resize-none disabled:opacity-50" 
                                    style={{ minHeight: '52px' }} 
                                    rows={1} 
                                    disabled={limitReached}
                                  />
                                   {/* Mic Button triggers recording */}
                                   {!inputText && !selectedImage && (
                                      <button onClick={startRecording} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-red-400">
                                         <MicIcon className="w-5 h-5" />
                                      </button>
                                   )}
                                </>
                            )}
                        </div>

                        {isRecording ? (
                             <button onClick={stopRecordingAndSend} className="mb-1 p-3 md:p-3.5 rounded-xl transition-all shadow-lg transform bg-emerald-500 text-white hover:scale-105">
                                <SendIcon className="w-5 h-5" />
                             </button>
                        ) : (
                             <button onClick={() => handleSendMessage()} disabled={(!inputText.trim() && !selectedImage) || limitReached} className={`mb-1 p-3 md:p-3.5 rounded-xl transition-all shadow-lg transform ${(!inputText.trim() && !selectedImage) || limitReached ? 'bg-[#1c1c1e] text-gray-600' : 'bg-white text-black hover:scale-105'}`}>
                                <SendIcon className="w-5 h-5" />
                             </button>
                        )}
                    </div>
                </div>
            </div>
        )}
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      {!isAdmin && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0c0c0e]/95 backdrop-blur-lg border-t border-white/5 flex justify-around items-center z-40 pb-safe">
             <button onClick={() => { setIsMobileMenuOpen(false); setMobileTab('home'); setActiveContactId(''); }} className={`flex flex-col items-center p-2 ${!activeContactId && !isMobileMenuOpen ? 'text-emerald-400' : 'text-gray-500'}`}>
                <HomeIcon className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-medium">Home</span>
             </button>
             <button onClick={() => { setIsMobileMenuOpen(true); }} className={`flex flex-col items-center p-2 ${isMobileMenuOpen ? 'text-emerald-400' : 'text-gray-500'}`}>
                 <MessageSquareIcon className="w-6 h-6 mb-1" />
                 <span className="text-[10px] font-medium">Chats</span>
             </button>
             <button onClick={() => openEditProfile()} className={`flex flex-col items-center p-2 ${isEditProfileOpen ? 'text-emerald-400' : 'text-gray-500'}`}>
                <UserIcon className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-medium">Profile</span>
             </button>
          </div>
      )}
    </div>
  );
}