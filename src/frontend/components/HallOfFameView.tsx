import {
    BodyFontSize,
    Border,
    HavenColors,
    HavenFonts,
    HavenSpacing,
    PixelFontSize,
    ShadowOffset,
} from '@/constants/havenTheme';
import { getPublicImageUrl } from '@/lib/storage';
import { CommunityWinner, getCommunityWinners } from '@/services/communityQuestSubmission.services';
import { type UserCommunity } from '@/services/userCommunities.services';
import type { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { Dimensions, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';

type HallOfFameView = {
  currentCommunity: UserCommunity;
  user: User | null;
  onBack: () => void;
};

export function HallOfFameView({ currentCommunity, user, onBack }: HallOfFameView) {
  const [submissions, setSubmissions] = useState<CommunityWinner[]>([]);
  const screenWidth = Dimensions.get("window").width;
  const horizontalPadding = HavenSpacing.xxl * 2;
  const postWidth = screenWidth - horizontalPadding;

  useEffect(() => {
    async function load() {
      const data = await getCommunityWinners(currentCommunity.communityId);

      setSubmissions(data);
    }    
    load();
  }, [currentCommunity.communityId]);

  return (
    <>
    <FlatList
        data={submissions}
        keyExtractor={(item, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
            <View style={{ width: postWidth }}>
            
            <View style={styles.communityCard}> 
                <Text style={styles.communityName}> {item.theme} </Text> 
            </View>

            {/* Image (main content like Instagram post) */}
            <Image
                source={{ uri: getPublicImageUrl(item.imagePath) }}
                style={{ width: screenWidth, height: 400 }}
                resizeMode="cover"
            />

            {/* Info section (like caption area) */}
            <View style={{ padding: 12 }}>
                <Text style={styles.detailValue}>
                {item.user}
                </Text>

                <Text style={styles.detailValue}>
                Votes: {item.votes}
                </Text>
            </View>

            </View>
        )}
    />
  
    <View style={styles.detailBlock}>
      <Pressable
        accessibilityRole="button"
        onPress={onBack}
        style={({ pressed }) => [
          styles.joinButton,
          pressed && styles.buttonPressed,
          ]}>
        <Text style={styles.joinButtonText}>Back</Text>
      </Pressable>
    </View>

    <View>
      
    </View>
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
    width: '100%',
    alignItems: 'flex-start',
    gap: HavenSpacing.sm,
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
    textAlign: 'center',
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