import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Image,
  Dimensions,
  Vibration,
  TouchableWithoutFeedback,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Audio } from 'expo-av';
import CameraView from '../components/CameraView';
import ARScene from '../components/ARScene';

import StaminaBar from '../components/game/StaminaBar';
import StatsDisplay from '../components/game/StatsDisplay';
import { GAME_CONFIG } from '../utils/gameConfig';

// Get screen dimensions
const { width, height } = Dimensions.get('window');

export default function GameScreen({ navigation, route }) {
  // Get difficulty from settings or use default
  const difficulty = route.params?.difficulty || GAME_CONFIG.CURRENT_DIFFICULTY;
  
  // Game state
  const [gameActive, setGameActive] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
  const [score, setScore] = useState(0);
  const [batsKilled, setBatsKilled] = useState(0);
  const [stamina, setStamina] = useState(100);
  const [lastShotTime, setLastShotTime] = useState(0);
  const [consecutiveHits, setConsecutiveHits] = useState(0);
  
  // Get target bats based on difficulty
  const getTargetBats = () => {
    switch(difficulty) {
      case 'EASY': return 20;
      case 'MEDIUM': return 25;
      case 'HARD': return 30;
      default: return 25;
    }
  };
  
  const [targetBats] = useState(getTargetBats());
  const [lastTapPosition, setLastTapPosition] = useState({ x: 0, y: 0 });
  const [lastMissPosition, setLastMissPosition] = useState(null);
  const missIndicatorTimeoutRef = useRef(null);
  
  // Handle screen tap
  const handleScreenTap = (event) => {
    if (!gameActive || gameOver) return;
    
    const tapX = event.nativeEvent.locationX;
    const tapY = event.nativeEvent.locationY;
    
    setLastTapPosition({ x: tapX, y: tapY });
    handleShoot(tapX, tapY);
  };

  // Sound effects
  const [shootSound, setShootSound] = useState();
  const [hitSound, setHitSound] = useState();
  const [missSound, setMissSound] = useState();
  
  const cameraRef = useRef(null);
  const arSceneRef = useRef(null);
  const gameTimerRef = useRef(null);

  // Load sound effects - commented out until sound files are added
  useEffect(() => {
    // Sound loading is disabled until sound files are added
    /*
    async function loadSounds() {
      try {
        // These are placeholder paths - you'll need to add actual sound files
        const shootSoundObject = new Audio.Sound();
        await shootSoundObject.loadAsync(require('../assets/sounds/shoot.mp3'));
        setShootSound(shootSoundObject);
        
        const hitSoundObject = new Audio.Sound();
        await hitSoundObject.loadAsync(require('../assets/sounds/hit.mp3'));
        setHitSound(hitSoundObject);
        
        const missSoundObject = new Audio.Sound();
        await missSoundObject.loadAsync(require('../assets/sounds/miss.mp3'));
        setMissSound(missSoundObject);
      } catch (error) {
        console.log('Error loading sounds:', error);
      }
    }
    
    if (GAME_CONFIG.SOUND_ENABLED) {
      loadSounds();
    }
    
    return () => {
      // Unload sounds when component unmounts
      if (shootSound) shootSound.unloadAsync();
      if (hitSound) hitSound.unloadAsync();
      if (missSound) missSound.unloadAsync();
    };
    */
  }, [GAME_CONFIG.SOUND_ENABLED]);
  
  // Game timer
  useEffect(() => {
    if (gameActive && !gameOver) {
      gameTimerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Time's up - end game
            endGame(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (gameTimerRef.current) {
        clearInterval(gameTimerRef.current);
      }
    };
  }, [gameActive, gameOver]);
  
  // End game function
  const endGame = (isWin) => {
    setGameActive(false);
    setGameOver(true);
    
    if (gameTimerRef.current) {
      clearInterval(gameTimerRef.current);
    }
    
    // Navigate to end screen with results
    navigation.navigate('EndScreen', {
      win: isWin,
      score,
      batsKilled,
      targetBats,
      timeLeft,
      difficulty
    });
  };

  // Handle camera permission denied
  const handleCameraPermissionDenied = () => {
    Alert.alert(
      'Camera Permission Required',
      'This AR game needs camera access to work. Please enable camera permissions in your device settings.',
      [{ text: 'OK', onPress: () => navigation.navigate('MainMenu') }]
    );
  };
  
  // Function to check if a bat is hit
  const checkBatHit = (position) => {
    // Forward the hit check to the AR scene
    if (arSceneRef.current) {
      return arSceneRef.current.checkBatHit(position);
    }
    return false;
  };
  
  // Function to get current bat count
  const getBatCount = () => {
    if (arSceneRef.current) {
      return arSceneRef.current.getBatCount();
    }
    return 0;
  };

  // Handle bat hit
  const handleBatHit = useCallback((points = 10) => {
    // Play hit sound - commented out until sound files are added
    /*
    if (GAME_CONFIG.SOUND_ENABLED && hitSound) {
      hitSound.replayAsync();
    }
    */
    
    // Vibrate device
    Vibration.vibrate(100);
    
    // Calculate bonus points for consecutive hits
    const now = Date.now();
    const timeSinceLastShot = now - lastShotTime;
    setLastShotTime(now);
    
    // If hit within 2 seconds of last hit, increase consecutive hits
    let bonus = 0;
    if (timeSinceLastShot < 2000) {
      setConsecutiveHits(prev => prev + 1);
      bonus = Math.min(consecutiveHits * 5, 50); // Max bonus of 50 points
    } else {
      setConsecutiveHits(1);
    }
    
    // Update score and bats killed
    const basePoints = points; // Use the points value from the bat type
    const totalPoints = basePoints + bonus;
    
    setBatsKilled(prev => {
      const newValue = prev + 1;
      // Check win condition
      if (newValue >= targetBats) {
        endGame(true);
      }
      return newValue;
    });
    
    setScore(prev => prev + totalPoints);
    
    // Increase stamina slightly for successful hit
    // More points = more stamina recovery
    const staminaBoost = Math.min(15, Math.floor(points / 5) + 5);
    setStamina(prev => Math.min(100, prev + staminaBoost));
  }, [consecutiveHits, lastShotTime, targetBats, hitSound]);
  
  // Handle shooting
  const handleShoot = useCallback((tapX, tapY) => {
    if (!gameActive || gameOver) return;
    
    // Play shoot sound - commented out until sound files are added
    /*
    if (GAME_CONFIG.SOUND_ENABLED && shootSound) {
      shootSound.replayAsync();
    }
    */
    
    // Vibrate on shoot for feedback
    Vibration.vibrate(50);
    
    // Check if hit any bat
    const tapPosition = { x: tapX, y: tapY };
    const hit = checkBatHit(tapPosition);
    
    if (!hit) {
      // Miss - reduce stamina
      /*
      if (GAME_CONFIG.SOUND_ENABLED && missSound) {
        missSound.replayAsync();
      }
      */
      
      // Show miss indicator
      setLastMissPosition(tapPosition);
      
      // Clear previous timeout if exists
      if (missIndicatorTimeoutRef.current) {
        clearTimeout(missIndicatorTimeoutRef.current);
      }
      
      // Set timeout to hide miss indicator after 500ms
      missIndicatorTimeoutRef.current = setTimeout(() => {
        setLastMissPosition(null);
      }, 500);
      
      // Reset consecutive hits on miss
      setConsecutiveHits(0);
      
      // Reduce stamina more if player has been missing a lot
      const staminaReduction = consecutiveHits === 0 ? 12 : 8; // Reduced penalty to make game more forgiving
      
      setStamina(prev => {
        const newValue = Math.max(0, prev - staminaReduction);
        // Check lose condition - stamina depleted
        if (newValue <= 0) {
          endGame(false);
        }
        return newValue;
      });
    }
  }, [gameActive, gameOver, consecutiveHits]);

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      <TouchableWithoutFeedback onPress={handleScreenTap}>
        <View style={styles.container}>
          <CameraView ref={cameraRef} style={{flex: 1}}>
            <View style={styles.overlay}>
              {/* AR Scene with bat sprites */}
              <ARScene
                ref={arSceneRef}
                active={gameActive && !gameOver}
                onBatHit={handleBatHit}
                difficulty={difficulty}
              />
              
              {/* Back button */}
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => {
                  setGameActive(false);
                  navigation.goBack();
                }}
              >
                <Image 
                  source={require('../assets/images/XBtn.png')} 
                  style={styles.backButtonImage} 
                  resizeMode="contain"
                />
              </TouchableOpacity>
              
              {/* Stats display (time, score, bats) */}
              <StatsDisplay
                timeLeft={timeLeft}
                score={score}
                batsKilled={batsKilled}
                targetBats={targetBats}
              />
              
              {/* Stamina bar */}
              <StaminaBar stamina={stamina} />
              
              {/* Miss indicator (shows briefly when player misses) */}
              {lastMissPosition && (
                <View style={[styles.missIndicator, {
                  left: lastMissPosition.x - 25,
                  top: lastMissPosition.y - 25
                }]} />
              )}
              
              {/* Consecutive hits indicator (only shows when > 1) */}
              {consecutiveHits > 1 && (
                <View style={styles.comboContainer}>
                  <Text style={styles.comboText}>{consecutiveHits}x COMBO!</Text>
                </View>
              )}
            </View>
          </CameraView>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  overlay: { 
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 20, // Fixed position to be visible on screen
    top: 20,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  backButtonImage: {
    width: 100,
    height: 100,
  },
  missIndicator: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: 'rgba(255, 0, 0, 0.8)',
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
    zIndex: 50,
  },

  comboContainer: {
    position: 'absolute',
    top: height / 2 - 100,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
  },
  comboText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5,
  },
});