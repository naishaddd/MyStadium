import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
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
  Trophy as TrophyIcon,
  Users as UsersIcon,
  MessageSquare as MsgIcon,
  MapPin as MapPinIcon,
  Sliders as ControlsIcon,
  User as UserIcon,
  DoorOpen as DoorIcon,
  Utensils as UtensilsIcon,
  ShoppingBag as ShopIcon,
  Activity as RestroomIcon,
  Send as SendIcon,
} from 'lucide-react-native';
import { StadiumLocation } from '../../types';

interface Props {
  locations: StadiumLocation[];
  onLocationsChange: (updated: StadiumLocation[]) => void;
  onSwitchRole: () => void;
}

type TabKey = 'overview' | 'attendance' | 'messages' | 'zones' | 'controls' | 'profile';

type StaffMember = {
  id: string;
  name: string;
  role: string;
  duty: string;
  status: 'On duty' | 'Standby' | 'Off shift';
  zone: string;
};

type GroupMessage = {
  id: string;
  sender: string;
  role: string;
  text: string;
  timestamp: string;
  accent: string;
};

type ZoneTicketState = {
  label: string;
  detail: string;
  accent: string;
};

const TAB_ITEMS: Array<{ key: TabKey; label: string; icon: React.ComponentType<any> }> = [
  { key: 'overview', label: 'Overview', icon: TrophyIcon },
  { key: 'attendance', label: 'Attendance', icon: UsersIcon },
  { key: 'messages', label: 'Messages', icon: MsgIcon },
  { key: 'zones', label: 'Zones', icon: MapPinIcon },
  { key: 'controls', label: 'Controls', icon: ControlsIcon },
  { key: 'profile', label: 'Profile', icon: UserIcon },
];

const APP_BG = '#f4efe7';
const CARD_BG = '#fffaf6';
const PAPER = '#f6f0e8';
const INK = '#2f2a26';
const MUTED = '#75695f';
const BORDER = '#e3d7cb';
const PERIWINKLE = '#8c6a54';
const AQUA = '#6f8f7c';
const AQUA_DEEP = '#4f7b67';
// const BUTTER = '#c8955b';
const CORAL = '#d4765f';

const TYPE_ICON: Record<string, React.ComponentType<any>> = {
  entrance: DoorIcon,
  food: UtensilsIcon,
  shop: ShopIcon,
  restroom: RestroomIcon,
};

const TOTAL_ATTENDANCE = 48216;
const ATTENDANCE_CAPACITY = 52000;

const STAFF_ROSTER: StaffMember[] = [
  { id: 'staff-1', name: 'Ari', role: 'Security lead', duty: 'Gate sweep and escalation', status: 'On duty', zone: 'North Gate' },
  { id: 'staff-2', name: 'Mina', role: 'Flow coordinator', duty: 'Keep entry lanes balanced', status: 'On duty', zone: 'Concourse' },
  { id: 'staff-3', name: 'Noah', role: 'Guest support', duty: 'Answer seating and accessibility requests', status: 'Standby', zone: 'Help desk' },
  { id: 'staff-4', name: 'Jules', role: 'Food court lead', duty: 'Coordinate restock alerts', status: 'On duty', zone: 'Food court' },
  { id: 'staff-5', name: 'Priya', role: 'Zone marshal', duty: 'Relay queue changes to the control room', status: 'Off shift', zone: 'Upper deck' },
];

const GROUP_MESSAGES: GroupMessage[] = [
  {
    id: 'msg-1',
    sender: 'Ari',
    role: 'Security lead',
    text: 'Gate B is healthy again. Move one runner back to the north entrance and keep the overflow lane open.',
    timestamp: '2 min ago',
    accent: '#ffb66f',
  },
  {
    id: 'msg-2',
    sender: 'Jules',
    role: 'Food court lead',
    text: 'Burger line is climbing. I need two extra hands on the pickup window and a queue sign at the corner.',
    timestamp: '5 min ago',
    accent: '#8b94ff',
  },
  {
    id: 'msg-3',
    sender: 'Mina',
    role: 'Flow coordinator',
    text: 'Concourse flow is stable. Posting a reminder to route fans away from the packed restroom cluster.',
    timestamp: '8 min ago',
    accent: '#66d6d1',
  },
  {
    id: 'msg-4',
    sender: 'Control Room',
    role: 'Group broadcast',
    text: 'All zone leads should confirm ticket status and handoff notes before halftime starts.',
    timestamp: 'just now',
    accent: '#f5d96b',
  },
];

const crowdLevel = (waitTime: number) => {
  if (waitTime >= 30) {
    return { label: 'Packed', tone: 'high', accent: '#d97b66' };
  }

  if (waitTime >= 18) {
    return { label: 'Busy', tone: 'mid', accent: '#d4a067' };
  }

  return { label: 'Calm', tone: 'low', accent: AQUA };
};

const ticketState = (waitTime: number): ZoneTicketState => {
  if (waitTime >= 30) {
    return { label: 'Selling fast', detail: 'Ticket demand is highest here', accent: '#d97b66' };
  }

  if (waitTime >= 18) {
    return { label: 'Steady', detail: 'Tickets are moving at a moderate pace', accent: '#d4a067' };
  }

  return { label: 'Open', detail: 'Good availability for walk-ups and online sales', accent: AQUA };
};

const attendanceShare = Math.round((TOTAL_ATTENDANCE / ATTENDANCE_CAPACITY) * 100);

export default function AdminView({
  locations,
  onLocationsChange,
  onSwitchRole,
}: Props) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [selectedId, setSelectedId] = useState<string>(locations[0]?.id ?? '');

  const [chatMessages, setChatMessages] = useState<GroupMessage[]>(GROUP_MESSAGES);
  const [newMsgText, setNewMsgText] = useState('');

  const handleSendMessage = () => {
    if (!newMsgText.trim()) return;
    const newMessage: GroupMessage = {
      id: `msg-${Date.now()}`,
      sender: 'Control Room',
      role: 'Group broadcast',
      text: newMsgText.trim(),
      timestamp: 'just now',
      accent: '#8c6a54',
    };
    setChatMessages([...chatMessages, newMessage]);
    setNewMsgText('');
  };

  const selectedLocation = locations.find(location => location.id === selectedId) ?? locations[0];
  const totalWait = locations.reduce((sum, location) => sum + location.waitTime, 0);
  const avgWait = locations.length ? Math.round(totalWait / locations.length) : 0;
  // const maxWait = locations.length ? Math.max(...locations.map(location => location.waitTime)) : 0;

  const topSignals = useMemo(() => {
    return [...locations]
      .sort((left, right) => right.waitTime - left.waitTime)
      .slice(0, 3)
      .map(location => ({
        ...location,
        crowd: crowdLevel(location.waitTime),
        ticket: ticketState(location.waitTime),
      }));
  }, [locations]);

  const activeStaff = STAFF_ROSTER.filter(member => member.status !== 'Off shift');
  const dutyCoverage = Math.round((activeStaff.length / STAFF_ROSTER.length) * 100);

  const adjustWait = (id: string, delta: number) => {
    onLocationsChange(
      locations.map(location => (
        location.id === id
          ? { ...location, waitTime: Math.max(0, location.waitTime + delta) }
          : location
      )),
    );
  };

  const renderOverview = () => (
    <>
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroTextWrap}>
            <Text style={styles.kicker}>Stadium Federation</Text>
            <Text style={styles.heroTitle}>Total attendance, duty, and zone control</Text>
            <Text style={styles.heroSub}>
              Live crowd, attendance, duty assignments, messages, and zone status in one control surface.
            </Text>
          </View>
        </View>

        <View style={styles.attendanceHero}>
          <View>
            <Text style={styles.attendanceValue}>{TOTAL_ATTENDANCE.toLocaleString()}</Text>
            <Text style={styles.attendanceLabel}>Total attendance inside the stadium</Text>
          </View>

        </View>

        <View style={styles.heroPillsRow}>
          <View style={[styles.heroPill, { backgroundColor: '#f3dfc8' }]}>
            <Text style={styles.heroPillValue}>{locations.length}</Text>
            <Text style={styles.heroPillLabel}>Active zones</Text>
          </View>
          <View style={[styles.heroPill, { backgroundColor: '#e8ded4' }]}>
            <Text style={styles.heroPillValue}>{avgWait}</Text>
            <Text style={styles.heroPillLabel}>Avg wait</Text>
          </View>
          <View style={[styles.heroPill, { backgroundColor: '#d8ebe3' }]}>
            <Text style={styles.heroPillValue}>{dutyCoverage}%</Text>
            <Text style={styles.heroPillLabel}>Duty coverage</Text>
          </View>
        </View>
      </View>


      <SectionCard title="Crowd summary" subtitle="Quick read on attendance, team coverage, and the current stadium flow.">
        <View style={styles.summaryGrid}>
          <SummaryTile
            title="Attendance"
            value={`${TOTAL_ATTENDANCE.toLocaleString()} fans`}
            detail={`${attendanceShare}% of stadium capacity`}
          />
          <SummaryTile
            title="Duty board"
            value={`${activeStaff.length} on shift`}
            detail={`${STAFF_ROSTER.length - activeStaff.length} away from floor`}
          />
        </View>
      </SectionCard>

      <SectionCard title="Top pressure zones" subtitle="These are the locations likely to need intervention first.">
        {topSignals.map(location => (
          <View key={location.id} style={styles.pressureRow}>
            <View style={styles.pressureIcon}>
              {(() => {
                const IconComp = TYPE_ICON[location.type];
                return IconComp ? <IconComp size={20} color="#8c6a54" /> : <MapPinIcon size={20} color="#8c6a54" />;
              })()}
            </View>
            <View style={styles.pressureInfo}>
              <Text style={styles.pressureName}>{location.name}</Text>
              <Text style={styles.pressureDetail}>{location.description}</Text>
              <Text style={styles.pressureMeta}>Ticket status: {location.ticket.label} · {location.ticket.detail}</Text>
            </View>
            <View style={styles.pressureTagWrap}>
              <View style={[styles.pressureTag, { backgroundColor: location.crowd.accent }]}>
                <Text style={styles.pressureTagText}>{location.crowd.label}</Text>
              </View>
            </View>
          </View>
        ))}
      </SectionCard>
    </>
  );

  const renderAttendance = () => (
    <>
      <SectionCard title="Attendance board" subtitle="Who is on duty, who is covering which zone, and where the work is happening.">
        <View style={styles.attendanceSummaryCard}>
          <View style={styles.attendanceSummaryTop}>
            <View>
              <Text style={styles.attendanceSummaryLabel}>Attendance today</Text>
              <Text style={styles.attendanceSummaryValue}>{TOTAL_ATTENDANCE.toLocaleString()}</Text>
            </View>
          </View>
          <Text style={styles.attendanceSummaryNote}>The board below shows the people, their roles, and the duty they are currently handling.</Text>
        </View>
      </SectionCard>

      <SectionCard title="Duty board" subtitle="People and the exact task they have been assigned.">
        {STAFF_ROSTER.map(member => (
          <View key={member.id} style={styles.staffCard}>
            <View style={styles.staffTopRow}>
              <View style={styles.staffAvatar}>
                <Text style={styles.staffAvatarText}>{member.name.slice(0, 1)}</Text>
              </View>
              <View style={styles.staffInfo}>
                <Text style={styles.staffName}>{member.name}</Text>
                <Text style={styles.staffRole}>{member.role}</Text>
              </View>
              <View style={[styles.staffStatus, member.status === 'On duty' ? styles.staffStatusLive : member.status === 'Standby' ? styles.staffStatusStandby : styles.staffStatusMuted]}>
                <Text style={styles.staffStatusText}>{member.status}</Text>
              </View>
            </View>

            <View style={styles.staffDutyRow}>
              <View style={styles.staffDutyChip}>
                <Text style={styles.staffDutyChipLabel}>Duty</Text>
                <Text style={styles.staffDutyChipValue}>{member.duty}</Text>
              </View>
              <View style={styles.staffDutyChip}>
                <Text style={styles.staffDutyChipLabel}>Zone</Text>
                <Text style={styles.staffDutyChipValue}>{member.zone}</Text>
              </View>
            </View>
          </View>
        ))}
      </SectionCard>
    </>
  );

  const renderMessages = () => (
    <SectionCard title="Group messages" subtitle="A shared operations room for updates, escalations, and handoffs.">
      <View style={styles.groupIntroCard}>
        <Text style={styles.groupIntroTitle}>Stadium operations room</Text>
        <Text style={styles.groupIntroText}>Messages here are shared across security, food, guest support, and zone leads so everyone can see who is doing what and where help is needed.</Text>
      </View>

      <View style={styles.chatThread}>
        {chatMessages.map(message => {
          const isMe = message.sender === 'Control Room';
          return (
            <View
              key={message.id}
              style={[
                styles.chatRow,
                isMe ? styles.chatRowRight : styles.chatRowLeft,
              ]}>
              {!isMe && (
                <View style={[styles.chatAvatar, { backgroundColor: message.accent + '25' }]}>
                  <Text style={[styles.chatAvatarText, { color: message.accent }]}>
                    {message.sender.slice(0, 1)}
                  </Text>
                </View>
              )}
              <View style={styles.chatBubbleContainer}>
                {!isMe && (
                  <Text style={styles.chatSenderName}>
                    {message.sender} <Text style={styles.chatSenderRole}>({message.role})</Text>
                  </Text>
                )}
                <View
                  style={[
                    styles.chatBubble,
                    isMe ? styles.chatBubbleRight : styles.chatBubbleLeft,
                  ]}>
                  <Text
                    style={[
                      styles.chatText,
                      isMe ? styles.chatTextRight : styles.chatTextLeft,
                    ]}>
                    {message.text}
                  </Text>
                </View>
                <Text style={[styles.chatTime, isMe ? styles.chatTimeRight : styles.chatTimeLeft]}>
                  {message.timestamp}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </SectionCard>
  );

  const renderZones = () => (
    <SectionCard title="All zones" subtitle="See every zone, ticket status, queue pressure, and the current operational state.">
      {locations.map(location => {
        const active = selectedId === location.id;
        const crowd = crowdLevel(location.waitTime);
        const tickets = ticketState(location.waitTime);
        return (
          <TouchableOpacity
            key={location.id}
            activeOpacity={0.8}
            style={[
              styles.zoneCard,
              active && styles.zoneCardActive,
              { borderLeftWidth: 5, borderLeftColor: crowd.accent }
            ]}
            onPress={() => setSelectedId(location.id)}>
            <View style={styles.zoneRow}>
              <View style={[styles.zoneIcon, { backgroundColor: crowd.accent + '15' }]}>
                {(() => {
                  const IconComp = TYPE_ICON[location.type];
                  return IconComp ? <IconComp size={20} color={crowd.accent} /> : <MapPinIcon size={20} color={crowd.accent} />;
                })()}
              </View>
              <View style={styles.zoneInfo}>
                <Text style={styles.zoneName}>{location.name}</Text>
                <Text style={styles.zoneDesc}>{location.description}</Text>
              </View>
              <View style={styles.zoneRightInfo}>
                <Text style={styles.zoneWaitText}>{location.waitTime}m</Text>
                <View style={[styles.zoneStatusBadge, { backgroundColor: crowd.accent }]}>
                  <Text style={styles.zoneStatusText}>{crowd.label}</Text>
                </View>
              </View>
            </View>

            {active && (
              <View style={styles.zoneDetailExpanded}>
                <View style={styles.ticketSummaryRow}>
                  <View style={[styles.ticketBadge, { backgroundColor: tickets.accent + '20' }]}>
                    <Text style={[styles.ticketBadgeLabel, { color: tickets.accent }]}>
                      Demand: {tickets.label}
                    </Text>
                  </View>
                  <Text style={styles.ticketDetailText}>{tickets.detail}</Text>
                </View>

                <View style={styles.adjustBlockCompact}>
                  <Text style={styles.adjustLabelCompact}>Adjust Queue Wait Time</Text>
                  <View style={styles.adjustRowCompact}>
                    <TouchableOpacity style={styles.adjustBtnCompact} onPress={() => adjustWait(location.id, -5)}>
                      <Text style={styles.adjustBtnTextCompact}>-5</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.adjustBtnCompact} onPress={() => adjustWait(location.id, -1)}>
                      <Text style={styles.adjustBtnTextCompact}>-1</Text>
                    </TouchableOpacity>
                    <View style={styles.adjustCurrentTimeWrap}>
                      <Text style={styles.adjustCurrentTimeVal}>{location.waitTime}</Text>
                      <Text style={styles.adjustCurrentTimeUnit}>min</Text>
                    </View>
                    <TouchableOpacity style={[styles.adjustBtnCompact, styles.adjustBtnCompactAccent]} onPress={() => adjustWait(location.id, 1)}>
                      <Text style={styles.adjustBtnTextCompactAccent}>+1</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.adjustBtnCompact, styles.adjustBtnCompactAccent]} onPress={() => adjustWait(location.id, 5)}>
                      <Text style={styles.adjustBtnTextCompactAccent}>+5</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </SectionCard>
  );

  const renderControls = () => (
    <>
      <SectionCard title="Crowd response" subtitle="Suggested actions based on current congestion.">
        <View style={styles.responseGrid}>
          <ResponseCard
            title="Open overflow gates"
            detail="Use when a food or entry line crosses the packed threshold."
            accent={CORAL}
          />
          <ResponseCard
            title="Broadcast stadium alert"
            detail="Push a message to redirect fans toward calmer zones."
            accent={PERIWINKLE}
          />
          <ResponseCard
            title="Dispatch support team"
            detail="Move runners and guides into the busiest area first."
            accent={AQUA}
          />
        </View>
      </SectionCard>

      <SectionCard title="Operational notes" subtitle="Admin guidance for the current match state.">
        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>What the stadium should do now</Text>
          <Text style={styles.noteLine}>• Keep the peak wait zone under 30 minutes.</Text>
          <Text style={styles.noteLine}>• Route fans away from the busiest queue first.</Text>
          <Text style={styles.noteLine}>• Escalate if two or more zones move into the packed range.</Text>
        </View>
      </SectionCard>
    </>
  );

  const renderProfile = () => (
    <>
      <View style={styles.profileCard}>
        <View style={styles.profileTopRow}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>AD</Text>
          </View>
          <View style={styles.profileTextWrap}>
            <Text style={styles.kicker}>Admin profile</Text>
            <Text style={styles.profileTitle}>Stadium Federation control</Text>
            <Text style={styles.profileSub}>
              Manage crowd flow, review the venue snapshot, and switch users when needed.
            </Text>
          </View>
        </View>

        <View style={styles.profileInfoRow}>
          <InfoChip label="Firm" value="Stadium Federation" />
          <InfoChip label="Stadium" value={selectedLocation?.name ?? 'Central Stadium'} />
        </View>
      </View>

      <SectionCard title="Role snapshot" subtitle="Current account and venue context.">
        <View style={styles.snapshotCard}>
          <Text style={styles.snapshotLabel}>Logged in as</Text>
          <Text style={styles.snapshotValue}>Stadium Admin</Text>
          <Text style={styles.snapshotDetail}>Ready to manage crowd pressure and zone routing.</Text>
          <TouchableOpacity onPress={onSwitchRole} style={styles.profileButton}>
            <Text style={styles.profileButtonText}>Switch User</Text>
          </TouchableOpacity>
        </View>
      </SectionCard>
    </>
  );

  const activeContent: Record<TabKey, React.ReactNode> = {
    overview: renderOverview(),
    attendance: renderAttendance(),
    messages: renderMessages(),
    zones: renderZones(),
    controls: renderControls(),
    profile: renderProfile(),
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fbf7f1" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.screen}>
        <View style={[styles.header, { paddingTop: insets.top + 12, paddingBottom: 12 }]}>
          <View style={styles.headerRow}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerFirm}>Stadium Federation</Text>
              <Text style={styles.headerTitle}>{selectedLocation?.name ?? 'Stadium Crowd Center'}</Text>
              <Text style={styles.headerSub}>Crowd view, zone routing, and stadium control</Text>
            </View>
            <TouchableOpacity onPress={onSwitchRole} style={styles.headerUserChip}>
              <Text style={styles.headerUserText}>Switch User</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {activeContent[activeTab]}
        </ScrollView>

        {activeTab === 'messages' && (
          <View style={styles.chatInputContainer}>
            <TextInput
              style={styles.chatInput}
              placeholder="Send message to zone leads..."
              placeholderTextColor={MUTED}
              value={newMsgText}
              onChangeText={setNewMsgText}
              onSubmitEditing={handleSendMessage}
              returnKeyType="send"
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage} activeOpacity={0.8}>
              <SendIcon size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          {TAB_ITEMS.map(tab => {
            const active = tab.key === activeTab;
            const IconComponent = tab.icon;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.navItem, active && styles.navItemActive]}
                onPress={() => setActiveTab(tab.key)}>
                <IconComponent size={20} color={active ? '#8c6a54' : '#75695f'} />
                <Text style={[styles.navLabel, active && styles.navLabelActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

/*
function StatCard({ value, label, accent }: { value: string; label: string; accent: string }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statAccent, { backgroundColor: accent }]} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}
*/

function SummaryTile({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <View style={styles.summaryTile}>
      <Text style={styles.summaryTitle}>{title}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryDetail}>{detail}</Text>
    </View>
  );
}

function ResponseCard({ title, detail, accent }: { title: string; detail: string; accent: string }) {
  return (
    <View style={styles.responseCard}>
      <View style={[styles.responseAccent, { backgroundColor: accent }]} />
      <Text style={styles.responseTitle}>{title}</Text>
      <Text style={styles.responseDetail}>{detail}</Text>
    </View>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoChip}>
      <Text style={styles.infoChipLabel}>{label}</Text>
      <Text style={styles.infoChipValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: APP_BG,
  },
  screen: {
    flex: 1,
    backgroundColor: APP_BG,
  },
  header: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#fbf7f1',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerFirm: {
    color: AQUA_DEEP,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  headerTitle: {
    color: INK,
    fontSize: 18,
    fontWeight: '900',
  },
  headerSub: {
    color: MUTED,
    fontSize: 12,
    marginTop: 3,
    lineHeight: 17,
  },
  headerUserChip: {
    backgroundColor: '#e8ded4',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#d7cabf',
  },
  headerUserText: {
    color: '#8c6a54',
    fontSize: 12,
    fontWeight: '800',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    gap: 14,
  },
  heroCard: {
    backgroundColor: CARD_BG,
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: '#5b5f8a',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  heroTextWrap: {
    flex: 1,
  },
  kicker: {
    color: AQUA_DEEP,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 6,
  },
  heroTitle: {
    color: INK,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 30,
  },
  heroSub: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  attendanceHero: {
    marginTop: 16,
    padding: 16,
    borderRadius: 22,
    backgroundColor: '#f2ebe4',
    borderWidth: 1,
    borderColor: '#e2d8cf',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  attendanceValue: {
    color: INK,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  attendanceLabel: {
    color: MUTED,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
    maxWidth: 210,
  },
  attendanceMeterWrap: {
    minWidth: 118,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  attendanceMeterValue: {
    color: '#8c6a54',
    fontSize: 20,
    fontWeight: '900',
  },
  attendanceMeterLabel: {
    color: MUTED,
    fontSize: 11,
    marginTop: 2,
  },
  attendanceMeterTrack: {
    marginTop: 10,
    width: 120,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#e6ddd4',
    overflow: 'hidden',
  },
  attendanceMeterFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: PERIWINKLE,
  },
  userChip: {
    backgroundColor: '#e8ded4',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#d7cabf',
  },
  userChipText: {
    color: '#8c6a54',
    fontSize: 12,
    fontWeight: '900',
  },
  heroPillsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  heroPill: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  heroPillValue: {
    color: INK,
    fontSize: 22,
    fontWeight: '900',
  },
  heroPillLabel: {
    color: MUTED,
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
  },
  statAccent: {
    width: 34,
    height: 6,
    borderRadius: 999,
    marginBottom: 10,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    color: INK,
  },
  statLabel: {
    fontSize: 11,
    color: MUTED,
    marginTop: 2,
    textAlign: 'center',
  },
  sectionCard: {
    backgroundColor: CARD_BG,
    borderRadius: 26,
    padding: 18,
    borderWidth: 1,
    borderColor: BORDER,
  },
  sectionTitle: {
    color: PERIWINKLE,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '900',
  },
  sectionSubtitle: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  sectionBody: {
    marginTop: 14,
    gap: 12,
  },
  summaryGrid: {
    gap: 10,
    flexDirection: 'row',
  },
  summaryTile: {
    flex: 1,
    backgroundColor: PAPER,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  summaryTitle: {
    color: MUTED,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '800',
  },
  summaryValue: {
    color: INK,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 6,
  },
  summaryDetail: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  pressureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e6ddd4',
  },
  pressureIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#f2ebe4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressureIconText: {
    fontSize: 20,
  },
  pressureInfo: {
    flex: 1,
  },
  pressureName: {
    color: INK,
    fontSize: 15,
    fontWeight: '900',
  },
  pressureDetail: {
    color: MUTED,
    fontSize: 12,
    marginTop: 3,
    lineHeight: 17,
  },
  pressureMeta: {
    color: '#7d7695',
    fontSize: 11,
    marginTop: 6,
    lineHeight: 16,
  },
  pressureTagWrap: {
    alignItems: 'flex-end',
  },
  pressureTag: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pressureTagText: {
    color: INK,
    fontSize: 11,
    fontWeight: '900',
  },
  scanCard: {
    borderRadius: 20,
    backgroundColor: PAPER,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    gap: 10,
  },
  scanTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  scanTitleWrap: {
    flex: 1,
  },
  scanName: {
    color: INK,
    fontSize: 15,
    fontWeight: '900',
  },
  scanDetail: {
    color: MUTED,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },
  scanBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  scanBadgeText: {
    color: INK,
    fontSize: 11,
    fontWeight: '900',
  },
  scanBarTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#e8ded4',
    overflow: 'hidden',
  },
  scanBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  attendanceSummaryCard: {
    borderRadius: 22,
    backgroundColor: PAPER,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
  },
  attendanceSummaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
  },
  attendanceSummaryLabel: {
    color: MUTED,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '800',
  },
  attendanceSummaryValue: {
    color: INK,
    fontSize: 26,
    fontWeight: '900',
    marginTop: 4,
  },
  attendanceSummaryPill: {
    borderRadius: 18,
    backgroundColor: '#f2ebe4',
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2d8cf',
  },
  attendanceSummaryPillValue: {
    color: '#8c6a54',
    fontSize: 18,
    fontWeight: '900',
  },
  attendanceSummaryPillLabel: {
    color: MUTED,
    fontSize: 11,
    marginTop: 2,
  },
  attendanceSummaryNote: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
  },
  staffCard: {
    borderRadius: 20,
    backgroundColor: PAPER,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    gap: 12,
  },
  staffTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  staffAvatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#e8ded4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  staffAvatarText: {
    color: '#8c6a54',
    fontSize: 16,
    fontWeight: '900',
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    color: INK,
    fontSize: 15,
    fontWeight: '900',
  },
  staffRole: {
    color: MUTED,
    fontSize: 12,
    marginTop: 3,
  },
  staffStatus: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  staffStatusLive: {
    backgroundColor: '#d8ebe3',
  },
  staffStatusStandby: {
    backgroundColor: '#f3dfc8',
  },
  staffStatusMuted: {
    backgroundColor: '#ece7d2',
  },
  staffStatusText: {
    color: INK,
    fontSize: 11,
    fontWeight: '900',
  },
  staffDutyRow: {
    gap: 8,
  },
  staffDutyChip: {
    borderRadius: 16,
    backgroundColor: '#fbf7f1',
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
  },
  staffDutyChipLabel: {
    color: MUTED,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '800',
  },
  staffDutyChipValue: {
    color: INK,
    fontSize: 13,
    fontWeight: '900',
    marginTop: 4,
    lineHeight: 18,
  },
  groupIntroCard: {
    borderRadius: 20,
    backgroundColor: '#f2ebe4',
    borderWidth: 1,
    borderColor: '#e2cfcfff',
    padding: 14,
  },
  groupIntroTitle: {
    color: INK,
    fontSize: 15,
    fontWeight: '900',
  },
  groupIntroText: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  chatThread: {
    gap: 16,
    marginTop: 10,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    maxWidth: '85%',
  },
  chatRowLeft: {
    alignSelf: 'flex-start',
  },
  chatRowRight: {
    alignSelf: 'flex-end',
  },
  chatAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  chatAvatarText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  chatBubbleContainer: {
    gap: 4,
  },
  chatSenderName: {
    fontSize: 11,
    fontWeight: '800',
    color: INK,
    marginLeft: 4,
  },
  chatSenderRole: {
    fontWeight: '500',
    color: MUTED,
  },
  chatBubble: {
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  chatBubbleLeft: {
    backgroundColor: '#fffaf6',
    borderWidth: 1,
    borderColor: BORDER,
    borderBottomLeftRadius: 4,
  },
  chatBubbleRight: {
    backgroundColor: '#8c6a54',
    borderBottomRightRadius: 4,
  },
  chatText: {
    fontSize: 13,
    lineHeight: 18,
  },
  chatTextLeft: {
    color: INK,
  },
  chatTextRight: {
    color: '#fffaf6',
  },
  chatTime: {
    fontSize: 9,
    color: MUTED,
    marginTop: 2,
  },
  chatTimeLeft: {
    alignSelf: 'flex-start',
    marginLeft: 6,
  },
  chatTimeRight: {
    alignSelf: 'flex-end',
    marginRight: 6,
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    backgroundColor: '#fbf7f1',
    gap: 10,
  },
  chatInput: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 16,
    fontSize: 13,
    color: INK,
    backgroundColor: '#fff',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8c6a54',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoneCard: {
    borderRadius: 20,
    padding: 14,
    backgroundColor: PAPER,
    borderWidth: 1,
    borderColor: BORDER,
    gap: 12,
  },
  zoneCardActive: {
    borderColor: PERIWINKLE,
    backgroundColor: '#fbf8f5',
  },
  zoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  zoneIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoneInfo: {
    flex: 1,
  },
  zoneName: {
    color: INK,
    fontSize: 15,
    fontWeight: '900',
  },
  zoneDesc: {
    color: MUTED,
    fontSize: 12,
    marginTop: 3,
    lineHeight: 17,
  },
  zoneRightInfo: {
    alignItems: 'flex-end',
    gap: 4,
  },
  zoneWaitText: {
    fontSize: 18,
    fontWeight: '900',
    color: INK,
  },
  zoneStatusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  zoneStatusText: {
    fontSize: 10,
    fontWeight: '900',
    color: INK,
  },
  zoneDetailExpanded: {
    borderTopWidth: 1,
    borderTopColor: '#e6ddd4',
    paddingTop: 12,
    gap: 12,
  },
  ticketSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  ticketBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ticketBadgeLabel: {
    fontSize: 10,
    fontWeight: '900',
  },
  ticketDetailText: {
    flex: 1,
    fontSize: 12,
    color: MUTED,
    lineHeight: 16,
  },
  adjustBlockCompact: {
    backgroundColor: '#f6f0e8',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  adjustLabelCompact: {
    color: PERIWINKLE,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },
  adjustRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  adjustBtnCompact: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#fbf7f1',
    borderWidth: 1,
    borderColor: BORDER,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adjustBtnCompactAccent: {
    backgroundColor: '#ddebe4',
    borderColor: '#b8d8cc',
  },
  adjustBtnTextCompact: {
    color: INK,
    fontSize: 13,
    fontWeight: '900',
  },
  adjustBtnTextCompactAccent: {
    color: '#4f7b67',
    fontSize: 13,
    fontWeight: '900',
  },
  adjustCurrentTimeWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    minWidth: 70,
  },
  adjustCurrentTimeVal: {
    fontSize: 24,
    fontWeight: '900',
    color: INK,
  },
  adjustCurrentTimeUnit: {
    fontSize: 12,
    color: MUTED,
    marginLeft: 2,
    fontWeight: '700',
  },
  responseGrid: {
    gap: 10,
  },
  responseCard: {
    borderRadius: 20,
    backgroundColor: PAPER,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    gap: 8,
  },
  responseAccent: {
    width: 42,
    height: 6,
    borderRadius: 999,
  },
  responseTitle: {
    color: INK,
    fontSize: 15,
    fontWeight: '900',
  },
  responseDetail: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 17,
  },
  noteCard: {
    borderRadius: 20,
    backgroundColor: PAPER,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
  },
  noteTitle: {
    color: INK,
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 8,
  },
  noteLine: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
  profileCard: {
    backgroundColor: CARD_BG,
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: BORDER,
  },
  profileTopRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#e8ded4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarText: {
    color: '#8c6a54',
    fontSize: 18,
    fontWeight: '900',
  },
  profileTextWrap: {
    flex: 1,
  },
  profileTitle: {
    color: INK,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 3,
  },
  profileSub: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  profileInfoRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  infoChip: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: PAPER,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
  },
  infoChipLabel: {
    color: MUTED,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '800',
  },
  infoChipValue: {
    color: INK,
    fontSize: 14,
    fontWeight: '900',
    marginTop: 5,
    lineHeight: 18,
  },
  snapshotCard: {
    borderRadius: 20,
    backgroundColor: PAPER,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
  },
  snapshotLabel: {
    color: MUTED,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '800',
  },
  snapshotValue: {
    color: INK,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 4,
  },
  snapshotDetail: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 12,
  },
  profileButton: {
    backgroundColor: AQUA,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  profileButtonText: {
    color: '#35584f',
    fontSize: 13,
    fontWeight: '900',
  },
  bottomNav: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    backgroundColor: '#fbf7f1',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 18,
  },
  navItemActive: {
    backgroundColor: '#f2ebe4',
  },
  navIcon: {
    fontSize: 16,
    color: MUTED,
  },
  navIconActive: {
    color: '#8c6a54',
  },
  navLabel: {
    color: MUTED,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 3,
  },
  navLabelActive: {
    color: '#8c6a54',
  },
});
