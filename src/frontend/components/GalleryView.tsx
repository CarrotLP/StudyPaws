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
import { getCommunityImagesOfWeek, getUserCommunityQuestLikes, likeCommunityQuest, Submission, unlikeCommunityQuest } from '@/services/communityQuestSubmission.services';
import { type UserCommunity } from '@/services/userCommunities.services';
import type { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

type GalleryViewProps = {
  currentCommunity: UserCommunity;
  theme: string;
  user: User | null;
  onBack: () => void;
};

export function HeartButton({
  liked,
  onPress,
}: {
  liked: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={10}>
      <Text style={{ fontSize: 25 }}>
        {liked ? "❤️" : "🤍"}
      </Text>
    </Pressable>
  );
}

export function GalleryView({ currentCommunity, theme, user, onBack }: GalleryViewProps) {
  const now = new Date();
  const nowString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [likes, setLikes] = useState<boolean[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);


  const toggleLike = async (index: number) => {
    if (!user) return;

    const submission = submissions[index];
    const submissionId = submission.submissionId;

    const isLiked = likes[index];

    // optimistic UI update
    setLikes((prev) => {
      const copy = [...prev];
      copy[index] = !copy[index];
      return copy;
    });

    try {
      if (isLiked) {
        await unlikeCommunityQuest(user.id, submissionId);
      } else {
        await likeCommunityQuest(user.id, submissionId);
      }
    } catch (err) {
      // rollback if failure
      setLikes((prev) => {
        const copy = [...prev];
        copy[index] = isLiked;
        return copy;
      });

      console.error('Like toggle failed:', err);
    }
  };


  useEffect(() => {
    async function load() {
      const data = await getCommunityImagesOfWeek(
        nowString,
        currentCommunity.communityId
      );

      setSubmissions(data);

      const likedSubmissionIds = user ? await getUserCommunityQuestLikes(user.id) : [];
      
      setLikes(data.map((submission) =>
        likedSubmissionIds.includes(submission.submissionId)
      ));
    }    
    load();
  }, [currentCommunity.communityId]);


  return (
    <>
    <View style={styles.communityList}>    
      <View style={styles.communityCard}>
        <Text style={styles.communityName}>{theme}</Text>
      </View>
    </View>

    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: "3%" }}>
      {submissions.map((submission, index) => (
        <View key={index} style={{ width: "31%", marginBottom: 10 }}>
          <Pressable 
            onPress={() =>
              setSelectedImage(getPublicImageUrl(submission.photoUri))
            }>
            <Image
            key={index}
            source={{ uri: getPublicImageUrl(submission.photoUri) }}
            style={{ width: "100%", height: 110 }}
            />
          </Pressable>
          <View style={{ alignItems: "flex-end" }}>
            <HeartButton
              liked={likes[index]}
              onPress={() => toggleLike(index)}
            />
          </View>
        </View>
      ))}
      <Modal visible={!!selectedImage} transparent>
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.9)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => setSelectedImage(null)}
        >
          <Image
            source={{ uri: selectedImage ?? "" }}
            style={{ width: "90%", height: "70%" }}
            resizeMode="contain"
          />
        </Pressable>
      </Modal>
    </View>
  
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