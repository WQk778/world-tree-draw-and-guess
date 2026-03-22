import { supabase } from '../lib/supabase';

export interface Friend {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  updated_at: string;
  profiles?: any; // joined profile data
}

export const friendService = {
  /**
   * Send a friend request
   */
  async sendRequest(targetUserId: string) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('friends')
      .insert({
        requester_id: user.user.id,
        addressee_id: targetUserId,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Accept a friend request via RPC
   */
  async acceptRequest(requestId: string) {
    const { data, error } = await supabase.rpc('accept_friend_request', {
      request_id: requestId
    });
    if (error) throw error;
    return data;
  },

  /**
   * Reject a friend request (delete it)
   */
  async rejectRequest(requestId: string) {
    const { error } = await supabase
      .from('friends')
      .delete()
      .eq('id', requestId);
    
    if (error) throw error;
    return true;
  },

  /**
   * Get list of friends (accepted)
   */
  async getFriends() {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const userId = user.user.id;
    const { data, error } = await supabase
      .from('friends')
      .select(`
        *,
        requester:requester_id (id, nickname, avatar_url),
        addressee:addressee_id (id, nickname, avatar_url)
      `)
      .eq('status', 'accepted')
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

    if (error) throw error;
    return data;
  },

  /**
   * Get pending requests (received)
   */
  async getPendingRequests() {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('friends')
      .select(`
        *,
        requester:requester_id (id, nickname, avatar_url)
      `)
      .eq('status', 'pending')
      .eq('addressee_id', user.user.id);

    if (error) throw error;
    return data;
  },

  /**
   * Delete a friend
   */
  async deleteFriend(friendId: string) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const userId = user.user.id;

    const { error } = await supabase
      .from('friends')
      .delete()
      .eq('status', 'accepted')
      .or(`and(requester_id.eq.${userId},addressee_id.eq.${friendId}),and(requester_id.eq.${friendId},addressee_id.eq.${userId})`);

    if (error) throw error;
    return true;
  }
};
