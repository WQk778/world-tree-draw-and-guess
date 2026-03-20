const { requireAdmin } = require('../auth');
const { supabaseAdmin } = require('../../config/supabase');

// Mock supabaseAdmin
jest.mock('../../config/supabase', () => ({
    supabaseAdmin: {
        from: jest.fn()
    }
}));

describe('RBAC Middleware - requireAdmin', () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        req = { user: { id: 'test-user-id' } };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return 401 if user is not authenticated', async () => {
        req.user = undefined;
        await requireAdmin(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Not authenticated' });
    });

    it('should return 403 if user is not in admin_users table', async () => {
        // Mock DB returning no admin
        const mockSelect = jest.fn().mockReturnThis();
        const mockEq = jest.fn().mockReturnThis();
        const mockSingle = jest.fn().mockResolvedValue({ data: null, error: null });
        
        supabaseAdmin.from.mockReturnValue({ select: mockSelect, eq: mockEq, single: mockSingle });

        await requireAdmin(req, res, next);
        
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden: Admin access required' });
    });

    it('should call next() and attach role if user is admin', async () => {
        const mockSelect = jest.fn().mockReturnThis();
        const mockEq = jest.fn().mockReturnThis();
        const mockSingle = jest.fn().mockResolvedValue({ data: { role: 'SUPER_ADMIN' }, error: null });
        
        supabaseAdmin.from.mockReturnValue({ select: mockSelect, eq: mockEq, single: mockSingle });

        await requireAdmin(req, res, next);
        
        expect(next).toHaveBeenCalled();
        expect(req.adminRole).toBe('SUPER_ADMIN');
    });
});