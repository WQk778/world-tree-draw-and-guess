const { supabaseAdmin } = require('../config/supabase');
const OpenAI = require('openai');
const path = require('path');
const fs = require('fs');
const { extractBaseTrajectory } = require('../utils/imagePreprocessor');
const { evaluateGeometry } = require('../utils/geometryMatcher');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
    timeout: 15000 
});

const getQuestion = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Check if the user already has a matched question that is not completed
        // IMPORTANT: Also check if this question still exists in the questions table!
        const { data: existingMatch, error: matchError } = await supabaseAdmin
            .from('onestroke_match_records')
            .select(`
                id,
                question_id,
                onestroke_questions (*)
            `)
            .eq('user_id', userId)
            .eq('status', 'matched')
            .order('matched_at', { ascending: false })
            .limit(1)
            .single();

        if (existingMatch && existingMatch.onestroke_questions) {
            // User already has an active question that still exists, return it
            return res.json({ question: existingMatch.onestroke_questions });
        } else if (existingMatch && !existingMatch.onestroke_questions) {
             // The question was deleted from DB but match record remains. Mark it invalid.
             await supabaseAdmin
                .from('onestroke_match_records')
                .update({ status: 'invalidated' })
                .eq('id', existingMatch.id);
        }

        // 2. If no active question, fetch all and pick a random one
        const { data: questions, error } = await supabaseAdmin
            .from('onestroke_questions')
            .select('*');

        if (error) throw error;
        if (!questions || questions.length === 0) {
            return res.status(404).json({ error: 'No questions found' });
        }

        const randomQ = questions[Math.floor(Math.random() * questions.length)];
        
        // 3. Save this match so if they refresh, they get the same question
        await supabaseAdmin
            .from('onestroke_match_records')
            .insert({
                user_id: userId,
                question_id: randomQ.id,
                status: 'matched'
            });

        res.json({ question: randomQ });
    } catch (error) {
        console.error('Error fetching question:', error);
        res.status(500).json({ error: 'Failed to fetch question' });
    }
};

const submitDrawing = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }

        const { questionId, answerName } = req.body;
        const userId = req.user.id;

        if (!questionId || !answerName) {
            return res.status(400).json({ error: 'Missing questionId or answerName' });
        }

        // 1. Upload user's drawing to storage
        const fileExt = path.extname(req.file.originalname);
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1000)}${fileExt}`;
        const filePath = req.file.path;
        const fileBuffer = fs.readFileSync(filePath);

        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from('drawings')
            .upload(`onestroke/${fileName}`, fileBuffer, {
                contentType: req.file.mimetype
            });

        if (uploadError) {
            fs.unlinkSync(filePath);
            throw uploadError;
        }

        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('drawings')
            .getPublicUrl(`onestroke/${fileName}`);

        fs.unlinkSync(filePath);

        // 2. Ask Qwen-VL-Max to judge
        const prompt = `你是一个宽容的“一笔画”裁判。这是一张用户画的“${answerName}”。请你观察并判断：
1. 它大体上是否能看出来是“${answerName}”？（只要形状轮廓沾边即可，不要太严苛，毕竟是手绘）
2. 它看起来是否像是一笔画成的？（即线条首尾相连，没有明显的多次断笔。如果用户有轻微的停顿但整体连贯，也可以算作一笔画）。
如果你认为它大体像“${answerName}”且符合一笔画的基本特征，请回答“一致”。否则回答“不一致”。
请在第一行只输出“一致”或“不一致”。第二行可以简短输出你判定的原因（20字以内）。`;

        const response = await openai.chat.completions.create({
            model: "qwen-vl-max",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        { type: "image_url", image_url: { "url": publicUrl } },
                    ],
                },
            ],
            max_tokens: 50,
        });

        const aiResult = response.choices[0].message.content.trim();
        // The first line should contain "一致" or "不一致"
        const firstLine = aiResult.split('\n')[0];
        let isCorrect = firstLine.includes('一致') && !firstLine.includes('不一致');
        let finalReason = aiResult;

        // 3. 强制触发轨迹几何验证环节 (如果名称识别通过)
        if (isCorrect) {
            try {
                // 获取目标图片的 URL
                const { data: questionData } = await supabaseAdmin
                    .from('onestroke_questions')
                    .select('image_url')
                    .eq('id', questionId)
                    .single();
                
                if (questionData && questionData.image_url) {
                    // 提取基准轨迹和用户轨迹
                    const baseTraj = await extractBaseTrajectory(questionData.image_url);
                    const userTraj = await extractBaseTrajectory(publicUrl);

                    if (baseTraj && userTraj) {
                        const geoResult = evaluateGeometry(baseTraj, userTraj);
                        if (!geoResult.isPassed) {
                            isCorrect = false;
                            finalReason = geoResult.reason + " (请画得更准确一些)";
                        } else {
                            finalReason += " | " + geoResult.reason;
                        }
                    } else {
                        console.warn("未能成功提取轨迹特征进行比对");
                    }
                }
            } catch (geoError) {
                console.error("轨迹几何验证失败:", geoError);
                // 验证过程出错不阻断主流程，可以按原有AI判断为准，或视情况而定
            }
        }

        const points = isCorrect ? 20 : 0; // 20 points for correct one-stroke

        // 4. Save Record
        const { error: recordError } = await supabaseAdmin
            .from('onestroke_records')
            .insert({
                user_id: userId,
                question_id: questionId,
                is_correct: isCorrect,
                points_earned: points
            });

        if (recordError) {
            console.error('Failed to save record:', recordError);
        }

        // 5. Update Match Record status to completed
        await supabaseAdmin
            .from('onestroke_match_records')
            .update({ status: 'completed' })
            .eq('user_id', userId)
            .eq('question_id', questionId)
            .eq('status', 'matched');

        res.json({
            isCorrect,
            aiMessage: isCorrect ? '答对啦！' : '答案错误，继续加油！',
            points,
            aiRaw: finalReason
        });

    } catch (error) {
        console.error('Submit one-stroke error:', error);
        res.status(500).json({ error: 'Internal server error during submission' });
    }
};

const getRankings = async (req, res) => {
    try {
        // Fetch top 50 players ordered by total_score
        const { data: rankings, error } = await supabaseAdmin
            .from('onestroke_profiles')
            .select(`
                total_score,
                correct_count,
                user_id,
                profiles!onestroke_profiles_user_id_fkey_profiles (nickname, avatar_url)
            `)
            .order('total_score', { ascending: false })
            .limit(50);

        if (error) throw error;

        res.json({ rankings });
    } catch (error) {
        console.error('Error fetching rankings:', error);
        res.status(500).json({ error: 'Failed to fetch rankings', details: error.message });
    }
};

module.exports = {
    getQuestion,
    submitDrawing,
    getRankings
};