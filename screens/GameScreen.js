import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import CameraView from '../components/CameraView';
import FireButton from '../components/game/FireButton';
import StaminaBar from '../components/game/StaminaBar';
import StatsDisplay from '../components/game/StatsDisplay';
import BatsCounter from '../components/game/BatsCounter';

// Get screen dimensions
const { width, height } = Dimensions.get('window');

export default function GameScreen({ navigation }) {
  // Game state
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [batsKilled, setBatsKilled] = useState(0);
  const [stamina, setStamina] = useState(100);
  const [targetBats] = useState(10);
  
  const cameraRef = useRef(null);

  // Handle permission denied or errors with the camera
  const handleCameraPermissionDenied = () => {
    Alert.alert(
      'Camera Permission Required',
      'This AR game needs camera access to work. Please enable camera permissions in your device settings.',
      [{ text: 'OK', onPress: () => navigation.navigate('MainMenu') }]
    );
  };
  
  // Handle shooting
  const handleShoot = () => {
    console.log('Fire!');
    // Example: Decrease stamina when shooting
    setStamina(prevStamina => Math.max(0, prevStamina - 10));
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      <CameraView ref={cameraRef}>
        <View style={styles.overlay}>
          {/* Back button */}
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>×</Text>
          </TouchableOpacity>
          
          {/* Stats display (time, score) */}
          <StatsDisplay
            timeLeft={timeLeft}
            score={score}
            batsKilled={batsKilled}
            targetBats={targetBats}
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
          <FireButton onPress={handleShoot} />
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
    right: 335,
    top: 20,
    width: 45,
    height: 45,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    zIndex: 10,
  },
  backButtonText: { 
    color: 'white', 
    fontSize: 24, 
    fontWeight: 'bold',
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
});