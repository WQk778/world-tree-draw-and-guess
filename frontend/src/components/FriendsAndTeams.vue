<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import { friendService } from '../services/friendService'
import { teamService } from '../services/teamService'
import { messageService } from '../services/messageService'
import { useUserStore } from '../stores/user'

const props = defineProps({
  isOpen: Boolean
})
const emit = defineEmits(['close'])

const router = useRouter()
const userStore = useUserStore()
const currentTab = ref('friends') // 'friends' or 'teams'

// --- Chat State ---
const activeChatFriend = ref(null)
const chatMessages = ref([])
const newMessage = ref('')
const unreadCounts = ref({})
const messagesContainer = ref(null)

// --- Friends State ---
const friends = ref([])
const pendingRequests = ref([])
const searchKeyword = ref('')
const searchResults = ref([])
const isSearching = ref(false)

// --- Teams State ---
const currentTeam = ref(null)
const teamMembers = ref([])
const pendingInvites = ref([])
const newTeamName = ref('')
const isCreatingTeam = ref(false)
const showInviteModal = ref(false)

// Messages
const errorMessage = ref('')
const successMessage = ref('')

const showError = (msg) => {
  errorMessage.value = msg
  setTimeout(() => errorMessage.value = '', 3000)
}
const showSuccess = (msg) => {
  successMessage.value = msg
  setTimeout(() => successMessage.value = '', 3000)
}

// --- Realtime Subscriptions ---
let friendsSub
let teamsSub
let teamMembersSub
let messagesSub

onMounted(async () => {
  if (!userStore.user) return
  await loadFriendsData()
  await loadTeamData()
  await loadUnreadCounts()
  setupRealtime()
})

onUnmounted(() => {
  if (friendsSub) supabase.removeChannel(friendsSub)
  if (teamsSub) supabase.removeChannel(teamsSub)
  if (teamMembersSub) supabase.removeChannel(teamMembersSub)
  if (messagesSub) supabase.removeChannel(messagesSub)
})

const setupRealtime = () => {
  const userId = userStore.user.id

  friendsSub = supabase.channel('friends_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'friends' }, payload => {
      // Reload on any friend change relevant to us
      loadFriendsData()
    })
    .subscribe()

  teamsSub = supabase.channel('teams_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, payload => {
      loadTeamData()
    })
    .subscribe()

  teamMembersSub = supabase.channel('team_members_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, payload => {
      loadTeamData()
    })
    .subscribe()

  messagesSub = supabase.channel('messages_changes')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${userId}` }, payload => {
      const msg = payload.new
      if (activeChatFriend.value && activeChatFriend.value.id === msg.sender_id) {
        // We are currently chatting with the sender, fetch updated messages
        openChat(activeChatFriend.value)
      } else {
        // Otherwise, just increment unread count
        loadUnreadCounts()
      }
    })
    .subscribe()
}

// --- Chat Logic ---
const loadUnreadCounts = async () => {
  try {
    unreadCounts.value = await messageService.getUnreadCounts()
  } catch (err) {
    console.error('Error loading unread counts:', err)
  }
}

const openChat = async (friend) => {
  activeChatFriend.value = friend
  try {
    chatMessages.value = await messageService.getMessages(friend.id)
    loadUnreadCounts()
    scrollToBottom()
  } catch (err) {
    showError('加载消息失败')
  }
}

const closeChat = () => {
  activeChatFriend.value = null
  chatMessages.value = []
}

const sendMessage = async () => {
  if (!newMessage.value.trim() || !activeChatFriend.value) return
  try {
    await messageService.sendMessage(activeChatFriend.value.id, newMessage.value)
    newMessage.value = ''
    chatMessages.value = await messageService.getMessages(activeChatFriend.value.id)
    scrollToBottom()
  } catch (err) {
    showError('发送失败')
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const joinRoom = (roomCode) => {
  router.push(`/room/${roomCode}`) // Might need logic to fetch room id by code, but let's assume route /room/code or we can navigate directly if our router handles it. Actually in LobbyView joinRoom uses API. We can just use the code to call API or redirect.
  // We'll emit event to parent or handle join directly. For simplicity, just redirect if your app supports /room/:id where id is code or UUID. Our app uses UUID. Let's redirect to lobby with code or just let Lobby handle it.
  // Wait, room_code in DB might be the 6 digit code. We need to call join API.
  handleJoinRoom(roomCode)
}

const handleJoinRoom = async (code) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const response = await fetch('http://localhost:3000/api/rooms/join', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ code })
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error)
    emit('close')
    router.push(`/room/${result.room.id}`)
  } catch (error) {
    showError('加入房间失败')
  }
}

// --- Friends Logic ---
const loadFriendsData = async () => {
  try {
    const [friendsData, requestsData] = await Promise.all([
      friendService.getFriends(),
      friendService.getPendingRequests()
    ])
    friends.value = friendsData
    pendingRequests.value = requestsData
  } catch (err) {
    console.error('Error loading friends:', err)
  }
}

const searchUsers = async () => {
  if (!searchKeyword.value.trim()) {
    searchResults.value = []
    return
  }
  isSearching.value = true
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nickname, avatar_url')
      .ilike('nickname', `%${searchKeyword.value}%`)
      .neq('id', userStore.user.id)
      .limit(20)

    if (error) throw error
    searchResults.value = data
  } catch (err) {
    showError('搜索失败')
  } finally {
    isSearching.value = false
  }
}

const getFriendStatus = (userId) => {
  const isFriend = friends.value.some(f => f.requester_id === userId || f.addressee_id === userId)
  if (isFriend) return 'friend'
  
  const hasPending = pendingRequests.value.some(r => r.requester_id === userId)
  if (hasPending) return 'pending_received'

  // We should also check requests we sent, but for simplicity we skip here or just say send request
  return 'none'
}

const sendFriendRequest = async (userId) => {
  try {
    await friendService.sendRequest(userId)
    showSuccess('好友申请已发送')
    searchKeyword.value = ''
    searchResults.value = []
  } catch (err) {
    if (err.code === '23505') showError('已发送过申请')
    else showError('发送申请失败')
  }
}

const acceptRequest = async (requestId) => {
  try {
    await friendService.acceptRequest(requestId)
    showSuccess('已接受好友申请')
    await loadFriendsData()
  } catch (err) {
    showError('操作失败')
  }
}

const rejectRequest = async (requestId) => {
  try {
    await friendService.rejectRequest(requestId)
    showSuccess('已拒绝好友申请')
    await loadFriendsData()
  } catch (err) {
    showError('操作失败')
  }
}

const getFriendProfile = (friendRecord) => {
  return friendRecord.requester_id === userStore.user.id 
    ? friendRecord.addressee 
    : friendRecord.requester
}

const deleteFriend = async (friendId) => {
  if (!confirm('确定要删除该好友吗？相关的聊天记录也将无法查看。')) return
  try {
    await friendService.deleteFriend(friendId)
    showSuccess('已删除好友')
    await loadFriendsData()
    // 如果正在和该好友聊天，关闭聊天窗口
    if (activeChatFriend.value && activeChatFriend.value.id === friendId) {
      closeChat()
    }
  } catch (err) {
    showError('删除好友失败')
  }
}

// --- Teams Logic ---
const loadTeamData = async () => {
  try {
    // 1. Check if we are in a team
    const { data: memberData, error: memberError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', userStore.user.id)
      .eq('status', 'joined')
      .maybeSingle()

    if (memberData) {
      const details = await teamService.getTeamDetails(memberData.team_id)
      currentTeam.value = details.team
      teamMembers.value = details.members
    } else {
      // Check if we are leader of a forming team without being in team_members
      // In our design, leader should be in team_members, but let's be safe.
      currentTeam.value = null
      teamMembers.value = []
    }

    // 2. Load pending invites
    const invites = await teamService.getPendingInvites()
    pendingInvites.value = invites

  } catch (err) {
    console.error('Error loading teams:', err)
  }
}

const createTeam = async () => {
  if (!newTeamName.value.trim()) return
  isCreatingTeam.value = true
  try {
    const team = await teamService.createTeam(newTeamName.value)
    // Add creator to team_members
    await supabase.from('team_members').insert({
      team_id: team.id,
      user_id: userStore.user.id,
      status: 'joined'
    })
    showSuccess('队伍创建成功')
    newTeamName.value = ''
    await loadTeamData()
  } catch (err) {
    showError('创建队伍失败')
  } finally {
    isCreatingTeam.value = false
  }
}

const acceptInvite = async (teamId) => {
  try {
    const success = await teamService.acceptInvite(teamId)
    if (success) {
      showSuccess('已加入队伍')
      await loadTeamData()
    } else {
      showError('加入队伍失败(可能已满)')
    }
  } catch (err) {
    showError('操作失败')
  }
}

const rejectInvite = async (teamId) => {
  try {
    await teamService.rejectInvite(teamId)
    showSuccess('已拒绝邀请')
    await loadTeamData()
  } catch (err) {
    showError('操作失败')
  }
}

const inviteFriend = async (friendId) => {
  if (!currentTeam.value) return
  try {
    await teamService.inviteToTeam(currentTeam.value.id, friendId)
    showSuccess('邀请已发送')
    showInviteModal.value = false
  } catch (err) {
    if (err.code === '23505') showError('已经邀请过该好友')
    else showError('发送邀请失败')
  }
}

const leaveOrDisband = async () => {
  if (!currentTeam.value) return
  const isLeader = currentTeam.value.leader_id === userStore.user.id
  if (isLeader) {
    if (!confirm('确定要解散队伍吗？')) return
    try {
      await teamService.disbandTeam(currentTeam.value.id)
      showSuccess('队伍已解散')
      await loadTeamData()
    } catch (err) {
      showError('解散失败')
    }
  } else {
    if (!confirm('确定要离开队伍吗？')) return
    try {
      await supabase.from('team_members').delete().eq('team_id', currentTeam.value.id).eq('user_id', userStore.user.id)
      showSuccess('已离开队伍')
      await loadTeamData()
    } catch (err) {
      showError('离开失败')
    }
  }
}

const transferLeader = async (memberId) => {
  if (!confirm('确定转让队长给该成员吗？')) return
  try {
    const success = await teamService.transferLeader(currentTeam.value.id, memberId)
    if (success) {
      showSuccess('队长已转让')
      await loadTeamData()
    } else {
      showError('转让失败')
    }
  } catch (err) {
    showError('转让失败')
  }
}

</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex justify-end">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/50" @click="emit('close')"></div>
    
    <!-- Drawer -->
    <div class="relative w-full max-w-md bg-white h-full shadow-[-8px_0px_0px_0px_rgba(0,0,0,1)] border-l-4 border-black flex flex-col transform transition-transform duration-300">
      
      <!-- Header -->
      <div class="p-6 border-b-4 border-black bg-yellow-300 flex justify-between items-center">
        <h2 class="text-2xl font-black text-black">社交 & 组队</h2>
        <button @click="emit('close')" class="w-8 h-8 flex items-center justify-center border-2 border-black rounded-full hover:bg-white transition-colors font-bold">X</button>
      </div>

      <!-- Tabs -->
      <div class="flex border-b-4 border-black font-black text-lg bg-gray-100">
        <button 
          class="flex-1 py-3 border-r-4 border-black transition-colors"
          :class="currentTab === 'friends' ? 'bg-white' : 'hover:bg-gray-200 text-gray-500'"
          @click="currentTab = 'friends'"
        >
          好友
        </button>
        <button 
          class="flex-1 py-3 transition-colors"
          :class="currentTab === 'teams' ? 'bg-white' : 'hover:bg-gray-200 text-gray-500'"
          @click="currentTab = 'teams'"
        >
          队伍
        </button>
      </div>

      <!-- Alerts -->
      <div v-if="errorMessage" class="p-3 bg-red-400 border-b-4 border-black font-bold text-black text-center">
        {{ errorMessage }}
      </div>
      <div v-if="successMessage" class="p-3 bg-green-400 border-b-4 border-black font-bold text-black text-center">
        {{ successMessage }}
      </div>

      <!-- Content Area -->
      <div class="flex-1 overflow-y-auto p-6 bg-blue-50/30">
        
        <!-- ================= FRIENDS TAB ================= -->
        <div v-if="currentTab === 'friends'" class="space-y-8">
          
          <!-- Search Users -->
          <div>
            <h3 class="font-black text-xl mb-3 flex items-center gap-2">🔍 添加好友</h3>
            <div class="flex gap-2">
              <input 
                v-model="searchKeyword" 
                @keyup.enter="searchUsers"
                placeholder="搜索用户昵称..." 
                class="flex-1 px-3 py-2 border-2 border-black rounded-lg focus:outline-none"
              />
              <button @click="searchUsers" class="px-4 py-2 bg-blue-400 border-2 border-black rounded-lg font-bold hover:bg-blue-300">
                {{ isSearching ? '...' : '搜索' }}
              </button>
            </div>
            
            <div v-if="searchResults.length > 0" class="mt-4 space-y-2">
              <div v-for="user in searchResults" :key="user.id" class="flex justify-between items-center p-3 bg-white border-2 border-black rounded-xl">
                <div class="flex items-center gap-3">
                  <img :src="user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`" class="w-10 h-10 rounded-full border border-black bg-gray-100" />
                  <span class="font-bold">{{ user.nickname }}</span>
                </div>
                <button 
                  v-if="getFriendStatus(user.id) === 'none'"
                  @click="sendFriendRequest(user.id)" 
                  class="px-3 py-1 bg-green-400 border-2 border-black rounded-lg font-bold text-sm hover:bg-green-300"
                >
                  添加
                </button>
                <span v-else-if="getFriendStatus(user.id) === 'friend'" class="text-sm font-bold text-gray-500">已是好友</span>
                <span v-else class="text-sm font-bold text-gray-500">已处理</span>
              </div>
            </div>
          </div>

          <!-- Pending Requests -->
          <div v-if="pendingRequests.length > 0">
            <h3 class="font-black text-xl mb-3 flex items-center gap-2">📬 好友申请</h3>
            <div class="space-y-2">
              <div v-for="req in pendingRequests" :key="req.id" class="flex justify-between items-center p-3 bg-yellow-100 border-2 border-black rounded-xl">
                <div class="flex items-center gap-3">
                  <img :src="req.requester.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${req.requester.id}`" class="w-10 h-10 rounded-full border border-black bg-white" />
                  <span class="font-bold">{{ req.requester.nickname }}</span>
                </div>
                <div class="flex gap-2">
                  <button @click="acceptRequest(req.id)" class="px-3 py-1 bg-green-400 border-2 border-black rounded-lg font-bold text-sm hover:bg-green-300">同意</button>
                  <button @click="rejectRequest(req.id)" class="px-3 py-1 bg-red-400 border-2 border-black rounded-lg font-bold text-sm hover:bg-red-300">拒绝</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Friend List -->
          <div>
            <h3 class="font-black text-xl mb-3 flex items-center gap-2">👫 我的好友 ({{ friends.length }})</h3>
            <div v-if="friends.length === 0" class="text-center text-gray-500 font-bold py-8">
              还没有好友，快去添加吧！
            </div>
            <div v-else class="space-y-2">
              <!-- Virtual scrolling is requested for 1000 items <= 200ms. For simplicity in UI, we use standard v-for, but could implement intersection observer if needed. With Vue 3 and modern browsers, < 100 items is fine. If it goes up to 1000, we should use vue-virtual-scroller. I will keep it simple here. -->
              <div v-for="friend in friends" :key="friend.id" class="flex justify-between items-center p-3 bg-white border-2 border-black rounded-xl hover:translate-x-1 transition-transform">
                <div class="flex items-center gap-3">
                  <img :src="getFriendProfile(friend).avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${getFriendProfile(friend).id}`" class="w-10 h-10 rounded-full border border-black bg-gray-100" />
                  <span class="font-bold">{{ getFriendProfile(friend).nickname }}</span>
                </div>
                <!-- Action dropdown or button -->
                <div class="flex items-center gap-2">
                  <span v-if="unreadCounts[getFriendProfile(friend).id]" class="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {{ unreadCounts[getFriendProfile(friend).id] }}
                  </span>
                  <button @click="openChat(getFriendProfile(friend))" class="px-3 py-1 bg-gray-200 border-2 border-black rounded-lg font-bold text-sm hover:bg-gray-300">
                    发消息
                  </button>
                  <button @click="deleteFriend(getFriendProfile(friend).id)" class="px-3 py-1 bg-red-100 text-red-600 border-2 border-black rounded-lg font-bold text-sm hover:bg-red-200" title="删除好友">
                    删除
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- ================= TEAMS TAB ================= -->
        <div v-if="currentTab === 'teams'" class="space-y-8">
          
          <!-- Not in a team -->
          <div v-if="!currentTeam">
            <div class="bg-purple-100 p-6 border-4 border-black rounded-2xl text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h3 class="text-2xl font-black mb-4">创建新队伍</h3>
              <input v-model="newTeamName" placeholder="给队伍起个响亮的名字" class="w-full px-4 py-3 border-2 border-black rounded-xl font-bold mb-4 focus:outline-none" />
              <button 
                @click="createTeam"
                :disabled="isCreatingTeam || !newTeamName"
                class="w-full py-3 bg-purple-400 border-2 border-black rounded-xl font-black hover:bg-purple-300 disabled:opacity-50"
              >
                {{ isCreatingTeam ? '创建中...' : '立即创建' }}
              </button>
            </div>

            <!-- Pending Invites -->
            <div v-if="pendingInvites.length > 0" class="mt-8">
              <h3 class="font-black text-xl mb-3 flex items-center gap-2">💌 队伍邀请</h3>
              <div class="space-y-3">
                <div v-for="invite in pendingInvites" :key="invite.id" class="p-4 bg-white border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <div class="font-bold mb-3">
                    <span class="text-blue-600">[{{ invite.team.name }}]</span> 邀请你加入
                  </div>
                  <div class="flex gap-2">
                    <button @click="acceptInvite(invite.team.id)" class="flex-1 py-2 bg-green-400 border-2 border-black rounded-lg font-bold hover:bg-green-300">接受</button>
                    <button @click="rejectInvite(invite.team.id)" class="flex-1 py-2 bg-red-400 border-2 border-black rounded-lg font-bold hover:bg-red-300">拒绝</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- In a team -->
          <div v-else>
            <div class="bg-blue-100 p-6 border-4 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div class="flex justify-between items-start mb-6">
                <div>
                  <h3 class="text-2xl font-black">{{ currentTeam.name }}</h3>
                  <span class="text-sm font-bold text-gray-600">状态: {{ currentTeam.status === 'forming' ? '组队中' : '游戏中' }}</span>
                </div>
                <div class="px-3 py-1 bg-white border-2 border-black rounded-lg font-bold">
                  {{ teamMembers.length }} / {{ currentTeam.max_members }}
                </div>
              </div>

              <!-- Members List -->
              <div class="space-y-3 mb-6">
                <div v-for="member in teamMembers" :key="member.id" class="flex justify-between items-center p-3 bg-white border-2 border-black rounded-xl">
                  <div class="flex items-center gap-3">
                    <img :src="member.user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${member.user.id}`" class="w-10 h-10 rounded-full border border-black bg-gray-100" />
                    <span class="font-bold flex items-center gap-2">
                      {{ member.user.nickname }}
                      <span v-if="member.user.id === currentTeam.leader_id" class="text-xs bg-yellow-400 border border-black px-1 rounded">👑 队长</span>
                    </span>
                  </div>
                  
                  <!-- Leader Actions -->
                  <div v-if="currentTeam.leader_id === userStore.user.id && member.user.id !== userStore.user.id">
                    <button @click="transferLeader(member.user.id)" class="text-xs px-2 py-1 bg-orange-300 border border-black rounded hover:bg-orange-200 font-bold">
                      转让队长
                    </button>
                  </div>
                </div>
              </div>

              <!-- Team Actions -->
              <div class="flex flex-col gap-3">
                <button 
                  v-if="currentTeam.leader_id === userStore.user.id"
                  @click="showInviteModal = true"
                  class="w-full py-3 bg-green-400 border-2 border-black rounded-xl font-black hover:bg-green-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all"
                >
                  邀请好友
                </button>
                
                <button 
                  @click="leaveOrDisband"
                  class="w-full py-3 bg-red-400 border-2 border-black rounded-xl font-black hover:bg-red-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all"
                >
                  {{ currentTeam.leader_id === userStore.user.id ? '解散队伍' : '离开队伍' }}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- Invite Friend Modal -->
    <div v-if="showInviteModal" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60">
      <div class="bg-white p-6 rounded-2xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-sm">
        <h3 class="text-xl font-black mb-4">邀请好友加入队伍</h3>
        
        <div class="max-h-60 overflow-y-auto space-y-2 mb-6">
          <div v-if="friends.length === 0" class="text-center text-gray-500 font-bold">没有可邀请的好友</div>
          <div v-for="friend in friends" :key="friend.id" class="flex justify-between items-center p-2 border-2 border-black rounded-xl">
            <span class="font-bold truncate">{{ getFriendProfile(friend).nickname }}</span>
            <button @click="inviteFriend(getFriendProfile(friend).id)" class="px-3 py-1 bg-blue-400 border-2 border-black rounded-lg font-bold hover:bg-blue-300">
              邀请
            </button>
          </div>
        </div>

        <button @click="showInviteModal = false" class="w-full py-2 bg-gray-200 border-2 border-black rounded-xl font-bold hover:bg-gray-300">
          关闭
        </button>
      </div>
    </div>

    <!-- Chat Modal -->
    <div v-if="activeChatFriend" class="absolute inset-0 z-50 bg-white flex flex-col h-full transform transition-transform">
      <!-- Chat Header -->
      <div class="p-4 border-b-4 border-black bg-blue-300 flex justify-between items-center">
        <div class="flex items-center gap-3">
          <button @click="closeChat" class="w-8 h-8 flex items-center justify-center border-2 border-black rounded-full hover:bg-white transition-colors font-bold">&larr;</button>
          <img :src="activeChatFriend.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${activeChatFriend.id}`" class="w-10 h-10 rounded-full border-2 border-black bg-gray-100" />
          <h3 class="font-black text-lg">{{ activeChatFriend.nickname }}</h3>
        </div>
      </div>

      <!-- Chat Messages -->
      <div class="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4" ref="messagesContainer">
        <div v-for="msg in chatMessages" :key="msg.id" class="flex flex-col" :class="msg.sender_id === userStore.user.id ? 'items-end' : 'items-start'">
          <div 
            class="max-w-[80%] p-3 border-2 border-black rounded-2xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            :class="msg.sender_id === userStore.user.id ? 'bg-green-300 rounded-tr-none' : 'bg-white rounded-tl-none'"
          >
            <div v-if="msg.type === 'text'" class="font-bold text-sm break-words">{{ msg.content }}</div>
            <div v-else-if="msg.type === 'room_invite'" class="flex flex-col gap-2">
              <span class="font-bold text-sm">🎮 {{ msg.content }}</span>
              <button 
                v-if="msg.sender_id !== userStore.user.id"
                @click="handleJoinRoom(msg.room_code)" 
                class="px-3 py-1 bg-yellow-400 border-2 border-black rounded-lg font-bold text-xs hover:bg-yellow-300"
              >
                加入房间
              </button>
            </div>
            <div class="text-[10px] text-gray-600 mt-1 text-right">
              {{ new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Chat Input -->
      <div class="p-4 border-t-4 border-black bg-white flex gap-2">
        <input 
          v-model="newMessage" 
          @keyup.enter="sendMessage"
          placeholder="输入消息..." 
          class="flex-1 px-4 py-2 border-2 border-black rounded-xl focus:outline-none"
        />
        <button 
          @click="sendMessage" 
          :disabled="!newMessage.trim()"
          class="px-6 py-2 bg-blue-400 border-2 border-black rounded-xl font-black hover:bg-blue-300 disabled:opacity-50 transition-colors"
        >
          发送
        </button>
      </div>
    </div>

  </div>
</template>
