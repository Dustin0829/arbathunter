import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

/**
 * BatsCounter Component - Displays number of bats killed and target
 * @param {Object} props
 * @param {Number} props.batsKilled - Number of bats killed
 * @param {Number} props.targetBats - Target number of bats to kill
 * @param {Object} props.style - Additional styles for the container
 */
const BatsCounter = ({ 
  batsKilled = 0, 
  targetBats = 10, 
  style 
}) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.text}>BATS: {batsKilled}/{targetBats}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 35,
    left: 300,
    backgroundColor: 'rgba(0, 0, 0, 0)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 8,
    zIndex: 15,
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5,
  },
});

export default BatsCounter; 