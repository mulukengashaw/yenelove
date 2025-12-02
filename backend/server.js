const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5000; // Render provides PORT

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://gmgxpgirgmmqsczvsbtv.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'sb_secret_KKeNHCpJEUcbCC0YmgheRA_eBbkvR4T';
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

console.log('🚀 Backend server starting...');
console.log('🔗 Supabase URL:', supabaseUrl);

// Helper function to parse user
const parseUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  avatar: user.avatar,
  status: user.status || 'online',
  gender: user.gender,
  age: user.age,
  location: user.location,
  bio: user.bio,
  music: user.music,
  tradition: user.tradition,
  voice: user.voice || 'Default',
  isPremium: user.is_premium || false,
  stories: user.stories || [],
  gifts: user.gifts || [],
  storiesCountToday: user.stories_count_today || 0,
  lastStoryDate: user.last_story_date,
  messagesCountToday: user.messages_count_today || 0,
  lastMessageDate: user.last_message_date,
  created_at: user.created_at
});

// ==================== ROUTES ====================

// Health check
app.get('/api/health', async (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    supabaseUrl: supabaseUrl
  });
});

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    const users = data.map(parseUser);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Signup
app.post('/api/signup', async (req, res) => {
  try {
    const userData = req.body;
    
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', userData.email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Generate ID
    const userId = require('crypto').randomUUID ? require('crypto').randomUUID() : `user_${Date.now()}`;

    const newUser = {
      id: userId,
      email: userData.email,
      password: userData.password,
      name: userData.name,
      avatar: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=random&color=fff`,
      gender: userData.gender || 'male',
      age: parseInt(userData.age) || 25,
      location: userData.location || 'Addis Ababa',
      bio: userData.bio || `Hello, I'm new to Yene Love!`,
      music: userData.music || '',
      tradition: userData.tradition || '',
      voice: 'Default',
      status: 'online',
      is_premium: false,
      stories: JSON.stringify([]),
      gifts: JSON.stringify([]),
      stories_count_today: 0,
      messages_count_today: 0,
      last_story_date: new Date().toISOString().split('T')[0],
      last_message_date: new Date().toISOString().split('T')[0]
    };

    const { data: createdUser, error: insertError } = await supabase
      .from('users')
      .insert([newUser])
      .select()
      .single();

    if (insertError) throw insertError;
    res.json(parseUser(createdUser));

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Simple password check
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json(parseUser(user));

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send message
app.post('/api/messages', async (req, res) => {
  try {
    const { chat_id, sender_id, text, image, audio } = req.body;
    
    const newMessage = {
      chat_id,
      sender_id,
      text,
      image,
      audio,
      reactions: JSON.stringify([])
    };

    const { data, error } = await supabase
      .from('messages')
      .insert([newMessage])
      .select()
      .single();

    if (error) throw error;
    
    const formattedMessage = {
      id: data.id,
      role: 'user',
      text: data.text,
      timestamp: new Date(data.created_at),
      image: data.image,
      audio: data.audio,
      senderId: data.sender_id,
      reactions: []
    };
    
    res.json(formattedMessage);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Backend server running on port ${PORT}`);
});