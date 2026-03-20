const fs = require('fs');
const crypto = require('crypto');

// Helpers
function getUUID() {
    return crypto.randomUUID();
}

function getTime(offsetMinutes = 0) {
    const d = new Date();
    d.setMinutes(d.getMinutes() - 1000 + offsetMinutes);
    return d.toISOString().replace('T', ' ').replace('Z', '+00');
}

// Data Storage
const users = [];
const profiles = [];
const rooms = [];
const roomMembers = [];
const gameRounds = [];
const drawings = [];
const guessRecords = [];
const pointRules = [];
const pointRecords = [];
const aiConfigs = [];
const rankings = [];
const loginRecords = [];

// 1. Users & Profiles (15 rows)
const names = [
    "ArtMaster99", "PixelQueen", "DoodleKing", "ColorWizard", "SketchyGuy",
    "CanvasHero", "BrushBoss", "PalettePro", "InkSplasher", "DrawDaily",
    "CreativeMind", "VisualVibe", "ArtisticSoul", "DesignGuru", "PencilPusher"
];
const avatars = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Ginger",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Cookie",
    "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Precious"
];

for (let i = 0; i < 15; i++) {
    const uid = getUUID();
    const createdAt = getTime(i * 10);
    users.push({
        id: uid,
        email: `user${i + 1}@example.com`,
        encrypted_password: "scrypt:32768:8:1:k7/somehash...",
        created_at: createdAt
    });
    profiles.push({
        id: uid,
        nickname: names[i],
        avatar_url: avatars[i % 5],
        total_points: Math.floor(Math.random() * 4900) + 100,
        created_at: createdAt,
        updated_at: createdAt
    });
}

// 2. Rooms (15 rows)
const roomStatuses = ['waiting', 'playing', 'finished', 'timeout'];
for (let i = 0; i < 15; i++) {
    const ownerId = profiles[i].id;
    const roomId = getUUID();
    const createdAt = getTime(100 + i * 5);
    rooms.push({
        id: roomId,
        code: Math.floor(100000 + Math.random() * 900000).toString(),
        owner_id: ownerId,
        max_players: [4, 6, 8, 10][Math.floor(Math.random() * 4)],
        status: roomStatuses[i % 4],
        created_at: createdAt,
        updated_at: createdAt
    });
}

// 3. Room Members (15 rows)
for (let i = 0; i < 15; i++) {
    const rIdx = i % 5;
    const uIdx = i;
    
    const roomId = rooms[rIdx].id;
    const userId = profiles[uIdx].id;
    const role = rooms[rIdx].owner_id === userId ? 'owner' : 'player';
    
    roomMembers.push({
        id: getUUID(),
        room_id: roomId,
        user_id: userId,
        role: role,
        is_online: Math.random() < 0.5,
        joined_at: getTime(110 + i * 2)
    });
}

// 4. Game Rounds (15 rows)
const words = ["Apple", "Bicycle", "Cat", "Dog", "Elephant", "Fish", "Guitar", "House", "Ice Cream", "Jacket", "Kite", "Lion", "Moon", "Notebook", "Orange"];
for (let i = 0; i < 15; i++) {
    const rIdx = i % 15;
    const drawerIdx = (i + 1) % 15;
    
    gameRounds.push({
        id: getUUID(),
        room_id: rooms[rIdx].id,
        drawer_id: profiles[drawerIdx].id,
        target_word: words[i],
        status: 'finished',
        round_number: (i % 3) + 1,
        created_at: getTime(200 + i * 10)
    });
}

// 5. Drawings (15 rows)
for (let i = 0; i < 15; i++) {
    drawings.push({
        id: getUUID(),
        round_id: gameRounds[i].id,
        image_url: `https://supabase-storage.com/drawings/img_${i}.png`,
        ai_raw_response: JSON.stringify({labels: ["sketch", "line_art"], description: `A drawing of ${words[i]}`}),
        ai_hint_text: `It looks like something related to ${words[i]}...`,
        recognition_confidence: 0.7 + Math.random() * 0.29,
        created_at: getTime(210 + i * 10)
    });
}

// 6. Guess Records (15 rows)
for (let i = 0; i < 15; i++) {
    const guesserIdx = (i + 2) % 15;
    const isCorrect = Math.random() < 0.5;
    
    guessRecords.push({
        id: getUUID(),
        drawing_id: drawings[i].id,
        user_id: profiles[guesserIdx].id,
        guess_content: isCorrect ? words[i] : "Something else",
        is_correct: isCorrect,
        points_earned: isCorrect ? 10 : 0,
        created_at: getTime(220 + i * 10)
    });
}

// 7. Point Rules (15 rows)
const ruleActions = [
    "guess_correct", "draw_accepted", "create_room", "join_room", "share_game",
    "streak_3", "streak_5", "perfect_round", "fast_guess", "first_blood",
    "daily_login", "invite_friend", "report_bug", "watch_ad", "vip_bonus"
];
for (let i = 0; i < 15; i++) {
    pointRules.push({
        id: getUUID(),
        rule_key: ruleActions[i],
        rule_name: `Rule: ${ruleActions[i].replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`,
        points_value: Math.floor(Math.random() * 45) + 5,
        is_active: true,
        created_at: getTime(50),
        updated_at: getTime(50)
    });
}

// 8. Point Records (15 rows)
for (let i = 0; i < 15; i++) {
    const uIdx = i;
    const rIdx = i;
    
    pointRecords.push({
        id: getUUID(),
        user_id: profiles[uIdx].id,
        rule_id: pointRules[rIdx].id,
        points_change: pointRules[rIdx].points_value,
        source_id: i < 15 ? guessRecords[i].id : null,
        created_at: getTime(300 + i * 5)
    });
}

// 9. AI Configs (15 rows)
const models = ["gpt-4-vision-preview", "gpt-3.5-turbo", "dall-e-3"];
for (let i = 0; i < 15; i++) {
    aiConfigs.push({
        id: getUUID(),
        config_name: `Config_v${i + 1}`,
        openai_model: models[i % 3],
        confidence_threshold: 0.5 + (i * 0.02),
        prompt_template: `Describe this image for a guessing game. Level ${i + 1}.`,
        is_active: (i === 14),
        updated_at: getTime(400 + i * 10)
    });
}

// 10. Rankings (15 rows)
for (let i = 0; i < 15; i++) {
    rankings.push({
        id: getUUID(),
        user_id: profiles[i].id,
        rank_position: i + 1,
        snapshot_points: profiles[i].total_points,
        period_type: "weekly",
        calculated_at: getTime(500)
    });
}

// 11. Login Records (15 rows)
for (let i = 0; i < 15; i++) {
    loginRecords.push({
        id: getUUID(),
        user_id: profiles[i].id,
        ip_address: `192.168.1.${100 + i}`,
        login_time: getTime(600 + i * 20)
    });
}

// Generate Output
let output = "-- 0. Seed auth.users (Required for foreign keys in profiles)\n";
output += "INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, aud, role, email_confirmed_at) VALUES\n";
const authValues = users.map(u => 
    `('${u.id}', '${u.email}', '${u.encrypted_password}', '${u.created_at}', '${u.created_at}', 'authenticated', 'authenticated', '${u.created_at}')`
);
output += authValues.join(",\n") + ";\n\n";

function generateInsert(table, data) {
    if (!data || data.length === 0) return "";
    const keys = Object.keys(data[0]);
    const columns = keys.join(", ");
    
    const valuesList = data.map(row => {
        const rowVals = keys.map(k => {
            let val = row[k];
            if (typeof val === 'string') {
                val = val.replace(/'/g, "''");
                return `'${val}'`;
            } else if (typeof val === 'boolean') {
                return val ? "TRUE" : "FALSE";
            } else if (val === null || val === undefined) {
                return "NULL";
            } else {
                return val;
            }
        });
        return `(${rowVals.join(", ")})`;
    });
    
    return `INSERT INTO public.${table} (${columns}) VALUES\n` + valuesList.join(",\n") + ";";
}

output += "-- 1. Profiles\n" + generateInsert("profiles", profiles) + "\n\n";
output += "-- 2. Rooms\n" + generateInsert("rooms", rooms) + "\n\n";
output += "-- 3. Room Members\n" + generateInsert("room_members", roomMembers) + "\n\n";
output += "-- 4. Game Rounds\n" + generateInsert("game_rounds", gameRounds) + "\n\n";
output += "-- 5. Drawings\n" + generateInsert("drawings", drawings) + "\n\n";
output += "-- 6. Guess Records\n" + generateInsert("guess_records", guessRecords) + "\n\n";
output += "-- 7. Point Rules\n" + generateInsert("point_rules", pointRules) + "\n\n";
output += "-- 8. Point Records\n" + generateInsert("point_records", pointRecords) + "\n\n";
output += "-- 9. AI Configs\n" + generateInsert("ai_configs", aiConfigs) + "\n\n";
output += "-- 10. Rankings\n" + generateInsert("rankings", rankings) + "\n\n";
output += "-- 11. Login Records\n" + generateInsert("login_records", loginRecords);

fs.writeFileSync('d:/SJK/supabase/migrations/20240111_seed_data.sql', output);
console.log("SQL file generated successfully.");
