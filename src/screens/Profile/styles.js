import { StyleSheet } from 'react-native';
import { theme } from '../../theme';
import { s, vs } from 'react-native-size-matters';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  containerDark: {
    backgroundColor: '#0F071D',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: vs(100),
  },

  /* ── 1. Screen Header ── */
  topNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(18),
    paddingTop: vs(8),
    paddingBottom: vs(10),
  },
  screenTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: s(22),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  screenTitleDark: {
    color: '#FFFFFF',
  },
  topNavVipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: s(12),
    paddingHorizontal: s(7),
    paddingVertical: vs(2),
    marginLeft: s(8),
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  topNavVipPillDark: {
    backgroundColor: '#311E08',
    borderColor: '#78350F',
  },
  topNavSparkle: {
    marginRight: s(3),
  },
  topNavVipPillText: {
    fontSize: s(8.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#92400E',
    letterSpacing: 0.6,
  },
  topNavVipPillTextDark: {
    color: '#FDE68A',
  },
  screenSubtitle: {
    fontSize: s(11.5),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#64748B',
    marginTop: vs(2),
  },
  screenSubtitleDark: {
    color: '#94A3B8',
  },
  navSettingsBtn: {
    width: s(40),
    height: s(40),
    borderRadius: s(14),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderBottomWidth: 2.5,
    borderBottomColor: '#CBD5E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  navSettingsBtnDark: {
    backgroundColor: '#1E0E38',
    borderColor: '#2E1654',
    borderBottomColor: '#180B2E',
  },

  /* ── 2. Dashboard Title Section ── */
  dashboardSectionHeader: {
    paddingHorizontal: s(18),
    marginTop: vs(14),
    marginBottom: vs(10),
  },
  dashboardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dashboardTitle: {
    fontSize: s(20),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1A0B2E',
    letterSpacing: -0.2,
  },
  dashboardTitleDark: {
    color: '#FFFFFF',
  },
  waveEmoji: {
    fontSize: s(19),
  },
  dashboardSubtitle: {
    fontSize: s(11.5),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#64748B',
    marginTop: vs(2),
  },
  dashboardSubtitleDark: {
    color: '#94A3B8',
  },

  /* ── 3. 3D Metric Cards Grid ── */
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: s(16),
  },

  /* ── 4. Tab Content Containers ── */
  tabContentContainer: {
    marginBottom: vs(14),
  },
  tabContentCard: {
    marginHorizontal: s(16),
    backgroundColor: '#FFFFFF',
    borderRadius: s(22),
    padding: s(20),
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderBottomWidth: 3,
    borderBottomColor: '#CBD5E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  tabContentCardDark: {
    backgroundColor: '#190B30',
    borderColor: '#2E1654',
    borderBottomColor: '#18072E',
  },
  tabContentEmptyIconWrap: {
    width: s(54),
    height: s(54),
    borderRadius: s(27),
    backgroundColor: '#FAF5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(12),
  },
  tabContentEmptyTitle: {
    fontSize: s(16),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1E293B',
    marginBottom: vs(6),
    textAlign: 'center',
  },
  tabContentEmptySub: {
    fontSize: s(12),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: s(17),
    paddingHorizontal: s(10),
    marginBottom: vs(16),
  },
  tabActionBtn: {
    borderRadius: s(14),
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  tabActionBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(18),
    paddingVertical: vs(10),
    borderRadius: s(14),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomWidth: 2,
    borderBottomColor: '#4C1D95',
  },
  tabActionBtnIcon: {
    marginRight: s(6),
  },
  tabActionBtnText: {
    color: '#FFFFFF',
    fontSize: s(12.5),
    fontFamily: theme.typography.fontFamily.bold,
  },

  /* Leaderboard Podium */
  leaderboardPodiumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: vs(10),
  },
  podiumItem: {
    alignItems: 'center',
    paddingHorizontal: s(8),
    borderRadius: s(14),
  },
  podiumSilver: {
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
    borderWidth: 1,
    borderColor: '#94A3B8',
    paddingVertical: vs(10),
  },
  podiumGold: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    paddingVertical: vs(16),
    transform: [{ translateY: -vs(8) }],
  },
  podiumBronze: {
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    borderWidth: 1,
    borderColor: '#FDBA74',
    paddingVertical: vs(10),
  },
  podiumMedal: {
    fontSize: s(22),
    marginBottom: vs(4),
  },
  podiumName: {
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1E293B',
    textAlign: 'center',
  },
  podiumScore: {
    fontSize: s(9.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#64748B',
    marginTop: vs(2),
  },

  /* ── 5. Menu Sections ── */
  menuSection: {
    marginBottom: vs(18),
    paddingHorizontal: s(16),
  },
  menuSectionHeader: {
    fontSize: s(10.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#64748B',
    letterSpacing: 1.2,
    marginBottom: vs(8),
    paddingLeft: s(4),
  },
  menuSectionHeaderDark: {
    color: '#94A3B8',
  },
  menuCard3D: {
    backgroundColor: '#FFFFFF',
    borderRadius: s(20),
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderBottomWidth: 3,
    borderBottomColor: '#CBD5E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  menuCard3DDark: {
    backgroundColor: '#170A2E',
    borderColor: '#2B1352',
    borderBottomColor: '#17062E',
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(14),
    paddingVertical: vs(12),
  },
  menuItemRowActive: {
    backgroundColor: '#F5F3FF',
  },
  menuItemRowActiveDark: {
    backgroundColor: '#27104B',
  },
  menuItemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuItemDividerDark: {
    borderBottomWidth: 1,
    borderBottomColor: '#240F44',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconBox3D: {
    width: s(34),
    height: s(34),
    borderRadius: s(11),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(12),
  },
  menuItemTitle: {
    fontSize: s(13),
    fontFamily: theme.typography.fontFamily.semiBold,
    color: '#1E293B',
    letterSpacing: -0.1,
  },
  menuItemTitleDark: {
    color: '#F1F5F9',
  },
  menuItemDestructive: {
    color: '#EF4444',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuBadge3D: {
    backgroundColor: '#EDE9FE',
    borderRadius: s(10),
    paddingHorizontal: s(7),
    paddingVertical: vs(2.5),
    marginRight: s(8),
  },
  menuBadge3DDark: {
    backgroundColor: '#2E1654',
  },
  menuBadgeText: {
    fontSize: s(10),
    fontFamily: theme.typography.fontFamily.bold,
  },
  aiBadge3D: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    borderRadius: s(10),
    paddingHorizontal: s(7),
    paddingVertical: vs(2.5),
    marginRight: s(8),
  },
  aiBadge3DDark: {
    backgroundColor: '#2E1654',
  },
  sparkleIcon: {
    marginRight: s(3),
  },
  aiBadgeText: {
    fontSize: s(10),
    fontFamily: theme.typography.fontFamily.bold,
  },

  /* ── 6. 3D Floating Help Widget ── */
  floatingHelpWrap: {
    position: 'absolute',
    right: s(18),
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
  },
  floatingHelpPulse: {
    position: 'absolute',
    width: s(62),
    height: s(62),
    borderRadius: s(31),
    backgroundColor: '#A855F7',
  },
  floatingHelpBtn3D: {
    width: s(50),
    height: s(50),
    borderRadius: s(25),
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  floatingHelpGradient: {
    flex: 1,
    borderRadius: s(25),
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.4)',
    borderBottomWidth: 3,
    borderBottomColor: '#3B0764',
  },

  textWhite: {
    color: '#FFFFFF',
  },
  textMutedDark: {
    color: '#94A3B8',
  },
});

export default styles;
