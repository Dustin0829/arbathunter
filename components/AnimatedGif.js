import React, { useState, useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated, Easing } from 'react-native';

/**
 * AnimatedGif Component - A custom component for animating bat sprites
 * 
 * @param {Object} props
 * @param {string|number} props.source - The source of the GIF image
 * @param {Object} props.style - Additional styles for the image
 */
const AnimatedGif = ({ 
  source, 
  style,
  ...props 
}) => {
  // Use a rotation animation for bat wings
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  // Start the animation
  useEffect(() => {
    // Create a sequence for the bat wing flapping animation
    Animated.loop(
      Animated.sequence([
        // Flap wings up
        Animated.parallel([
          Animated.timing(rotateAnim, {
            toValue: 10,
            duration: 150,
            easing: Easing.linear,
            useNativeDriver: true
          }),
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 150,
            easing: Easing.linear,
            useNativeDriver: true
          })
        ]),
        // Flap wings down
        Animated.parallel([
          Animated.timing(rotateAnim, {
            toValue: -10,
            duration: 150,
            easing: Easing.linear,
            useNativeDriver: true
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.9,
            duration: 150,
            easing: Easing.linear,
            useNativeDriver: true
          })
        ])
      ])
    ).start();
    
    return () => {
      // Cleanup
      rotateAnim.stopAnimation();
      scaleAnim.stopAnimation();
    };
  }, []);
  
  // Create the rotation transform
  const rotate = rotateAnim.interpolate({
    inputRange: [-10, 10],
    outputRange: ['-10deg', '10deg']
  });

  return (
    <View style={[styles.container, style]}>
      <Animated.Image 
        source={source}
        style={[
          styles.image, 
          style,
          { 
            transform: [
              { rotate },
              { scale: scaleAnim }
            ] 
          }
        ]}
        resizeMode="contain"
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export default AnimatedGif;