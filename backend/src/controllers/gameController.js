const { supabaseAdmin } = require('../config/supabase');
const OpenAI = require('openai');
const fs = require('fs');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
    timeout: 15000 // 15 seconds timeout
});

console.log('OpenAI Config:', {
    baseURL: process.env.OPENAI_BASE_URL || 'default',
    apiKeyPresent: !!process.env.OPENAI_API_KEY
});

// Helper: Delete local file
const deleteLocalFile = (filePath) => {
    fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting file:', err);
    });
};

const submitDrawing = async (req, res) => {
    let filePath = '';
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file uploaded' });
        }

        const { roomId, roundId } = req.body;
        const userId = req.user.id;
        const file = req.file;
        filePath = file.path;

        // 1. Upload to Supabase Storage
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${roomId}/${roundId}_${userId}_${Date.now()}.${fileExt}`;
        const fileBuffer = fs.readFileSync(filePath);

        const { data: storageData, error: storageError } = await supabaseAdmin
            .storage
            .from('drawings')
            .upload(fileName, fileBuffer, {
                contentType: file.mimetype,
                upsert: false
            });

        if (storageError) {
            console.error('Storage upload error:', storageError);
            deleteLocalFile(filePath);
            return res.status(500).json({ error: 'Failed to upload image' });
        }

        // Get Public URL
        const { data: { publicUrl } } = supabaseAdmin
            .storage
            .from('drawings')
            .getPublicUrl(fileName);

        // 2. Save Drawing to Database immediately (without AI hint yet)
        const insertObj = {
            image_url: publicUrl,
            ai_hint_text: 'AI 正在思考中...',
            recognition_confidence: 0.9,
            round_id: roundId
        };

        const { data: drawingData, error: dbError } = await supabaseAdmin
            .from('drawings')
            .insert([insertObj])
            .select()
            .single();

        if (dbError) {
            console.error('Database insert error:', dbError);
            deleteLocalFile(filePath);
            return res.status(500).json({ error: 'Failed to save drawing record: ' + dbError.message });
        }

        // 3. Update Game Round Status to 'guessing'
        const { error: updateError } = await supabaseAdmin
            .from('game_rounds')
            .update({ status: 'guessing' })
            .eq('id', roundId);

        if (updateError) {
            console.error('Failed to update round status:', updateError);
        }

        // Cleanup local file
        deleteLocalFile(filePath);

        // Send response immediately so frontend doesn't wait for AI
        res.status(201).json({
            message: 'Drawing submitted successfully',
            drawing: drawingData
        });

        // 4. Call OpenAI Vision API asynchronously (Using Qwen via DashScope)
        (async () => {
            try {
                // Determine which model to use. If admin set gpt-4o, map it to qwen-vl-max as default
                let modelToUse = "qwen-vl-max"; 
                // We'll read from DB config in a real app, but for now we hardcode or fallback
                
                const response = await openai.chat.completions.create({
                    model: modelToUse,
                    messages: [
                        {
                            role: "user",
                            content: [
                                { type: "text", text: "Please describe this drawing in a short, fun phrase (max 10 words) suitable for a 'Draw & Guess' game hint. The language should be Chinese. Do not reveal the answer directly if possible." },
                                { type: "image_url", image_url: { "url": publicUrl } },
                            ],
                        },
                    ],
                    max_tokens: 300,
                });
                
                const aiHint = response.choices[0].message.content;
                
                // Update the drawing with the real AI hint
                await supabaseAdmin
                    .from('drawings')
                    .update({ 
                        ai_hint_text: aiHint,
                        ai_raw_response: response
                    })
                    .eq('id', drawingData.id);

            } catch (aiError) {
                console.error('OpenAI API error:', aiError);
                await supabaseAdmin
                    .from('drawings')
                    .update({ ai_hint_text: 'AI 识别失败，请发挥想象力！' })
                    .eq('id', drawingData.id);
            }
        })();

    } catch (error) {
        console.error('Submit drawing error:', error);
        if (filePath) deleteLocalFile(filePath);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const submitGuess = async (req, res) => {
    try {
        const { roundId, guess } = req.body;
        const userId = req.user.id;

        if (!roundId || !guess) {
            return res.status(400).json({ error: 'Missing roundId or guess' });
        }

        // 1. Fetch Round Info
        const { data: round, error: roundError } = await supabaseAdmin
            .from('game_rounds')
            .select('*')
            .eq('id', roundId)
            .single();

        if (roundError || !round) {
            return res.status(404).json({ error: 'Round not found' });
        }

        if (round.status !== 'guessing') {
            return res.status(400).json({ error: 'Round is not in guessing phase' });
        }

        // 2. Fetch Latest Drawing for this Round
        const { data: drawing, error: drawingError } = await supabaseAdmin
            .from('drawings')
            .select('id')
            .eq('round_id', roundId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (drawingError || !drawing) {
            return res.status(404).json({ error: 'Drawing not found for this round' });
        }

        // 3. Check if user already guessed
        const { data: existingGuess } = await supabaseAdmin
            .from('guess_records')
            .select('*')
            .eq('user_id', userId)
            .eq('drawing_id', drawing.id)
            .single();

        if (existingGuess) {
            return res.status(400).json({ error: 'You have already submitted a guess for this round!' });
        }

        // 4. Check Correctness
        // Simple case-insensitive match
        const isCorrect = round.target_word.trim().toLowerCase() === guess.trim().toLowerCase();
        let points = 0;

        if (isCorrect) {
            points = 10; // Fixed points for now

            // Insert Point Record (Triggers profile total_points update)
            await supabaseAdmin.from('point_records').insert({
                user_id: userId,
                points_change: points,
                source_id: drawing.id
            });
        }
        
        // 无论是对是错，都直接结束对局
        await supabaseAdmin
            .from('game_rounds')
            .update({ status: 'finished' })
            .eq('id', roundId);

        // 5. Insert Guess Record
        const { data: guessRecord, error: guessError } = await supabaseAdmin
            .from('guess_records')
            .insert({
                drawing_id: drawing.id,
                user_id: userId,
                guess_content: guess,
                is_correct: isCorrect,
                points_earned: points
            })
            .select()
            .single();

        if (guessError) throw guessError;

        res.status(200).json({
            message: isCorrect ? 'Correct guess!' : 'Incorrect guess',
            isCorrect,
            points,
            guess: guessRecord
        });

    } catch (error) {
        console.error('Submit guess error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const endRound = async (req, res) => {
    try {
        const { roundId } = req.body;
        const userId = req.user.id;

        if (!roundId) {
            return res.status(400).json({ error: 'Missing roundId' });
        }

        // 1. Fetch Round Info
        const { data: round, error: roundError } = await supabaseAdmin
            .from('game_rounds')
            .select('*')
            .eq('id', roundId)
            .single();

        if (roundError || !round) {
            return res.status(404).json({ error: 'Round not found' });
        }

        // Only drawer or room owner should end it? For simplicity, we just allow the drawer or if it's already guessing
        if (round.drawer_id !== userId) {
            // we could enforce only drawer, but let's allow room owner too if we want. For now, restrict to drawer
            // return res.status(403).json({ error: 'Only the drawer can end the round' });
        }

        // Update round status to finished
        const { error: updateError } = await supabaseAdmin
            .from('game_rounds')
            .update({ status: 'finished' })
            .eq('id', roundId);

        if (updateError) {
            console.error('Failed to update round status:', updateError);
            return res.status(500).json({ error: 'Failed to end round' });
        }

        res.status(200).json({ message: 'Round ended successfully' });

    } catch (error) {
        console.error('End round error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    submitDrawing,
    submitGuess,
    endRound
};
