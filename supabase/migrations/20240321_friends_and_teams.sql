-- 1. 好友关系表 (friends)
CREATE TABLE IF NOT EXISTS public.friends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    addressee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(requester_id, addressee_id),
    CHECK (requester_id != addressee_id)
);

-- 创建唯一索引防止反向重复
CREATE UNIQUE INDEX IF NOT EXISTS idx_friends_unique_pair 
ON public.friends (LEAST(requester_id, addressee_id), GREATEST(requester_id, addressee_id));

-- 2. 队伍表 (teams)
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    leader_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name VARCHAR(50) DEFAULT 'My Team',
    status VARCHAR(20) DEFAULT 'forming' CHECK (status IN ('forming', 'in_game', 'disbanded')),
    max_members INTEGER DEFAULT 4 CHECK (max_members >= 2 AND max_members <= 10),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 队伍成员表 (team_members)
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'joined')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- 启用 RLS
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Friends RLS Policies
CREATE POLICY "Users can view their own friends" 
ON public.friends FOR SELECT 
USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can create friend requests" 
ON public.friends FOR INSERT 
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update their friend requests" 
ON public.friends FOR UPDATE 
USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can delete their friends" 
ON public.friends FOR DELETE 
USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Teams RLS Policies
CREATE POLICY "Anyone can view teams" 
ON public.teams FOR SELECT 
USING (true);

CREATE POLICY "Users can create teams" 
ON public.teams FOR INSERT 
WITH CHECK (auth.uid() = leader_id);

CREATE POLICY "Leaders can update their teams" 
ON public.teams FOR UPDATE 
USING (auth.uid() = leader_id);

CREATE POLICY "Leaders can delete their teams" 
ON public.teams FOR DELETE 
USING (auth.uid() = leader_id);

-- Team Members RLS Policies
CREATE POLICY "Users can view team members" 
ON public.team_members FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.teams t 
    WHERE t.id = team_members.team_id AND t.status != 'disbanded'
  )
);

CREATE POLICY "Leaders can insert team members" 
ON public.team_members FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.teams t 
    WHERE t.id = team_members.team_id AND t.leader_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own team member status" 
ON public.team_members FOR UPDATE 
USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.teams t 
    WHERE t.id = team_members.team_id AND t.leader_id = auth.uid()
));

CREATE POLICY "Users can leave or leaders can remove members" 
ON public.team_members FOR DELETE 
USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.teams t 
    WHERE t.id = team_members.team_id AND t.leader_id = auth.uid()
));

-- RPC: 接受好友请求
CREATE OR REPLACE FUNCTION accept_friend_request(request_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.friends
  SET status = 'accepted', updated_at = NOW()
  WHERE id = request_id AND addressee_id = auth.uid() AND status = 'pending';
  
  IF FOUND THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;

-- RPC: 转移队长
CREATE OR REPLACE FUNCTION transfer_team_leader(p_team_id UUID, p_new_leader_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the current user is the leader
  IF EXISTS (SELECT 1 FROM public.teams WHERE id = p_team_id AND leader_id = auth.uid()) THEN
    -- Check if the new leader is in the team and has joined
    IF EXISTS (SELECT 1 FROM public.team_members WHERE team_id = p_team_id AND user_id = p_new_leader_id AND status = 'joined') THEN
      UPDATE public.teams
      SET leader_id = p_new_leader_id, updated_at = NOW()
      WHERE id = p_team_id;
      RETURN TRUE;
    END IF;
  END IF;
  RETURN FALSE;
END;
$$;

-- RPC: 解散队伍
CREATE OR REPLACE FUNCTION disband_team(p_team_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only leader can disband
  IF EXISTS (SELECT 1 FROM public.teams WHERE id = p_team_id AND leader_id = auth.uid()) THEN
    UPDATE public.teams
    SET status = 'disbanded', updated_at = NOW()
    WHERE id = p_team_id;
    
    DELETE FROM public.team_members
    WHERE team_id = p_team_id;
    
    RETURN TRUE;
  END IF;
  RETURN FALSE;
END;
$$;

-- RPC: 接受队伍邀请
CREATE OR REPLACE FUNCTION accept_team_invite(p_team_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_members INT;
  v_max_members INT;
BEGIN
  -- Get max members
  SELECT max_members INTO v_max_members FROM public.teams WHERE id = p_team_id AND status = 'forming';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Get current joined members count + leader
  SELECT COUNT(*) INTO v_current_members FROM public.team_members WHERE team_id = p_team_id AND status = 'joined';
  
  -- The leader is not in team_members usually, or they are? Let's assume leader is also in team_members.
  -- Wait, if leader is in team_members, count is fine.
  
  IF v_current_members >= v_max_members THEN
    RETURN FALSE; -- Team full
  END IF;

  UPDATE public.team_members
  SET status = 'joined', joined_at = NOW()
  WHERE team_id = p_team_id AND user_id = auth.uid() AND status = 'pending';
  
  IF FOUND THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;

-- Create Realtime publications
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friends;
ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_members;
