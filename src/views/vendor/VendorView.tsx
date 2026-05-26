/**
 * VendorView — Vendor command center
 * White-peach dashboard with bottom navigation for orders, reviews, inventory,
 * and a merged profile menu for team, processing, and admin info.
 */

import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Home as HomeIcon,
  Inbox as InboxIcon,
  CheckCircle as CheckIcon,
  Package as PackageIcon,
  User as UserIcon,
} from 'lucide-react-native';
import { StadiumLocation } from '../../types';

interface Props {
  locations: StadiumLocation[];
  onLocationsChange: (updated: StadiumLocation[]) => void;
  onSwitchRole: () => void;
}

type TabKey = 'overview' | 'received' | 'reviewed' | 'inventory' | 'profile';

type VendorOrder = {
  id: string;
  orderNo: string;
  customer: string;
  item: string;
  quantity: number;
  amount: number;
  status: 'received' | 'approved' | 'rejected' | 'processing';
  eta: string;
  note: string;
};

type InventoryItem = {
  id: string;
  name: string;
  stock: number;
  threshold: number;
  unit: string;
};

type TeamMember = {
  id: string;
  name: string;
  role: string;
  shift: string;
  status: 'On duty' | 'Break' | 'Offline';
};

type ProfileOption = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
};

const TABS: Array<{ key: TabKey; label: string; icon: React.ComponentType<any> }> = [
  { key: 'overview', label: 'Home', icon: HomeIcon },
  { key: 'received', label: 'Received', icon: InboxIcon },
  { key: 'reviewed', label: 'Approved', icon: CheckIcon },
  { key: 'inventory', label: 'Inventory', icon: PackageIcon },
  { key: 'profile', label: 'Profile', icon: UserIcon },
];

const APP_BG = '#fff7f1';

const money = (value: number) => `$${value.toFixed(0)}`;

const INITIAL_ORDERS: VendorOrder[] = [
  {
    id: 'ord-101',
    orderNo: '#1042',
    customer: 'Section B / Row 14',
    item: 'Loaded Nachos',
    quantity: 2,
    amount: 18,
    status: 'received',
    eta: '8 min',
    note: 'Extra cheese, no jalapeños',
  },
  {
    id: 'ord-102',
    orderNo: '#1043',
    customer: 'North Gate Pickup',
    item: 'Classic Burger',
    quantity: 1,
    amount: 12,
    status: 'received',
    eta: '6 min',
    note: 'Add fries',
  },
  {
    id: 'ord-103',
    orderNo: '#1037',
    customer: 'VIP Lounge',
    item: 'Cold Drink Pack',
    quantity: 4,
    amount: 16,
    status: 'approved',
    eta: '4 min',
    note: 'Priority handoff',
  },
  {
    id: 'ord-104',
    orderNo: '#1032',
    customer: 'Club Level',
    item: 'Pretzel Combo',
    quantity: 3,
    amount: 21,
    status: 'rejected',
    eta: 'N/A',
    note: 'Out of stock',
  },
  {
    id: 'ord-105',
    orderNo: '#1039',
    customer: 'Section A / Row 7',
    item: 'Chicken Wrap',
    quantity: 1,
    amount: 13,
    status: 'processing',
    eta: '2 min',
    note: 'Packing now',
  },
];

const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'inv-1', name: 'Burger buns', stock: 42, threshold: 20, unit: 'pcs' },
  { id: 'inv-2', name: 'Nacho trays', stock: 18, threshold: 30, unit: 'packs' },
  { id: 'inv-3', name: 'Soft drinks', stock: 88, threshold: 50, unit: 'cans' },
  { id: 'inv-4', name: 'Wrap shells', stock: 22, threshold: 25, unit: 'packs' },
  { id: 'inv-5', name: 'Paper bags', stock: 150, threshold: 60, unit: 'pcs' },
];

const INITIAL_TEAM: TeamMember[] = [
  { id: 'team-1', name: 'Maya', role: 'Lead vendor', shift: '9:00 - 17:00', status: 'On duty' },
  { id: 'team-2', name: 'Jordan', role: 'Runner', shift: '11:00 - 19:00', status: 'On duty' },
  { id: 'team-3', name: 'Luis', role: 'Cashier', shift: '12:00 - 20:00', status: 'Break' },
  { id: 'team-4', name: 'Ava', role: 'Prep support', shift: '14:00 - 22:00', status: 'Offline' },
];

export default function VendorView({
  locations,
  onLocationsChange,
  onSwitchRole,
}: Props) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [ownedId, setOwnedId] = useState<string>(locations[0]?.id ?? '');
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [orders, setOrders] = useState<VendorOrder[]>(INITIAL_ORDERS);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [team] = useState<TeamMember[]>(INITIAL_TEAM);
  const [options, setOptions] = useState<ProfileOption[]>([
    {
      id: 'auto-assign',
      label: 'Auto-assign order batches',
      description: 'Send new requests to the next available team member.',
      enabled: true,
    },
    {
      id: 'live-alerts',
      label: 'Live federation alerts',
      description: 'Surface vendor, queue, and inventory changes in real time.',
      enabled: true,
    },
    {
      id: 'stadium-sync',
      label: 'Stadium sync',
      description: 'Keep venue and stand data aligned with the admin profile.',
      enabled: false,
    },
  ]);

  const ownedLocation = locations.find(location => location.id === ownedId) ?? locations[0];
  const receivedOrders = orders.filter(order => order.status === 'received');
  const reviewedOrders = orders.filter(order => order.status === 'approved' || order.status === 'rejected');
  const processingOrders = orders.filter(order => order.status === 'processing');
  const lowStockItems = inventory.filter(item => item.stock <= item.threshold);

  const metrics = useMemo(() => ({
    received: receivedOrders.length,
    approved: orders.filter(order => order.status === 'approved').length,
    rejected: orders.filter(order => order.status === 'rejected').length,
    processing: processingOrders.length,
  }), [orders, processingOrders.length, receivedOrders.length]);

  const adjustWait = (delta: number) => {
    if (!ownedLocation) {
      return;
    }

    onLocationsChange(
      locations.map(location => (
        location.id === ownedLocation.id
          ? { ...location, waitTime: Math.max(0, location.waitTime + delta) }
          : location
      )),
    );
  };

  const updateOrderStatus = (orderId: string, nextStatus: VendorOrder['status']) => {
    setOrders(current => current.map(order => (
      order.id === orderId ? { ...order, status: nextStatus } : order
    )));
  };

  const restockItem = (itemId: string, amount: number) => {
    setInventory(current => current.map(item => (
      item.id === itemId ? { ...item, stock: item.stock + amount } : item
    )));
  };

  const toggleOption = (optionId: string) => {
    setOptions(current => current.map(option => (
      option.id === optionId ? { ...option, enabled: !option.enabled } : option
    )));
  };

  const renderOverview = () => (
    <>

      <View style={styles.statsRow}>
        <StatCard value={String(metrics.received)} label="Incoming" />
        <StatCard value={String(metrics.approved)} label="Approved" />
        <StatCard value={String(metrics.processing)} label="Processing" />
      </View>

      <SectionCard title="Quick switch stalls" subtitle="Select the stall you are currently managing.">
        {locations.map(location => (
          <TouchableOpacity
            key={location.id}
            style={[styles.locationRow, location.id === ownedId && styles.locationRowActive]}
            onPress={() => setOwnedId(location.id)}>
            <View style={styles.locationTextWrap}>
              <Text style={styles.locationName}>{location.name}</Text>
              <Text style={styles.locationDesc}>{location.description}</Text>
            </View>
            <Text style={styles.locationWait}>~{location.waitTime}m</Text>
          </TouchableOpacity>
        ))}
      </SectionCard>

      <SectionCard title="Today at a glance" subtitle="A compact summary of the vendor floor.">
        <View style={styles.bulletCard}>
          <Text style={styles.bulletText}>• {metrics.received} orders still waiting for a decision</Text>
          <Text style={styles.bulletText}>• {lowStockItems.length} inventory items are at or below threshold</Text>
          <Text style={styles.bulletText}>• {team.filter(member => member.status === 'On duty').length} team members are on duty</Text>
        </View>
      </SectionCard>
    </>
  );

  const renderReceivedOrders = () => (
    <SectionCard title="Current received orders" subtitle="Approve or reject live requests before they move into the next stage.">
      {receivedOrders.map(order => (
        <View key={order.id} style={styles.orderCard}>
          <View style={styles.orderTopRow}>
            <View>
              <Text style={styles.orderNumber}>{order.orderNo}</Text>
              <Text style={styles.orderTitle}>{order.item}</Text>
            </View>
            <Text style={styles.orderAmount}>{money(order.amount)}</Text>
          </View>
          <Text style={styles.orderMeta}>{order.customer} · {order.quantity} item(s)</Text>
          <Text style={styles.orderNote}>{order.note}</Text>
          <View style={styles.orderFooter}>
            <Text style={styles.orderEta}>ETA {order.eta}</Text>
            <View style={styles.orderActions}>
              <TouchableOpacity
                style={[styles.orderAction, styles.orderReject]}
                onPress={() => updateOrderStatus(order.id, 'rejected')}>
                <Text style={styles.orderActionText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.orderAction, styles.orderApprove]}
                onPress={() => updateOrderStatus(order.id, 'approved')}>
                <Text style={styles.orderActionText}>Approve</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
    </SectionCard>
  );

  const renderReviewedOrders = () => (
    <SectionCard title="Approved and rejected orders" subtitle="Audit the decisions already made on incoming orders.">
      <View style={styles.pillRow}>
        <View style={styles.metricPill}>
          <Text style={styles.metricValue}>{metrics.approved}</Text>
          <Text style={styles.metricLabel}>Approved</Text>
        </View>
        <View style={styles.metricPill}>
          <Text style={[styles.metricValue, styles.metricValueRejected]}>{metrics.rejected}</Text>
          <Text style={styles.metricLabel}>Rejected</Text>
        </View>
      </View>

      {reviewedOrders.map(order => (
        <View key={order.id} style={styles.reviewRow}>
          <View style={styles.reviewTextWrap}>
            <Text style={styles.orderNumber}>{order.orderNo}</Text>
            <Text style={styles.orderTitle}>{order.item}</Text>
            <Text style={styles.orderMeta}>{order.customer}</Text>
          </View>
          <View style={[styles.reviewStatus, order.status === 'approved' ? styles.reviewApproved : styles.reviewRejected]}>
            <Text style={styles.reviewStatusText}>
              {order.status === 'approved' ? 'Approved' : 'Rejected'}
            </Text>
          </View>
        </View>
      ))}
    </SectionCard>
  );

  const renderInventory = () => (
    <SectionCard title="Current inventory" subtitle="Keep the floor stocked before items reach the red zone.">
      {inventory.map(item => {
        const isLow = item.stock <= item.threshold;
        const progress = Math.min(100, Math.round((item.stock / Math.max(item.threshold, 1)) * 100));

        return (
          <View key={item.id} style={styles.inventoryCard}>
            <View style={styles.inventoryTopRow}>
              <View>
                <Text style={styles.inventoryName}>{item.name}</Text>
                <Text style={styles.inventoryMeta}>{item.stock} {item.unit} on hand</Text>
              </View>
              <View style={[styles.stockBadge, isLow ? styles.stockBadgeLow : styles.stockBadgeGood]}>
                <Text style={styles.stockBadgeText}>{isLow ? 'Low' : 'Healthy'}</Text>
              </View>
            </View>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>

            <View style={styles.inventoryFooter}>
              <Text style={styles.inventoryThreshold}>Reorder at {item.threshold} {item.unit}</Text>
              <TouchableOpacity style={styles.restockButton} onPress={() => restockItem(item.id, 12)}>
                <Text style={styles.restockButtonText}>Restock +12</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </SectionCard>
  );

  const renderProfile = () => (
    <>
      <View style={styles.heroCard}>
        <View style={styles.profileHeaderRow}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>CA</Text>
          </View>
          <View style={styles.profileIdentity}>
            <Text style={styles.kicker}>Cable Admin Profile</Text>
            <Text style={styles.heroTitle}>Federation control and stadium ops</Text>
            <Text style={styles.heroSubtitle}>
              Manage your profile, keep federation details visible, and balance team activity with processing.
            </Text>
          </View>
        </View>
        <View style={styles.profileChipRow}>
          <View style={styles.profileChip}><Text style={styles.profileChipText}>Cable Admin</Text></View>
          <View style={styles.profileChip}><Text style={styles.profileChipText}>Stadium Lead</Text></View>
          <View style={styles.profileChip}><Text style={styles.profileChipText}>Live Sync</Text></View>
        </View>
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Federation</Text>
          <Text style={styles.infoValue}>National Stadium Federation</Text>
          <Text style={styles.infoDetail}>Compliance, vendor standards, and venue reporting.</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Stadium</Text>
          <Text style={styles.infoValue}>{ownedLocation?.name ?? 'Primary Stadium Stall'}</Text>
          <Text style={styles.infoDetail}>Current venue and stall ownership context.</Text>
        </View>
      </View>

      <SectionCard title="Options widget" subtitle="Quick profile controls for the cable admin account.">
        {options.map(option => (
          <TouchableOpacity key={option.id} style={styles.optionRow} onPress={() => toggleOption(option.id)}>
            <View style={styles.optionTextWrap}>
              <Text style={styles.optionName}>{option.label}</Text>
              <Text style={styles.optionDesc}>{option.description}</Text>
            </View>
            <View style={[styles.optionToggle, option.enabled ? styles.optionToggleOn : styles.optionToggleOff]}>
              <Text style={styles.optionToggleText}>{option.enabled ? 'On' : 'Off'}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </SectionCard>

      <SectionCard title="Team" subtitle="See the shift plan and who is currently active.">
        {team.map(member => (
          <View key={member.id} style={styles.teamCard}>
            <View style={styles.teamAvatar}>
              <Text style={styles.teamAvatarText}>{member.name.charAt(0)}</Text>
            </View>
            <View style={styles.teamInfo}>
              <Text style={styles.teamName}>{member.name}</Text>
              <Text style={styles.teamRole}>{member.role}</Text>
              <Text style={styles.teamShift}>{member.shift}</Text>
            </View>
            <View style={[
              styles.teamStatus,
              member.status === 'On duty' ? styles.teamStatusLive : member.status === 'Break' ? styles.teamStatusBreak : styles.teamStatusOffline,
            ]}>
              <Text style={styles.teamStatusText}>{member.status}</Text>
            </View>
          </View>
        ))}
      </SectionCard>

      <SectionCard title="Processing" subtitle="Track the orders already in motion and move the queue forward.">
        {processingOrders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No orders are processing right now.</Text>
            <Text style={styles.emptyText}>Approve a received order to move it here.</Text>
          </View>
        ) : (
          processingOrders.map(order => (
            <View key={order.id} style={styles.processCard}>
              <View style={styles.processTopRow}>
                <View>
                  <Text style={styles.orderNumber}>{order.orderNo}</Text>
                  <Text style={styles.orderTitle}>{order.item}</Text>
                </View>
                <Text style={styles.orderEta}>{order.eta}</Text>
              </View>
              <View style={styles.pipelineRow}>
                <PipelineStep label="Prep" active />
                <PipelineStep label="Pack" active />
                <PipelineStep label="Hand off" active={false} />
              </View>
              <Text style={styles.orderMeta}>{order.note}</Text>
            </View>
          ))
        )}
      </SectionCard>
    </>
  );

  const activeContent: Record<TabKey, React.ReactNode> = {
    overview: renderOverview(),
    received: renderReceivedOrders(),
    reviewed: renderReviewedOrders(),
    inventory: renderInventory(),
    profile: renderProfile(),
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.screen}>
        <View style={[styles.header, { paddingTop: insets.top + 12, paddingBottom: 12 }]}>
          <View style={styles.headerRow}>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.headerFirm}>Stadium Federation</Text>
              <Text style={styles.headerTitle}>{ownedLocation?.name ?? 'Primary Stadium Stall'}</Text>
              <Text style={styles.headerSub}>
                Live orders, profile, and operations
              </Text>
            </View>
            <TouchableOpacity onPress={onSwitchRole} style={styles.headerChip}>
              <Text style={styles.headerChipText}>Switch User</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {activeContent[activeTab]}
        </ScrollView>

        <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          {TABS.map(tab => {
            const active = tab.key === activeTab;
            const IconComponent = tab.icon;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.navItem, active && styles.navItemActive]}
                onPress={() => setActiveTab(tab.key)}>
                <IconComponent size={20} color={active ? '#6d3827' : '#9a7668'} />
                <Text style={[styles.navLabel, active && styles.navLabelActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
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

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function PipelineStep({ label, active }: { label: string; active: boolean }) {
  return (
    <View style={[styles.pipelineStep, active ? styles.pipelineStepActive : styles.pipelineStepMuted]}>
      <Text style={[styles.pipelineStepText, active ? styles.pipelineStepTextActive : styles.pipelineStepTextMuted]}>{label}</Text>
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
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1ddd1',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerFirm: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#d86f47',
    marginBottom: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2d1a15',
  },
  headerSub: {
    fontSize: 12,
    color: '#8f6f62',
    marginTop: 3,
    lineHeight: 17,
  },
  headerChip: {
    backgroundColor: '#ffe5d7',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#f3c8b0',
  },
  headerChipText: {
    color: '#8d4d31',
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
    backgroundColor: '#fffefc',
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: '#f4ddd2',
    shadowColor: '#d99b7a',
    shadowOpacity: 0.18,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  kicker: {
    color: '#d86f47',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  heroTitle: {
    color: '#2d1a15',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
    maxWidth: 240,
  },
  heroSubtitle: {
    color: '#86665b',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 12,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#ffd8c6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarText: {
    color: '#6d3827',
    fontSize: 18,
    fontWeight: '900',
  },
  profileIdentity: {
    flex: 1,
  },
  profileChipRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 14,
  },
  profileChip: {
    backgroundColor: '#fff1e8',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#f3ddd4',
  },
  profileChipText: {
    color: '#8d4d31',
    fontSize: 12,
    fontWeight: '700',
  },
  roleChip: {
    backgroundColor: '#ffe5d7',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#f3c8b0',
  },
  roleChipText: {
    color: '#8d4d31',
    fontSize: 12,
    fontWeight: '700',
  },
  primaryCard: {
    backgroundColor: '#fffefc',
    borderRadius: 26,
    padding: 18,
    borderWidth: 1,
    borderColor: '#f3ddd4',
  },
  primaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  sectionTitle: {
    color: '#d86f47',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  primaryName: {
    color: '#2d1a15',
    fontSize: 19,
    fontWeight: '800',
    marginTop: 4,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  statusOpen: {
    backgroundColor: '#ffe1d0',
  },
  statusClosed: {
    backgroundColor: '#f4e3df',
  },
  statusText: {
    color: '#7f4530',
    fontSize: 12,
    fontWeight: '700',
  },
  primaryDesc: {
    color: '#86665b',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
  },
  waitCard: {
    marginTop: 14,
    borderRadius: 20,
    backgroundColor: '#fff1e8',
    paddingVertical: 16,
    alignItems: 'center',
  },
  waitLabel: {
    color: '#ab745f',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 11,
    marginBottom: 4,
    fontWeight: '700',
  },
  waitValue: {
    color: '#d86f47',
    fontSize: 36,
    fontWeight: '900',
  },
  adjustRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  adjustButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#fff5ef',
    borderWidth: 1,
    borderColor: '#f0d5c7',
  },
  adjustButtonAccent: {
    backgroundColor: '#ffd8c6',
    borderColor: '#f0b699',
  },
  adjustButtonText: {
    color: '#815444',
    fontSize: 14,
    fontWeight: '800',
  },
  adjustButtonTextAccent: {
    color: '#813e22',
    fontSize: 14,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: '#fffefc',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#f3ddd4',
  },
  statValue: {
    color: '#2d1a15',
    fontSize: 21,
    fontWeight: '900',
    textAlign: 'center',
  },
  statLabel: {
    color: '#9a7668',
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  sectionCard: {
    backgroundColor: '#fffefc',
    borderRadius: 26,
    padding: 18,
    borderWidth: 1,
    borderColor: '#f3ddd4',
  },
  sectionSubtitle: {
    color: '#86665b',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  sectionBody: {
    marginTop: 14,
    gap: 12,
  },
  infoGrid: {
    gap: 10,
  },
  infoCard: {
    borderRadius: 22,
    backgroundColor: '#fffefc',
    borderWidth: 1,
    borderColor: '#f3ddd4',
    padding: 16,
    gap: 6,
  },
  infoLabel: {
    color: '#d86f47',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  infoValue: {
    color: '#2d1a15',
    fontSize: 16,
    fontWeight: '800',
  },
  infoDetail: {
    color: '#86665b',
    fontSize: 12,
    lineHeight: 18,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderRadius: 20,
    padding: 14,
    backgroundColor: '#fff6f0',
    borderWidth: 1,
    borderColor: '#f2d7cb',
  },
  optionTextWrap: {
    flex: 1,
  },
  optionName: {
    color: '#2d1a15',
    fontSize: 14,
    fontWeight: '800',
  },
  optionDesc: {
    color: '#8f6f62',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },
  optionToggle: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 50,
    alignItems: 'center',
  },
  optionToggleOn: {
    backgroundColor: '#e7f6ea',
  },
  optionToggleOff: {
    backgroundColor: '#fde2dc',
  },
  optionToggleText: {
    color: '#7b4538',
    fontSize: 11,
    fontWeight: '800',
  },
  locationRow: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: '#fff6f0',
    borderWidth: 1,
    borderColor: '#f2d7cb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
  },
  locationRowActive: {
    backgroundColor: '#ffe2d2',
    borderColor: '#f0bfa7',
  },
  locationTextWrap: {
    flex: 1,
  },
  locationName: {
    color: '#2d1a15',
    fontSize: 15,
    fontWeight: '800',
  },
  locationDesc: {
    color: '#9a7668',
    fontSize: 12,
    marginTop: 3,
  },
  locationWait: {
    color: '#d86f47',
    fontSize: 14,
    fontWeight: '800',
  },
  bulletCard: {
    gap: 8,
  },
  bulletText: {
    color: '#5f4438',
    fontSize: 13,
    lineHeight: 19,
  },
  orderCard: {
    borderRadius: 20,
    backgroundColor: '#fff6f0',
    borderWidth: 1,
    borderColor: '#f2d7cb',
    padding: 14,
    gap: 8,
  },
  orderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  orderNumber: {
    color: '#d86f47',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  orderTitle: {
    color: '#2d1a15',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  orderAmount: {
    color: '#2d1a15',
    fontSize: 16,
    fontWeight: '900',
  },
  orderMeta: {
    color: '#8f6f62',
    fontSize: 12,
  },
  orderNote: {
    color: '#5f4438',
    fontSize: 13,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginTop: 2,
  },
  orderEta: {
    color: '#ab745f',
    fontSize: 12,
    fontWeight: '700',
  },
  orderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  orderAction: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  orderReject: {
    backgroundColor: '#fde2dc',
  },
  orderApprove: {
    backgroundColor: '#ffccae',
  },
  orderActionText: {
    color: '#6d3827',
    fontSize: 12,
    fontWeight: '800',
  },
  pillRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricPill: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: '#fff6f0',
    borderWidth: 1,
    borderColor: '#f2d7cb',
    paddingVertical: 12,
    alignItems: 'center',
  },
  metricValue: {
    color: '#2d1a15',
    fontSize: 20,
    fontWeight: '900',
  },
  metricValueRejected: {
    color: '#b55b45',
  },
  metricLabel: {
    color: '#9a7668',
    fontSize: 11,
    marginTop: 2,
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f4dfd5',
  },
  reviewTextWrap: {
    flex: 1,
  },
  reviewStatus: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  reviewApproved: {
    backgroundColor: '#e7f6ea',
  },
  reviewRejected: {
    backgroundColor: '#fde2dc',
  },
  reviewStatusText: {
    color: '#7b4538',
    fontSize: 12,
    fontWeight: '800',
  },
  inventoryCard: {
    borderRadius: 20,
    backgroundColor: '#fff6f0',
    borderWidth: 1,
    borderColor: '#f2d7cb',
    padding: 14,
    gap: 10,
  },
  inventoryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  inventoryName: {
    color: '#2d1a15',
    fontSize: 15,
    fontWeight: '800',
  },
  inventoryMeta: {
    color: '#9a7668',
    fontSize: 12,
    marginTop: 2,
  },
  stockBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  stockBadgeLow: {
    backgroundColor: '#fde2dc',
  },
  stockBadgeGood: {
    backgroundColor: '#e7f6ea',
  },
  stockBadgeText: {
    color: '#7b4538',
    fontSize: 11,
    fontWeight: '800',
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#f1d8cb',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#f29c70',
  },
  inventoryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  inventoryThreshold: {
    color: '#8f6f62',
    fontSize: 12,
    flex: 1,
  },
  restockButton: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: '#ffd0b8',
  },
  restockButtonText: {
    color: '#6d3827',
    fontSize: 12,
    fontWeight: '800',
  },
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 20,
    backgroundColor: '#fff6f0',
    borderWidth: 1,
    borderColor: '#f2d7cb',
    padding: 14,
  },
  teamAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffd8c6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamAvatarText: {
    color: '#6d3827',
    fontSize: 16,
    fontWeight: '900',
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    color: '#2d1a15',
    fontSize: 15,
    fontWeight: '800',
  },
  teamRole: {
    color: '#8f6f62',
    fontSize: 12,
    marginTop: 2,
  },
  teamShift: {
    color: '#ab745f',
    fontSize: 11,
    marginTop: 3,
  },
  teamStatus: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  teamStatusLive: {
    backgroundColor: '#e7f6ea',
  },
  teamStatusBreak: {
    backgroundColor: '#fff1d8',
  },
  teamStatusOffline: {
    backgroundColor: '#fde2dc',
  },
  teamStatusText: {
    color: '#7b4538',
    fontSize: 11,
    fontWeight: '800',
  },
  processCard: {
    borderRadius: 20,
    backgroundColor: '#fff6f0',
    borderWidth: 1,
    borderColor: '#f2d7cb',
    padding: 14,
    gap: 10,
  },
  processTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  pipelineRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pipelineStep: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 8,
    alignItems: 'center',
  },
  pipelineStepActive: {
    backgroundColor: '#ffd0b8',
  },
  pipelineStepMuted: {
    backgroundColor: '#f6e4dc',
  },
  pipelineStepText: {
    fontSize: 11,
    fontWeight: '800',
  },
  pipelineStepTextActive: {
    color: '#6d3827',
  },
  pipelineStepTextMuted: {
    color: '#9a7668',
  },
  emptyCard: {
    borderRadius: 20,
    backgroundColor: '#fff6f0',
    borderWidth: 1,
    borderColor: '#f2d7cb',
    padding: 18,
  },
  emptyTitle: {
    color: '#2d1a15',
    fontSize: 15,
    fontWeight: '800',
  },
  emptyText: {
    color: '#8f6f62',
    fontSize: 12,
    marginTop: 4,
  },
  bottomNav: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1d8cb',
    backgroundColor: '#fff8f4',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 18,
  },
  navItemActive: {
    backgroundColor: '#ffe1d0',
  },
  navIcon: {
    fontSize: 16,
    color: '#9a7668',
  },
  navIconActive: {
    color: '#6d3827',
  },
  navLabel: {
    color: '#9a7668',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
  navLabelActive: {
    color: '#6d3827',
  },
});
