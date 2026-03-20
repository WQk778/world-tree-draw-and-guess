const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase Admin Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase URL or Service Role Key in environment variables');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

exports.signup = async (req, res, next) => {
  try {
    const { email, password, nickname } = req.body;

    if (!email || !password || !nickname) {
      return res.status(400).json({ error: 'Email, password, and nickname are required' });
    }

    // Use admin.createUser to bypass email confirmation and rate limits
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm the user
      user_metadata: {
        nickname,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${nickname}`
      }
    });

    if (error) {
      console.error('Supabase Admin Create User Error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ 
      message: 'User created successfully', 
      user: data.user 
    });
  } catch (error) {
    next(error);
  }
};
