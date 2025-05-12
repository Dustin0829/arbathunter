# AR Bat Hunter

An augmented reality mobile game where players hunt virtual bats in their real-world environment using their device's camera.

## Game Overview

AR Bat Hunter is a first-person shooter AR mobile game built with React Native and Expo. Players use their mobile device's camera to hunt and shoot virtual bats that appear in their surroundings. The game features:

- AR integration for an immersive bat hunting experience
- 3D bat models with realistic animations
- Time-limited gameplay (120 seconds)
- Multiple difficulty levels
- Score tracking and leaderboards

## Technologies Used

- React Native
- Expo
- React Navigation
- Three.js (for 3D model rendering)
- Expo Camera (for AR functionality)

## Installation

1. Clone the repository:
```
git clone https://github.com/YOUR_USERNAME/ar-bat-hunter.git
cd ar-bat-hunter
```

2. Install dependencies:
```
npm install
```

3. Start the development server:
```
npx expo start
```

4. Open the Expo Go app on your mobile device and scan the QR code to run the app.

## Game Features

- **Main Menu**: Start the game, access settings, or view leaderboards
- **Settings**: Adjust difficulty levels (Easy, Medium, Hard)
- **AR Game Screen**: Hunt bats in augmented reality with a crosshair and fire button
- **End Screen**: View your final score and choose to play again or return to the main menu

## Difficulty Levels

- **Easy**: 20 bats to hunt, larger bats, slower spawn rate
- **Medium**: 25 bats to hunt, medium-sized bats, moderate spawn rate
- **Hard**: 30 bats to hunt, smaller bats, faster spawn rate

## Credits

- 3D Bat Model: 3D_BAT.glb
- Game assets and UI elements created for AR Bat Hunter

## License

[MIT License](LICENSE)
