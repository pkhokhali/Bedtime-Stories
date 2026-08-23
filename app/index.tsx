import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { SettingsButton } from '@/components/SettingsButton';
import { StoryCarousel } from '@/components/StoryCarousel';
import { brand, colors, radii, spacing } from '@/constants/theme';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useDownloadsStore } from '@/store/useDownloadsStore';
import { storiesForAge, ageBands, stories as allLocalStories } from '@/data/catalog';

export default function NetflixStyleHome() {
  const router = useRouter();
  const language = useSettingsStore((s) => s.language);
  
  const remoteStoriesAll = useDownloadsStore((s) => s.remoteStories);
  
  // Merge all stories across all age bands for the global catalog
  const mergedStories = allLocalStories.map(ls => {
    const rs = remoteStoriesAll.find(r => r.id === ls.id);
    return rs ? { ...ls, ...rs } : ls;
  });
  const purelyRemote = remoteStoriesAll.filter(rs => !allLocalStories.some(ls => ls.id === rs.id));
  const fullCatalog = [...mergedStories, ...purelyRemote];
  
  // Filter into categories
  const featuredStory = fullCatalog[0];
  const toddlers = fullCatalog.filter(s => s.ageBand === '2-4' || s.ageBand === '4-6');
  const kids = fullCatalog.filter(s => s.ageBand === '6-8' || s.ageBand === '9-12');
  const parents = fullCatalog.filter(s => s.ageBand === 'parents' || s.ageBand === '25+');
  const teens = fullCatalog.filter(s => s.ageBand === '13-17' || s.ageBand === '18-25');

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        
        {/* HERO SECTION */}
        <View style={styles.heroContainer}>
          {featuredStory?.coverImage ? (
             <ImageBackground source={{ uri: featuredStory.coverImage }} style={styles.heroImage} />
          ) : (
             <View style={[styles.heroImage, { backgroundColor: featuredStory?.accent || colors.forestFar, justifyContent: 'center', alignItems: 'center', padding: 40 }]}>
                <Text style={{ fontSize: 50, color: 'rgba(255,255,255,0.2)', fontFamily: 'Nunito_800ExtraBold', textAlign: 'center' }}>
                  {featuredStory?.title[language] || featuredStory?.title.en}
                </Text>
             </View>
          )}
          
          <LinearGradient
            colors={['transparent', 'rgba(15,23,42,0.8)', colors.background]}
            style={styles.heroGradient}
          />
          
          <SafeAreaView style={styles.headerSafe} edges={['top']}>
            <View style={styles.header}>
              <Text style={styles.brand}>{brand.name}</Text>
              <SettingsButton />
            </View>
          </SafeAreaView>

          <View style={styles.heroContent}>
            <Text style={styles.heroKicker}>{language === 'ne' ? '?????? ??????' : 'Recently Added'}</Text>
            <Text style={styles.heroTitle}>
              {featuredStory?.title[language] || featuredStory?.title.en}
            </Text>
            
            <View style={styles.heroButtons}>
              <Pressable style={styles.playButton} onPress={() => router.push('/story/' + featuredStory.id)}>
                <Ionicons name="play" size={24} color="#000" />
                <Text style={styles.playButtonText}>{language === 'ne' ? '???? ?????????' : 'Play'}</Text>
              </Pressable>
              
              <Pressable style={styles.infoButton} onPress={() => router.push('/library')}>
                <Ionicons name="albums-outline" size={24} color="#fff" />
                <Text style={styles.infoButtonText}>{language === 'ne' ? '?????????' : 'Library'}</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* CAROUSELS */}
        <View style={styles.carouselsContainer}>
          <StoryCarousel title={language === 'ne' ? '???? ????????? ????' : 'For Little Ones'} stories={toddlers} />
          <StoryCarousel title={language === 'ne' ? '?????????????? ????' : 'Kids & Tweens'} stories={kids} />
          <StoryCarousel title={language === 'ne' ? '????????? ???? (???????)' : 'After Hours (Parents)'} stories={parents} />
          <StoryCarousel title={language === 'ne' ? '????????? ????' : 'Young Adults'} stories={teens} />
        </View>
        
        <View style={{height: 100}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  heroContainer: {
    width: '100%',
    height: 550,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 300,
  },
  headerSafe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  brand: {
    color: '#fff',
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 24,
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  heroContent: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  heroKicker: {
    color: colors.amber,
    fontFamily: 'Nunito_800ExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontSize: 12,
    marginBottom: 8,
  },
  heroTitle: {
    color: '#fff',
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 40,
    textAlign: 'center',
    marginBottom: 24,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  playButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 4,
    gap: 8,
  },
  playButtonText: {
    color: '#000',
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 16,
  },
  infoButton: {
    backgroundColor: 'rgba(81, 84, 91, 0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
    gap: 8,
  },
  infoButtonText: {
    color: '#fff',
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 16,
  },
  carouselsContainer: {
    paddingTop: 20,
  }
});
