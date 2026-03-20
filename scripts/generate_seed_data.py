import uuid
import json
from datetime import datetime, timedelta
import random

# Helpers
def get_uuid():
    return str(uuid.uuid4())

def get_time(offset_minutes=0):
    t = datetime.now() - timedelta(minutes=1000) + timedelta(minutes=offset_minutes)
    return t.strftime('%Y-%m-%d %H:%M:%S')

# Data Storage
users = []
profiles = []
rooms = []
room_members = []
game_rounds = []
drawings = []
guess_records = []
point_rules = []
point_records = []
ai_configs = []
rankings = []
login_records = []

# 1. Users & Profiles (15 rows)
names = [
    "ArtMaster99", "PixelQueen", "DoodleKing", "ColorWizard", "SketchyGuy",
    "CanvasHero", "BrushBoss", "PalettePro", "InkSplasher", "DrawDaily",
    "CreativeMind", "VisualVibe", "ArtisticSoul", "DesignGuru", "PencilPusher"
]
avatars = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Ginger",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Cookie",
    "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Precious"
]

for i in range(15):
    uid = get_uuid()
    users.append({
        "id": uid,
        "email": f"user{i+1}@example.com",
        "encrypted_password": "scrypt:32768:8:1:k7/somehash...", # Mock hash
        "created_at": get_time(i*10)
    })
    profiles.append({
        "id": uid,
        "nickname": names[i],
        "avatar_url": avatars[i % 5],
        "total_points": random.randint(100, 5000),
        "created_at": get_time(i*10),
        "updated_at": get_time(i*10)
    })

# 2. Rooms (15 rows)
room_statuses = ['waiting', 'playing', 'finished', 'timeout']
for i in range(15):
    owner_id = profiles[i]['id']
    room_id = get_uuid()
    rooms.append({
        "id": room_id,
        "code": f"{random.randint(100000, 999999)}",
        "owner_id": owner_id,
        "max_players": random.choice([4, 6, 8, 10]),
        "status": room_statuses[i % 4],
        "created_at": get_time(100 + i*5),
        "updated_at": get_time(100 + i*5)
    })

# 3. Room Members (15 rows)
# Distribute 15 memberships. Let's say user[i] joins room[i] as owner (already implied), 
# but to make 15 rows interesting, let's mix it up.
# Actually, the owner IS a member usually. Let's explicitly add owners as members + some others.
# To strictly follow "15 rows", we will add 15 membership records.
for i in range(15):
    # User i joins Room i (as owner or player)
    # Or User i joins Room (i % 5) to have multiple people in one room
    r_idx = i % 5 # 5 active rooms for this data
    u_idx = i
    
    room_id = rooms[r_idx]['id']
    user_id = profiles[u_idx]['id']
    
    role = 'owner' if rooms[r_idx]['owner_id'] == user_id else 'player'
    
    room_members.append({
        "id": get_uuid(),
        "room_id": room_id,
        "user_id": user_id,
        "role": role,
        "is_online": random.choice([True, False]),
        "joined_at": get_time(110 + i*2)
    })

# 4. Game Rounds (15 rows)
words = ["Apple", "Bicycle", "Cat", "Dog", "Elephant", "Fish", "Guitar", "House", "Ice Cream", "Jacket", "Kite", "Lion", "Moon", "Notebook", "Orange"]
for i in range(15):
    # Each room gets some rounds, or just distribute rounds across rooms
    r_idx = i % 15 # Each room gets a round for variety
    drawer_idx = (i + 1) % 15 # Shift drawer
    
    game_rounds.append({
        "id": get_uuid(),
        "room_id": rooms[r_idx]['id'],
        "drawer_id": profiles[drawer_idx]['id'],
        "target_word": words[i],
        "status": 'finished',
        "round_number": (i % 3) + 1,
        "created_at": get_time(200 + i*10)
    })

# 5. Drawings (15 rows)
for i in range(15):
    drawings.append({
        "id": get_uuid(),
        "round_id": game_rounds[i]['id'],
        "image_url": f"https://supabase-storage.com/drawings/img_{i}.png",
        "ai_raw_response": json.dumps({"labels": ["sketch", "line_art"], "description": f"A drawing of {words[i]}"}),
        "ai_hint_text": f"It looks like something related to {words[i]}...",
        "recognition_confidence": random.uniform(0.7, 0.99),
        "created_at": get_time(210 + i*10)
    })

# 6. Guess Records (15 rows)
for i in range(15):
    # User (i+2) guesses Drawing i
    guesser_idx = (i + 2) % 15
    is_correct = random.choice([True, False])
    
    guess_records.append({
        "id": get_uuid(),
        "drawing_id": drawings[i]['id'],
        "user_id": profiles[guesser_idx]['id'],
        "guess_content": words[i] if is_correct else "Something else",
        "is_correct": is_correct,
        "points_earned": 10 if is_correct else 0,
        "created_at": get_time(220 + i*10)
    })

# 7. Point Rules (15 rows)
rule_actions = [
    "guess_correct", "draw_accepted", "create_room", "join_room", "share_game",
    "streak_3", "streak_5", "perfect_round", "fast_guess", "first_blood",
    "daily_login", "invite_friend", "report_bug", "watch_ad", "vip_bonus"
]
for i in range(15):
    point_rules.append({
        "id": get_uuid(),
        "rule_key": rule_actions[i],
        "rule_name": f"Rule: {rule_actions[i].replace('_', ' ').title()}",
        "points_value": random.randint(5, 50),
        "is_active": True,
        "created_at": get_time(50),
        "updated_at": get_time(50)
    })

# 8. Point Records (15 rows)
for i in range(15):
    # Link a user to a rule
    u_idx = i
    r_idx = i
    
    point_records.append({
        "id": get_uuid(),
        "user_id": profiles[u_idx]['id'],
        "rule_id": point_rules[r_idx]['id'],
        "points_change": point_rules[r_idx]['points_value'],
        "source_id": guess_records[i]['id'] if i < 15 else None, # Link to a guess for context
        "created_at": get_time(300 + i*5)
    })

# 9. AI Configs (15 rows)
# Simulating history of config changes
models = ["gpt-4-vision-preview", "gpt-3.5-turbo", "dall-e-3"]
for i in range(15):
    ai_configs.append({
        "id": get_uuid(),
        "config_name": f"Config_v{i+1}",
        "openai_model": models[i % 3],
        "confidence_threshold": 0.5 + (i * 0.02),
        "prompt_template": f"Describe this image for a guessing game. Level {i+1}.",
        "is_active": (i == 14), # Only last one active
        "updated_at": get_time(400 + i*10)
    })

# 10. Rankings (15 rows)
for i in range(15):
    rankings.append({
        "id": get_uuid(),
        "user_id": profiles[i]['id'],
        "rank_position": i + 1,
        "snapshot_points": profiles[i]['total_points'],
        "period_type": "weekly",
        "calculated_at": get_time(500)
    })

# 11. Login Records (15 rows)
for i in range(15):
    login_records.append({
        "id": get_uuid(),
        "user_id": profiles[i]['id'],
        "ip_address": f"192.168.1.{100+i}",
        "login_time": get_time(600 + i*20)
    })

# Output SQL
print("-- 0. Seed auth.users (Required for foreign keys in profiles)")
print("INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, aud, role, email_confirmed_at) VALUES")
auth_values = []
for u in users:
    auth_values.append(f"('{u['id']}', '{u['email']}', '{u['encrypted_password']}', '{u['created_at']}', '{u['created_at']}', 'authenticated', 'authenticated', '{u['created_at']}')")
print(",\n".join(auth_values) + ";")
print("\n")

def generate_insert(table, data):
    if not data: return ""
    keys = data[0].keys()
    columns = ", ".join(keys)
    values_list = []
    
    for row in data:
        row_vals = []
        for k in keys:
            val = row[k]
            if isinstance(val, str):
                # Escape single quotes
                val = val.replace("'", "''")
                row_vals.append(f"'{val}'")
            elif isinstance(val, bool):
                row_vals.append("TRUE" if val else "FALSE")
            elif val is None:
                row_vals.append("NULL")
            else:
                row_vals.append(str(val))
        values_list.append(f"({', '.join(row_vals)})")
    
    return f"INSERT INTO public.{table} ({columns}) VALUES\n" + ",\n".join(values_list) + ";"

print("-- 1. Profiles")
print(generate_insert("profiles", profiles))
print("\n-- 2. Rooms")
print(generate_insert("rooms", rooms))
print("\n-- 3. Room Members")
print(generate_insert("room_members", room_members))
print("\n-- 4. Game Rounds")
print(generate_insert("game_rounds", game_rounds))
print("\n-- 5. Drawings")
print(generate_insert("drawings", drawings))
print("\n-- 6. Guess Records")
print(generate_insert("guess_records", guess_records))
print("\n-- 7. Point Rules")
print(generate_insert("point_rules", point_rules))
print("\n-- 8. Point Records")
print(generate_insert("point_records", point_records))
print("\n-- 9. AI Configs")
print(generate_insert("ai_configs", ai_configs))
print("\n-- 10. Rankings")
print(generate_insert("rankings", rankings))
print("\n-- 11. Login Records")
print(generate_insert("login_records", login_records))
