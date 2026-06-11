import { type UserCommunity } from '@/services/userCommunities.services';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  BodyFontSize,
  Border,
  HavenColors,
  HavenFonts,
  HavenSpacing,
  PixelFontSize,
  ShadowOffset,
} from '@/constants/havenTheme';
import { getCommunityMemberCount } from '@/services/community.services';
import { useEffect, useState } from 'react';

type CommunityViewProps = {
  currentCommunity: UserCommunity;
  loading: boolean;
  leaving: boolean;
  confirmLeaveCommunity: () => void;
  onOpenGallery: () => void;
  onOpenHallOfFame: () => void;
};

export function CommunityView({ currentCommunity, loading, leaving, confirmLeaveCommunity, onOpenGallery, onOpenHallOfFame }: CommunityViewProps) {
  const [memberCount, setMemberCount] = useState(0);
  useEffect(() => {
      if (!currentCommunity) return;
  
      getCommunityMemberCount(currentCommunity.communityId)
        .then(setMemberCount)
        .catch(console.error);
    }, [currentCommunity?.communityId]);
  
  return (
    <>
    <View style={styles.communityList}>    
              {currentCommunity ? (
                <View style={styles.communityCard}>
                  <Text style={styles.communityName}>{currentCommunity.communityName}</Text>
                </View>
              ) : null}
            </View>
    
            {currentCommunity ? (
              <View style={styles.communityDetails}>
                <View style={{justifyContent: 'space-between'}}>
                  <View style={[styles.detailBlock]}>
                    <Text style={styles.detailLabel}>Community code:</Text>
                    <Text style={styles.detailLabel}>No. of Members:</Text>
                  </View>
                  <View style={[styles.detailBlock]}>
                    <Text style={styles.detailValue}>{currentCommunity.communityCode}</Text>
                    <Text style={styles.detailValue}>{memberCount}</Text>
                  </View>
                </View>
    
                <View style={styles.detailButton}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={onOpenGallery}
                      style={({ pressed }) => [
                        styles.communityCard,
                        pressed && styles.buttonPressed,
                        ]}>
                      <Text style={styles.joinButtonText}>Visit Gallery</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      onPress={onOpenHallOfFame}
                      style={({ pressed }) => [
                        styles.communityCard,
                        pressed && styles.buttonPressed,
                      ]}>
                      <Text style={styles.joinButtonText}>Visit Hall of Fame</Text>
                    </Pressable>
                </View>
              </View>
            ) : null}

            {currentCommunity ? (
                      <Pressable
                        accessibilityRole="button"
                        disabled={leaving || loading}
                        onPress={confirmLeaveCommunity}
                        style={({ pressed }) => [
                          styles.leaveButton,
                          pressed && !(leaving || loading) && styles.buttonPressed,
                          (leaving || loading) && styles.buttonDisabled,
                        ]}>
                        <Text style={styles.leaveButtonText}>{leaving ? 'Leaving...' : 'Leave community'}</Text>
                      </Pressable>
                    ) : null}
    </>
  );
}


const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: HavenColors.parchment,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: HavenSpacing.xxl,
    paddingTop: HavenSpacing.xl,
    paddingBottom: HavenSpacing.xxl,
    backgroundColor: HavenColors.parchment,
    gap: HavenSpacing.lg,
  },
  section: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.xl,
    color: HavenColors.leather,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  rule: {
    height: Border.thick,
    backgroundColor: HavenColors.ink,
  },
  communityList: {
    gap: HavenSpacing.md,
  },
  communityCard: {
    width: '100%',
    minHeight: 72,
    justifyContent: 'center',
    backgroundColor: HavenColors.cellFill,
    borderWidth: Border.base,
    borderColor: HavenColors.inkSoft,
    paddingVertical: HavenSpacing.lg,
    paddingHorizontal: HavenSpacing.xl,
    boxShadow: `${ShadowOffset.two}px ${ShadowOffset.two}px 0px ${HavenColors.parchmentShadow}`,
  },
  communityName: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.lg,
    color: HavenColors.ink,
    textAlign: 'center',
  },
  communityDetails: {
    width: '100%',
    gap: HavenSpacing.lg,
  },
  detailBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between'
  },
  detailButton: {
    alignItems: 'flex-start',
    gap: HavenSpacing.sm,
    justifyContent: 'space-between'
  },
  detailLabel: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.base,
    color: HavenColors.ink,
    textAlign: 'left',
  },
  detailValue: {
    fontFamily: HavenFonts.body,
    fontSize: BodyFontSize.lg,
    color: HavenColors.ink,
    textAlign: 'left',
  },
  memberName: {
    flex: 1,
    fontFamily: HavenFonts.body,
    fontSize: BodyFontSize.lg,
    color: HavenColors.ink,
    textAlign: 'left',
  },
  leaderboardTable: {
    width: '100%',
    gap: HavenSpacing.sm,
  },
  leaderboardRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: HavenSpacing.md,
  },
  leaderboardHeaderRow: {
    paddingBottom: HavenSpacing.xs,
    borderBottomWidth: Border.base,
    borderBottomColor: HavenColors.inkSoft,
  },
  leaderboardHeaderText: {
    flex: 1,
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.base,
    color: HavenColors.ink,
    textAlign: 'left',
  },
  message: {
    fontFamily: HavenFonts.body,
    fontSize: BodyFontSize.lg,
    color: HavenColors.inkSoft,
    textAlign: 'center',
  },
  joinButton: {
    alignSelf: 'center',
    backgroundColor: HavenColors.ink,
    borderWidth: Border.base,
    borderColor: HavenColors.ink,
    paddingVertical: HavenSpacing.lg,
    paddingHorizontal: HavenSpacing.xxl,
    marginTop: HavenSpacing.md,
    boxShadow: `${ShadowOffset.three}px ${ShadowOffset.three}px 0px ${HavenColors.leatherShadow}`,
  },
  joinButtonText: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.xl,
    color: HavenColors.gold,
    textAlign: 'center',
  },
  leaveButton: {
    alignSelf: 'flex-end',
    backgroundColor: HavenColors.ink,
    borderWidth: Border.base,
    borderColor: HavenColors.ink,
    paddingVertical: HavenSpacing.md,
    paddingHorizontal: HavenSpacing.lg,
    marginTop: HavenSpacing.xl,
    marginBottom: HavenSpacing.xxl * 2,
    boxShadow: `${ShadowOffset.three}px ${ShadowOffset.three}px 0px ${HavenColors.leatherShadow}`,
  },
  leaveButtonText: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.base,
    color: HavenColors.gold,
    textAlign: 'center',
  },
  input: {
    minHeight: 48,
    backgroundColor: HavenColors.cellFill,
    borderWidth: Border.base,
    borderColor: HavenColors.inkSoft,
    color: HavenColors.ink,
    fontFamily: HavenFonts.body,
    fontSize: BodyFontSize.lg,
    paddingHorizontal: HavenSpacing.lg,
    paddingVertical: HavenSpacing.md,
    marginTop: HavenSpacing.sm,
  },
  label: {
    fontFamily: HavenFonts.pixel,
    fontSize: PixelFontSize.base,
    color: HavenColors.ink,
    marginTop: HavenSpacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    transform: [{ translateX: ShadowOffset.one }, { translateY: ShadowOffset.one }],
  },

});