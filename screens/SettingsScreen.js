import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Switch,
  ImageBackground,
  Dimensions,
  Image,
  Alert,
  Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GAME_CONFIG } from '../utils/gameConfig';
import { Video } from 'expo-av';

// Get the dimensions of the screen - in landscape mode, width is the longer dimension
const { width, height } = Dimensions.get('window');

export default function SettingsScreen({ navigation }) {
  const [soundEnabled, setSoundEnabled] = useState(GAME_CONFIG.SOUND_ENABLED);
  const [difficulty, setDifficulty] = useState(GAME_CONFIG.CURRENT_DIFFICULTY); // EASY, MEDIUM, HARD
  const videoRef = useRef(null);
  
  // Animation for buttons
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Play the background video when component mounts
    if (videoRef.current) {
      videoRef.current.playAsync();
    }
    
    // Start button pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Save settings when they change
  useEffect(() => {
    // In a real app, you would use AsyncStorage or another persistence method
    // For this prototype, we're just updating the global object
    GAME_CONFIG.SOUND_ENABLED = soundEnabled;
    GAME_CONFIG.CURRENT_DIFFICULTY = difficulty;
    
    console.log('Settings updated:', { soundEnabled, difficulty });
  }, [soundEnabled, difficulty]);

  const handleDifficultyChange = (newDifficulty) => {
    setDifficulty(newDifficulty);
  };

  const handleResetHighScores = () => {
    // Show confirmation dialog
    Alert.alert(
      "Reset High Scores",
      "Are you sure you want to reset all high scores? This cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Reset", 
          onPress: () => {
            // In a real app, you would clear scores from storage
            console.log('High scores reset');
            Alert.alert("Success", "High scores have been reset!");
          },
          style: "destructive"
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {/* Background Video - reusing the same as main menu */}
      <Video
        ref={videoRef}
        source={require('../assets/images/GameMenuBackground.mp4')}
        style={styles.backgroundVideo}
        resizeMode="cover"
        isLooping
        shouldPlay
        isMuted={!soundEnabled}
        
      />
                <TouchableOpacity
            style={styles.muteButton}
            onPress={() => setSoundEnabled(!soundEnabled)}
          >
            <Text style={styles.muteButtonText}>{soundEnabled ? '🔊' : '🔇'}</Text>
          </TouchableOpacity>
      {/* Back button in top left */}
      <TouchableOpacity
        style={styles.backButtonTopLeft}

        onPress={() => navigation.navigate('MainMenu')}
      >
        <Text style={styles.backButtonTopLeftText}>Back</Text>
      </TouchableOpacity>
      
      {/* Main content */}
      <View style={styles.mainContent}>
        {/* Settings Title */}
        <Text style={styles.title}>SETTINGS</Text>
        
        {/* Difficulty Section */}
        <View style={styles.difficultySection}>
          <Text style={styles.difficultyTitle}>DIFFICULTY</Text>
          
          <View style={styles.difficultyOptions}>
            <TouchableOpacity
              style={[
                styles.difficultyButton,
                difficulty === 'EASY' && styles.difficultyButtonSelected,
              ]}
              onPress={() => handleDifficultyChange('EASY')}
            >
              <Text style={[
                styles.difficultyButtonText,
                difficulty === 'EASY' && styles.difficultyButtonTextSelected
              ]}>EASY</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.difficultyButton,
                difficulty === 'MEDIUM' && styles.difficultyButtonSelected,
              ]}
              onPress={() => handleDifficultyChange('MEDIUM')}
            >
              <Text style={[
                styles.difficultyButtonText,
                difficulty === 'MEDIUM' && styles.difficultyButtonTextSelected
              ]}>Medium</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.difficultyButton,
                difficulty === 'HARD' && styles.difficultyButtonSelected,
              ]}
              onPress={() => handleDifficultyChange('HARD')}
            >
              <Text style={[
                styles.difficultyButtonText,
                difficulty === 'HARD' && styles.difficultyButtonTextSelected
              ]}>Hard</Text>
            </TouchableOpacity>
          </View>
          
          {/* Mute button in corner */}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    opacity: 0.85, // Make the red background more prominent
  },
  mainContent: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 64,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 80,
    textAlign: 'center',
    fontFamily: 'monospace',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -3, height: 3 },
    textShadowRadius: 10,
    letterSpacing: 4,
    position: 'absolute',
    top: 0,
  },
  difficultySection: {
    width: '100%',
    alignItems: 'center',
    marginTop: 150,
  },
  difficultyTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 30,
    textAlign: 'center',
    fontFamily: 'monospace',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -2, height: 2 },
    textShadowRadius: 5,
    letterSpacing: 2,
  },
  difficultyOptions: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '90%',
    paddingHorizontal: 20,
  },
  difficultyButton: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 3,
    borderColor: 'white',
    borderRadius: 6,
    minWidth: 150,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  difficultyButtonSelected: {
    backgroundColor: 'rgb(89, 4, 129)',
    borderColor: '#ffffff',
  },
  difficultyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 28,
    fontFamily: 'monospace',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5,
    letterSpacing: 1,
  },
  difficultyButtonTextSelected: {
    color: 'white',
  },
  settingLabel: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
    marginRight: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5,
    fontFamily: 'monospace',
  },
  resetButton: {
    backgroundColor: GAME_CONFIG.COLORS.SECONDARY,
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginBottom: 30,
    alignSelf: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  resetButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
    fontFamily: 'monospace',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: 'white',
  },
  buttonIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
    fontFamily: 'monospace',
  },
  muteButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  muteButtonText: {
    fontSize: 20,
  },
  backButtonTopLeft: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 100,
    height: 50,
    borderRadius: 10,
    backgroundColor: 'rgb(214, 15, 15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    padding: 10,
  },
  backButtonTopLeftText: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
}); 