// ── supabase-client.js ─────────────────────────────────────────────────────
// Fichier partagé — importer dans chaque page HTML via:
// <script src="supabase-client.js"></script>

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const SUPABASE_URL  = 'https://eaiiesiouwqpwtxrebax.supabase.co'
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhaWllc2lvdXdxcHd0eHJlYmF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNDQxMTksImV4cCI6MjA5NTkyMDExOX0.aZ91Da3mVrR6CUibFuM0qdCpeMPjA43PLkC2JlS18A4'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'newsporto-auth',
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────

/** Inscription email + création profil */
export async function signUp({ email, password, username, newsletter = false }) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error

  // Créer le profil
  const { error: profileError } = await supabase.from('profiles').insert({
    id:           data.user.id,
    username,
    display_name: username,
    newsletter,
    points:       500,   // 500 pts offerts à l'inscription
    rank:         'Adepto',
  })
  if (profileError) throw profileError

  // Log les 100 pts de bienvenue
  await addPoints(data.user.id, 500, 'welcome', null)

  return data.user
}

/** Connexion */
export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data.user
}

/** Déconnexion */
export async function signOut() {
  await supabase.auth.signOut()
}

/** Récupère la session courante */
export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

/** Récupère l'utilisateur courant + son profil */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  return profile ? { ...user, profile } : user
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFIL
// ─────────────────────────────────────────────────────────────────────────────

/** Met à jour le profil (nom, bio, avatar) */
export async function updateProfile(userId, updates) {
  const { error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
  if (error) throw error
}

/** Upload avatar → Storage bucket "avatars" */
export async function uploadAvatar(userId, file) {
  const ext  = file.name.split('.').pop()
  const path = `${userId}/avatar.${ext}`
  const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  await updateProfile(userId, { avatar_url: data.publicUrl })
  return data.publicUrl
}

/** Récupère un profil public par username */
export async function getProfile(username) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, bio, points, rank, created_at')
    .eq('username', username)
    .single()
  if (error) throw error
  return data
}

// ─────────────────────────────────────────────────────────────────────────────
// POINTS
// ─────────────────────────────────────────────────────────────────────────────

const RANK_THRESHOLDS = [
  { rank: 'Invicta', min: 5000 },
  { rank: 'Lenda',   min: 2000 },
  { rank: 'Ultras',  min: 500  },
  { rank: 'Dragão',  min: 100  },
  { rank: 'Adepto',  min: 0    },
]

function computeRank(points) {
  return RANK_THRESHOLDS.find(r => points >= r.min)?.rank ?? 'Adepto'
}

/**
 * Ajoute (ou retire si négatif) des points à un utilisateur
 * reason: 'forum_reply' | 'forum_thread' | 'best_answer' | 'bet_win' | 'bet_lose' | 'welcome'
 * refId:  id du thread ou du match (optionnel)
 */
export async function addPoints(userId, amount, reason, refId = null) {
  // 1. Récupère les points actuels
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('points')
    .eq('id', userId)
    .single()
  if (error) throw error

  const newPoints = Math.max(0, profile.points + amount)
  const newRank   = computeRank(newPoints)

  // 2. Met à jour le solde + le rang
  await supabase
    .from('profiles')
    .update({ points: newPoints, rank: newRank, updated_at: new Date().toISOString() })
    .eq('id', userId)

  // 3. Log dans points_log
  await supabase.from('points_log').insert({
    user_id: userId,
    amount,
    reason,
    ref_id: refId ? String(refId) : null,
  })

  return { newPoints, newRank }
}

/** Récupère l'historique des points d'un user */
export async function getPointsLog(userId, limit = 20) {
  const { data, error } = await supabase
    .from('points_log')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

// ─────────────────────────────────────────────────────────────────────────────
// PARIS (BETS)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Place une mise
 * matchId: id football-data.org
 * pick: 'win' | 'draw' | 'lose'
 */
export async function placeBet({ userId, matchId, matchLabel, pick, stake, multiplier }) {
  const potentialGain = Math.floor(stake * multiplier)

  // Vérifie que l'user n'a pas déjà misé sur ce match
  const { data: existing } = await supabase
    .from('bets')
    .select('id')
    .eq('user_id', userId)
    .eq('match_id', String(matchId))
    .single()

  if (existing) throw new Error('Tu as déjà misé sur ce match')

  // Vérifie les fonds
  const { data: profile } = await supabase
    .from('profiles')
    .select('points')
    .eq('id', userId)
    .single()

  if (profile.points < stake) throw new Error('Pas assez de points')

  // Déduit la mise
  await addPoints(userId, -stake, 'bet_lose', matchId)

  // Enregistre le pari
  const { data, error } = await supabase.from('bets').insert({
    user_id:        userId,
    match_id:       String(matchId),
    match_label:    matchLabel,
    pick,
    stake,
    multiplier,
    potential_gain: potentialGain,
    status:         'pending',
  }).select().single()

  if (error) throw error
  return { bet: data, potentialGain }
}

/** Récupère les paris d'un user */
export async function getUserBets(userId) {
  const { data, error } = await supabase
    .from('bets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

/**
 * Résoudre un match (à appeler depuis une fonction admin/serverless)
 * result: 'win' | 'draw' | 'lose' (du point de vue de Porto)
 */
export async function resolveMatch(matchId, result) {
  const { data: bets } = await supabase
    .from('bets')
    .select('*')
    .eq('match_id', String(matchId))
    .eq('status', 'pending')

  for (const bet of bets) {
    if (bet.pick === result) {
      // Gagnant → crédite le gain total (mise déjà déduite, donc gain = stake * mult)
      await addPoints(bet.user_id, bet.potential_gain, 'bet_win', matchId)
      await supabase.from('bets').update({ status: 'won' }).eq('id', bet.id)
    } else {
      // Perdant → mise déjà déduite, juste update status
      await supabase.from('bets').update({ status: 'lost' }).eq('id', bet.id)
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FORUM
// ─────────────────────────────────────────────────────────────────────────────

/** Crée un thread → +5 pts */
export async function createThread({ authorId, title, content, category = 'general' }) {
  const { data, error } = await supabase
    .from('forum_threads')
    .insert({ author_id: authorId, title, content, category })
    .select().single()
  if (error) throw error
  await addPoints(authorId, 5, 'forum_thread', data.id)
  return data
}

/** Répond à un thread → +3 pts (1x par thread grâce au UNIQUE) */
export async function replyToThread({ threadId, authorId, content }) {
  const { data, error } = await supabase
    .from('forum_replies')
    .insert({ thread_id: threadId, author_id: authorId, content })
    .select().single()

  if (error) {
    // Violation UNIQUE = déjà répondu, pas de points
    if (error.code === '23505') return { alreadyReplied: true }
    throw error
  }

  // Incrémente reply_count
  await supabase.rpc('increment_reply_count', { thread_id: threadId })
  await addPoints(authorId, 3, 'forum_reply', threadId)
  return { reply: data, alreadyReplied: false }
}

/** Marque une réponse comme meilleure → +10 pts au répondant */
export async function markBestAnswer(replyId, threadAuthorId) {
  const { data: reply, error } = await supabase
    .from('forum_replies')
    .update({ is_best_answer: true })
    .eq('id', replyId)
    .select().single()
  if (error) throw error

  // Seul l'auteur du thread peut marquer
  await addPoints(reply.author_id, 10, 'best_answer', reply.thread_id)
  return reply
}

// ─────────────────────────────────────────────────────────────────────────────
// AMIS & MESSAGES
// ─────────────────────────────────────────────────────────────────────────────

/** Envoie une demande d'ami */
export async function sendFriendRequest(requesterId, addresseeId) {
  const { error } = await supabase
    .from('friendships')
    .insert({ requester_id: requesterId, addressee_id: addresseeId })
  if (error) throw error
}

/** Accepte une demande d'ami */
export async function acceptFriendRequest(friendshipId) {
  const { error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', friendshipId)
  if (error) throw error
}

/** Liste les amis acceptés d'un user */
export async function getFriends(userId) {
  const { data, error } = await supabase
    .from('friendships')
    .select(`
      id, status,
      requester:requester_id(id, username, display_name, avatar_url, rank),
      addressee:addressee_id(id, username, display_name, avatar_url, rank)
    `)
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .eq('status', 'accepted')
  if (error) throw error
  // Retourne l'ami (pas soi-même)
  return data.map(f => f.requester.id === userId ? f.addressee : f.requester)
}

/** Envoie un MP (seulement entre amis) */
export async function sendMessage(senderId, receiverId, content) {
  const { data, error } = await supabase
    .from('messages')
    .insert({ sender_id: senderId, receiver_id: receiverId, content })
    .select().single()
  if (error) throw error
  return data
}

/** Récupère la conversation entre 2 users */
export async function getConversation(userId, friendId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:sender_id(username, display_name, avatar_url)')
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${userId})`)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

/** Marque les messages comme lus */
export async function markMessagesRead(senderId, receiverId) {
  await supabase
    .from('messages')
    .update({ read: true })
    .eq('sender_id', senderId)
    .eq('receiver_id', receiverId)
    .eq('read', false)
}

// ─────────────────────────────────────────────────────────────────────────────
// PRÉSENCE EN LIGNE (Realtime)
// ─────────────────────────────────────────────────────────────────────────────

let presenceChannel = null

/** Démarre le tracking de présence pour l'user courant */
export function startPresence(userId, username) {
  presenceChannel = supabase.channel('online-users')
  presenceChannel
    .on('presence', { event: 'sync' }, () => {
      const state = presenceChannel.presenceState()
      window.dispatchEvent(new CustomEvent('presence-update', { detail: state }))
    })
    .subscribe(async status => {
      if (status === 'SUBSCRIBED') {
        await presenceChannel.track({ user_id: userId, username, online_at: new Date().toISOString() })
      }
    })
  return presenceChannel
}

/** Arrête le tracking */
export function stopPresence() {
  if (presenceChannel) supabase.removeChannel(presenceChannel)
}

// ─────────────────────────────────────────────────────────────────────────────
// LEADERBOARD PARIS
// ─────────────────────────────────────────────────────────────────────────────

export async function getBetsLeaderboard(limit = 10) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, rank, points')
    .order('points', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

// Expose on window so non-module scripts can share the same instance
window._supabase = supabase

// ─────────────────────────────────────────────────────────────────────────────
// VOTES THREADS (Reddit-style)
// ─────────────────────────────────────────────────────────────────────────────

export async function voteThread(threadId, userId, vote) {
  const { data: existing } = await supabase
    .from('thread_votes')
    .select('id, vote')
    .eq('thread_id', threadId)
    .eq('user_id', userId)
    .maybeSingle()

  let delta = 0

  if (existing) {
    if (existing.vote === vote) {
      await supabase.from('thread_votes').delete().eq('id', existing.id)
      delta = -vote
      vote = 0
    } else {
      await supabase.from('thread_votes').update({ vote }).eq('id', existing.id)
      delta = vote * 2
    }
  } else {
    await supabase.from('thread_votes').insert({ thread_id: threadId, user_id: userId, vote })
    delta = vote
  }

  const { data: thread } = await supabase.from('forum_threads').select('votes').eq('id', threadId).single()
  const newVotes = (thread?.votes || 0) + delta
  await supabase.from('forum_threads').update({ votes: newVotes }).eq('id', threadId)
  return { newVotes, userVote: vote }
}

export async function getUserVotes(userId, threadIds) {
  if (!threadIds.length) return {}
  const { data } = await supabase
    .from('thread_votes')
    .select('thread_id, vote')
    .eq('user_id', userId)
    .in('thread_id', threadIds)
  const map = {}
  ;(data || []).forEach(v => { map[v.thread_id] = v.vote })
  return map
}
