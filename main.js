import { HUDShader } from './hudShader.js';

class AudiobookNarratorOrb {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.composer = null;
        this.usePostProcessing = false;
        
        // Audio system
        this.audioElement = null;
        this.audioContext = null;
        this.analyser = null;
        this.source = null;
        this.dataArray = null;
        
        // Visual components
        this.narratorOrb = null;
        this.starField = null;
        this.reflectionPlane = null;
        this.reflectedOrb = null;
        this.lights = {};
        this.hudPass = null;
        
        // Audio analysis - enhanced for speech
        this.amplitude = 0;
        this.smoothedAmplitude = 0;
        this.voiceFrequencies = {
            subBass: 0,     // 20-60Hz
            bass: 0,        // 60-250Hz  
            lowMid: 0,      // 250-500Hz (fundamental voice)
            mid: 0,         // 500-2kHz (vowels, clarity)
            highMid: 0,     // 2-4kHz (consonants)
            presence: 0,    // 4-6kHz (speech presence)
            brilliance: 0   // 6kHz+ (sibilance, air)
        };
        
        // Enhanced reactivity for speech
        this.speechReactivity = {
            intensity: 3.5,
            responsiveness: 0.25,
            smoothing: 0.15
        };
        
        // Color palette
        this.neonColors = {
            electricBlue: new THREE.Color(0x00FFFF),
            scorchedPink: new THREE.Color(0xFF0055),
            ultravioletOrange: new THREE.Color(0xFF6600),
            toxicGreen: new THREE.Color(0x00FF66)
        };
        
        this.clock = new THREE.Clock();
        this.isPlaying = false;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        
        this.init();
        this.setupEventListeners();
        this.animate();
    }
    
    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        
        // Camera with cinematic positioning
        this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 1, 8);
        this.camera.lookAt(0, 0, 0);
        
        // High-quality renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            preserveDrawingBuffer: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        document.getElementById('container').appendChild(this.renderer.domElement);
        
        // Try to setup post-processing with bloom effect
        this.setupPostProcessing();
        
        this.setupLighting();
        this.createStarField();
        this.createNarratorOrb();
        this.createReflectionSystem();
        
        console.log('Audiobook Narrator Orb initialized', this.usePostProcessing ? 'with bloom and HUD' : 'without post-processing');
    }
    
    setupPostProcessing() {
        // Check if post-processing classes are available
        if (typeof THREE.EffectComposer === 'undefined' || 
            typeof THREE.RenderPass === 'undefined' || 
            typeof THREE.UnrealBloomPass === 'undefined') {
            console.warn('Post-processing not available, falling back to standard rendering');
            this.usePostProcessing = false;
            return;
        }
        
        try {
            // Create effect composer
            this.composer = new THREE.EffectComposer(this.renderer);
            
            // Add render pass
            const renderPass = new THREE.RenderPass(this.scene, this.camera);
            this.composer.addPass(renderPass);
            
            // Add UnrealBloomPass for ethereal glow
            const bloomPass = new THREE.UnrealBloomPass(
                new THREE.Vector2(window.innerWidth, window.innerHeight),
                0.8,    // strength
                0.6,    // radius
                0.1     // threshold
            );
            this.composer.addPass(bloomPass);
            
            // Add HUD overlay shader pass
            this.hudPass = new THREE.ShaderPass(HUDShader);
            this.hudPass.material.transparent = true;
            this.hudPass.material.blending = THREE.AdditiveBlending;
            this.composer.addPass(this.hudPass);
            
            // Add final copy pass if available
            if (typeof THREE.ShaderPass !== 'undefined' && typeof THREE.CopyShader !== 'undefined') {
                const copyPass = new THREE.ShaderPass(THREE.CopyShader);
                copyPass.renderToScreen = true;
                this.composer.addPass(copyPass);
            } else {
                // Make HUD pass render to screen if no copy pass
                this.hudPass.renderToScreen = true;
            }
            
            this.usePostProcessing = true;
            console.log('Post-processing with HUD overlay initialized');
            
        } catch (error) {
            console.warn('Failed to initialize post-processing:', error);
            this.usePostProcessing = false;
        }
    }
    
    setupLighting() {
        // Main key light (Electric Blue)
        this.lights.keyLight = new THREE.PointLight(this.neonColors.electricBlue, 2, 20);
        this.lights.keyLight.position.set(4, 4, 4);
        this.lights.keyLight.castShadow = true;
        this.scene.add(this.lights.keyLight);
        
        // Fill light (Scorched Pink)
        this.lights.fillLight = new THREE.PointLight(this.neonColors.scorchedPink, 1.5, 15);
        this.lights.fillLight.position.set(-3, 2, 3);
        this.scene.add(this.lights.fillLight);
        
        // Rim light (Toxic Green)
        this.lights.rimLight = new THREE.DirectionalLight(this.neonColors.toxicGreen, 1);
        this.lights.rimLight.position.set(-2, -1, -4);
        this.scene.add(this.lights.rimLight);
        
        // Ambient light for subtle base illumination
        this.lights.ambient = new THREE.AmbientLight(0x0a0a0a, 0.3);
        this.scene.add(this.lights.ambient);
    }
    
    createStarField() {
        const starCount = 1500;
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);
        
        for (let i = 0; i < starCount; i++) {
            const i3 = i * 3;
            
            // Distribute in large sphere
            const radius = 80 + Math.random() * 120;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);
            
            // Subtle neon colors
            const colorChoice = Math.random();
            if (colorChoice < 0.4) {
                colors[i3] = 0.0; colors[i3 + 1] = 1.0; colors[i3 + 2] = 1.0; // Electric Blue
            } else if (colorChoice < 0.7) {
                colors[i3] = 1.0; colors[i3 + 1] = 0.0; colors[i3 + 2] = 0.33; // Scorched Pink
            } else if (colorChoice < 0.9) {
                colors[i3] = 0.0; colors[i3 + 1] = 1.0; colors[i3 + 2] = 0.4; // Toxic Green
            } else {
                colors[i3] = 1.0; colors[i3 + 1] = 0.4; colors[i3 + 2] = 0.0; // Ultraviolet Orange
            }
            
            sizes[i] = Math.random() * 3 + 0.5;
        }
        
        const starGeometry = new THREE.BufferGeometry();
        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const starMaterial = new THREE.PointsMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending
        });
        
        this.starField = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(this.starField);
    }
    
    createNarratorOrb() {
        const sphereGeometry = new THREE.SphereGeometry(1.8, 128, 64);
        
        // Load shaders from HTML script tags
        const vertexShader = document.getElementById('vertexshader').textContent;
        const fragmentShader = document.getElementById('fragmentshader').textContent;
        
        // Advanced refractive glass material with enhanced shader
        const orbMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                amplitude: { value: 0 },
                subBass: { value: 0 },
                bass: { value: 0 },
                lowMid: { value: 0 },
                mid: { value: 0 },
                highMid: { value: 0 },
                presence: { value: 0 },
                brilliance: { value: 0 },
                reactivity: { value: this.speechReactivity.intensity },
                electricBlue: { value: this.neonColors.electricBlue },
                scorchedPink: { value: this.neonColors.scorchedPink },
                ultravioletOrange: { value: this.neonColors.ultravioletOrange },
                toxicGreen: { value: this.neonColors.toxicGreen }
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });
        
        this.narratorOrb = new THREE.Mesh(sphereGeometry, orbMaterial);
        this.scene.add(this.narratorOrb);
    }
    
    createReflectionSystem() {
        // Create subtle reflection plane
        const planeGeometry = new THREE.PlaneGeometry(15, 15);
        const planeMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.1
        });
        
        this.reflectionPlane = new THREE.Mesh(planeGeometry, planeMaterial);
        this.reflectionPlane.rotation.x = -Math.PI / 2;
        this.reflectionPlane.position.y = -2.5;
        this.scene.add(this.reflectionPlane);
        
        // Create reflected orb
        this.reflectedOrb = this.narratorOrb.clone();
        this.reflectedOrb.scale.y = -1;
        this.reflectedOrb.position.y = -5;
        this.reflectedOrb.material = this.reflectedOrb.material.clone();
        
        // Make reflection more subtle
        this.reflectedOrb.material.transparent = true;
        
        // Modify reflection shader for fadeout
        this.reflectedOrb.material.fragmentShader = this.reflectedOrb.material.fragmentShader.replace(
            'gl_FragColor = vec4(result, alpha);',
            `
            // Fade reflection based on distance from center
            float distanceFromCenter = length(vWorldPosition.xz) / 8.0;
            float reflectionFade = 1.0 - clamp(distanceFromCenter, 0.0, 1.0);
            
            alpha *= 0.4 * reflectionFade;
            gl_FragColor = vec4(result * 0.7, alpha);
            `
        );
        
        this.reflectedOrb.material.needsUpdate = true;
        this.scene.add(this.reflectedOrb);
    }
    
    setupEventListeners() {
        // File input
        document.getElementById('audioFile').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.loadAudioFile(file);
        });
        
        // Controls
        document.getElementById('playBtn').addEventListener('click', () => this.playAudio());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pauseAudio());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportVideo());
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') { e.preventDefault(); this.togglePlayPause(); }
            if (e.code === 'KeyE') { e.preventDefault(); this.exportVideo(); }
        });
        
        // Drag & drop
        const container = document.getElementById('container');
        container.addEventListener('dragover', (e) => { e.preventDefault(); });
        container.addEventListener('drop', (e) => {
            e.preventDefault();
            const files = e.dataTransfer.files;
            if (files.length > 0) this.loadAudioFile(files[0]);
        });
        
        // Window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    async loadAudioFile(file) {
        this.showLoading(true);
        
        try {
            console.log('Loading audiobook:', file.name);
            
            this.audioElement = new Audio();
            this.audioElement.crossOrigin = 'anonymous';
            
            const url = URL.createObjectURL(file);
            this.audioElement.src = url;
            
            await new Promise((resolve, reject) => {
                this.audioElement.addEventListener('loadeddata', resolve);
                this.audioElement.addEventListener('error', reject);
                this.audioElement.load();
            });
            
            // Setup enhanced audio analysis for speech
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            if (this.source) this.source.disconnect();
            
            this.source = this.audioContext.createMediaElementSource(this.audioElement);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 8192; // High resolution for speech analysis
            this.analyser.smoothingTimeConstant = 0.7; // Responsive to speech dynamics
            
            this.source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            
            // Update UI
            document.getElementById('audioTitle').textContent = file.name;
            document.getElementById('audioInfo').style.display = 'block';
            document.getElementById('playBtn').disabled = false;
            document.getElementById('pauseBtn').disabled = false;
            document.getElementById('exportBtn').disabled = false;
            
            console.log('✅ Audiobook loaded and ready for enhanced narration!');
            
        } catch (error) {
            console.error('Error loading audiobook:', error);
            alert('Error loading audiobook. Please try MP3, WAV, or MP4 format.');
        } finally {
            this.showLoading(false);
        }
    }
    
    playAudio() {
        if (this.audioElement && this.audioContext) {
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            this.audioElement.play();
            this.isPlaying = true;
        }
    }
    
    pauseAudio() {
        if (this.audioElement) {
            this.audioElement.pause();
            this.isPlaying = false;
        }
    }
    
    togglePlayPause() {
        if (this.isPlaying) this.pauseAudio();
        else this.playAudio();
    }
    
    async exportVideo() {
        if (!this.audioElement) {
            alert('Please load an audiobook file first');
            return;
        }
        
        const exportBtn = document.getElementById('exportBtn');
        exportBtn.disabled = true;
        exportBtn.textContent = 'Recording...';
        
        try {
            this.audioElement.currentTime = 0;
            const duration = this.audioElement.duration;
            
            // Ultra high-quality recording for cinematic output
            const canvasStream = this.renderer.domElement.captureStream(60);
            const audioDestination = this.audioContext.createMediaStreamDestination();
            this.source.connect(audioDestination);
            
            const combinedStream = new MediaStream([
                ...canvasStream.getVideoTracks(),
                ...audioDestination.stream.getAudioTracks()
            ]);
            
            this.mediaRecorder = new MediaRecorder(combinedStream, {
                mimeType: 'video/webm;codecs=vp9,opus',
                videoBitsPerSecond: 15000000, // 15 Mbps for cinema quality
                audioBitsPerSecond: 320000    // 320 kbps for audiobook quality
            });
            
            this.recordedChunks = [];
            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) this.recordedChunks.push(e.data);
            };
            
            this.mediaRecorder.onstop = () => this.downloadVideo();
            
            this.mediaRecorder.start(100);
            this.playAudio();
            
            setTimeout(() => {
                this.mediaRecorder.stop();
                exportBtn.disabled = false;
                exportBtn.textContent = 'EXPORT';
            }, (duration + 1) * 1000);
            
            alert(`🎬 Recording ${duration.toFixed(1)}s of enhanced narrator orb!\nCinema-quality export will download automatically.`);
            
        } catch (error) {
            console.error('Export error:', error);
            alert('Export failed: ' + error.message);
            exportBtn.disabled = false;
            exportBtn.textContent = 'EXPORT';
        }
    }
    
    downloadVideo() {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const timestamp = new Date().toISOString().slice(0,19).replace(/[:.]/g, '-');
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `audiobook-narrator-orb-enhanced-${timestamp}.webm`;
        a.click();
        
        URL.revokeObjectURL(url);
        console.log('✅ Enhanced narrator orb exported!');
    }
    
    updateAudioAnalysis() {
        if (!this.analyser || !this.isPlaying) return;
        
        this.analyser.getByteFrequencyData(this.dataArray);
        
        // Enhanced amplitude calculation with speech focus
        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            sum += this.dataArray[i];
        }
        const rawAmplitude = sum / this.dataArray.length / 255;
        
        // More responsive smoothing for speech dynamics
        this.amplitude += (rawAmplitude - this.amplitude) * this.speechReactivity.responsiveness;
        this.smoothedAmplitude += (this.amplitude - this.smoothedAmplitude) * this.speechReactivity.smoothing;
        
        // Enhanced frequency analysis for speech characteristics
        const nyquist = this.audioContext.sampleRate / 2;
        const binSize = nyquist / this.dataArray.length;
        
        const speechBands = {
            subBass: [20, 60],
            bass: [60, 250],
            lowMid: [250, 500],   // Fundamental voice frequencies
            mid: [500, 2000],     // Vowel formants
            highMid: [2000, 4000], // Consonant clarity
            presence: [4000, 6000], // Speech presence
            brilliance: [6000, 20000] // Sibilance and air
        };
        
        Object.keys(speechBands).forEach(band => {
            const [minFreq, maxFreq] = speechBands[band];
            const startBin = Math.floor(minFreq / binSize);
            const endBin = Math.floor(maxFreq / binSize);
            
            let bandSum = 0;
            for (let i = startBin; i < endBin; i++) {
                bandSum += this.dataArray[i];
            }
            
            const rawValue = bandSum / (endBin - startBin) / 255;
            
            // Enhanced smoothing with speech-specific responsiveness
            const responsiveness = band === 'mid' || band === 'highMid' ? 0.3 : 0.2;
            this.voiceFrequencies[band] += (rawValue - this.voiceFrequencies[band]) * responsiveness;
        });
    }
    
    updateVisuals() {
        const time = this.clock.getElapsedTime();
        
        // Update narrator orb with enhanced speech reactivity
        if (this.narratorOrb && this.narratorOrb.material.uniforms) {
            const uniforms = this.narratorOrb.material.uniforms;
            uniforms.time.value = time;
            uniforms.amplitude.value = this.smoothedAmplitude;
            uniforms.subBass.value = this.voiceFrequencies.subBass;
            uniforms.bass.value = this.voiceFrequencies.bass;
            uniforms.lowMid.value = this.voiceFrequencies.lowMid;
            uniforms.mid.value = this.voiceFrequencies.mid;
            uniforms.highMid.value = this.voiceFrequencies.highMid;
            uniforms.presence.value = this.voiceFrequencies.presence;
            uniforms.brilliance.value = this.voiceFrequencies.brilliance;
        }
        
        // Update HUD shader with real-time audio data
        if (this.hudPass && this.hudPass.uniforms) {
            this.hudPass.uniforms.u_time.value = time;
            this.hudPass.uniforms.u_amplitude.value = this.smoothedAmplitude;
            this.hudPass.uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
            
            // Convert dataArray to normalized float array for HUD
            if (this.dataArray) {
                const audioBands = new Array(64);
                for (let i = 0; i < 64; i++) {
                    const index = Math.floor((i / 64) * this.dataArray.length);
                    audioBands[i] = this.dataArray[index] / 255.0;
                }
                this.hudPass.uniforms.u_audioBands.value = audioBands;
            }
        }
        
        // Update reflected orb
        if (this.reflectedOrb && this.reflectedOrb.material.uniforms) {
            Object.assign(this.reflectedOrb.material.uniforms, this.narratorOrb.material.uniforms);
        }
        
        // Dynamic lighting based on speech
        const speechActivity = (this.voiceFrequencies.mid + this.voiceFrequencies.highMid + this.voiceFrequencies.presence) / 3;
        
        this.lights.keyLight.intensity = 2 + speechActivity * 1.5;
        this.lights.fillLight.intensity = 1.5 + this.voiceFrequencies.bass * 0.8;
        this.lights.rimLight.intensity = 1 + this.voiceFrequencies.brilliance * 1.2;
        
        // Subtle rotation enhanced by speech activity
        const rotationSpeed = 0.003 * (1 + speechActivity * 0.7);
        this.narratorOrb.rotation.y += rotationSpeed;
        this.narratorOrb.rotation.x += rotationSpeed * 0.4;
        
        if (this.reflectedOrb) {
            this.reflectedOrb.rotation.y += rotationSpeed;
            this.reflectedOrb.rotation.x += rotationSpeed * 0.4;
        }
        
        // Gentle starfield animation
        if (this.starField) {
            this.starField.rotation.y += 0.0002;
            this.starField.material.opacity = 0.6 + speechActivity * 0.2;
        }
    }
    
    updateCamera() {
        const time = this.clock.getElapsedTime();
        
        // Cinematic camera movement with speech responsiveness
        const speechIntensity = (this.voiceFrequencies.mid + this.voiceFrequencies.presence) / 2;
        const radius = 8 + Math.sin(time * 0.08) * 1.5 + speechIntensity * 0.5;
        const speed = 0.02 + speechIntensity * 0.01;
        
        this.camera.position.x = Math.sin(time * speed) * radius;
        this.camera.position.z = Math.cos(time * speed) * radius;
        this.camera.position.y = 1 + Math.sin(time * 0.03) * 0.8 + speechIntensity * 0.3;
        
        this.camera.lookAt(0, 0, 0);
    }
    
    updateTimeDisplay() {
        if (this.audioElement) {
            const current = this.audioElement.currentTime || 0;
            const duration = this.audioElement.duration || 0;
            
            const formatTime = (time) => {
                const mins = Math.floor(time / 60);
                const secs = Math.floor(time % 60);
                return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            };
            
            document.getElementById('audioTime').textContent = `${formatTime(current)} / ${formatTime(duration)}`;
        }
    }
    
    showLoading(show) {
        document.getElementById('loading').style.display = show ? 'block' : 'none';
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Update composer size for post-processing
        if (this.composer && this.usePostProcessing) {
            this.composer.setSize(window.innerWidth, window.innerHeight);
            
            // Update HUD shader resolution
            if (this.hudPass && this.hudPass.uniforms) {
                this.hudPass.uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
            }
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.updateAudioAnalysis();
        this.updateVisuals();
        this.updateCamera();
        this.updateTimeDisplay();
        
        // Render with post-processing bloom effect if available, otherwise fallback
        if (this.usePostProcessing && this.composer) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }
}

// Initialize the enhanced audiobook narrator orb
document.addEventListener('DOMContentLoaded', () => {
    new AudiobookNarratorOrb();
});
