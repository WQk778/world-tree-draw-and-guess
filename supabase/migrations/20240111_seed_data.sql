-- 0. Seed auth.users (Required for foreign keys in profiles)
INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, aud, role, email_confirmed_at) VALUES
('8f337f95-df0e-4c1a-8ec9-d33d31b9fa7e', 'user1@example.com', 'scrypt:32768:8:1:k7/somehash...', '2026-01-10 20:44:58.985+00', '2026-01-10 20:44:58.985+00', 'authenticated', 'authenticated', '2026-01-10 20:44:58.985+00'),
('3e86374d-7fae-4aab-8720-ba2e5617f5b0', 'user2@example.com', 'scrypt:32768:8:1:k7/somehash...', '2026-01-10 20:54:58.987+00', '2026-01-10 20:54:58.987+00', 'authenticated', 'authenticated', '2026-01-10 20:54:58.987+00'),
('a21265f1-d6d8-4996-af4c-c2fde909e0a7', 'user3@example.com', 'scrypt:32768:8:1:k7/somehash...', '2026-01-10 21:04:58.987+00', '2026-01-10 21:04:58.987+00', 'authenticated', 'authenticated', '2026-01-10 21:04:58.987+00'),
('8b799b4a-42c1-4f54-a039-5ed76a46a019', 'user4@example.com', 'scrypt:32768:8:1:k7/somehash...', '2026-01-10 21:14:58.987+00', '2026-01-10 21:14:58.987+00', 'authenticated', 'authenticated', '2026-01-10 21:14:58.987+00'),
('98e7e4c7-625c-4387-b6b0-5fae310ce013', 'user5@example.com', 'scrypt:32768:8:1:k7/somehash...', '2026-01-10 21:24:58.987+00', '2026-01-10 21:24:58.987+00', 'authenticated', 'authenticated', '2026-01-10 21:24:58.987+00'),
('68b40fab-6810-428d-a07c-3c5dfd80bdac', 'user6@example.com', 'scrypt:32768:8:1:k7/somehash...', '2026-01-10 21:34:58.987+00', '2026-01-10 21:34:58.987+00', 'authenticated', 'authenticated', '2026-01-10 21:34:58.987+00'),
('8d3831f8-53ca-4901-8d15-5c8bc0699893', 'user7@example.com', 'scrypt:32768:8:1:k7/somehash...', '2026-01-10 21:44:58.987+00', '2026-01-10 21:44:58.987+00', 'authenticated', 'authenticated', '2026-01-10 21:44:58.987+00'),
('dbeec6cf-28ab-407c-97f8-e03cdbc2a222', 'user8@example.com', 'scrypt:32768:8:1:k7/somehash...', '2026-01-10 21:54:58.987+00', '2026-01-10 21:54:58.987+00', 'authenticated', 'authenticated', '2026-01-10 21:54:58.987+00'),
('07c693fd-0d8f-4fef-a9f8-dadd47cdee8a', 'user9@example.com', 'scrypt:32768:8:1:k7/somehash...', '2026-01-10 22:04:58.987+00', '2026-01-10 22:04:58.987+00', 'authenticated', 'authenticated', '2026-01-10 22:04:58.987+00'),
('ef188014-0783-4ca4-9ef1-cc3835cb8fac', 'user10@example.com', 'scrypt:32768:8:1:k7/somehash...', '2026-01-10 22:14:58.987+00', '2026-01-10 22:14:58.987+00', 'authenticated', 'authenticated', '2026-01-10 22:14:58.987+00'),
('f00bae8b-8997-464b-8d95-5b9d47cc3e00', 'user11@example.com', 'scrypt:32768:8:1:k7/somehash...', '2026-01-10 22:24:58.987+00', '2026-01-10 22:24:58.987+00', 'authenticated', 'authenticated', '2026-01-10 22:24:58.987+00'),
('9efccddb-589d-4485-841f-a70b43a4b864', 'user12@example.com', 'scrypt:32768:8:1:k7/somehash...', '2026-01-10 22:34:58.987+00', '2026-01-10 22:34:58.987+00', 'authenticated', 'authenticated', '2026-01-10 22:34:58.987+00'),
('46b0a50e-387d-43b2-a076-b47475a93844', 'user13@example.com', 'scrypt:32768:8:1:k7/somehash...', '2026-01-10 22:44:58.987+00', '2026-01-10 22:44:58.987+00', 'authenticated', 'authenticated', '2026-01-10 22:44:58.987+00'),
('a7e04f4a-efda-4b43-bf7e-57cd6b979046', 'user14@example.com', 'scrypt:32768:8:1:k7/somehash...', '2026-01-10 22:54:58.987+00', '2026-01-10 22:54:58.987+00', 'authenticated', 'authenticated', '2026-01-10 22:54:58.987+00'),
('bc1b8673-5b27-456d-9145-645ccf99fc52', 'user15@example.com', 'scrypt:32768:8:1:k7/somehash...', '2026-01-10 23:04:58.987+00', '2026-01-10 23:04:58.987+00', 'authenticated', 'authenticated', '2026-01-10 23:04:58.987+00');

-- 1. Profiles
INSERT INTO public.profiles (id, nickname, avatar_url, total_points, created_at, updated_at) VALUES
('8f337f95-df0e-4c1a-8ec9-d33d31b9fa7e', 'ArtMaster99', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', 3383, '2026-01-10 20:44:58.985+00', '2026-01-10 20:44:58.985+00'),
('3e86374d-7fae-4aab-8720-ba2e5617f5b0', 'PixelQueen', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka', 383, '2026-01-10 20:54:58.987+00', '2026-01-10 20:54:58.987+00'),
('a21265f1-d6d8-4996-af4c-c2fde909e0a7', 'DoodleKing', 'https://api.dicebear.com/7.x/bottts/svg?seed=Ginger', 4336, '2026-01-10 21:04:58.987+00', '2026-01-10 21:04:58.987+00'),
('8b799b4a-42c1-4f54-a039-5ed76a46a019', 'ColorWizard', 'https://api.dicebear.com/7.x/adventurer/svg?seed=Cookie', 4481, '2026-01-10 21:14:58.987+00', '2026-01-10 21:14:58.987+00'),
('98e7e4c7-625c-4387-b6b0-5fae310ce013', 'SketchyGuy', 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Precious', 1210, '2026-01-10 21:24:58.987+00', '2026-01-10 21:24:58.987+00'),
('68b40fab-6810-428d-a07c-3c5dfd80bdac', 'CanvasHero', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', 2215, '2026-01-10 21:34:58.987+00', '2026-01-10 21:34:58.987+00'),
('8d3831f8-53ca-4901-8d15-5c8bc0699893', 'BrushBoss', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka', 3028, '2026-01-10 21:44:58.987+00', '2026-01-10 21:44:58.987+00'),
('dbeec6cf-28ab-407c-97f8-e03cdbc2a222', 'PalettePro', 'https://api.dicebear.com/7.x/bottts/svg?seed=Ginger', 4011, '2026-01-10 21:54:58.987+00', '2026-01-10 21:54:58.987+00'),
('07c693fd-0d8f-4fef-a9f8-dadd47cdee8a', 'InkSplasher', 'https://api.dicebear.com/7.x/adventurer/svg?seed=Cookie', 3301, '2026-01-10 22:04:58.987+00', '2026-01-10 22:04:58.987+00'),
('ef188014-0783-4ca4-9ef1-cc3835cb8fac', 'DrawDaily', 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Precious', 3475, '2026-01-10 22:14:58.987+00', '2026-01-10 22:14:58.987+00'),
('f00bae8b-8997-464b-8d95-5b9d47cc3e00', 'CreativeMind', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', 997, '2026-01-10 22:24:58.987+00', '2026-01-10 22:24:58.987+00'),
('9efccddb-589d-4485-841f-a70b43a4b864', 'VisualVibe', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka', 1979, '2026-01-10 22:34:58.987+00', '2026-01-10 22:34:58.987+00'),
('46b0a50e-387d-43b2-a076-b47475a93844', 'ArtisticSoul', 'https://api.dicebear.com/7.x/bottts/svg?seed=Ginger', 2874, '2026-01-10 22:44:58.987+00', '2026-01-10 22:44:58.987+00'),
('a7e04f4a-efda-4b43-bf7e-57cd6b979046', 'DesignGuru', 'https://api.dicebear.com/7.x/adventurer/svg?seed=Cookie', 3161, '2026-01-10 22:54:58.987+00', '2026-01-10 22:54:58.987+00'),
('bc1b8673-5b27-456d-9145-645ccf99fc52', 'PencilPusher', 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Precious', 3063, '2026-01-10 23:04:58.987+00', '2026-01-10 23:04:58.987+00');

-- 2. Rooms
INSERT INTO public.rooms (id, code, owner_id, max_players, status, created_at, updated_at) VALUES
('0e144a15-7f3d-4c40-80bf-ae041a3688f5', '453094', '8f337f95-df0e-4c1a-8ec9-d33d31b9fa7e', 6, 'waiting', '2026-01-10 22:24:58.987+00', '2026-01-10 22:24:58.987+00'),
('0cc66337-4107-4493-9395-5e5af16c52ef', '184337', '3e86374d-7fae-4aab-8720-ba2e5617f5b0', 4, 'playing', '2026-01-10 22:29:58.987+00', '2026-01-10 22:29:58.987+00'),
('0a73da2e-41b7-4199-bb59-529175557ac9', '190667', 'a21265f1-d6d8-4996-af4c-c2fde909e0a7', 4, 'finished', '2026-01-10 22:34:58.987+00', '2026-01-10 22:34:58.987+00'),
('f351be79-4577-4dd3-9ba9-6803f8542238', '626023', '8b799b4a-42c1-4f54-a039-5ed76a46a019', 10, 'timeout', '2026-01-10 22:39:58.987+00', '2026-01-10 22:39:58.987+00'),
('e6c0b702-5651-428d-8474-bf75589a35c1', '652775', '98e7e4c7-625c-4387-b6b0-5fae310ce013', 8, 'waiting', '2026-01-10 22:44:58.987+00', '2026-01-10 22:44:58.987+00'),
('1d3a997a-fc89-4701-b792-f914d76f13d4', '929949', '68b40fab-6810-428d-a07c-3c5dfd80bdac', 4, 'playing', '2026-01-10 22:49:58.987+00', '2026-01-10 22:49:58.987+00'),
('cb3e8de0-5f18-45d3-91ac-c850355374c8', '864181', '8d3831f8-53ca-4901-8d15-5c8bc0699893', 10, 'finished', '2026-01-10 22:54:58.987+00', '2026-01-10 22:54:58.987+00'),
('db288123-3b99-4006-9f79-5e2ddbdfeead', '596695', 'dbeec6cf-28ab-407c-97f8-e03cdbc2a222', 4, 'timeout', '2026-01-10 22:59:58.987+00', '2026-01-10 22:59:58.987+00'),
('d1be0f14-33e7-4d42-851b-bff3b25a685b', '438543', '07c693fd-0d8f-4fef-a9f8-dadd47cdee8a', 10, 'waiting', '2026-01-10 23:04:58.987+00', '2026-01-10 23:04:58.987+00'),
('4ed31785-4f47-42a4-951a-609a9c4518d5', '474512', 'ef188014-0783-4ca4-9ef1-cc3835cb8fac', 10, 'playing', '2026-01-10 23:09:58.987+00', '2026-01-10 23:09:58.987+00'),
('f6ce73ff-ccd8-41c4-a8b3-0077cb265b0c', '862914', 'f00bae8b-8997-464b-8d95-5b9d47cc3e00', 4, 'finished', '2026-01-10 23:14:58.987+00', '2026-01-10 23:14:58.987+00'),
('eb7f5cc7-9db3-4522-9381-81a52b376642', '468525', '9efccddb-589d-4485-841f-a70b43a4b864', 10, 'timeout', '2026-01-10 23:19:58.987+00', '2026-01-10 23:19:58.987+00'),
('dd3fd8b2-021d-4b98-9162-bf907c895dd8', '145972', '46b0a50e-387d-43b2-a076-b47475a93844', 8, 'waiting', '2026-01-10 23:24:58.987+00', '2026-01-10 23:24:58.987+00'),
('f2d9cc60-d52b-4822-ae16-3b5736454b67', '198740', 'a7e04f4a-efda-4b43-bf7e-57cd6b979046', 10, 'playing', '2026-01-10 23:29:58.987+00', '2026-01-10 23:29:58.987+00'),
('a578fe87-3ea7-4e0a-ac56-1edf9f4e7035', '567821', 'bc1b8673-5b27-456d-9145-645ccf99fc52', 4, 'finished', '2026-01-10 23:34:58.987+00', '2026-01-10 23:34:58.987+00');

-- 3. Room Members
INSERT INTO public.room_members (id, room_id, user_id, role, is_online, joined_at) VALUES
('b413a276-247b-49ce-bf42-b49b8ff6beed', '0e144a15-7f3d-4c40-80bf-ae041a3688f5', '8f337f95-df0e-4c1a-8ec9-d33d31b9fa7e', 'owner', TRUE, '2026-01-10 22:34:58.987+00'),
('eb7ca362-a686-4ad0-a2e5-5135116f9821', '0cc66337-4107-4493-9395-5e5af16c52ef', '3e86374d-7fae-4aab-8720-ba2e5617f5b0', 'owner', TRUE, '2026-01-10 22:36:58.987+00'),
('1c25cce7-cef6-40fc-8964-c2f34210980d', '0a73da2e-41b7-4199-bb59-529175557ac9', 'a21265f1-d6d8-4996-af4c-c2fde909e0a7', 'owner', TRUE, '2026-01-10 22:38:58.987+00'),
('e00a3cc0-5725-4a75-952e-7453786273ad', 'f351be79-4577-4dd3-9ba9-6803f8542238', '8b799b4a-42c1-4f54-a039-5ed76a46a019', 'owner', TRUE, '2026-01-10 22:40:58.987+00'),
('342ba30f-9d57-42f5-bca5-7e9d40526afd', 'e6c0b702-5651-428d-8474-bf75589a35c1', '98e7e4c7-625c-4387-b6b0-5fae310ce013', 'owner', TRUE, '2026-01-10 22:42:58.987+00'),
('9b22242c-9d1c-47a5-b5e2-5bc157bc7b70', '0e144a15-7f3d-4c40-80bf-ae041a3688f5', '68b40fab-6810-428d-a07c-3c5dfd80bdac', 'player', TRUE, '2026-01-10 22:44:58.987+00'),
('4f910070-27e0-4fa9-86ce-d0f84a8c16fb', '0cc66337-4107-4493-9395-5e5af16c52ef', '8d3831f8-53ca-4901-8d15-5c8bc0699893', 'player', FALSE, '2026-01-10 22:46:58.987+00'),
('c5d727cc-252a-4e83-8da0-b0b46d13883d', '0a73da2e-41b7-4199-bb59-529175557ac9', 'dbeec6cf-28ab-407c-97f8-e03cdbc2a222', 'player', FALSE, '2026-01-10 22:48:58.987+00'),
('65ea0a05-ef31-4915-8120-c236c50c5f51', 'f351be79-4577-4dd3-9ba9-6803f8542238', '07c693fd-0d8f-4fef-a9f8-dadd47cdee8a', 'player', FALSE, '2026-01-10 22:50:58.987+00'),
('6115d6a6-0c10-4c2c-8e87-b2254ac9dcd9', 'e6c0b702-5651-428d-8474-bf75589a35c1', 'ef188014-0783-4ca4-9ef1-cc3835cb8fac', 'player', TRUE, '2026-01-10 22:52:58.987+00'),
('ccd550eb-da6e-4dc5-b488-0630e0bc97eb', '0e144a15-7f3d-4c40-80bf-ae041a3688f5', 'f00bae8b-8997-464b-8d95-5b9d47cc3e00', 'player', FALSE, '2026-01-10 22:54:58.987+00'),
('af88ede1-af67-492f-a1f2-8cd8c4d68a40', '0cc66337-4107-4493-9395-5e5af16c52ef', '9efccddb-589d-4485-841f-a70b43a4b864', 'player', FALSE, '2026-01-10 22:56:58.987+00'),
('8aa0fbb6-5433-4987-8265-c209abb7ce34', '0a73da2e-41b7-4199-bb59-529175557ac9', '46b0a50e-387d-43b2-a076-b47475a93844', 'player', FALSE, '2026-01-10 22:58:58.987+00'),
('ceb4b396-b599-4d66-9b14-943441531324', 'f351be79-4577-4dd3-9ba9-6803f8542238', 'a7e04f4a-efda-4b43-bf7e-57cd6b979046', 'player', TRUE, '2026-01-10 23:00:58.987+00'),
('300ae410-947a-4903-b910-ca24426ce79b', 'e6c0b702-5651-428d-8474-bf75589a35c1', 'bc1b8673-5b27-456d-9145-645ccf99fc52', 'player', TRUE, '2026-01-10 23:02:58.987+00');

-- 4. Game Rounds
INSERT INTO public.game_rounds (id, room_id, drawer_id, target_word, status, round_number, created_at) VALUES
('31b23882-1c6f-433f-8d25-5767d37db376', '0e144a15-7f3d-4c40-80bf-ae041a3688f5', '3e86374d-7fae-4aab-8720-ba2e5617f5b0', 'Apple', 'finished', 1, '2026-01-11 00:04:58.987+00'),
('71a2fc42-6692-4455-8611-e2f98f1c22f9', '0cc66337-4107-4493-9395-5e5af16c52ef', 'a21265f1-d6d8-4996-af4c-c2fde909e0a7', 'Bicycle', 'finished', 2, '2026-01-11 00:14:58.987+00'),
('ebcaa0de-1b1a-499c-a295-ffadfd042cc5', '0a73da2e-41b7-4199-bb59-529175557ac9', '8b799b4a-42c1-4f54-a039-5ed76a46a019', 'Cat', 'finished', 3, '2026-01-11 00:24:58.987+00'),
('1168a4ba-88b4-409b-94c9-600b3b89eb4f', 'f351be79-4577-4dd3-9ba9-6803f8542238', '98e7e4c7-625c-4387-b6b0-5fae310ce013', 'Dog', 'finished', 1, '2026-01-11 00:34:58.987+00'),
('57a5e743-2f36-4d43-aaf7-28f7a0ce61ea', 'e6c0b702-5651-428d-8474-bf75589a35c1', '68b40fab-6810-428d-a07c-3c5dfd80bdac', 'Elephant', 'finished', 2, '2026-01-11 00:44:58.987+00'),
('d250e5db-4e2c-4175-a283-7c31cf48dcbe', '1d3a997a-fc89-4701-b792-f914d76f13d4', '8d3831f8-53ca-4901-8d15-5c8bc0699893', 'Fish', 'finished', 3, '2026-01-11 00:54:58.987+00'),
('3665751c-8909-4e7d-a57d-ffbed1deefa7', 'cb3e8de0-5f18-45d3-91ac-c850355374c8', 'dbeec6cf-28ab-407c-97f8-e03cdbc2a222', 'Guitar', 'finished', 1, '2026-01-11 01:04:58.987+00'),
('8a9a0b5c-d3e0-46cc-a019-b432084f3492', 'db288123-3b99-4006-9f79-5e2ddbdfeead', '07c693fd-0d8f-4fef-a9f8-dadd47cdee8a', 'House', 'finished', 2, '2026-01-11 01:14:58.987+00'),
('3d5af052-b554-4d73-86d6-2a8beb998d7c', 'd1be0f14-33e7-4d42-851b-bff3b25a685b', 'ef188014-0783-4ca4-9ef1-cc3835cb8fac', 'Ice Cream', 'finished', 3, '2026-01-11 01:24:58.987+00'),
('eaf4feef-0067-4c48-9cf2-0ed16f0c44c2', '4ed31785-4f47-42a4-951a-609a9c4518d5', 'f00bae8b-8997-464b-8d95-5b9d47cc3e00', 'Jacket', 'finished', 1, '2026-01-11 01:34:58.987+00'),
('b759489a-b88e-46f9-a677-42822f14f010', 'f6ce73ff-ccd8-41c4-a8b3-0077cb265b0c', '9efccddb-589d-4485-841f-a70b43a4b864', 'Kite', 'finished', 2, '2026-01-11 01:44:58.987+00'),
('a248d9a5-87a3-40a4-b35c-2b945a5f594c', 'eb7f5cc7-9db3-4522-9381-81a52b376642', '46b0a50e-387d-43b2-a076-b47475a93844', 'Lion', 'finished', 3, '2026-01-11 01:54:58.987+00'),
('f1d5b71f-821f-412f-895b-72ffb30e40ec', 'dd3fd8b2-021d-4b98-9162-bf907c895dd8', 'a7e04f4a-efda-4b43-bf7e-57cd6b979046', 'Moon', 'finished', 1, '2026-01-11 02:04:58.987+00'),
('1d2705f5-5c33-40ee-a4ab-2327c164405b', 'f2d9cc60-d52b-4822-ae16-3b5736454b67', 'bc1b8673-5b27-456d-9145-645ccf99fc52', 'Notebook', 'finished', 2, '2026-01-11 02:14:58.987+00'),
('bdc61769-e986-4df8-bfb2-00170002a9d6', 'a578fe87-3ea7-4e0a-ac56-1edf9f4e7035', '8f337f95-df0e-4c1a-8ec9-d33d31b9fa7e', 'Orange', 'finished', 3, '2026-01-11 02:24:58.987+00');

-- 5. Drawings
INSERT INTO public.drawings (id, round_id, image_url, ai_raw_response, ai_hint_text, recognition_confidence, created_at) VALUES
('d38ae6a5-da50-41ea-a7fc-23d9d0b45a8d', '31b23882-1c6f-433f-8d25-5767d37db376', 'https://supabase-storage.com/drawings/img_0.png', '{"labels":["sketch","line_art"],"description":"A drawing of Apple"}', 'It looks like something related to Apple...', 0.9369934726264606, '2026-01-11 00:14:58.987+00'),
('7fe8feab-a7b5-4d52-b58a-207ebb1bca31', '71a2fc42-6692-4455-8611-e2f98f1c22f9', 'https://supabase-storage.com/drawings/img_1.png', '{"labels":["sketch","line_art"],"description":"A drawing of Bicycle"}', 'It looks like something related to Bicycle...', 0.7282510862485778, '2026-01-11 00:24:58.987+00'),
('7e682b27-ab0d-4a15-b311-1451b5efd4fa', 'ebcaa0de-1b1a-499c-a295-ffadfd042cc5', 'https://supabase-storage.com/drawings/img_2.png', '{"labels":["sketch","line_art"],"description":"A drawing of Cat"}', 'It looks like something related to Cat...', 0.8323268585439337, '2026-01-11 00:34:58.987+00'),
('3f38d6ce-82d6-4b86-bc65-3d37bc3e741f', '1168a4ba-88b4-409b-94c9-600b3b89eb4f', 'https://supabase-storage.com/drawings/img_3.png', '{"labels":["sketch","line_art"],"description":"A drawing of Dog"}', 'It looks like something related to Dog...', 0.7199501076261792, '2026-01-11 00:44:58.987+00'),
('e7df40e1-d80c-46b7-80e9-e7a17d10fddc', '57a5e743-2f36-4d43-aaf7-28f7a0ce61ea', 'https://supabase-storage.com/drawings/img_4.png', '{"labels":["sketch","line_art"],"description":"A drawing of Elephant"}', 'It looks like something related to Elephant...', 0.7057993136761395, '2026-01-11 00:54:58.987+00'),
('09fb5355-5875-419e-9749-5493ba605051', 'd250e5db-4e2c-4175-a283-7c31cf48dcbe', 'https://supabase-storage.com/drawings/img_5.png', '{"labels":["sketch","line_art"],"description":"A drawing of Fish"}', 'It looks like something related to Fish...', 0.9550360047937139, '2026-01-11 01:04:58.987+00'),
('7ec63907-2d8f-4b54-af89-4b1d337f20dc', '3665751c-8909-4e7d-a57d-ffbed1deefa7', 'https://supabase-storage.com/drawings/img_6.png', '{"labels":["sketch","line_art"],"description":"A drawing of Guitar"}', 'It looks like something related to Guitar...', 0.7381780688524682, '2026-01-11 01:14:58.987+00'),
('ceb68cbf-96aa-448a-b119-a5cc922593cf', '8a9a0b5c-d3e0-46cc-a019-b432084f3492', 'https://supabase-storage.com/drawings/img_7.png', '{"labels":["sketch","line_art"],"description":"A drawing of House"}', 'It looks like something related to House...', 0.7858128473547575, '2026-01-11 01:24:58.987+00'),
('c544d584-a3b8-4e57-a96d-c6b8d74a14a4', '3d5af052-b554-4d73-86d6-2a8beb998d7c', 'https://supabase-storage.com/drawings/img_8.png', '{"labels":["sketch","line_art"],"description":"A drawing of Ice Cream"}', 'It looks like something related to Ice Cream...', 0.9346702489039613, '2026-01-11 01:34:58.987+00'),
('9dbcccb4-c928-4c06-91ae-8b99d6b06776', 'eaf4feef-0067-4c48-9cf2-0ed16f0c44c2', 'https://supabase-storage.com/drawings/img_9.png', '{"labels":["sketch","line_art"],"description":"A drawing of Jacket"}', 'It looks like something related to Jacket...', 0.8449836473974724, '2026-01-11 01:44:58.987+00'),
('8998d901-48bc-4e26-9185-3afbf277009a', 'b759489a-b88e-46f9-a677-42822f14f010', 'https://supabase-storage.com/drawings/img_10.png', '{"labels":["sketch","line_art"],"description":"A drawing of Kite"}', 'It looks like something related to Kite...', 0.8965080909268404, '2026-01-11 01:54:58.987+00'),
('d54182fb-c345-4e20-bba8-3a5b6ff84f7f', 'a248d9a5-87a3-40a4-b35c-2b945a5f594c', 'https://supabase-storage.com/drawings/img_11.png', '{"labels":["sketch","line_art"],"description":"A drawing of Lion"}', 'It looks like something related to Lion...', 0.8208638726085421, '2026-01-11 02:04:58.987+00'),
('7f359d80-4248-498c-b244-5fe31bedf2d0', 'f1d5b71f-821f-412f-895b-72ffb30e40ec', 'https://supabase-storage.com/drawings/img_12.png', '{"labels":["sketch","line_art"],"description":"A drawing of Moon"}', 'It looks like something related to Moon...', 0.9043396092673404, '2026-01-11 02:14:58.987+00'),
('d37ca02b-9c61-40b1-8725-8438d1f7c060', '1d2705f5-5c33-40ee-a4ab-2327c164405b', 'https://supabase-storage.com/drawings/img_13.png', '{"labels":["sketch","line_art"],"description":"A drawing of Notebook"}', 'It looks like something related to Notebook...', 0.9536468412141078, '2026-01-11 02:24:58.987+00'),
('d76aa1f3-410d-456b-881f-13d3505a27ea', 'bdc61769-e986-4df8-bfb2-00170002a9d6', 'https://supabase-storage.com/drawings/img_14.png', '{"labels":["sketch","line_art"],"description":"A drawing of Orange"}', 'It looks like something related to Orange...', 0.8228608249488217, '2026-01-11 02:34:58.987+00');

-- 6. Guess Records
INSERT INTO public.guess_records (id, drawing_id, user_id, guess_content, is_correct, points_earned, created_at) VALUES
('377408a7-9aac-4781-8db1-ac1f29d5fa0f', 'd38ae6a5-da50-41ea-a7fc-23d9d0b45a8d', 'a21265f1-d6d8-4996-af4c-c2fde909e0a7', 'Apple', TRUE, 10, '2026-01-11 00:24:58.987+00'),
('9368a02b-578d-4b40-b2b6-a895e7de4c07', '7fe8feab-a7b5-4d52-b58a-207ebb1bca31', '8b799b4a-42c1-4f54-a039-5ed76a46a019', 'Bicycle', TRUE, 10, '2026-01-11 00:34:58.987+00'),
('4d1a5c3f-ef3d-458f-b153-4ce226a67298', '7e682b27-ab0d-4a15-b311-1451b5efd4fa', '98e7e4c7-625c-4387-b6b0-5fae310ce013', 'Something else', FALSE, 0, '2026-01-11 00:44:58.987+00'),
('714d6bc5-e132-42c0-a96d-d3e9025b9935', '3f38d6ce-82d6-4b86-bc65-3d37bc3e741f', '68b40fab-6810-428d-a07c-3c5dfd80bdac', 'Something else', FALSE, 0, '2026-01-11 00:54:58.987+00'),
('d4aedd7f-b226-4cef-9978-78f4e3bf7542', 'e7df40e1-d80c-46b7-80e9-e7a17d10fddc', '8d3831f8-53ca-4901-8d15-5c8bc0699893', 'Elephant', TRUE, 10, '2026-01-11 01:04:58.987+00'),
('4d3c254c-697f-4e50-8353-76e0ac969c4e', '09fb5355-5875-419e-9749-5493ba605051', 'dbeec6cf-28ab-407c-97f8-e03cdbc2a222', 'Something else', FALSE, 0, '2026-01-11 01:14:58.987+00'),
('7554c518-6238-41b4-b05e-9e1b8f9dae4a', '7ec63907-2d8f-4b54-af89-4b1d337f20dc', '07c693fd-0d8f-4fef-a9f8-dadd47cdee8a', 'Guitar', TRUE, 10, '2026-01-11 01:24:58.987+00'),
('1134c435-3b20-46a9-bc48-e5d601fc790b', 'ceb68cbf-96aa-448a-b119-a5cc922593cf', 'ef188014-0783-4ca4-9ef1-cc3835cb8fac', 'Something else', FALSE, 0, '2026-01-11 01:34:58.987+00'),
('856634bb-51a3-4cc3-b536-d1bbcdb84f62', 'c544d584-a3b8-4e57-a96d-c6b8d74a14a4', 'f00bae8b-8997-464b-8d95-5b9d47cc3e00', 'Something else', FALSE, 0, '2026-01-11 01:44:58.987+00'),
('67fbc2f1-8f6d-473e-a622-8fb525f4958a', '9dbcccb4-c928-4c06-91ae-8b99d6b06776', '9efccddb-589d-4485-841f-a70b43a4b864', 'Jacket', TRUE, 10, '2026-01-11 01:54:58.987+00'),
('252e680b-7a7f-48f0-805d-fadeabedc535', '8998d901-48bc-4e26-9185-3afbf277009a', '46b0a50e-387d-43b2-a076-b47475a93844', 'Something else', FALSE, 0, '2026-01-11 02:04:58.987+00'),
('586d1fad-528d-4b99-9539-2099e918a877', 'd54182fb-c345-4e20-bba8-3a5b6ff84f7f', 'a7e04f4a-efda-4b43-bf7e-57cd6b979046', 'Lion', TRUE, 10, '2026-01-11 02:14:58.987+00'),
('e3cd6410-104f-49d1-af14-643665144aea', '7f359d80-4248-498c-b244-5fe31bedf2d0', 'bc1b8673-5b27-456d-9145-645ccf99fc52', 'Something else', FALSE, 0, '2026-01-11 02:24:58.987+00'),
('a92d2cda-94c9-4366-9074-c7dfb25e672e', 'd37ca02b-9c61-40b1-8725-8438d1f7c060', '8f337f95-df0e-4c1a-8ec9-d33d31b9fa7e', 'Notebook', TRUE, 10, '2026-01-11 02:34:58.987+00'),
('41936301-78e6-403a-9cb6-92ada4d7a24a', 'd76aa1f3-410d-456b-881f-13d3505a27ea', '3e86374d-7fae-4aab-8720-ba2e5617f5b0', 'Orange', TRUE, 10, '2026-01-11 02:44:58.987+00');

-- 7. Point Rules
INSERT INTO public.point_rules (id, rule_key, rule_name, points_value, is_active, created_at, updated_at) VALUES
('e0f59187-5b42-4a71-ab0e-a56a04a736af', 'guess_correct', 'Rule: Guess Correct', 28, TRUE, '2026-01-10 21:34:58.987+00', '2026-01-10 21:34:58.987+00'),
('d334abd3-2d25-4986-92ab-9a617d661517', 'draw_accepted', 'Rule: Draw Accepted', 43, TRUE, '2026-01-10 21:34:58.987+00', '2026-01-10 21:34:58.987+00'),
('bf067876-0f16-45a9-b1dd-20b2cb94e4e3', 'create_room', 'Rule: Create Room', 34, TRUE, '2026-01-10 21:34:58.987+00', '2026-01-10 21:34:58.987+00'),
('61f57e5b-8637-428f-88f2-67f1f47b1614', 'join_room', 'Rule: Join Room', 33, TRUE, '2026-01-10 21:34:58.987+00', '2026-01-10 21:34:58.987+00'),
('70afdf22-736f-450d-bba3-601b17c8445b', 'share_game', 'Rule: Share Game', 27, TRUE, '2026-01-10 21:34:58.987+00', '2026-01-10 21:34:58.987+00'),
('ae173e8e-b1a6-4157-90ce-6a2af70a06a0', 'streak_3', 'Rule: Streak 3', 36, TRUE, '2026-01-10 21:34:58.987+00', '2026-01-10 21:34:58.987+00'),
('40154e35-0582-41a4-8da1-579620f63d6c', 'streak_5', 'Rule: Streak 5', 32, TRUE, '2026-01-10 21:34:58.987+00', '2026-01-10 21:34:58.987+00'),
('2214122a-6dab-4c68-b1db-d3af6f9e0b73', 'perfect_round', 'Rule: Perfect Round', 43, TRUE, '2026-01-10 21:34:58.987+00', '2026-01-10 21:34:58.987+00'),
('eacbc0eb-f9f0-4c3a-a4da-915f2f518141', 'fast_guess', 'Rule: Fast Guess', 42, TRUE, '2026-01-10 21:34:58.987+00', '2026-01-10 21:34:58.987+00'),
('ad63e8e2-30fe-491e-9840-b89c4fc8e745', 'first_blood', 'Rule: First Blood', 16, TRUE, '2026-01-10 21:34:58.987+00', '2026-01-10 21:34:58.987+00'),
('08703a20-9531-4cc6-806c-a9787569f2dd', 'daily_login', 'Rule: Daily Login', 39, TRUE, '2026-01-10 21:34:58.987+00', '2026-01-10 21:34:58.987+00'),
('35a63c4d-be0f-44b8-a2d0-bf6eaccfb471', 'invite_friend', 'Rule: Invite Friend', 36, TRUE, '2026-01-10 21:34:58.987+00', '2026-01-10 21:34:58.987+00'),
('98655c26-f6cf-4b29-b0e5-ffb29244183c', 'report_bug', 'Rule: Report Bug', 39, TRUE, '2026-01-10 21:34:58.987+00', '2026-01-10 21:34:58.987+00'),
('9fd6a11d-a472-407c-b3cb-08f4cd6961b8', 'watch_ad', 'Rule: Watch Ad', 8, TRUE, '2026-01-10 21:34:58.987+00', '2026-01-10 21:34:58.987+00'),
('67d45b9d-a09a-4026-b0a7-cef5e9f9ae1a', 'vip_bonus', 'Rule: Vip Bonus', 43, TRUE, '2026-01-10 21:34:58.987+00', '2026-01-10 21:34:58.987+00');

-- 8. Point Records
INSERT INTO public.point_records (id, user_id, rule_id, points_change, source_id, created_at) VALUES
('d32dc5fd-25ef-4cb5-b757-580673909891', '8f337f95-df0e-4c1a-8ec9-d33d31b9fa7e', 'e0f59187-5b42-4a71-ab0e-a56a04a736af', 28, '377408a7-9aac-4781-8db1-ac1f29d5fa0f', '2026-01-11 01:44:58.987+00'),
('fe177f6a-0c0f-445f-98d2-f4212c5156b3', '3e86374d-7fae-4aab-8720-ba2e5617f5b0', 'd334abd3-2d25-4986-92ab-9a617d661517', 43, '9368a02b-578d-4b40-b2b6-a895e7de4c07', '2026-01-11 01:49:58.987+00'),
('8f3672c9-fad4-477e-b903-c0f825a28d9b', 'a21265f1-d6d8-4996-af4c-c2fde909e0a7', 'bf067876-0f16-45a9-b1dd-20b2cb94e4e3', 34, '4d1a5c3f-ef3d-458f-b153-4ce226a67298', '2026-01-11 01:54:58.987+00'),
('499889f0-feff-4e1a-b693-cfb71bd56d86', '8b799b4a-42c1-4f54-a039-5ed76a46a019', '61f57e5b-8637-428f-88f2-67f1f47b1614', 33, '714d6bc5-e132-42c0-a96d-d3e9025b9935', '2026-01-11 01:59:58.987+00'),
('314354cc-83ad-46f9-ba0a-894e0f7032c0', '98e7e4c7-625c-4387-b6b0-5fae310ce013', '70afdf22-736f-450d-bba3-601b17c8445b', 27, 'd4aedd7f-b226-4cef-9978-78f4e3bf7542', '2026-01-11 02:04:58.987+00'),
('1a971d34-8653-4970-ab42-9a5bc0c5fde1', '68b40fab-6810-428d-a07c-3c5dfd80bdac', 'ae173e8e-b1a6-4157-90ce-6a2af70a06a0', 36, '4d3c254c-697f-4e50-8353-76e0ac969c4e', '2026-01-11 02:09:58.987+00'),
('98a57a50-c027-4031-966d-e6608f5d185f', '8d3831f8-53ca-4901-8d15-5c8bc0699893', '40154e35-0582-41a4-8da1-579620f63d6c', 32, '7554c518-6238-41b4-b05e-9e1b8f9dae4a', '2026-01-11 02:14:58.987+00'),
('56d2e3e4-487e-417d-a386-96dfd44150f2', 'dbeec6cf-28ab-407c-97f8-e03cdbc2a222', '2214122a-6dab-4c68-b1db-d3af6f9e0b73', 43, '1134c435-3b20-46a9-bc48-e5d601fc790b', '2026-01-11 02:19:58.987+00'),
('5c2ad9bc-f9dd-43b0-9447-c804beef85a2', '07c693fd-0d8f-4fef-a9f8-dadd47cdee8a', 'eacbc0eb-f9f0-4c3a-a4da-915f2f518141', 42, '856634bb-51a3-4cc3-b536-d1bbcdb84f62', '2026-01-11 02:24:58.987+00'),
('b7aee810-837e-4545-a4d2-68678a07cd84', 'ef188014-0783-4ca4-9ef1-cc3835cb8fac', 'ad63e8e2-30fe-491e-9840-b89c4fc8e745', 16, '67fbc2f1-8f6d-473e-a622-8fb525f4958a', '2026-01-11 02:29:58.987+00'),
('c6d5df33-0441-4d4d-9fb9-74680cdced52', 'f00bae8b-8997-464b-8d95-5b9d47cc3e00', '08703a20-9531-4cc6-806c-a9787569f2dd', 39, '252e680b-7a7f-48f0-805d-fadeabedc535', '2026-01-11 02:34:58.987+00'),
('41979c52-0d07-43c8-bbe1-f427f1db3d11', '9efccddb-589d-4485-841f-a70b43a4b864', '35a63c4d-be0f-44b8-a2d0-bf6eaccfb471', 36, '586d1fad-528d-4b99-9539-2099e918a877', '2026-01-11 02:39:58.987+00'),
('32363b3a-9b33-4774-af8d-06023f283796', '46b0a50e-387d-43b2-a076-b47475a93844', '98655c26-f6cf-4b29-b0e5-ffb29244183c', 39, 'e3cd6410-104f-49d1-af14-643665144aea', '2026-01-11 02:44:58.987+00'),
('f6efb988-175b-4042-8384-0526eab7724b', 'a7e04f4a-efda-4b43-bf7e-57cd6b979046', '9fd6a11d-a472-407c-b3cb-08f4cd6961b8', 8, 'a92d2cda-94c9-4366-9074-c7dfb25e672e', '2026-01-11 02:49:58.987+00'),
('d0242911-6803-47e5-8312-296b04734531', 'bc1b8673-5b27-456d-9145-645ccf99fc52', '67d45b9d-a09a-4026-b0a7-cef5e9f9ae1a', 43, '41936301-78e6-403a-9cb6-92ada4d7a24a', '2026-01-11 02:54:58.987+00');

-- 9. AI Configs
INSERT INTO public.ai_configs (id, config_name, openai_model, confidence_threshold, prompt_template, is_active, updated_at) VALUES
('98730940-c8d9-4ddf-9bb9-c3f9a1becd76', 'Config_v1', 'gpt-4-vision-preview', 0.5, 'Describe this image for a guessing game. Level 1.', FALSE, '2026-01-11 03:24:58.988+00'),
('f96c512e-6e2f-445e-8653-f3b762c12a27', 'Config_v2', 'gpt-3.5-turbo', 0.52, 'Describe this image for a guessing game. Level 2.', FALSE, '2026-01-11 03:34:58.988+00'),
('2094c94a-6e94-463e-9afb-0fe0042bfefd', 'Config_v3', 'dall-e-3', 0.54, 'Describe this image for a guessing game. Level 3.', FALSE, '2026-01-11 03:44:58.988+00'),
('c3a949ce-5abd-4f45-8acd-c3aea6a19590', 'Config_v4', 'gpt-4-vision-preview', 0.56, 'Describe this image for a guessing game. Level 4.', FALSE, '2026-01-11 03:54:58.988+00'),
('2c008cba-9efb-4c6b-af2d-61dfb211e423', 'Config_v5', 'gpt-3.5-turbo', 0.58, 'Describe this image for a guessing game. Level 5.', FALSE, '2026-01-11 04:04:58.988+00'),
('e2784011-24fd-4152-b6ec-ee65e0ad8f77', 'Config_v6', 'dall-e-3', 0.6, 'Describe this image for a guessing game. Level 6.', FALSE, '2026-01-11 04:14:58.988+00'),
('52fb49cc-0ba8-4beb-9cb4-565cade22f17', 'Config_v7', 'gpt-4-vision-preview', 0.62, 'Describe this image for a guessing game. Level 7.', FALSE, '2026-01-11 04:24:58.988+00'),
('e134fdec-d0a7-462b-ad43-956d372885b4', 'Config_v8', 'gpt-3.5-turbo', 0.64, 'Describe this image for a guessing game. Level 8.', FALSE, '2026-01-11 04:34:58.988+00'),
('89949720-8c24-49cc-9206-5d83022566bd', 'Config_v9', 'dall-e-3', 0.66, 'Describe this image for a guessing game. Level 9.', FALSE, '2026-01-11 04:44:58.988+00'),
('756822fe-4b78-41b4-b1a4-c9837694698c', 'Config_v10', 'gpt-4-vision-preview', 0.6799999999999999, 'Describe this image for a guessing game. Level 10.', FALSE, '2026-01-11 04:54:58.988+00'),
('14509203-e112-438e-9b9f-7f72dec9d1c4', 'Config_v11', 'gpt-3.5-turbo', 0.7, 'Describe this image for a guessing game. Level 11.', FALSE, '2026-01-11 05:04:58.988+00'),
('64c99133-0728-4157-8755-97c9dc0cef44', 'Config_v12', 'dall-e-3', 0.72, 'Describe this image for a guessing game. Level 12.', FALSE, '2026-01-11 05:14:58.988+00'),
('ca93e863-3cc2-406f-880c-b137cbc41e3a', 'Config_v13', 'gpt-4-vision-preview', 0.74, 'Describe this image for a guessing game. Level 13.', FALSE, '2026-01-11 05:24:58.988+00'),
('d5db759a-4dee-43af-b819-59be85f335cf', 'Config_v14', 'gpt-3.5-turbo', 0.76, 'Describe this image for a guessing game. Level 14.', FALSE, '2026-01-11 05:34:58.988+00'),
('421cdde0-9d7d-4ad8-a285-feec879ada09', 'Config_v15', 'dall-e-3', 0.78, 'Describe this image for a guessing game. Level 15.', TRUE, '2026-01-11 05:44:58.988+00');

-- 10. Rankings
INSERT INTO public.rankings (id, user_id, rank_position, snapshot_points, period_type, calculated_at) VALUES
('aea3adef-2a9d-4fe5-947e-636f133a1a41', '8f337f95-df0e-4c1a-8ec9-d33d31b9fa7e', 1, 3383, 'weekly', '2026-01-11 05:04:58.988+00'),
('bce62055-8aa9-4d88-b769-e505d42e5513', '3e86374d-7fae-4aab-8720-ba2e5617f5b0', 2, 383, 'weekly', '2026-01-11 05:04:58.988+00'),
('00a77974-7333-4dad-af56-32b88646dac4', 'a21265f1-d6d8-4996-af4c-c2fde909e0a7', 3, 4336, 'weekly', '2026-01-11 05:04:58.988+00'),
('ca1bc133-5236-4700-8e56-a387626086d1', '8b799b4a-42c1-4f54-a039-5ed76a46a019', 4, 4481, 'weekly', '2026-01-11 05:04:58.988+00'),
('37b2ade4-0255-41cc-8fe6-8f49318139c8', '98e7e4c7-625c-4387-b6b0-5fae310ce013', 5, 1210, 'weekly', '2026-01-11 05:04:58.988+00'),
('9ae7245e-6e62-4c79-91d3-160abf7dde09', '68b40fab-6810-428d-a07c-3c5dfd80bdac', 6, 2215, 'weekly', '2026-01-11 05:04:58.988+00'),
('7a42c58c-4a11-47b0-a8d7-1dcf4ba4e691', '8d3831f8-53ca-4901-8d15-5c8bc0699893', 7, 3028, 'weekly', '2026-01-11 05:04:58.988+00'),
('1ecb6a10-d804-4b10-a0be-2f72a345cb18', 'dbeec6cf-28ab-407c-97f8-e03cdbc2a222', 8, 4011, 'weekly', '2026-01-11 05:04:58.988+00'),
('5d1b1952-a268-45a0-ba6d-ed341661023d', '07c693fd-0d8f-4fef-a9f8-dadd47cdee8a', 9, 3301, 'weekly', '2026-01-11 05:04:58.988+00'),
('65fa9c7d-a576-45d3-a77c-30c95ecf95f0', 'ef188014-0783-4ca4-9ef1-cc3835cb8fac', 10, 3475, 'weekly', '2026-01-11 05:04:58.988+00'),
('f3b5b932-a8bb-4d73-9b86-d2e4ec7d2601', 'f00bae8b-8997-464b-8d95-5b9d47cc3e00', 11, 997, 'weekly', '2026-01-11 05:04:58.988+00'),
('f3a6502f-8f17-41cf-9d68-a7ebb7c89e28', '9efccddb-589d-4485-841f-a70b43a4b864', 12, 1979, 'weekly', '2026-01-11 05:04:58.988+00'),
('7878d75d-5ccc-40b5-a681-ee123cb0014b', '46b0a50e-387d-43b2-a076-b47475a93844', 13, 2874, 'weekly', '2026-01-11 05:04:58.988+00'),
('fd6818ca-1a0e-43ab-ad9b-0191ede591b9', 'a7e04f4a-efda-4b43-bf7e-57cd6b979046', 14, 3161, 'weekly', '2026-01-11 05:04:58.988+00'),
('c2b4093b-d4be-4064-a1df-7e1259ec875d', 'bc1b8673-5b27-456d-9145-645ccf99fc52', 15, 3063, 'weekly', '2026-01-11 05:04:58.988+00');

-- 11. Login Records
INSERT INTO public.login_records (id, user_id, ip_address, login_time) VALUES
('c1f339b7-ec8d-4ba6-abb3-1489bb990cb1', '8f337f95-df0e-4c1a-8ec9-d33d31b9fa7e', '192.168.1.100', '2026-01-11 06:44:58.988+00'),
('8dc26eed-96bb-46ad-b879-20efb3637460', '3e86374d-7fae-4aab-8720-ba2e5617f5b0', '192.168.1.101', '2026-01-11 07:04:58.988+00'),
('4e24c0e9-51ce-4ca6-8257-e3a75e8821ac', 'a21265f1-d6d8-4996-af4c-c2fde909e0a7', '192.168.1.102', '2026-01-11 07:24:58.988+00'),
('e52483ed-fc5d-4702-af7e-00602ec23482', '8b799b4a-42c1-4f54-a039-5ed76a46a019', '192.168.1.103', '2026-01-11 07:44:58.988+00'),
('b5045612-74ad-48e2-a968-9727dead5e42', '98e7e4c7-625c-4387-b6b0-5fae310ce013', '192.168.1.104', '2026-01-11 08:04:58.988+00'),
('14839d80-be1b-41e5-99d8-bdc1bf533c60', '68b40fab-6810-428d-a07c-3c5dfd80bdac', '192.168.1.105', '2026-01-11 08:24:58.988+00'),
('bb170cb6-2051-4e44-98a5-85532b4068e8', '8d3831f8-53ca-4901-8d15-5c8bc0699893', '192.168.1.106', '2026-01-11 08:44:58.988+00'),
('ac8e3466-c5d3-4267-a670-0677fc02804f', 'dbeec6cf-28ab-407c-97f8-e03cdbc2a222', '192.168.1.107', '2026-01-11 09:04:58.988+00'),
('da1f48bb-6acc-4be0-9655-7a35513cd4e3', '07c693fd-0d8f-4fef-a9f8-dadd47cdee8a', '192.168.1.108', '2026-01-11 09:24:58.988+00'),
('7119c41f-b7f0-48e4-aa53-3e77b6de3b25', 'ef188014-0783-4ca4-9ef1-cc3835cb8fac', '192.168.1.109', '2026-01-11 09:44:58.988+00'),
('37ac1f0a-2654-434c-802b-4fde6761aab0', 'f00bae8b-8997-464b-8d95-5b9d47cc3e00', '192.168.1.110', '2026-01-11 10:04:58.988+00'),
('56844da9-e45e-4cbe-a9a4-2e181c246a27', '9efccddb-589d-4485-841f-a70b43a4b864', '192.168.1.111', '2026-01-11 10:24:58.988+00'),
('5b1fe460-5c6b-430d-8b58-c026e323ac08', '46b0a50e-387d-43b2-a076-b47475a93844', '192.168.1.112', '2026-01-11 10:44:58.988+00'),
('d0192a98-fbad-42bd-a9d7-0653c79fec57', 'a7e04f4a-efda-4b43-bf7e-57cd6b979046', '192.168.1.113', '2026-01-11 11:04:58.988+00'),
('8f37d16b-5c32-474c-9702-a0b63865eec7', 'bc1b8673-5b27-456d-9145-645ccf99fc52', '192.168.1.114', '2026-01-11 11:24:58.988+00');