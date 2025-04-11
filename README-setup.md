# Particula – Advanced Setup Guide

This guide provides everything you need to install, use, and customize the Particula visualizer.

---

## 📦 Requirements

- Node.js ([https://nodejs.org](https://nodejs.org))
- A modern web browser (Chrome or Firefox recommended)
- (Optional) VB-Cable or VB HiFi Cable for capturing system-wide audio

---

## 🖥️ Running Locally

1. **Open a terminal** in your project folder.

2. **Install** or verify you have Node.js (v14+). Then run:

   ```bash
   npx serve .
   ```

3. **Open** your browser at:

   ```
   http://localhost:3000
   ```

**Windows shortcut**: double-click `run.bat` to start a server and open the project automatically.

> **Note:** You must serve files via a local server; opening `index.html` directly from the filesystem won't work, because Particula loads scripts from CDNs.

---

## 🎧 Audio Input Setup

Particula can visualize audio from two main sources:

- **Audio Player**: Streams files placed in the `Songs/` folder.
- **Microphone**: Captures live sound from your mic or virtual audio cable.

### On-Screen Audio Controls

When running Particula, you’ll see a small panel at the top (or a floating one), containing:

- **Song Select**: Dropdown of `.mp3`, `.wav`, or `.ogg` files from your `Songs/` folder.
- **Play/Pause**: Toggles playback of the selected file.
- **Volume Slider**: Adjusts the volume of the audio element.
- **Timeline Slider**: Lets you seek through the loaded track.
- **Use Mic / Use Player**: Switch between audio files or microphone input.

If no songs appear:

- Make sure you created a `Songs/` folder
- Ensure you’re running via `npx serve .` (not file://)

> **Tip:** Some browsers block autoplay. Click the screen or the Play button to start audio.

---

## 🔌 VB-Cable Setup (Windows Only)

To make Particula react to system-wide audio (Spotify, YouTube, etc.), install a virtual cable:

### Option 1: VB-Cable

1. Install VB-Audio Virtual Cable: [https://vb-audio.com/Cable/](https://vb-audio.com/Cable/)
2. In Windows Sound Settings:
   - **Playback (Output)** → `CABLE Input`
   - **Recording (Input)** → `CABLE Output`
3. Enable "Listen to this device":
   - Right-click sound icon → Sound settings → More sound settings
   - **Recording** tab → Right-click `CABLE Output` → Properties → **Listen** tab
   - Check "Listen to this device", select your speakers/headphones
   - Confirm with OK

### Option 2: VB HiFi Cable (Recommended)

1. Install HiFi Cable: [https://vb-audio.com/Cable/](https://vb-audio.com/Cable/)
2. **Output** → `Hi-Fi Cable Input`
3. **Input** → `Hi-Fi Cable Output`
4. In Recording → `Hi-Fi Cable Output` → Properties:
   - Enable "Listen to this device"
   - **Advanced** → 44100 Hz, 16-bit (CD Quality)

---

## ⚠️ Windows Automatic Gain Control (AGC)

Windows 11 can auto-adjust mic input volume, causing fluctuations.

### Why It Happens:

- Windows detects `CABLE Output`/`Hi-Fi Cable Output` as a microphone.
- AGC tries to "improve" volume.
- Particula sees unexpected amplitude changes.

### Disabling AGC:

1. Press `Win + R`, type `regedit`, press Enter
2. Search (Ctrl + F) for `CABLE Output` or `Hi-Fi Cable Output`
3. Locate audio `Capture` entries
4. Right-click → New → DWORD (32-bit) Value
5. Name it `EnableAGC` → value `0`
6. Restart PC

> Proceed carefully. Registry edits can affect system behavior.

---

## 🧪 GUI Overview

Particula uses a **dat.GUI** panel to tweak parameters in real time. Each sphere has its own folder, plus a few global controls:

- **Global Particle Count**: One master setting for all sphere particle counts
- **Fog Settings**: Enable/disable fog, set color, and adjust near/far distances

**Click outside** the GUI or control panels to hide them – click again to show them.

---

## 🎛️ GUI Parameter Reference

### Per-Sphere Parameters

1. **enabled**

   - Toggles visibility of the sphere's particle system.

2. **particleCount**

   - Sets how many particles are generated.

3. **particleSize**

   - Controls each particle’s rendered size.

4. **particleLifetime**

   - How many seconds before a particle is "reborn." Once time is up, it respawns at a new position.

5. **sphereRadius**

   - The maximum distance particles can occupy from the center.

6. **innerSphereRadius**

   - A 0–1 factor that controls how close to the center initial spawn can be.

7. **rotationSpeedMin / rotationSpeedMax**

   - Defines the lower/upper bound of rotation speed around the y-axis. The actual speed is tied to audio volume.

8. **rotationSmoothness**

   - How gently rotation speed transitions in response to volume changes.

9. **volumeChangeThreshold**

   - Ignores volume differences below this threshold.

10. **minFrequency / maxFrequency**

    - The frequency band (Hz) used for amplitude-based motions.

11. **minFrequencyBeat / maxFrequencyBeat**

    - The frequency band used for detecting beat spikes.

12. **noiseScale**

    - The scale of the Perlin noise field affecting particle movement.

13. **dynamicNoiseScale**

    - If true, noiseScale auto-changes after a peak event.

14. **minNoiseScale / maxNoiseScale**

    - Range for that dynamic noiseScale.

15. **noiseStep**

    - Step size for noiseScale jumps when a beat is detected.

16. **noiseSpeed**

    - How fast the noise "flow" evolves.

17. **turbulenceStrength**

    - Intensity of noise forces.

18. **colorStart / colorEnd**

    - Defines a color gradient for the particles.

19. **peakSensitivity**

    - Controls how easily peaks are triggered. If current amplitude > average \* peakSensitivity, we register a peak.

20. **beatThreshold**

    - Raw amplitude threshold for the beat band.

21. **beatStrength**

    - Push intensity applied to particles when a beat is detected.

22. **gainMultiplier**

    - Multiplies frequency data. Raise it to make the sphere more reactive.

23. **historyLength** (peakDetection)

    - Number of amplitude samples stored for averaging.

24. **minTimeBetweenPeaks** (peakDetection)

    - Milliseconds that must pass before detecting another peak.

---

### Global GUI Parameters

1. **Global Particle Count**

   - Forces all spheres to share the same particle count.

2. **Fog**

   - **enabled**: Toggles fog.
   - **color**: Fog color.
   - **near** / **far**: Adjusts how quickly fog fades in/out.

---

## 💾 Presets

Save your favorite sphere + global settings, then load them later or share as JSON.

- **Save**: Creates a named preset.
- **Reset**: Returns to defaults.
- **Delete**: Removes a preset.
- **Export/Import**: Backs up all presets or loads them from disk.

> Presets are stored in your browser’s localStorage by default.

---

## 🔧 Troubleshooting

**Audio not reacting?**

- Ensure microphone permissions are granted.
- Check VB-Cable settings if you want system audio.
- Reload the browser after changing device inputs.

**Mic input too quiet or volume shifts unexpectedly?**

- Windows AGC might be active. (See above.)
- Try the HiFi Cable with manual volume control.

**No songs listed in the dropdown?**

- Confirm a `Songs/` folder is present.
- Use a local server (npx serve .).
- Make sure your audio files end in `.mp3`, `.wav`, or `.ogg`.

---

## 🛠️ Dev Mode Tips

- **main.js** centralizes logic: spheres, audio analyzers, beat detection.
- Each sphere is constructed similarly; you can clone or expand that function.
- Beat detection uses a combination of averaging, thresholds, and time gating.
- Presets are stored per sphere in a structured JSON.
- If you add new parameters, update the GUI code accordingly.

---

### Copy Settings to Other Spheres

In the GUI for Sphere 1, you might see a button named `Copy to Spheres 2-5`. Clicking it duplicates Sphere 1’s current parameters to the others.

---

## 📖 Usage Flow Summary

1. **Open Particula** in your browser via `http://localhost:3000`.
2. Decide if you want to play local files or capture mic/system audio.
3. Adjust sphere parameters in the GUI:
   - Turn on or off certain spheres.
   - Play with color gradients, noise, or beat detection.
4. Hide the GUI by clicking outside it; click again to show.
5. Save/Load presets as you discover interesting visuals.

Enjoy exploring **Particula**! For deeper modifications, read the commented sections in `main.js`.

---

**Happy visualizing!**