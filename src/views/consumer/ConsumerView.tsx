/**
 * ConsumerView — Fan-facing view with bottom navigation
 * Tabs: Home | Chat | Explore | My Pass
 */

import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Home as HomeIcon,
  Newspaper as NewsIcon,
  MapPin as MapPinIcon,
  Utensils as UtensilsIcon,
  User as UserIcon,
  DoorOpen as DoorIcon,
  ShoppingBag as ShopIcon,
  Smile as SmileIcon,
  Shield as ShieldIcon,
  Megaphone as MegaphoneIcon,
  Mic as MicIcon,
  Heart as HeartIcon,
  MessageSquare as MsgIcon,
  Share2 as ShareIcon,
  Send as SendIcon,
  Sparkles as SparklesIcon,
  Ticket as TicketIcon,
  QrCode as QrCodeIcon,
  Plus as PlusIcon,
  Edit as EditIcon,
  ArrowUp as ArrowUpIcon,
  Check as CheckIcon,
  Pizza as PizzaIcon,
  CupSoda as CupIcon,
  Flame as FlameIcon,
  Zap as ZapIcon,
  Trophy as TrophyIcon,
  Activity as RestroomIcon,
} from 'lucide-react-native';
import { FanLevel, StadiumLocation } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'home' | 'chat' | 'explore' | 'food' | 'pass';

type FoodItem = {
  id: string;
  name: string;
  price: number;
  description: string;
  icon: React.ComponentType<any>;
};

type FeedMode = 'chat' | 'news' | 'assist';

type FeedPost = {
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
};

type LiveAnnouncement = {
  id: string;
  badge: string;
  title: string;
  detail: string;
  icon: React.ComponentType<any>;
};

interface Props {
  locations: StadiumLocation[];
  onSwitchRole: () => void;
}

// const OLLAMA_MODEL = 'llama3.2:3b';
// const OLLAMA_BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:11434' : 'http://127.0.0.1:11434';

const TYPE_ICON: Record<string, React.ComponentType<any>> = {
  entrance: DoorIcon,
  food: UtensilsIcon,
  shop: ShopIcon,
  restroom: RestroomIcon,
};

const FAN_LEVELS: FanLevel[] = ['beginner', 'casual', 'super_fan'];

const FAN_PERKS: Record<FanLevel, string[]> = {
  beginner: ['Free stadium map', 'Basic AI assistance'],
  casual: ['Skip 1 queue/game', 'Exclusive offers', 'Free map'],
  super_fan: ['VIP lounge access', 'Skip 3 queues/game', 'Priority merch'],
};

const FOOD_MENU: FoodItem[] = [
  { id: 'burger', name: 'Classic Burger', price: 12, description: 'Juicy beef burger with fries', icon: UtensilsIcon },
  { id: 'pizza', name: 'Slice Pizza', price: 9, description: 'Cheesy slice with stadium sauce', icon: PizzaIcon },
  { id: 'nachos', name: 'Loaded Nachos', price: 8, description: 'Crispy nachos with dip and jalapeños', icon: FlameIcon },
  { id: 'drink', name: 'Cold Drink', price: 4, description: 'Soft drink served chilled', icon: CupIcon },
];

const STORIES = [
  { id: 's1', name: 'Stadium', icon: TrophyIcon, color: '#5b4636' },
  { id: 's2', name: 'You', icon: SmileIcon, color: '#c07840' },
  { id: 's3', name: 'Food Ct', icon: UtensilsIcon, color: '#e07830' },
  { id: 's4', name: 'Security', icon: ShieldIcon, color: '#4a7856' },
  { id: 's5', name: 'Merch', icon: ShopIcon, color: '#7856a8' },
];

const LIVE_ANNOUNCEMENTS: LiveAnnouncement[] = [
  { id: 'a1', badge: 'Stadium', title: 'Gate A security line is moving fast', detail: 'Wait time down to 6 min. Head there now.', icon: MegaphoneIcon },
  { id: 'a2', badge: 'Event', title: 'Halftime show starts in 12 minutes', detail: 'Field crew reset before stage lights.', icon: MicIcon },
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

// ─── Sub-screens ──────────────────────────────────────────────────────────────

function HomeScreen({
  currentLocation,
  fanLevel,
  locations,
  onTabChange,
}: {
  currentLocation: string;
  fanLevel: FanLevel;
  locations: StadiumLocation[];
  onTabChange: (t: Tab) => void;
}) {
  const minWait = Math.min(...locations.map(l => l.waitTime));
  const bestSpot = locations.find(l => l.waitTime === minWait);

  return (
    <ScrollView contentContainerStyle={s.screenPad} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={s.heroCard}>
        <TrophyIcon size={48} color="#d86f47" style={{ marginBottom: 12 }} />
        <Text style={s.heroTitle}>Welcome back, Fan!</Text>
        <Text style={s.heroSub}>You are at <Text style={s.heroAccent}>{currentLocation}</Text></Text>
      </View>
 
      {/* Quick stats */}
      <View style={s.statsRow}>
        <View style={s.statBox}>
          <Text style={s.statNum}>{locations.length}</Text>
          <Text style={s.statLbl}>Spots</Text>
        </View>
        <View style={s.statBox}>
          <Text style={s.statNum}>{minWait}</Text>
          <Text style={s.statLbl}>Min Wait</Text>
        </View>
        <View style={s.statBox}>
          <Text style={[s.statNum, { color: '#c8b0ff', textTransform: 'capitalize' }]}>
            {fanLevel.replace('_', ' ')}
          </Text>
          <Text style={s.statLbl}>Fan Level</Text>
        </View>
      </View>
 
      {/* Best spot */}
      {bestSpot && (
        <View style={s.tipCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 4 }}>
            <ZapIcon size={12} color="#c07840" />
            <Text style={[s.tipLabel, { marginBottom: 0 }]}>Shortest Wait Right Now</Text>
          </View>
          <Text style={s.tipName}>{bestSpot.name}</Text>
          <Text style={s.tipWait}>~{bestSpot.waitTime} min — {bestSpot.description}</Text>
        </View>
      )}
 
      {/* Quick actions */}
      <Text style={s.sectionTitle}>Quick Actions</Text>
      <View style={s.actionsRow}>
        <TouchableOpacity style={s.actionBtn} onPress={() => onTabChange('chat')}>
          <MsgIcon size={24} color="#8c6a54" style={{ marginBottom: 6 }} />
          <Text style={s.actionLbl}>Live Feed</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionBtn} onPress={() => onTabChange('explore')}>
          <MapPinIcon size={24} color="#8c6a54" style={{ marginBottom: 6 }} />
          <Text style={s.actionLbl}>Navigate</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionBtn} onPress={() => onTabChange('pass')}>
          <UserIcon size={24} color="#8c6a54" style={{ marginBottom: 6 }} />
          <Text style={s.actionLbl}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionBtn} onPress={() => onTabChange('food')}>
          <UtensilsIcon size={24} color="#8c6a54" style={{ marginBottom: 6 }} />
          <Text style={s.actionLbl}>Order Food</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function LiveFeedScreen({
  feedHistory,
  announcements,
  onSend,
  onGeminiAssist,
  assistantBusy,
}: {
  feedHistory: FeedPost[];
  announcements: LiveAnnouncement[];
  onSend: (text: string, mode: FeedMode) => void;
  onGeminiAssist: () => void;
  assistantBusy: boolean;
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
    stadium: 'Stadium Official', fan: 'Fan', gemini: 'Gemma Assist',
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
            {item.role === 'stadium' ? (
              <TrophyIcon size={18} color="#ffffff" />
            ) : item.role === 'gemini' ? (
              <SparklesIcon size={18} color="#ffffff" />
            ) : (
              <SmileIcon size={18} color="#ffffff" />
            )}
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
        <TouchableOpacity
          activeOpacity={0.8}
          style={[sf.imagePlaceholder, { height: imgH, backgroundColor: item.imageColor ?? '#eee' }]}
          onPress={() => Alert.alert(`Media from ${roleName[item.role]}`, 'Mock Media URL: https://stadium.app/media/mock-image-123.jpg')}
        >
          <Text style={sf.imagePlaceholderEmoji}>{item.imageEmoji ?? '📷'}</Text>
          <Text style={sf.imagePlaceholderLabel}>{isPortrait ? '3 : 4' : '4 : 3'}</Text>
        </TouchableOpacity>

        {/* Action bar */}
        <View style={sf.postActions}>
          <TouchableOpacity style={sf.postActionBtn} onPress={() => toggleLike(item.id)}>
            <HeartIcon size={18} color={liked ? '#e03050' : '#888'} fill={liked ? '#e03050' : 'none'} />
            <Text style={sf.postActionCount}>{(item.likes ?? 0) + (liked ? 1 : 0)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={sf.postActionBtn}>
            <MsgIcon size={18} color="#888" />
            <Text style={sf.postActionCount}>{item.comments ?? 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={sf.postActionBtn}>
            <ShareIcon size={18} color="#888" />
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
            {isGemini ? (
              <SparklesIcon size={14} color="#ffffff" />
            ) : (
              <TrophyIcon size={14} color="#ffffff" />
            )}
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
            {announcements.length > 0 && (() => {
              const AnnouncementIcon = announcements[0].icon;
              return (
                <View style={sf.announceBanner}>
                  <AnnouncementIcon size={22} color="#ffffff" style={{ marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={sf.announceBannerBadge}>{announcements[0].badge}</Text>
                    <Text style={sf.announceBannerTitle}>{announcements[0].title}</Text>
                  </View>
                  <TouchableOpacity style={sf.geminiBtn} onPress={onGeminiAssist}>
                    {assistantBusy ? <ActivityIndicator color="#fff" /> : <Text style={sf.geminiBtnText}>✨ Ask AI</Text>}
                  </TouchableOpacity>
                </View>
              );
            })()}

            {/* ── Stories rail ── */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={sf.storiesRail}>
              {STORIES.map(st => (
                <TouchableOpacity
                  key={st.id}
                  style={sf.storyItem}
                  onPress={() => Alert.alert(`${st.name} Story`, `Playing mock video stream for ${st.name} (https://stadium.app/live/${st.id})`)}
                >
                  <View style={[sf.storyRing, { borderColor: st.color }]}>
                    <View style={[sf.storyAvatar, { backgroundColor: st.color }]}>
                      <st.icon size={26} color="#ffffff" />
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
          {([['chat', 'Chat', MsgIcon], ['news', 'Post', MegaphoneIcon], ['assist', 'AI', SparklesIcon]] as const).map(([val, label, Icon]) => {
            const active = mode === val;
            return (
              <TouchableOpacity key={val} style={[sf.modeChip, active && sf.modeChipActive]} onPress={() => setMode(val)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Icon size={12} color={active ? '#ffffff' : '#5b4636'} />
                  <Text style={[sf.modeChipText, active && sf.modeChipTextActive]}>{label}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <View style={sf.inputRow}>
          <TouchableOpacity style={sf.attachBtn} onPress={onGeminiAssist}>
            {assistantBusy ? <ActivityIndicator color="#5b4636" /> : <SparklesIcon size={18} color="#5b4636" />}
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
            <SendIcon size={16} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function ExploreScreen({
  locations,
  currentLocation,
  onSelect,
}: {
  locations: StadiumLocation[];
  currentLocation: string;
  onSelect: (loc: StadiumLocation) => void;
}) {
  return (
    <ScrollView contentContainerStyle={s.screenPad} showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 22, marginBottom: 10, gap: 6 }}>
        <MapPinIcon size={12} color="#9e8c7a" />
        <Text style={[s.sectionTitle, { marginTop: 0, marginBottom: 0 }]}>Nearby Locations</Text>
      </View>
      {locations.map(loc => {
        const isActive = loc.name === currentLocation;
        return (
          <TouchableOpacity
            key={loc.id}
            style={[s.locCard, isActive && s.locCardActive]}
            onPress={() => onSelect(loc)}>
            <View style={s.locIconWrap}>
              {(() => {
                const IconComp = TYPE_ICON[loc.type];
                return IconComp ? <IconComp size={20} color="#8c6a54" /> : <MapPinIcon size={20} color="#8c6a54" />;
              })()}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.locName}>{loc.name}</Text>
              <Text style={s.locDesc}>{loc.description}</Text>
            </View>
            <View style={s.waitPill}>
              <Text style={s.waitPillNum}>{loc.waitTime}</Text>
              <Text style={s.waitPillUnit}>min</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function FoodScreen({
  onPlaceOrder,
}: {
  onPlaceOrder: (summary: string) => void;
}) {
  const [cart, setCart] = useState<Record<string, number>>({});

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => {
      const nextQuantity = Math.max(0, (prev[itemId] ?? 0) + delta);
      if (nextQuantity === 0) {
        const updated = { ...prev };
        delete updated[itemId];
        return updated;
      }

      return { ...prev, [itemId]: nextQuantity };
    });
  };

  const cartLines = FOOD_MENU
    .filter(item => (cart[item.id] ?? 0) > 0)
    .map(item => ({ ...item, quantity: cart[item.id] ?? 0 }));

  const totalItems = cartLines.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartLines.reduce((sum, item) => sum + item.quantity * item.price, 0);

  const placeOrder = () => {
    if (!totalItems) {
      Alert.alert('Add food first', 'Select at least one item before placing an order.');
      return;
    }

    const summary = cartLines.map(item => `${item.quantity} x ${item.name}`).join(', ');
    onPlaceOrder(summary);
    setCart({});
  };

  return (
    <ScrollView contentContainerStyle={s.screenPad} showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 22, marginBottom: 10, gap: 6 }}>
        <UtensilsIcon size={12} color="#9e8c7a" />
        <Text style={[s.sectionTitle, { marginTop: 0, marginBottom: 0 }]}>Food Order</Text>
      </View>
      <Text style={s.foodIntro}>Pick your items, then confirm the order with one tap.</Text>

      {FOOD_MENU.map(item => {
        const quantity = cart[item.id] ?? 0;

        return (
          <View key={item.id} style={s.foodCard}>
            <View style={s.foodCardTop}>
              <View style={s.foodIconWrap}>
                {(() => {
                  const IconComp = item.icon;
                  return <IconComp size={20} color="#8c6a54" />;
                })()}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.foodName}>{item.name}</Text>
                <Text style={s.foodDesc}>{item.description}</Text>
              </View>
              <Text style={s.foodPrice}>${item.price}</Text>
            </View>

            <View style={s.foodActions}>
              <TouchableOpacity
                style={[s.qtyBtn, quantity === 0 && s.qtyBtnDisabled]}
                onPress={() => updateQuantity(item.id, -1)}
                disabled={quantity === 0}>
                <Text style={s.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={s.qtyValue}>{quantity}</Text>
              <TouchableOpacity style={s.qtyBtn} onPress={() => updateQuantity(item.id, 1)}>
                <Text style={s.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

      <View style={s.orderSummaryCard}>
        <Text style={s.orderSummaryLabel}>Current Order</Text>
        <Text style={s.orderSummaryValue}>
          {totalItems ? `${totalItems} item${totalItems > 1 ? 's' : ''}` : 'No items selected'}
        </Text>
        <Text style={s.orderSummaryTotal}>Total: ${totalPrice}</Text>
        <TouchableOpacity style={s.placeOrderBtn} onPress={placeOrder}>
          <Text style={s.placeOrderText}>Place Order</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function ProfileScreen({
  fanLevel,
  onCycleLevel,
  onProfileSave,
}: {
  fanLevel: FanLevel;
  onCycleLevel: () => void;
  onProfileSave: (name: string) => void;
}) {
  const levelIndex = FAN_LEVELS.indexOf(fanLevel);
  const progress = ((levelIndex + 1) / FAN_LEVELS.length) * 100;

  // Pre-populated defaults
  const [name, setName] = useState('Alex Johnson');
  const [email, setEmail] = useState('alex.j@email.com');
  const [seat, setSeat] = useState('B14');
  const [team, setTeam] = useState('Home Team');
  const [isEditing, setIsEditing] = useState(false);

  const [tickets, setTickets] = useState<{ id: string; event: string; seat: string; date: string }[]>([
    { id: 't1', event: 'Championship Finals', seat: 'B14', date: '24 May 2026' },
  ]);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketCode, setTicketCode] = useState('');

  const handleSave = () => {
    if (!name.trim()) { Alert.alert('Name required', 'Please enter your name.'); return; }
    setIsEditing(false);
    onProfileSave(name.trim());
  };

  const addTicket = () => {
    if (!ticketCode.trim()) { Alert.alert('Enter a ticket code'); return; }
    setTickets(prev => [...prev, { id: String(Date.now()), event: 'Stadium Event', seat, date: new Date().toLocaleDateString() }]);
    setTicketCode(''); setShowTicketForm(false);
  };

  return (
    <ScrollView contentContainerStyle={s.screenPad} showsVerticalScrollIndicator={false}>

      {/* ── Fan Pass Card ── */}
      <View style={s.passCard}>
        <View style={s.avatarRow}>
          <View style={s.avatarCircle}>
            <Text style={s.avatarInitial}>{name.trim() ? name.trim()[0].toUpperCase() : '?'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.passCardLabel}>FAN PASS</Text>
            <Text style={s.passCardLevel}>{fanLevel.replace('_', ' ').toUpperCase()}</Text>
            <Text style={s.passUserName}>{name}</Text>
          </View>
          <TicketIcon size={36} color="#ffffff" style={{ opacity: 0.8 }} />
        </View>
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={s.progressLabel}>Level {levelIndex + 1} of {FAN_LEVELS.length}</Text>
      </View>

      {/* ── Perks ── */}
      <Text style={s.sectionTitle}>Your Perks</Text>
      {FAN_PERKS[fanLevel].map((perk, i) => (
        <View key={i} style={s.perkRow}>
          <Text style={s.perkDot}>✦</Text>
          <Text style={s.perkText}>{perk}</Text>
        </View>
      ))}
      {levelIndex < FAN_LEVELS.length - 1 && (
        <TouchableOpacity style={s.levelUpBtn} onPress={onCycleLevel}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <ArrowUpIcon size={14} color="#5b4636" />
            <Text style={s.levelUpText}>Level Up to {FAN_LEVELS[levelIndex + 1].replace('_', ' ')}</Text>
          </View>
        </TouchableOpacity>
      )}
      {levelIndex === FAN_LEVELS.length - 1 && (
        <View style={s.maxCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <TrophyIcon size={14} color="#5b4636" />
            <Text style={s.maxText}>Super Fan — max level reached!</Text>
          </View>
        </View>
      )}

      {/* ── My Tickets ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 22, marginBottom: 10, gap: 6 }}>
        <TicketIcon size={12} color="#9e8c7a" />
        <Text style={[s.sectionTitle, { marginTop: 0, marginBottom: 0 }]}>My Tickets</Text>
      </View>
      {tickets.length === 0 && (
        <View style={s.emptyTickets}><Text style={s.emptyTicketsText}>No tickets added yet.</Text></View>
      )}
      {tickets.map(t => (
        <View key={t.id} style={s.ticketCard}>
          <View style={{ flex: 1 }}>
            <Text style={s.ticketEvent}>{t.event}</Text>
            <Text style={s.ticketMeta}>Seat {t.seat}  ·  {t.date}</Text>
          </View>
          <QrCodeIcon size={28} color="#aaa" />
        </View>
      ))}
      {showTicketForm ? (
        <View style={s.ticketFormCard}>
          <Text style={s.formLabel}>Ticket Code</Text>
          <TextInput style={s.profileInput} value={ticketCode} onChangeText={setTicketCode}
            placeholder="e.g. STD-2024-A1" placeholderTextColor="#aaa" autoCapitalize="characters" />
          <View style={s.ticketFormBtns}>
            <TouchableOpacity style={s.addTicketConfirm} onPress={addTicket}>
              <Text style={s.addTicketConfirmText}>Add Ticket</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.addTicketCancel} onPress={() => setShowTicketForm(false)}>
              <Text style={s.addTicketCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={s.addTicketBtn} onPress={() => setShowTicketForm(true)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <PlusIcon size={14} color="#c07840" />
            <Text style={s.addTicketBtnText}>Add / Scan Ticket</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* ── Profile Section ── */}
      <View style={s.profileHeaderRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <UserIcon size={12} color="#9e8c7a" />
          <Text style={[s.sectionTitle, { marginTop: 0, marginBottom: 0 }]}>My Profile</Text>
        </View>
        <TouchableOpacity style={s.editBtn} onPress={() => isEditing ? handleSave() : setIsEditing(true)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {isEditing ? (
              <CheckIcon size={12} color="#ffffff" />
            ) : (
              <EditIcon size={12} color="#ffffff" />
            )}
            <Text style={s.editBtnText}>{isEditing ? 'Save' : 'Edit'}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={s.formCard}>
        {isEditing ? (
          <>
            <Text style={s.formLabel}>Full Name</Text>
            <TextInput style={s.profileInput} value={name} onChangeText={setName} placeholderTextColor="#aaa" />
            <Text style={s.formLabel}>Email</Text>
            <TextInput style={s.profileInput} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#aaa" />
            <Text style={s.formLabel}>Seat Number</Text>
            <TextInput style={s.profileInput} value={seat} onChangeText={setSeat} autoCapitalize="characters" placeholderTextColor="#aaa" />
            <Text style={s.formLabel}>Favourite Team</Text>
            <TextInput style={s.profileInput} value={team} onChangeText={setTeam} placeholderTextColor="#aaa" />
            <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
              <Text style={s.saveBtnText}>Save Profile</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {[['Full Name', name], ['Email', email], ['Seat Number', seat], ['Favourite Team', team]].map(([label, val]) => (
              <View key={label} style={s.profileFieldRow}>
                <Text style={s.formLabel}>{label}</Text>
                <Text style={s.profileFieldValue}>{val}</Text>
              </View>
            ))}
          </>
        )}
      </View>

    </ScrollView>
  );
}
// ─── Bottom Nav Bar ───────────────────────────────────────────────────────────

const NAV_ITEMS: { key: Tab; icon: React.ComponentType<any>; label: string }[] = [
  { key: 'home', icon: HomeIcon, label: 'Home' },
  { key: 'chat', icon: NewsIcon, label: 'Live Feed' },
  { key: 'explore', icon: MapPinIcon, label: 'Explore' },
  { key: 'food', icon: UtensilsIcon, label: 'Food' },
  { key: 'pass', icon: UserIcon, label: 'Profile' },
];

function BottomNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.navBar, { paddingBottom: Math.max(insets.bottom, 6) }]}>
      {NAV_ITEMS.map(item => {
        const isActive = item.key === active;
        const IconComponent = item.icon;
        return (
          <TouchableOpacity
            key={item.key}
            style={s.navItem}
            onPress={() => onChange(item.key)}
            activeOpacity={0.7}>
            {isActive && <View style={s.navActiveGlow} />}
            <IconComponent size={20} color={isActive ? '#5b4636' : '#aaa'} />
            <Text style={[s.navLabel, isActive && s.navLabelActive]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ConsumerView({ locations, onSwitchRole }: Props) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [feedHistory, setFeedHistory] = useState<FeedPost[]>(INITIAL_FEED);
  const [announcements] = useState<LiveAnnouncement[]>(LIVE_ANNOUNCEMENTS);
  const [fanLevel, setFanLevel] = useState<FanLevel>('beginner');
  const [currentLocation, setCurrentLocation] = useState<string>('Gate A');
  const [assistantBusy] = useState(false);

  const addFeedPost = (role: FeedPost['role'], headline: string, text: string) =>
    setFeedHistory(prev => [
      ...prev,
      { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, role, type: 'text' as const, headline, text, timestamp: Date.now() },
    ]);



  const handleSend = (text: string, mode: FeedMode) => {
    if (mode === 'assist') {
      return;
    }

    if (mode === 'news') {
      addFeedPost('fan', 'Fan shared news', text);
      addFeedPost('stadium', 'Crew acknowledgement', 'Thanks for the update. Stadium staff are checking the reported area and will confirm any changes on the official feed.');
      setActiveTab('chat');
      return;
    }

    addFeedPost('fan', 'Fan chat', text);
    setActiveTab('chat');
  };

  const handleFoodOrder = (summary: string) => {
    addFeedPost('fan', 'Food order placed', `I ordered food: ${summary}`);
    addFeedPost('stadium', 'Order received', `🍔 Food order received: ${summary}. Your order is being prepared now.`);
    setActiveTab('chat');
  };

  const handleSelectLocation = (loc: StadiumLocation) => {
    setCurrentLocation(loc.name);
    addFeedPost('gemini', 'Navigation update', `📍 Navigating to ${loc.name}. Wait: ~${loc.waitTime} min. ${loc.description}`);
    setActiveTab('chat');
  };

  const cycleFanLevel = () => {
    setFanLevel(prev => {
      const next = FAN_LEVELS[(FAN_LEVELS.indexOf(prev) + 1) % FAN_LEVELS.length];
      addFeedPost('gemini', 'Fan level upgrade', `🎉 Fan level upgraded to "${next.replace('_', ' ')}"! New perks unlocked.`);
      return next;
    });
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeScreen
            currentLocation={currentLocation}
            fanLevel={fanLevel}
            locations={locations}
            onTabChange={setActiveTab}
          />
        );
      case 'chat':
        return (
          <LiveFeedScreen
            feedHistory={feedHistory}
            announcements={announcements}
            onSend={handleSend}
            onGeminiAssist={() => {}}
            assistantBusy={assistantBusy}
          />
        );
      case 'explore':
        return (
          <ExploreScreen
            locations={locations}
            currentLocation={currentLocation}
            onSelect={handleSelectLocation}
          />
        );
      case 'food':
        return <FoodScreen onPlaceOrder={handleFoodOrder} />;
      case 'pass':
        return (
          <ProfileScreen
            fanLevel={fanLevel}
            onCycleLevel={cycleFanLevel}
            onProfileSave={name => addFeedPost('gemini', 'Profile saved', `👤 Profile saved! Hey ${name}, your details are locked in. The app is now personalised for you! 🎉`)}
          />
        );
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* ── Header ── */}
      <View style={[s.header, { paddingTop: insets.top + 12, paddingBottom: 12 }]}>
        <View style={s.headerRow}>
          <View>
            <Text style={s.headerTitle}>🏟️ MyStadium</Text>
            <Text style={s.headerSub}>📍 {currentLocation}</Text>
          </View>
          <TouchableOpacity onPress={onSwitchRole} style={s.roleChip}>
            <Text style={s.roleChipText}>Switch Role</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Tab content ── */}
      <View style={{ flex: 1 }}>{renderScreen()}</View>

      {/* ── Bottom nav ── */}
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f7f3ee' },

  // Header
  header: { paddingHorizontal: 18, paddingVertical: 12, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#ede8e0' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1a1a1a' },
  headerSub: { fontSize: 12, color: '#888', marginTop: 2 },
  roleChip: { backgroundColor: '#f0ece4', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#ddd8ce' },
  roleChipText: { color: '#5b4636', fontSize: 12, fontWeight: '600' },

  // Bottom nav
  navBar: { flexDirection: 'row', backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#ede8e0', paddingBottom: 6, paddingTop: 8 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4, position: 'relative' },
  navActiveGlow: { position: 'absolute', top: -8, width: 36, height: 3, borderRadius: 2, backgroundColor: '#5b4636' },
  navIcon: { fontSize: 20, opacity: 0.35 },
  navIconActive: { opacity: 1 },
  navLabel: { fontSize: 10, color: '#aaa', marginTop: 3 },
  navLabelActive: { color: '#5b4636', fontWeight: '700' },

  // Shared
  screenPad: { padding: 16, paddingBottom: 28 },
  sectionTitle: { color: '#9e8c7a', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: 22, marginBottom: 10 },

  // Home
  heroCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#ede8e0', marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  heroEmoji: { fontSize: 40, marginBottom: 8 },
  heroTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a1a', marginBottom: 4 },
  heroSub: { fontSize: 14, color: '#888' },
  heroAccent: { color: '#5b4636', fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  statBox: { flex: 1, backgroundColor: '#ffffff', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#ede8e0' },
  statNum: { fontSize: 20, fontWeight: '800', color: '#1a1a1a' },
  statLbl: { fontSize: 11, color: '#aaa', marginTop: 2 },
  tipCard: { backgroundColor: '#fff8f2', borderRadius: 14, padding: 14, marginTop: 14, borderWidth: 1, borderColor: '#f0e4d4' },
  tipLabel: { color: '#c07840', fontSize: 11, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase' },
  tipName: { color: '#1a1a1a', fontSize: 16, fontWeight: '700', marginBottom: 2 },
  tipWait: { color: '#888', fontSize: 13 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, backgroundColor: '#ffffff', borderRadius: 16, paddingVertical: 18, alignItems: 'center', borderWidth: 1, borderColor: '#ede8e0' },
  actionIcon: { fontSize: 24, marginBottom: 6 },
  actionLbl: { color: '#5b4636', fontSize: 12, fontWeight: '600' },

  // Food
  foodIntro: { color: '#888', fontSize: 13, lineHeight: 18, marginBottom: 10 },
  foodCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#ede8e0' },
  foodCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  foodIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#f7f3ee', alignItems: 'center', justifyContent: 'center' },
  foodIcon: { fontSize: 22 },
  foodName: { color: '#1a1a1a', fontSize: 15, fontWeight: '700', marginBottom: 2 },
  foodDesc: { color: '#888', fontSize: 12, lineHeight: 16 },
  foodPrice: { color: '#5b4636', fontSize: 16, fontWeight: '800' },
  foodActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 12 },
  qtyBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#5b4636', alignItems: 'center', justifyContent: 'center' },
  qtyBtnDisabled: { backgroundColor: '#e0dbd4' },
  qtyBtnText: { color: '#fff', fontSize: 22, fontWeight: '700', lineHeight: 22 },
  qtyValue: { minWidth: 18, textAlign: 'center', color: '#1a1a1a', fontSize: 15, fontWeight: '700' },
  orderSummaryCard: { marginTop: 10, backgroundColor: '#fff8f2', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f0e4d4' },
  orderSummaryLabel: { color: '#c07840', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 },
  orderSummaryValue: { color: '#1a1a1a', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  orderSummaryTotal: { color: '#5b4636', fontSize: 14, marginBottom: 12 },
  placeOrderBtn: { backgroundColor: '#5b4636', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  placeOrderText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  // Live feed
  feedRoot: { flex: 1, backgroundColor: '#f7f3ee' },
  feedList: { padding: 16, paddingBottom: 24 },
  feedHeroCard: { backgroundColor: '#ffffff', borderRadius: 22, padding: 18, borderWidth: 1, borderColor: '#ede8e0', marginBottom: 14 },
  feedKicker: { color: '#9e8c7a', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.1 },
  feedTitle: { color: '#1a1a1a', fontSize: 22, fontWeight: '900', lineHeight: 28, marginTop: 8 },
  feedSubtitle: { color: '#888', fontSize: 13, lineHeight: 19, marginTop: 8 },
  feedHeroRow: { flexDirection: 'row', gap: 10, marginTop: 16, flexWrap: 'wrap' },
  feedStatPill: { minWidth: 92, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 16, backgroundColor: '#f7f3ee', borderWidth: 1, borderColor: '#ede8e0' },
  feedStatValue: { color: '#1a1a1a', fontSize: 18, fontWeight: '900' },
  feedStatLabel: { color: '#9e8c7a', fontSize: 11, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.8 },
  geminiHeroButton: { flexGrow: 1, minWidth: 120, backgroundColor: '#5b4636', borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  geminiHeroButtonText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  announcementRail: { backgroundColor: '#ffffff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#ede8e0', marginBottom: 14 },
  announcementRailTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 8 },
  announcementRailLabel: { color: '#1a1a1a', fontSize: 14, fontWeight: '800' },
  announcementRailHint: { color: '#aaa', fontSize: 11 },
  announcementCard: { flexDirection: 'row', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f0ece4' },
  announcementIcon: { fontSize: 20, marginTop: 2 },
  announcementBadge: { color: '#9e8c7a', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  announcementTitle: { color: '#1a1a1a', fontSize: 14, fontWeight: '800', marginTop: 2 },
  announcementDetail: { color: '#888', fontSize: 12, lineHeight: 17, marginTop: 4 },
  feedSectionTitle: { color: '#9e8c7a', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  feedCard: { backgroundColor: '#ffffff', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: '#ede8e0', marginBottom: 10 },
  feedCardFan: { borderColor: '#f0e4d4', backgroundColor: '#fff8f2' },
  feedCardGemini: { borderColor: '#dce8f0', backgroundColor: '#f5faff' },
  feedCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  feedRoleDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4, backgroundColor: '#ccc' },
  feedRoleDotFan: { backgroundColor: '#f59e0b' },
  feedRoleDotGemini: { backgroundColor: '#60a5fa' },
  feedCardHeadline: { color: '#1a1a1a', fontSize: 15, fontWeight: '800' },
  feedCardMeta: { color: '#aaa', fontSize: 11, marginTop: 2 },
  feedCardText: { color: '#444', fontSize: 14, lineHeight: 20 },
  composerShell: { marginTop: 10 },
  modeRow: { flexDirection: 'row', gap: 10, marginBottom: 10, flexWrap: 'wrap' },
  modeChip: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#ddd8ce' },
  modeChipActive: { backgroundColor: '#5b4636', borderColor: '#5b4636' },
  modeChipText: { color: '#888', fontSize: 12, fontWeight: '700' },
  modeChipTextActive: { color: '#fff' },
  composerCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: '#ede8e0' },
  composerLabel: { color: '#1a1a1a', fontSize: 13, fontWeight: '800', marginBottom: 10 },
  inputBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#f7f3ee', borderWidth: 1, borderColor: '#ddd8ce', borderRadius: 18, gap: 10 },
  input: { flex: 1, backgroundColor: 'transparent', paddingHorizontal: 16, color: '#1a1a1a', fontSize: 14 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#5b4636', alignItems: 'center', justifyContent: 'center' },
  sendIcon: { color: '#fff', fontSize: 16, fontWeight: '900' },
  secondaryAssistBtn: { marginTop: 10, alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, backgroundColor: '#f0ece4', borderWidth: 1, borderColor: '#ddd8ce' },
  secondaryAssistText: { color: '#5b4636', fontSize: 12, fontWeight: '700' },

  // Explore
  locCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#ede8e0', gap: 12 },
  locCardActive: { borderColor: '#5b4636', backgroundColor: '#fff8f2' },
  locIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#f7f3ee', alignItems: 'center', justifyContent: 'center' },
  locIcon: { fontSize: 22 },
  locName: { color: '#1a1a1a', fontSize: 15, fontWeight: '700', marginBottom: 2 },
  locDesc: { color: '#888', fontSize: 12 },
  waitPill: { backgroundColor: '#f7f3ee', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center', minWidth: 46, borderWidth: 1, borderColor: '#ede8e0' },
  waitPillNum: { color: '#5b4636', fontSize: 18, fontWeight: '800' },
  waitPillUnit: { color: '#aaa', fontSize: 10 },

  // Profile — Fan Pass Card
  passCard: { backgroundColor: '#5b4636', borderRadius: 20, padding: 20, marginBottom: 16 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  avatarCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  avatarInitial: { color: '#5b4636', fontSize: 26, fontWeight: '900' },
  passCardLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  passCardLevel: { color: '#fff', fontSize: 18, fontWeight: '900', textTransform: 'capitalize', marginTop: 2 },
  passUserName: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 2 },
  passCardEmoji: { fontSize: 36 },
  progressTrack: { height: 5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 3 },
  progressLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },

  // Perks
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  perkDot: { color: '#c07840', fontSize: 12 },
  perkText: { color: '#444', fontSize: 14 },
  levelUpBtn: { marginTop: 14, backgroundColor: '#fff8f2', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#f0e4d4' },
  levelUpText: { color: '#5b4636', fontSize: 15, fontWeight: '700' },
  maxCard: { marginTop: 14, backgroundColor: '#fff8f2', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#f0e4d4' },
  maxText: { color: '#5b4636', fontSize: 15, fontWeight: '700' },

  // Tickets
  emptyTickets: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#ede8e0' },
  emptyTicketsText: { color: '#aaa', fontSize: 13 },
  ticketCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#ede8e0', gap: 10, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  ticketLeft: { width: 4, alignSelf: 'stretch', backgroundColor: '#c07840', borderRadius: 2 },
  ticketDashes: { color: '#ddd', fontSize: 8, letterSpacing: -2 },
  ticketEvent: { color: '#1a1a1a', fontSize: 14, fontWeight: '700', marginBottom: 3 },
  ticketMeta: { color: '#888', fontSize: 12 },
  ticketQr: { color: '#ccc', fontSize: 28 },
  ticketFormCard: { backgroundColor: '#ffffff', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#ede8e0' },
  ticketFormBtns: { flexDirection: 'row', gap: 10, marginTop: 10 },
  addTicketConfirm: { flex: 1, backgroundColor: '#5b4636', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  addTicketConfirmText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  addTicketCancel: { flex: 1, backgroundColor: '#f7f3ee', borderRadius: 10, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#ddd8ce' },
  addTicketCancelText: { color: '#888', fontSize: 14 },
  addTicketBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#c07840', borderStyle: 'dashed', marginBottom: 4 },
  addTicketBtnText: { color: '#c07840', fontSize: 14, fontWeight: '700' },

  // Profile form
  profileHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, marginBottom: 10 },
  editBtn: { backgroundColor: '#5b4636', paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20 },
  editBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  formCard: { backgroundColor: '#ffffff', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#ede8e0' },
  formLabel: { color: '#9e8c7a', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 12, marginBottom: 4 },
  profileInput: { backgroundColor: '#f7f3ee', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: '#1a1a1a', fontSize: 14, borderWidth: 1, borderColor: '#ede8e0' },
  profileFieldRow: { paddingVertical: 4 },
  profileFieldValue: { color: '#1a1a1a', fontSize: 15, fontWeight: '500', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0ece4' },
  saveBtn: { marginTop: 18, backgroundColor: '#5b4636', borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  saveBtnDone: { backgroundColor: '#3a7a4a' },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});

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

