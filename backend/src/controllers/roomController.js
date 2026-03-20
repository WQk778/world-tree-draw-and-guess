const { supabaseAdmin } = require('../config/supabase');

const createRoom = async (req, res, next) => {
    try {
        const { maxPlayers } = req.body;
        const ownerId = req.user.id; // From auth middleware

        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        const { data: room, error: roomError } = await supabaseAdmin
            .from('rooms')
            .insert([{ code, owner_id: ownerId, max_players: maxPlayers || 8, status: 'waiting' }])
            .select()
            .single();

        if (roomError) throw roomError;

        // Add owner as a member
        const { error: memberError } = await supabaseAdmin
            .from('room_members')
            .insert([{ room_id: room.id, user_id: ownerId, role: 'owner' }]);

        if (memberError) throw memberError;

        res.status(201).json({ message: 'Room created successfully', room });
    } catch (error) {
        next(error);
    }
};

const joinRoom = async (req, res, next) => {
    try {
        const { code } = req.body;
        const userId = req.user.id;

        // Find room
        const { data: room, error: findError } = await supabaseAdmin
            .from('rooms')
            .select('*')
            .eq('code', code)
            .single();

        if (findError || !room) {
            return res.status(404).json({ error: '找不到该房间，请检查房间码是否正确' });
        }

        if (room.status !== 'waiting') {
            return res.status(400).json({ error: 'Room is already playing or finished' });
        }

        // Check if already a member
        const { data: existingMember } = await supabaseAdmin
            .from('room_members')
            .select('id')
            .eq('room_id', room.id)
            .eq('user_id', userId)
            .single();

        if (existingMember) {
            return res.status(200).json({ message: 'Already joined', room });
        }

        // Check capacity
        const { count, error: countError } = await supabaseAdmin
            .from('room_members')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id);

        if (countError) throw countError;

        if (count >= room.max_players) {
            return res.status(400).json({ error: 'Room is full' });
        }

        // Join
        const { error: joinError } = await supabaseAdmin
            .from('room_members')
            .insert([{ room_id: room.id, user_id: userId, role: 'player' }]);

        if (joinError) throw joinError;

        res.status(200).json({ message: 'Joined successfully', room });
    } catch (error) {
        next(error);
    }
};

const getRoomMembers = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { data: members, error } = await supabaseAdmin
            .from('room_members')
            .select(`
                *,
                profiles (nickname, avatar_url, total_points)
            `)
            .eq('room_id', id);

        if (error) throw error;

        res.status(200).json({ members });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createRoom,
    joinRoom,
    getRoomMembers
};
