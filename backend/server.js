const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = 5000;

// Initialize Supabase client
const supabaseUrl = 'https://gmgxpgirgmmqsczvsbtv.supabase.co';
const supabaseKey = 'sb_secret_KKeNHCpJEUcbCC0YmgheRA_eBbkvR4T';
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

// ==================== AUTH & USER ROUTES ====================

// 1. Get all users
app.get('/api/users', async (req, res) => {
  try {
    console.log('📋 Fetching all users...');
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const users = data.map(parseUser);
    console.log(`✅ Found ${users.length} users`);
    res.json(users);
  } catch (error) {
    console.error('❌ Error fetching users:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// 2. Signup (Create new user)
app.post('/api/signup', async (req, res) => {
  try {
    const userData = req.body;
    console.log('📝 Signup request for:', userData.email);

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', userData.email)
      .single();

    if (existingUser) {
      console.log('⚠️ User already exists:', userData.email);
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Generate user ID
    const userId = require('crypto').randomUUID ? require('crypto').randomUUID() : `user_${Date.now()}`;

    // Prepare user data
    const newUser = {
      id: userId,
      email: userData.email,
      password: userData.password, // Store plain text for now
      name: userData.name,
      avatar: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=random&color=fff`,
      gender: userData.gender || 'male',
      age: parseInt(userData.age) || 25,
      location: userData.location || 'Addis Ababa',
      bio: userData.bio || `Hello, I'm new to Yene Love!`,
      music: userData.music || '',
      tradition: userData.tradition || '',
      voice: userData.voice || 'Default',
      status: 'online',
      is_premium: false,
      stories: JSON.stringify([]),
      gifts: JSON.stringify([]),
      stories_count_today: 0,
      messages_count_today: 0,
      last_story_date: new Date().toISOString().split('T')[0],
      last_message_date: new Date().toISOString().split('T')[0]
    };

    console.log('💾 Inserting user:', newUser.email);

    // Insert into database
    const { data: createdUser, error: insertError } = await supabase
      .from('users')
      .insert([newUser])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Database insert error:', insertError);
      return res.status(500).json({ error: insertError.message });
    }

    console.log('✅ User created successfully:', createdUser.email);
    res.json(parseUser(createdUser));

  } catch (error) {
    console.error('🔥 Signup error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('🔐 Login attempt for:', email);

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Simple password check (plain text for now)
    if (user.password !== password) {
      console.log('❌ Invalid password for:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    console.log('✅ Login successful for:', email);
    res.json(parseUser(user));

  } catch (error) {
    console.error('🔥 Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Update user
app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    console.log('✏️ Updating user:', id);

    // Prepare updates for database
    const dbUpdates = {
      name: updates.name,
      age: updates.age,
      location: updates.location,
      bio: updates.bio,
      music: updates.music,
      tradition: updates.tradition,
      avatar: updates.avatar,
      is_premium: updates.isPremium,
      stories_count_today: updates.storiesCountToday,
      messages_count_today: updates.messagesCountToday
    };

    // Handle password update if provided
    if (updates.password) {
      dbUpdates.password = updates.password;
    }

    // Handle JSON fields
    if (updates.stories) dbUpdates.stories = JSON.stringify(updates.stories);
    if (updates.gifts) dbUpdates.gifts = JSON.stringify(updates.gifts);

    const { data, error } = await supabase
      .from('users')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ User updated:', id);
    res.json(parseUser(data));

  } catch (error) {
    console.error('❌ Update error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// 5. Delete user
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Deleting user:', id);

    // First delete related data
    await supabase.from('messages').delete().eq('sender_id', id);
    await supabase.from('premium_requests').delete().eq('user_id', id);
    await supabase.from('stories').delete().eq('user_id', id);
    await supabase.from('chat_sessions').delete().or(`user1_id.eq.${id},user2_id.eq.${id}`);

    // Then delete user
    const { error } = await supabase.from('users').delete().eq('id', id);

    if (error) throw error;

    console.log('✅ User deleted:', id);
    res.json({ success: true });

  } catch (error) {
    console.error('❌ Delete error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ==================== MESSAGE ROUTES ====================

// 6. Send message
app.post('/api/messages', async (req, res) => {
  try {
    const { chat_id, sender_id, text, image, audio } = req.body;
    console.log('📤 Sending message from:', sender_id, 'to chat:', chat_id);

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

    console.log('✅ Message sent. ID:', data.id);
    
    // Return formatted message
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
    console.error('❌ Send message error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ==================== HEALTH CHECK ====================

// 7. Health check
app.get('/api/health', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    res.json({
      status: 'healthy',
      database: error ? 'disconnected' : 'connected',
      timestamp: new Date().toISOString(),
      supabaseUrl
    });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error: error.message });
  }
});

// 8. Test endpoint
app.get('/api/test', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      return res.json({ 
        status: 'error', 
        message: 'Database connection failed',
        error: error.message 
      });
    }

    res.json({
      status: 'success',
      message: 'Backend is running correctly',
      database: 'Connected',
      supabaseUrl,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`👥 Users API: http://localhost:${PORT}/api/users`);
});



