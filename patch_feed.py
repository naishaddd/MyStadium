import re

src = open('src/views/consumer/ConsumerView.tsx').read()

# ── 1. Replace FeedPost type ──────────────────────────────────────────────────
old_type = """type FeedPost = {
  id: string;
  role: 'fan' | 'stadium' | 'gemini';
  headline: string;
  text: string;
  timestamp: number;
};"""

new_type = """type FeedPost = {
  id: string;
  role: 'fan' | 'stadium' | 'gemini';
  type: 'image' | 'text';
  headline: string;
  text: string;
  timestamp: number;
  aspectRatio?: '4:3' | '3:4';
  imageColor?: string;
  imageEmoji?: string;
  likes?: number;
  comments?: number;
};"""

src = src.replace(old_type, new_type)

# ── 2. Replace LIVE_ANNOUNCEMENTS + INITIAL_FEED ─────────────────────────────
old_block_start = "const LIVE_ANNOUNCEMENTS"
old_block_end = "];\n\n// ─── Sub-screens"

idx_s = src.index(old_block_start)
idx_e = src.index("// ─── Sub-screens", idx_s)

new_data = """const STORIES = [
  { id: 's1', name: 'Stadium', emoji: '🏟️', color: '#5b4636' },
  { id: 's2', name: 'You', emoji: '😊', color: '#c07840' },
  { id: 's3', name: 'Food Ct', emoji: '🍔', color: '#e07830' },
  { id: 's4', name: 'Security', emoji: '🛡️', color: '#4a7856' },
  { id: 's5', name: 'Merch', emoji: '🛍️', color: '#7856a8' },
];

const LIVE_ANNOUNCEMENTS: LiveAnnouncement[] = [
  { id: 'a1', badge: 'Stadium', title: 'Gate A security line is moving fast', detail: 'Wait time down to 6 min. Head there now.', icon: '📣' },
  { id: 'a2', badge: 'Event', title: 'Halftime show starts in 12 minutes', detail: 'Field crew reset before stage lights.', icon: '🎤' },
];

const INITIAL_FEED: FeedPost[] = [
  {
    id: 'p1', role: 'stadium', type: 'image', headline: 'Stadium Official',
    text: 'North Food Court freshly restocked! All stalls open — beat the halftime rush 🎉',
    aspectRatio: '4:3', imageColor: '#f0c87a', imageEmoji: '🍔',
    likes: 48, comments: 12, timestamp: Date.now() - 9 * 60 * 1000,
  },
  {
    id: 'p2', role: 'fan', type: 'text', headline: 'Fan',
    text: 'The energy in the upper deck is unreal right now 🔥 Best game of the season!',
    timestamp: Date.now() - 5 * 60 * 1000,
  },
  {
    id: 'p3', role: 'fan', type: 'image', headline: 'Fan',
    text: 'Best view in the house! 🏟️ So glad I got these seats.',
    aspectRatio: '3:4', imageColor: '#a8c8f0', imageEmoji: '🏟️',
    likes: 31, comments: 7, timestamp: Date.now() - 3 * 60 * 1000,
  },
  {
    id: 'p4', role: 'gemini', type: 'text', headline: 'Gemini Assist',
    text: 'Quick summary: Gate A is fastest entry, food court is restocked, halftime show in ~12 min. Anything else I can help with?',
    timestamp: Date.now() - 2 * 60 * 1000,
  },
];

"""

src = src[:idx_s] + new_data + src[idx_e:]

# ── 3. Replace LiveFeedScreen function ───────────────────────────────────────
idx_fn_start = src.index("function LiveFeedScreen(")
idx_fn_end = src.index("\nfunction ExploreScreen(")

new_feed_fn = r"""function LiveFeedScreen({
  feedHistory,
  announcements,
  onSend,
  onGeminiAssist,
}: {
  feedHistory: FeedPost[];
  announcements: LiveAnnouncement[];
  onSend: (text: string, mode: FeedMode) => void;
  onGeminiAssist: () => void;
}) {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<FeedMode>('chat');
  const flatRef = useRef<FlatList>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  const fmtTime = (ts: number) =>
    new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) { return; }
    onSend(trimmed, mode);
    setInput('');
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 150);
  };

  const toggleLike = (id: string) =>
    setLikedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const roleColor: Record<string, string> = {
    stadium: '#5b4636', fan: '#c07840', gemini: '#3a78c9',
  };
  const roleName: Record<string, string> = {
    stadium: 'Stadium Official', fan: 'Fan', gemini: 'Gemini AI',
  };

  const renderImagePost = (item: FeedPost) => {
    const isPortrait = item.aspectRatio === '3:4';
    const imgH = isPortrait ? 340 : 240;
    const liked = likedIds.has(item.id);
    return (
      <View style={sf.postCard} key={item.id}>
        {/* Post header */}
        <View style={sf.postHeader}>
          <View style={[sf.postAvatar, { backgroundColor: roleColor[item.role] }]}>
            <Text style={sf.postAvatarText}>
              {item.role === 'stadium' ? '🏟️' : item.role === 'gemini' ? '✨' : '😊'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={sf.postAuthor}>{roleName[item.role]}</Text>
            <Text style={sf.postTime}>{fmtTime(item.timestamp)}</Text>
          </View>
          {item.role === 'stadium' && (
            <View style={sf.officialBadge}><Text style={sf.officialBadgeText}>Official ✓</Text></View>
          )}
        </View>

        {/* Image placeholder */}
        <View style={[sf.imagePlaceholder, { height: imgH, backgroundColor: item.imageColor ?? '#eee' }]}>
          <Text style={sf.imagePlaceholderEmoji}>{item.imageEmoji ?? '📷'}</Text>
          <Text style={sf.imagePlaceholderLabel}>{isPortrait ? '3 : 4' : '4 : 3'}</Text>
        </View>

        {/* Action bar */}
        <View style={sf.postActions}>
          <TouchableOpacity style={sf.postActionBtn} onPress={() => toggleLike(item.id)}>
            <Text style={[sf.postActionIcon, liked && { color: '#e03050' }]}>{liked ? '❤️' : '🤍'}</Text>
            <Text style={sf.postActionCount}>{(item.likes ?? 0) + (liked ? 1 : 0)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={sf.postActionBtn}>
            <Text style={sf.postActionIcon}>💬</Text>
            <Text style={sf.postActionCount}>{item.comments ?? 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={sf.postActionBtn}>
            <Text style={sf.postActionIcon}>↗️</Text>
          </TouchableOpacity>
        </View>

        {/* Caption */}
        <View style={sf.postCaption}>
          <Text style={sf.postCaptionAuthor}>{roleName[item.role]} </Text>
          <Text style={sf.postCaptionText}>{item.text}</Text>
        </View>
      </View>
    );
  };

  const renderTextBubble = (item: FeedPost) => {
    const isFan = item.role === 'fan';
    const isGemini = item.role === 'gemini';
    return (
      <View key={item.id} style={[sf.bubbleRow, isFan ? sf.bubbleRowRight : sf.bubbleRowLeft]}>
        {!isFan && (
          <View style={[sf.bubbleAvatar, { backgroundColor: roleColor[item.role] }]}>
            <Text style={sf.bubbleAvatarText}>
              {isGemini ? '✨' : '🏟️'}
            </Text>
          </View>
        )}
        <View style={[sf.bubble, isFan ? sf.bubbleFan : isGemini ? sf.bubbleGemini : sf.bubbleStadium]}>
          {!isFan && <Text style={sf.bubbleSender}>{roleName[item.role]}</Text>}
          <Text style={[sf.bubbleText, isFan && sf.bubbleTextFan]}>{item.text}</Text>
          <Text style={[sf.bubbleMeta, isFan && sf.bubbleMetaFan]}>{fmtTime(item.timestamp)}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={sf.root}>
      <FlatList
        ref={flatRef}
        data={feedHistory}
        keyExtractor={item => item.id}
        contentContainerStyle={sf.list}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
        ListHeaderComponent={(
          <View>
            {/* ── Announcements banner ── */}
            {announcements.length > 0 && (
              <View style={sf.announceBanner}>
                <Text style={sf.announceBannerIcon}>{announcements[0].icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={sf.announceBannerBadge}>{announcements[0].badge}</Text>
                  <Text style={sf.announceBannerTitle}>{announcements[0].title}</Text>
                </View>
                <TouchableOpacity style={sf.geminiBtn} onPress={onGeminiAssist}>
                  <Text style={sf.geminiBtnText}>✨ Ask AI</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── Stories rail ── */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={sf.storiesRail}>
              {STORIES.map(st => (
                <TouchableOpacity key={st.id} style={sf.storyItem}>
                  <View style={[sf.storyRing, { borderColor: st.color }]}>
                    <View style={[sf.storyAvatar, { backgroundColor: st.color }]}>
                      <Text style={sf.storyEmoji}>{st.emoji}</Text>
                    </View>
                  </View>
                  <Text style={sf.storyName}>{st.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={sf.divider} />
          </View>
        )}
        renderItem={({ item }) =>
          item.type === 'image' ? renderImagePost(item) : renderTextBubble(item)
        }
        ListFooterComponent={<View style={{ height: 12 }} />}
      />

      {/* ── Input bar (WhatsApp style) ── */}
      <View style={sf.inputWrap}>
        {/* Mode pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={sf.modeRow}>
          {([['chat', '💬 Chat'], ['news', '📢 Post'], ['assist', '✨ AI']] as const).map(([val, label]) => {
            const active = mode === val;
            return (
              <TouchableOpacity key={val} style={[sf.modeChip, active && sf.modeChipActive]} onPress={() => setMode(val)}>
                <Text style={[sf.modeChipText, active && sf.modeChipTextActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <View style={sf.inputRow}>
          <TouchableOpacity style={sf.attachBtn} onPress={onGeminiAssist}>
            <Text style={sf.attachIcon}>✨</Text>
          </TouchableOpacity>
          <TextInput
            style={sf.input}
            value={input}
            onChangeText={setInput}
            placeholder={mode === 'news' ? 'Share a stadium update…' : mode === 'assist' ? 'Ask Gemini anything…' : 'Message the community…'}
            placeholderTextColor="#bbb"
            multiline
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <TouchableOpacity style={sf.sendBtn} onPress={handleSend}>
            <Text style={sf.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
"""

src = src[:idx_fn_start] + new_feed_fn + src[idx_fn_end:]

# ── 4. Add new styles (sf) before the closing of StyleSheet ─────────────────
# Append a new const sf = StyleSheet.create({...}) after the existing s = StyleSheet

new_sf = """
// ─── Live Feed Styles ─────────────────────────────────────────────────────────

const sf = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f7f3ee' },
  list: { paddingBottom: 8 },

  // Announcements banner
  announceBanner: { margin: 14, marginBottom: 0, backgroundColor: '#fff8f2', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#f0e4d4' },
  announceBannerIcon: { fontSize: 22 },
  announceBannerBadge: { color: '#c07840', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  announceBannerTitle: { color: '#1a1a1a', fontSize: 13, fontWeight: '700', marginTop: 1 },
  geminiBtn: { backgroundColor: '#5b4636', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  geminiBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Stories
  storiesRail: { paddingHorizontal: 14, paddingVertical: 14, gap: 14 },
  storyItem: { alignItems: 'center', gap: 5 },
  storyRing: { width: 68, height: 68, borderRadius: 34, borderWidth: 2.5, padding: 3, alignItems: 'center', justifyContent: 'center' },
  storyAvatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  storyEmoji: { fontSize: 24 },
  storyName: { fontSize: 11, color: '#888', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#ede8e0', marginHorizontal: 0 },

  // Instagram-style image post
  postCard: { backgroundColor: '#fff', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#ede8e0' },
  postHeader: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  postAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  postAvatarText: { fontSize: 18 },
  postAuthor: { color: '#1a1a1a', fontSize: 14, fontWeight: '700' },
  postTime: { color: '#aaa', fontSize: 11, marginTop: 1 },
  officialBadge: { backgroundColor: '#f0ece4', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#ddd8ce' },
  officialBadgeText: { color: '#5b4636', fontSize: 11, fontWeight: '700' },
  imagePlaceholder: { width: '100%', alignItems: 'center', justifyContent: 'center', gap: 8 },
  imagePlaceholderEmoji: { fontSize: 56, opacity: 0.6 },
  imagePlaceholderLabel: { fontSize: 12, color: 'rgba(0,0,0,0.3)', fontWeight: '700', letterSpacing: 1 },
  postActions: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, gap: 16 },
  postActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  postActionIcon: { fontSize: 20 },
  postActionCount: { color: '#888', fontSize: 13, fontWeight: '600' },
  postCaption: { flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 14, flexWrap: 'wrap' },
  postCaptionAuthor: { color: '#1a1a1a', fontSize: 13, fontWeight: '800' },
  postCaptionText: { color: '#444', fontSize: 13, lineHeight: 18, flex: 1 },

  // WhatsApp-style chat bubbles
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, marginVertical: 4, gap: 8 },
  bubbleRowLeft: { justifyContent: 'flex-start' },
  bubbleRowRight: { justifyContent: 'flex-end' },
  bubbleAvatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  bubbleAvatarText: { fontSize: 14 },
  bubble: { maxWidth: '75%', borderRadius: 18, padding: 11, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  bubbleFan: { backgroundColor: '#dcf8c6', borderBottomRightRadius: 4 },
  bubbleStadium: { backgroundColor: '#ffffff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#ede8e0' },
  bubbleGemini: { backgroundColor: '#e8f0fe', borderBottomLeftRadius: 4 },
  bubbleSender: { color: '#5b4636', fontSize: 11, fontWeight: '800', marginBottom: 3 },
  bubbleText: { color: '#1a1a1a', fontSize: 14, lineHeight: 19 },
  bubbleTextFan: { color: '#1a1a1a' },
  bubbleMeta: { color: '#888', fontSize: 10, textAlign: 'right', marginTop: 4 },
  bubbleMetaFan: { color: '#777' },

  // Input bar
  inputWrap: { backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#ede8e0', paddingBottom: 6 },
  modeRow: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4, gap: 8 },
  modeChip: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: '#f7f3ee', borderWidth: 1, borderColor: '#ddd8ce' },
  modeChipActive: { backgroundColor: '#5b4636', borderColor: '#5b4636' },
  modeChipText: { color: '#888', fontSize: 12, fontWeight: '700' },
  modeChipTextActive: { color: '#fff' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 10, paddingBottom: 6, gap: 8 },
  attachBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f7f3ee', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ddd8ce' },
  attachIcon: { fontSize: 18 },
  input: { flex: 1, backgroundColor: '#f7f3ee', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, color: '#1a1a1a', fontSize: 14, borderWidth: 1, borderColor: '#ddd8ce', maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#5b4636', alignItems: 'center', justifyContent: 'center' },
  sendIcon: { color: '#fff', fontSize: 16 },
});
"""

# Insert sf before the final export default or at end of file
# Find the last line and append
src = src.rstrip() + '\n' + new_sf + '\n'

open('src/views/consumer/ConsumerView.tsx', 'w').write(src)
print('Done. Lines:', len(src.split('\n')))
