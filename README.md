# Particula

Particula is an interactive music-driven particle visualizer built with WebGL (Three.js).  
It reacts to sound, frequency, and rhythm to create a dynamic audiovisual experience in 3D space.

## Demo

Demo video: https://youtu.be/AroTkLpfSSA  
(Add the correct link once the video is uploaded.)

## Running locally

Requires Node.js: https://nodejs.org

1. Open a terminal in the project folder
2. Run a local server:

    npx serve .

3. Open this address in your browser:

    http://localhost:3000

Alternatively, use the provided run.bat file (Windows only).

## Features

- Five independent particle spheres reacting to different frequency bands
- Noise and turbulence dynamics influenced by audio input
- Beat detection with reactive wave effects
- Switch between audio player and microphone input
- Real-time parameter editing via built-in GUI
- Preset system (save, load, export, import)

## Collaboration

- This is the official repository of the Particula project.  
- Feel free to experiment, modify, and contribute.
- Open a pull request, start a discussion, or fork the repo and experiment. If you build something cool, we’d love to see it – especially presets or entirely new directions.
- If you publish a fork or derivative version, please acknowledge the original and do not use the name "Particula" without permission.

## Ideas for Future Development

- Add a moving camera to enhance depth and immersion.
- Decouple the spheres from the center – let them float freely in 3D space.
- Try alternative shapes: rings, ellipsoids, toruses.
- Make the noise animation slow down or sync with tempo.
- Assign more particles to lower frequencies (logarithmic sound spectrum distribution).

## License

MIT © 2025 Humprt Pum  
Free to use and modify with attribution.
