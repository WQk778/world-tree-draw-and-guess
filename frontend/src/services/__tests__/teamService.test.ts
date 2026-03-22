import { describe, it, expect, vi, beforeEach } from 'vitest';
import { teamService } from '../teamService';
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

describe('teamService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a team', async () => {
    const mockUser = { user: { id: 'leader-1' } };
    supabase.auth.getUser.mockResolvedValue({ data: mockUser });

    const mockInsert = vi.fn().mockReturnThis();
    const mockSelect = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'team-1', name: 'Cool Team' }, error: null });

    supabase.from.mockReturnValue({
      insert: mockInsert,
      select: mockSelect,
      single: mockSingle
    } as any);

    const result = await teamService.createTeam('Cool Team', 4);

    expect(supabase.from).toHaveBeenCalledWith('teams');
    expect(mockInsert).toHaveBeenCalledWith({
      leader_id: 'leader-1',
      name: 'Cool Team',
      max_members: 4,
      status: 'forming'
    });
    expect(result.id).toBe('team-1');
  });

  it('should transfer leader via RPC', async () => {
    supabase.rpc.mockResolvedValue({ data: true, error: null });

    const result = await teamService.transferLeader('team-1', 'new-leader');

    expect(supabase.rpc).toHaveBeenCalledWith('transfer_team_leader', {
      p_team_id: 'team-1',
      p_new_leader_id: 'new-leader'
    });
    expect(result).toBe(true);
  });

  it('should disband team via RPC', async () => {
    supabase.rpc.mockResolvedValue({ data: true, error: null });

    const result = await teamService.disbandTeam('team-1');

    expect(supabase.rpc).toHaveBeenCalledWith('disband_team', {
      p_team_id: 'team-1'
    });
    expect(result).toBe(true);
  });
});
