const { supabaseAdmin } = require('../config/supabase');
const { logAudit } = require('../middlewares/auth');

let aiConfig = {
    model: 'qwen-vl-max',
    threshold: 0.8
};

let pointRules = {
    correctGuess: 10,
    quickGuessBonus: 5
};

const checkAdmin = (req, res) => {
    res.json({ message: 'Admin verified', role: req.adminRole });
};

const getStats = async (req, res) => {
    try {
        // Fetch simple stats
        const [{ count: usersCount }, { count: roomsCount }, { count: drawingsCount }] = await Promise.all([
            supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
            supabaseAdmin.from('rooms').select('*', { count: 'exact', head: true }),
            supabaseAdmin.from('drawings').select('*', { count: 'exact', head: true })
        ]);

        res.json({
            stats: {
                totalUsers: usersCount || 0,
                totalRooms: roomsCount || 0,
                totalDrawings: drawingsCount || 0
            },
            config: {
                ai: aiConfig,
                rules: pointRules
            }
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
};

const updateAiConfig = async (req, res) => {
    try {
        const { model, threshold } = req.body;
        const oldConfig = { ...aiConfig };
        
        if (model) aiConfig.model = model;
        if (threshold) aiConfig.threshold = threshold;
        
        // Log the action
        await logAudit(
            req.user.id,
            'UPDATE_AI_CONFIG',
            'ai_config',
            { old: oldConfig, new: aiConfig },
            req.ip
        );

        res.json({ message: 'AI Config updated', config: aiConfig });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update AI config' });
    }
};

const updateRules = async (req, res) => {
    try {
        const { correctGuess, quickGuessBonus } = req.body;
        const oldRules = { ...pointRules };
        
        if (correctGuess !== undefined) pointRules.correctGuess = correctGuess;
        if (quickGuessBonus !== undefined) pointRules.quickGuessBonus = quickGuessBonus;
        
        // Log the action
        await logAudit(
            req.user.id,
            'UPDATE_RULES',
            'point_rules',
            { old: oldRules, new: pointRules },
            req.ip
        );

        res.json({ message: 'Rules updated', config: pointRules });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update rules' });
    }
};

module.exports = {
    checkAdmin,
    getStats,
    updateAiConfig,
    updateRules
};