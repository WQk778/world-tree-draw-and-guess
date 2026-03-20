const { supabaseAdmin } = require('../config/supabase');

/**
 * Middleware to authenticate user using Supabase JWT
 */
const authenticateUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing or invalid authorization header' });
        }

        const token = authHeader.split(' ')[1];
        
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // Attach user to request object
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ error: 'Internal server error during authentication' });
    }
};

/**
 * Middleware to check if the authenticated user is an admin
 */
const requireAdmin = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { data: adminUser, error } = await supabaseAdmin
            .from('admin_users')
            .select('role')
            .eq('id', req.user.id)
            .single();

        if (error || !adminUser) {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }

        // Attach admin role
        req.adminRole = adminUser.role;
        next();
    } catch (error) {
        console.error('Admin middleware error:', error);
        res.status(500).json({ error: 'Internal server error during authorization' });
    }
};

/**
 * Utility to log admin actions
 */
const logAudit = async (adminId, action, resource, details = {}, ipAddress = '') => {
    try {
        await supabaseAdmin.from('audit_logs').insert({
            admin_id: adminId,
            action,
            resource,
            details,
            ip_address: ipAddress
        });
    } catch (error) {
        console.error('Failed to write audit log:', error);
    }
};

module.exports = { authenticateUser, requireAdmin, logAudit };
