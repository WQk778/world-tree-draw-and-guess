import { supabase } from '../lib/supabase';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  type: 'text' | 'room_invite';
  room_code?: string;
  is_read: boolean;
  created_at: string;
  sender?: any;
}

export const messageService = {
  /**
   * Send a text message to a friend
   */
  async sendMessage(receiverId: string, content: string) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.user.id,
        receiver_id: receiverId,
        content,
        type: 'text'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Send a room invite
   */
  async sendRoomInvite(receiverId: string, roomCode: string) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.user.id,
        receiver_id: receiverId,
        content: `邀请你加入房间：${roomCode}`,
        type: 'room_invite',
        room_code: roomCode
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get messages between current user and a friend
   */
  async getMessages(friendId: string, limit: number = 50) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const userId = user.user.id;

    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id(id, nickname, avatar_url)
      `)
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    
    // Mark as read if receiver is current user
    const unreadIds = data
      .filter(m => m.receiver_id === userId && !m.is_read)
      .map(m => m.id);

    if (unreadIds.length > 0) {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .in('id', unreadIds);
    }

    return data.reverse(); // Return in chronological order
  },

  /**
   * Get unread message counts grouped by sender
   */
  async getUnreadCounts() {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('messages')
      .select('sender_id')
      .eq('receiver_id', user.user.id)
      .eq('is_read', false);

    if (error) throw error;

    const counts: Record<string, number> = {};
    data.forEach(m => {
      counts[m.sender_id] = (counts[m.sender_id] || 0) + 1;
    });

    return counts;
  }
};
