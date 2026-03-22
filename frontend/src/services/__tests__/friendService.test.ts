import { describe, it, expect, vi, beforeEach } from 'vitest';
import { friendService } from '../friendService';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn()
    },
    from: vi.fn(),
    rpc: vi.fn()
  }
}));

describe('friendService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send a friend request', async () => {
    const mockUser = { user: { id: 'user-1' } };
    supabase.auth.getUser.mockResolvedValue({ data: mockUser });

    const mockInsert = vi.fn().mockReturnThis();
    const mockSelect = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'req-1' }, error: null });

    supabase.from.mockReturnValue({
      insert: mockInsert,
      select: mockSelect,
      single: mockSingle
    } as any);

    const result = await friendService.sendRequest('user-2');

    expect(supabase.from).toHaveBeenCalledWith('friends');
    expect(mockInsert).toHaveBeenCalledWith({
      requester_id: 'user-1',
      addressee_id: 'user-2',
      status: 'pending'
    });
    expect(result).toEqual({ id: 'req-1' });
  });

  it('should accept a friend request via RPC', async () => {
    supabase.rpc.mockResolvedValue({ data: true, error: null });

    const result = await friendService.acceptRequest('req-1');

    expect(supabase.rpc).toHaveBeenCalledWith('accept_friend_request', {
      request_id: 'req-1'
    });
    expect(result).toBe(true);
  });

  it('should reject a friend request', async () => {
    const mockDelete = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockResolvedValue({ error: null });

    supabase.from.mockReturnValue({
      delete: mockDelete,
      eq: mockEq
    } as any);

    const result = await friendService.rejectRequest('req-1');

    expect(supabase.from).toHaveBeenCalledWith('friends');
    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith('id', 'req-1');
    expect(result).toBe(true);
  });

  it('should delete a friend', async () => {
    const mockUser = { user: { id: 'user-1' } };
    supabase.auth.getUser.mockResolvedValue({ data: mockUser });

    const mockDelete = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockOr = vi.fn().mockResolvedValue({ error: null });

    supabase.from.mockReturnValue({
      delete: mockDelete,
      eq: mockEq,
      or: mockOr
    } as any);

    const result = await friendService.deleteFriend('user-2');

    expect(supabase.from).toHaveBeenCalledWith('friends');
    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith('status', 'accepted');
    expect(mockOr).toHaveBeenCalledWith('and(requester_id.eq.user-1,addressee_id.eq.user-2),and(requester_id.eq.user-2,addressee_id.eq.user-1)');
    expect(result).toBe(true);
  });
});
