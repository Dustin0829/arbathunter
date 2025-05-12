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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Audio } from 'expo-av';
import CameraView from '../components/CameraView';
import ARScene from '../components/ARScene';

import StaminaBar from '../components/game/StaminaBar';
import StatsDisplay from '../components/game/StatsDisplay';
import BatsCounter from '../components/game/BatsCounter';
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
  const [crosshairPosition] = useState({ x: width / 2, y: height / 2 });

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

  // Handle bat hit
  const handleBatHit = useCallback(() => {
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
    const basePoints = 10;
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
    setStamina(prev => Math.min(100, prev + 5));
  }, [consecutiveHits, lastShotTime, targetBats, hitSound]);
  
  // Handle shooting
  const handleShoot = useCallback(() => {
    if (!gameActive || gameOver) return;
    
    // Play shoot sound - commented out until sound files are added
    /*
    if (GAME_CONFIG.SOUND_ENABLED && shootSound) {
      shootSound.replayAsync();
    }
    */
    
    // Check if hit any bat
    const hit = checkBatHit(crosshairPosition);
    
    if (!hit) {
      // Miss - reduce stamina
      /*
      if (GAME_CONFIG.SOUND_ENABLED && missSound) {
        missSound.replayAsync();
      }
      */
      
      setStamina(prev => {
        const newValue = Math.max(0, prev - 10);
        // Check lose condition - stamina depleted
        if (newValue <= 0) {
          endGame(false);
        }
        return newValue;
      });
    }
  }, [gameActive, gameOver, crosshairPosition, shootSound, missSound]);

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      <CameraView ref={cameraRef}>
        <View style={styles.overlay}>
          {/* AR Scene with 3D bat models */}
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
          
          {/* Stats display (time, score) */}
          <StatsDisplay
            timeLeft={timeLeft}
            score={score}
          />
          
          {/* Separate Bats Counter */}
          <BatsCounter 
            batsKilled={batsKilled}
            targetBats={targetBats}
          />
          
          {/* Stamina bar */}
          <StaminaBar stamina={stamina} />
          
          {/* Custom Crosshair */}
          <View style={styles.crosshairContainer}>
            <View style={styles.crosshairHorizontal} />
            <View style={styles.crosshairVertical} />
            <View style={styles.crosshairCenter} />
          </View>
          
          {/* Gun image */}
          <Image 
            source={require('../assets/images/gun.png')} 
            style={styles.gunImage}
            resizeMode="contain"
          />
          
          {/* Fire Button */}
          <TouchableOpacity 
            style={styles.fireButton}
            onPress={handleShoot}
            activeOpacity={0.7}
          >
            <Image 
              source={require('../assets/images/FireButton.png')} 
              style={styles.fireButtonImage} 
              resizeMode="contain"
            />
          </TouchableOpacity>
          
          {/* Consecutive hits indicator (only shows when > 1) */}
          {consecutiveHits > 1 && (
            <View style={styles.comboContainer}>
              <Text style={styles.comboText}>{consecutiveHits}x COMBO!</Text>
            </View>
          )}
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  overlay: { 
    flex: 1, 
    backgroundColor: 'transparent',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: -350,
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
  gunImage: {
    position: 'absolute',
    bottom: -38,
    right: -450,
    width: 600,
    height: 500,
    zIndex: 10,
  },
  crosshairContainer: {
    position: 'absolute',
    top: '50%',
    left: '0%',
    width: 60,
    height: 60,
    marginLeft: -30,
    marginTop: -30,
    zIndex: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crosshairHorizontal: {
    position: 'absolute',
    width: 30,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  crosshairVertical: {
    position: 'absolute',
    width: 2,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  crosshairCenter: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgb(255, 0, 0)',
    borderWidth: 1,
    borderColor: 'white',
  },
  fireButton: {
    position: 'absolute',
    bottom: 30,
    left: -380,
    zIndex: 15,
  },
  fireButtonImage: {
    width: 120,
    height: 120,
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