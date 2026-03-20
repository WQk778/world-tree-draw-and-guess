require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function makeAdmin(email) {
    // Get user by email
    const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
        console.error('Error fetching users:', userError);
        return;
    }

    const user = users.users.find(u => u.email === email);
    if (!user) {
        console.error(`User with email ${email} not found.`);
        return;
    }

    // Insert into admin_users
    const { error: adminError } = await supabaseAdmin
        .from('admin_users')
        .upsert({ id: user.id, role: 'SUPER_ADMIN' });

    if (adminError) {
        console.error('Error promoting user:', adminError);
    } else {
        console.log(`Successfully promoted ${email} to SUPER_ADMIN!`);
    }
}

const email = process.argv[2];
if (!email) {
    console.log('Usage: node promote_admin.js <email>');
} else {
    makeAdmin(email);
}