import { supabase } from '../lib/supabase';

export interface Team {
  id: string;
  leader_id: string;
  name: string;
  status: 'forming' | 'in_game' | 'disbanded';
  max_members: number;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  status: 'pending' | 'joined';
  joined_at: string;
  profiles?: any;
}

export const teamService = {
  /**
   * Create a new team
   */
  async createTeam(name: string, maxMembers: number = 4) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('teams')
      .insert({
        leader_id: user.user.id,
        name,
        max_members: maxMembers,
        status: 'forming'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Invite a friend to team
   */
  async inviteToTeam(teamId: string, targetUserId: string) {
    const { data, error } = await supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: targetUserId,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Accept team invite via RPC
   */
  async acceptInvite(teamId: string) {
    const { data, error } = await supabase.rpc('accept_team_invite', {
      p_team_id: teamId
    });
    if (error) throw error;
    return data;
  },

  /**
   * Reject team invite
   */
  async rejectInvite(teamId: string) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', user.user.id);
    
    if (error) throw error;
    return true;
  },

  /**
   * Transfer team leader via RPC
   */
  async transferLeader(teamId: string, newLeaderId: string) {
    const { data, error } = await supabase.rpc('transfer_team_leader', {
      p_team_id: teamId,
      p_new_leader_id: newLeaderId
    });
    if (error) throw error;
    return data;
  },

  /**
   * Disband team via RPC
   */
  async disbandTeam(teamId: string) {
    const { data, error } = await supabase.rpc('disband_team', {
      p_team_id: teamId
    });
    if (error) throw error;
    return data;
  },

  /**
   * Get team details and members
   */
  async getTeamDetails(teamId: string) {
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*, leader:leader_id(id, nickname, avatar_url)')
      .eq('id', teamId)
      .single();

    if (teamError) throw teamError;

    const { data: members, error: memberError } = await supabase
      .from('team_members')
      .select('*, user:user_id(id, nickname, avatar_url)')
      .eq('team_id', teamId)
      .eq('status', 'joined');

    if (memberError) throw memberError;

    return { team, members };
  },

  /**
   * Get my pending invites
   */
  async getPendingInvites() {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('team_members')
      .select('*, team:team_id(id, name, leader_id)')
      .eq('user_id', user.user.id)
      .eq('status', 'pending');

    if (error) throw error;
    return data;
  }
};
