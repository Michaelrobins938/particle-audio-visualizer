import * as THREE from 'https://unpkg.com/three@0.150.1/build/three.module.js';
import { NarratorOrb } from './NarratorOrb.js';

console.log("Main.js loaded successfully");

class AudiobookNarratorVisualizer {
    constructor() {
        console.log("Initializing visualizer...");
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.audioContext = null;
        this.audioSource = null;
        this.analyser = null;
        this.gainNode = null;
        this.narratorOrb = null;
        this.starfield = null;
        this.reflectionGroup = null;
        this.reflectionCore = null;
        this.reflectionTendrils = null;
        this.animationId = null;
        this.isPlaying = false;
        this.currentAudio = null;
        this.lastTime = 0;
        this.audioLoaded = false;
        
        // UI state
        this.uiCollapsed = false;
        this.autoHideTimeout = null;
        this.isMouseOverUI = false;
        
        // Settings
        this.settings = {
            gain: 1.0,
            particles: 50000,
            intensity: 1.0,
            volume: 0.5,
            autoHideUI: true,
            autoHideDelay: 3000 // 3 seconds
        };
        
        this.init();
    }
    
    async init() {
        try {
            console.log("Starting initialization...");
            this.setupScene();
            this.setupAudio();
            this.setupUI();
            this.setupControls();
            this.setupEventListeners();
            this.loadPresets();
            this.loadUIState();
            console.log("Initialization complete");
        } catch (error) {
            console.error('Initialization failed:', error);
            // Show error to user
            this.showUploadStatus('Failed to initialize application: ' + error.message, true);
        }
    }
    
    setupUI() {
        // Create collapse toggle button if it doesn't exist
        this.createCollapseToggle();
        
        // Setup auto-hide functionality
        this.setupAutoHide();
        
        // Setup UI hover detection
        this.setupUIHoverDetection();
    }
    
    createCollapseToggle() {
        // Check if toggle button already exists
        let toggleBtn = document.getElementById('uiToggle');
        if (!toggleBtn) {
            toggleBtn = document.createElement('button');
            toggleBtn.id = 'uiToggle';
            toggleBtn.className = 'ui-toggle';
            toggleBtn.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 12h18m-9-9l9 9-9 9"/>
                </svg>
            `;
            toggleBtn.title = 'Toggle UI (T key)';
            document.body.appendChild(toggleBtn);
        }
        
        // Add styles for the toggle button
        this.addToggleStyles();
        
        toggleBtn.addEventListener('click', () => {
            this.toggleUI();
        });
    }
    
    addToggleStyles() {
        // Check if styles already exist
        if (document.getElementById('uiToggleStyles')) return;
        
        const style = document.createElement('style');
        style.id = 'uiToggleStyles';
        style.textContent = `
            .ui-toggle {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                background: rgba(0, 0, 0, 0.7);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                color: white;
                padding: 12px;
                cursor: pointer;
                transition: all 0.3s ease;
                backdrop-filter: blur(10px);
            }
            
            .ui-toggle:hover {
                background: rgba(0, 0, 0, 0.9);
                border-color: rgba(255, 255, 255, 0.4);
                transform: scale(1.05);
            }
            
            .ui-toggle svg {
                display: block;
                transition: transform 0.3s ease;
            }
            
            .ui-collapsed .ui-toggle svg {
                transform: rotate(180deg);
            }
            
            .ui-panel {
                transition: all 0.3s ease;
                transform: translateX(0);
                opacity: 1;
            }
            
            .ui-collapsed .ui-panel {
                transform: translateX(100%);
                opacity: 0;
                pointer-events: none;
            }
            
            .ui-collapsed .ui-panel.left-panel {
                transform: translateX(-100%);
            }
            
            .auto-hide .ui-panel {
                opacity: 0.1;
                transition: opacity 0.3s ease;
            }
            
            .auto-hide .ui-panel:hover,
            .auto-hide.ui-hover .ui-panel {
                opacity: 1;
            }
            
            .auto-hide .ui-toggle {
                opacity: 0.3;
            }
            
            .auto-hide .ui-toggle:hover {
                opacity: 1;
            }
            
            /* Minimize button for individual panels */
            .panel-minimize {
                position: absolute;
                top: 8px;
                right: 8px;
                background: rgba(255, 255, 255, 0.1);
                border: none;
                border-radius: 4px;
                color: white;
                padding: 4px 8px;
                cursor: pointer;
                font-size: 12px;
                opacity: 0.7;
                transition: opacity 0.2s ease;
            }
            
            .panel-minimize:hover {
                opacity: 1;
                background: rgba(255, 255, 255, 0.2);
            }
            
            .panel-minimized {
                height: 40px !important;
                overflow: hidden;
            }
            
            .panel-minimized .panel-content {
                display: none;
            }
            
            .panel-minimized .panel-minimize {
                right: auto;
                left: 8px;
            }
        `;
        document.head.appendChild(style);
    }
    
    setupAutoHide() {
        const autoHideCheckbox = document.getElementById('autoHideUI');
        if (!autoHideCheckbox) {
            // Create auto-hide toggle if it doesn't exist
            const settingsPanel = document.querySelector('.settings-panel, #settingsPanel, .ui-panel');
            if (settingsPanel) {
                const autoHideContainer = document.createElement('div');
                autoHideContainer.className = 'setting-row';
                autoHideContainer.innerHTML = `
                    <label>
                        <input type="checkbox" id="autoHideUI" ${this.settings.autoHideUI ? 'checked' : ''}>
                        Auto-hide UI
                    </label>
                `;
                settingsPanel.appendChild(autoHideContainer);
            }
        }
        
        const autoHideToggle = document.getElementById('autoHideUI');
        if (autoHideToggle) {
            autoHideToggle.addEventListener('change', (e) => {
                this.settings.autoHideUI = e.target.checked;
                this.updateAutoHide();
                this.saveUIState();
            });
        }
        
        this.updateAutoHide();
    }
    
    setupUIHoverDetection() {
        // Detect when mouse is over UI elements
        const uiPanels = document.querySelectorAll('.ui-panel, .control-panel, .settings-panel');
        
        uiPanels.forEach(panel => {
            panel.addEventListener('mouseenter', () => {
                this.isMouseOverUI = true;
                document.body.classList.add('ui-hover');
                this.clearAutoHideTimeout();
            });
            
            panel.addEventListener('mouseleave', () => {
                this.isMouseOverUI = false;
                document.body.classList.remove('ui-hover');
                if (this.settings.autoHideUI) {
                    this.startAutoHideTimeout();
                }
            });
        });
        
        // Also handle the main canvas
        if (this.renderer && this.renderer.domElement) {
            this.renderer.domElement.addEventListener('mousemove', () => {
                if (!this.isMouseOverUI && this.settings.autoHideUI) {
                    this.showUITemporarily();
                }
            });
        }
    }
    
    updateAutoHide() {
        if (this.settings.autoHideUI) {
            document.body.classList.add('auto-hide');
            this.startAutoHideTimeout();
        } else {
            document.body.classList.remove('auto-hide');
            this.clearAutoHideTimeout();
        }
    }
    
    startAutoHideTimeout() {
        this.clearAutoHideTimeout();
        if (this.settings.autoHideUI && !this.isMouseOverUI) {
            this.autoHideTimeout = setTimeout(() => {
                document.body.classList.add('ui-auto-hidden');
            }, this.settings.autoHideDelay);
        }
    }
    
    clearAutoHideTimeout() {
        if (this.autoHideTimeout) {
            clearTimeout(this.autoHideTimeout);
            this.autoHideTimeout = null;
        }
        document.body.classList.remove('ui-auto-hidden');
    }
    
    showUITemporarily() {
        this.clearAutoHideTimeout();
        if (this.settings.autoHideUI) {
            this.startAutoHideTimeout();
        }
    }
    
    toggleUI() {
        this.uiCollapsed = !this.uiCollapsed;
        
        if (this.uiCollapsed) {
            document.body.classList.add('ui-collapsed');
        } else {
            document.body.classList.remove('ui-collapsed');
        }
        
        this.saveUIState();
        
        // Clear auto-hide when manually toggling
        this.clearAutoHideTimeout();
        
        console.log('UI toggled:', this.uiCollapsed ? 'collapsed' : 'expanded');
    }
    
    addPanelMinimizeButtons() {
        // Add minimize buttons to individual panels
        const panels = document.querySelectorAll('.ui-panel, .control-panel, .settings-panel');
        
        panels.forEach(panel => {
            if (!panel.querySelector('.panel-minimize')) {
                const minimizeBtn = document.createElement('button');
                minimizeBtn.className = 'panel-minimize';
                minimizeBtn.textContent = '−';
                minimizeBtn.title = 'Minimize panel';
                
                minimizeBtn.addEventListener('click', () => {
                    panel.classList.toggle('panel-minimized');
                    minimizeBtn.textContent = panel.classList.contains('panel-minimized') ? '+' : '−';
                    minimizeBtn.title = panel.classList.contains('panel-minimized') ? 'Expand panel' : 'Minimize panel';
                });
                
                panel.style.position = 'relative';
                panel.appendChild(minimizeBtn);
            }
        });
    }
    
    saveUIState() {
        const uiState = {
            collapsed: this.uiCollapsed,
            autoHide: this.settings.autoHideUI,
            autoHideDelay: this.settings.autoHideDelay
        };
        localStorage.setItem('narratorOrbUIState', JSON.stringify(uiState));
    }
    
    loadUIState() {
        const saved = localStorage.getItem('narratorOrbUIState');
        if (saved) {
            try {
                const uiState = JSON.parse(saved);
                this.uiCollapsed = uiState.collapsed || false;
                this.settings.autoHideUI = uiState.autoHide !== undefined ? uiState.autoHide : true;
                this.settings.autoHideDelay = uiState.autoHideDelay || 3000;
                
                if (this.uiCollapsed) {
                    document.body.classList.add('ui-collapsed');
                }
                
                // Update auto-hide checkbox if it exists
                const autoHideCheckbox = document.getElementById('autoHideUI');
                if (autoHideCheckbox) {
                    autoHideCheckbox.checked = this.settings.autoHideUI;
                }
                
                this.updateAutoHide();
            } catch (error) {
                console.error('Failed to load UI state:', error);
            }
        }
    }
    
    setupScene() {
        this.scene = new THREE.Scene();
        
        // Create starfield background
        this.createStarfield();
        
        // Move camera much closer for dramatic effect like the example
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 0, 2.5); // Much closer - was 5, now 2.5
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        document.body.appendChild(this.renderer.domElement);
        
        // Add ambient lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);
        
        console.log("Scene setup complete");
    }
    
    createStarfield() {
        const starGeometry = new THREE.BufferGeometry();
        const starPositions = [];
        const starSizes = [];
        
        // Create more scattered stars further back for depth
        for (let i = 0; i < 800; i++) {
            const x = (Math.random() - 0.5) * 200; // Spread stars further
            const y = (Math.random() - 0.5) * 200;
            const z = (Math.random() - 0.5) * 200 - 50; // Push stars further back
            
            starPositions.push(x, y, z);
            starSizes.push(Math.random() * 2 + 0.5);
        }
        
        starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
        starGeometry.setAttribute('size', new THREE.Float32BufferAttribute(starSizes, 1));
        
        const starMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 }
            },
            vertexShader: `
                attribute float size;
                varying float vSize;
                uniform float time;
                
                void main() {
                    vSize = size;
                    vec3 pos = position;
                    
                    pos.x += sin(time + position.y) * 0.01;
                    pos.y += cos(time + position.x) * 0.01;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = size * (1.0 + sin(time * 2.0 + position.x) * 0.2);
                }
            `,
            fragmentShader: `
                varying float vSize;
                uniform float time;
                
                void main() {
                    vec2 center = gl_PointCoord - vec2(0.5);
                    float dist = length(center);
                    
                    if (dist > 0.5) discard;
                    
                    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
                    alpha *= (0.8 + 0.2 * sin(time * 3.0 + vSize));
                    
                    gl_FragColor = vec4(1.0, 1.0, 1.0, alpha * 0.6); // Dimmer stars
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending
        });
        
        this.starfield = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(this.starfield);
        
        this.scene.background = new THREE.Color(0x0a0a0a); // Slightly darker background
    }
    
    setupAudio() {
        console.log("Audio setup ready");
    }
    
    async initializeAudio() {
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.analyser = this.audioContext.createAnalyser();
                this.analyser.fftSize = 512;
                this.analyser.smoothingTimeConstant = 0.75;
                
                this.gainNode = this.audioContext.createGain();
                this.gainNode.gain.value = this.settings.gain;
                this.gainNode.connect(this.audioContext.destination);
                this.analyser.connect(this.gainNode);
                
                console.log("Audio context initialized");
                return true;
            } catch (error) {
                console.error("Failed to initialize audio context:", error);
                return false;
            }
        }
        return true;
    }
    
    initializeNarratorOrb() {
        console.log("Initializing NarratorOrb...");
        
        // Check if Three.js is available
        if (typeof THREE === 'undefined') {
            console.error("THREE.js is not loaded!");
            return;
        }
        
        // Check if scene is ready
        if (!this.scene || !this.camera || !this.renderer) {
            console.error("Scene not ready for NarratorOrb initialization");
            return;
        }
        
        if (this.narratorOrb) {
            console.log("Destroying existing NarratorOrb...");
            this.narratorOrb.destroy();
        }
        
        if (this.reflectionGroup) {
            console.log("Removing reflection group...");
            this.scene.remove(this.reflectionGroup);
        }
        
        // Larger orb configuration for closer viewing
        const orbConfig = {
            coreParticleCount: Math.floor(this.settings.particles * 0.6),
            tendrilParticleCount: Math.floor(this.settings.particles * 0.4),
            coreRadius: 1.8, // Larger core - was 1.0
            tendrilRadius: 3.5, // Keep tendrils proportional
            baseHue: 200
        };
        
        console.log("Creating NarratorOrb with config:", orbConfig);
        console.log("Analyser available:", !!this.analyser);
        
        try {
            this.narratorOrb = new NarratorOrb(
                this.scene,
                this.camera,
                this.renderer,
                this.analyser,
                orbConfig
            );
            console.log("NarratorOrb created successfully:", this.narratorOrb);
            
            // Center the orb perfectly in view like the example
            if (this.narratorOrb.orbGroup) {
                this.narratorOrb.orbGroup.position.set(0, 0, 0); // Centered - was (0, 1, 0)
                this.narratorOrb.orbGroup.scale.setScalar(1.4); // Scale up for more presence
            }
            
            this.createOrbReflection();
            
        } catch (error) {
            console.error("Error creating NarratorOrb:", error);
            throw error; // Re-throw to be caught by caller
        }
        
        console.log("NarratorOrb initialized with analyser:", !!this.analyser);
    }
    
    createOrbReflection() {
        this.reflectionGroup = new THREE.Group();
        
        if (this.narratorOrb.nebulaCore) {
            const reflectionCoreGeometry = this.narratorOrb.nebulaCore.geometry.clone();
            const reflectionCoreMaterial = this.narratorOrb.nebulaMaterial.clone();
            
            reflectionCoreMaterial.uniforms.intensity.value = 0.2; // Dimmer reflection
            
            this.reflectionCore = new THREE.Points(reflectionCoreGeometry, reflectionCoreMaterial);
            this.reflectionGroup.add(this.reflectionCore);
        }
        
        if (this.narratorOrb.nebulaTendrils) {
            const reflectionTendrilGeometry = this.narratorOrb.nebulaTendrils.geometry.clone();
            const reflectionTendrilMaterial = this.narratorOrb.tendrilMaterial.clone();
            
            reflectionTendrilMaterial.uniforms.intensity.value = 0.15; // Dimmer reflection
            
            this.reflectionTendrils = new THREE.Points(reflectionTendrilGeometry, reflectionTendrilMaterial);
            this.reflectionGroup.add(this.reflectionTendrils);
        }
        
        // Position reflection further down and make it smaller
        this.reflectionGroup.position.set(0, -4, 0); // Further down
        this.reflectionGroup.scale.y = -1; // Flip vertically
        this.reflectionGroup.scale.setScalar(0.4); // Smaller reflection
        
        this.scene.add(this.reflectionGroup);
    }
    
    setupControls() {
        // Don't initialize NarratorOrb here - it will be called after scene is ready
        
        // File upload with drag & drop
        const fileInput = document.getElementById('audioFile');
        const fileUpload = document.getElementById('fileUpload');
        
        if (fileInput && fileUpload) {
            // Click to upload
            fileUpload.addEventListener('click', (e) => {
                if (e.target !== fileInput) {
                    console.log("File upload clicked, opening file dialog...");
                    fileInput.click();
                }
            });
            
            // File selection
            fileInput.addEventListener('change', (e) => {
                console.log("File input changed, files:", e.target.files.length);
                if (e.target.files.length > 0) {
                    const file = e.target.files[0];
                    console.log("Selected file:", file.name, "Type:", file.type, "Size:", file.size);
                    this.loadAudioFile(file);
                }
            });
            
            // Drag & drop functionality
            fileUpload.addEventListener('dragover', (e) => {
                e.preventDefault();
                fileUpload.classList.add('dragover');
            });
            
            fileUpload.addEventListener('dragleave', (e) => {
                e.preventDefault();
                fileUpload.classList.remove('dragover');
            });
            
            fileUpload.addEventListener('drop', (e) => {
                e.preventDefault();
                fileUpload.classList.remove('dragover');
                
                const files = e.dataTransfer.files;
                console.log("Files dropped:", files.length);
                if (files.length > 0) {
                    const file = files[0];
                    console.log("Dropped file:", file.name, "Type:", file.type);
                    if (file.type.startsWith('audio/') || file.name.toLowerCase().endsWith('.mp3') || 
                        file.name.toLowerCase().endsWith('.wav') || file.name.toLowerCase().endsWith('.ogg')) {
                        this.loadAudioFile(file);
                    } else {
                        this.showUploadStatus('✗ Please select an audio file (MP3, WAV, OGG)', true);
                    }
                }
            });
        }
        
        // Demo audio button - disable it since user wants file upload
        const loadDefaultBtn = document.getElementById('loadDefaultBtn');
        if (loadDefaultBtn) {
            loadDefaultBtn.addEventListener('click', () => {
                this.showUploadStatus('Please upload your own audio file instead', true);
            });
        }
        
        // Playback controls
        const playBtn = document.getElementById('playBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const stopBtn = document.getElementById('stopBtn');
        
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                console.log("Play button clicked, audio loaded:", this.audioLoaded);
                this.play();
            });
        }
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                console.log("Pause button clicked");
                this.pause();
            });
        }
        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                console.log("Stop button clicked");
                this.stop();
            });
        }
        
        // Progress bar
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.addEventListener('click', (e) => {
                if (this.currentAudio && this.audioLoaded) {
                    const rect = progressBar.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const percentage = x / rect.width;
                    this.currentAudio.currentTime = percentage * this.currentAudio.duration;
                    this.updateProgress();
                }
            });
        }
        
        // Volume control
        this.setupSlider('volumeSlider', 'volumeValue', (value) => {
            this.settings.volume = parseFloat(value);
            if (this.currentAudio) {
                this.currentAudio.volume = this.settings.volume;
            }
            const volumeValue = document.getElementById('volumeValue');
            if (volumeValue) volumeValue.textContent = Math.round(this.settings.volume * 100) + '%';
        });
        
        // Settings sliders
        this.setupSlider('gainSlider', 'gainValue', (value) => {
            this.settings.gain = parseFloat(value);
            if (this.gainNode) {
                this.gainNode.gain.value = this.settings.gain;
            }
            const gainValue = document.getElementById('gainValue');
            if (gainValue) gainValue.textContent = this.settings.gain.toFixed(1) + 'x';
        });
        
        this.setupSlider('particleSlider', 'particleValue', (value) => {
            this.settings.particles = parseInt(value);
            const particleValue = document.getElementById('particleValue');
            if (particleValue) particleValue.textContent = this.settings.particles.toLocaleString();
        });
        
        this.setupSlider('intensitySlider', 'intensityValue', (value) => {
            this.settings.intensity = parseFloat(value);
            const intensityValue = document.getElementById('intensityValue');
            if (intensityValue) intensityValue.textContent = this.settings.intensity.toFixed(1) + 'x';
            
            if (this.narratorOrb) {
                this.narratorOrb.setIntensity(this.settings.intensity);
            }
        });
        
        this.setupPresetControls();
        
        // Add minimize buttons to panels
        this.addPanelMinimizeButtons();
        
        // Initialize NarratorOrb after everything is set up
        try {
            this.initializeNarratorOrb();
            console.log("NarratorOrb initialized successfully");
        } catch (error) {
            console.error("Failed to initialize NarratorOrb:", error);
        }
        
        // Start animation loop
        this.animate();
        console.log("Controls setup complete");
    }
    
    setupSlider(sliderId, valueId, callback) {
        const slider = document.getElementById(sliderId);
        if (slider) {
            slider.addEventListener('input', (e) => {
                callback(e.target.value);
            });
            callback(slider.value);
        }
    }
    
    showUploadStatus(message, isError = false) {
        const uploadStatus = document.getElementById('uploadStatus');
        if (uploadStatus) {
            uploadStatus.textContent = message;
            uploadStatus.className = 'upload-status ' + (isError ? 'error' : 'success');
            uploadStatus.style.display = 'block';
            
            if (!isError) {
                setTimeout(() => {
                    uploadStatus.style.display = 'none';
                }, 5000);
            }
        }
        console.log("Upload status:", message, "Error:", isError);
    }
    
    async loadAudioFile(file) {
        try {
            console.log("Starting to load audio file:", file.name, "Size:", file.size, "Type:", file.type);
            
            // Show loading state
            const fileUpload = document.getElementById('fileUpload');
            if (fileUpload) fileUpload.classList.add('loading');
            
            this.showLoading(true);
            this.showUploadStatus("Loading audio file...");
            
            // Validate file
            const isAudioFile = file.type.startsWith('audio/') || 
                               file.name.toLowerCase().endsWith('.mp3') || 
                               file.name.toLowerCase().endsWith('.wav') || 
                               file.name.toLowerCase().endsWith('.ogg') ||
                               file.name.toLowerCase().endsWith('.m4a') ||
                               file.name.toLowerCase().endsWith('.aac');
            
            if (!isAudioFile) {
                throw new Error('Please select an audio file (MP3, WAV, OGG, M4A, AAC)');
            }
            
            // Initialize audio context
            const audioInitialized = await this.initializeAudio();
            if (!audioInitialized) {
                throw new Error('Failed to initialize audio system');
            }
            
            // Resume audio context if suspended
            if (this.audioContext.state === 'suspended') {
                console.log("Resuming suspended audio context...");
                await this.audioContext.resume();
            }
            
            // Clean up previous audio
            if (this.currentAudio) {
                console.log("Cleaning up previous audio...");
                this.currentAudio.pause();
                if (this.currentAudio.src && this.currentAudio.src.startsWith('blob:')) {
                    URL.revokeObjectURL(this.currentAudio.src);
                }
            }
            
            if (this.audioSource) {
                console.log("Disconnecting previous audio source...");
                this.audioSource.disconnect();
                this.audioSource = null;
            }
            
            // Create new audio element
            console.log("Creating new audio element...");
            this.currentAudio = new Audio();
            this.currentAudio.preload = 'auto';
            this.currentAudio.volume = this.settings.volume;
            
            // Create object URL for the file
            const audioURL = URL.createObjectURL(file);
            this.currentAudio.src = audioURL;
            
            console.log("Audio URL created:", audioURL);
            
            // Wait for audio to load
            await new Promise((resolve, reject) => {
                let timeoutId;
                
                const cleanup = () => {
                    if (timeoutId) clearTimeout(timeoutId);
                    this.currentAudio.removeEventListener('loadedmetadata', onLoaded);
                    this.currentAudio.removeEventListener('canplaythrough', onLoaded);
                    this.currentAudio.removeEventListener('error', onError);
                };
                
                const onLoaded = () => {
                    console.log("Audio metadata loaded successfully");
                    console.log("Duration:", this.currentAudio.duration);
                    console.log("Ready state:", this.currentAudio.readyState);
                    cleanup();
                    resolve();
                };
                
                const onError = (e) => {
                    console.error("Audio loading error:", e);
                    console.error("Audio error code:", this.currentAudio.error?.code);
                    console.error("Audio error message:", this.currentAudio.error?.message);
                    cleanup();
                    reject(new Error(`Failed to load audio: ${this.currentAudio.error?.message || 'Unknown error'}`));
                };
                
                this.currentAudio.addEventListener('loadedmetadata', onLoaded);
                this.currentAudio.addEventListener('canplaythrough', onLoaded);
                this.currentAudio.addEventListener('error', onError);
                
                // Set timeout
                timeoutId = setTimeout(() => {
                    cleanup();
                    reject(new Error('Audio loading timeout - file may be corrupted or unsupported'));
                }, 30000); // 30 second timeout
                
                // Force load
                this.currentAudio.load();
            });
            
            // Create audio source and connect to analyser
            console.log("Creating audio source node...");
            this.audioSource = this.audioContext.createMediaElementSource(this.currentAudio);
            
            console.log("Connecting audio to analyser...");
            this.audioSource.connect(this.analyser);
            
            // Update narrator orb with new analyser
            if (this.narratorOrb) {
                console.log("Updating narrator orb with new analyser...");
                this.narratorOrb.analyserNode = this.analyser;
                this.narratorOrb.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
                console.log("Analyser frequency bin count:", this.analyser.frequencyBinCount);
            }
            
            // Setup audio event listeners
            this.currentAudio.addEventListener('timeupdate', () => {
                this.updateProgress();
            });
            
            this.currentAudio.addEventListener('ended', () => {
                console.log("Audio ended");
                this.stop();
            });
            
            this.currentAudio.addEventListener('error', (e) => {
                console.error('Audio playback error:', e);
                this.showUploadStatus('Audio playback error occurred', true);
            });
            
            this.currentAudio.addEventListener('play', () => {
                console.log("Audio started playing");
            });
            
            this.currentAudio.addEventListener('pause', () => {
                console.log("Audio paused");
            });
            
            // Mark as loaded and update UI
            this.audioLoaded = true;
            this.updateAudioInfo(file.name);
            this.enablePlaybackControls();
            this.showLoading(false);
            
            // Remove loading state
            if (fileUpload) fileUpload.classList.remove('loading');
            
            this.showUploadStatus(`✓ ${file.name} loaded successfully! Press play to start.`);
            console.log('Audio file loaded successfully:', file.name);
            
        } catch (error) {
            console.error('Failed to load audio file:', error);
            this.showLoading(false);
            this.audioLoaded = false;
            
            // Remove loading state
            const fileUpload = document.getElementById('fileUpload');
            if (fileUpload) fileUpload.classList.remove('loading');
            
            this.showUploadStatus('✗ ' + error.message, true);
        }
    }
    
    async play() {
        try {
            if (!this.currentAudio) {
                this.showUploadStatus('✗ Please upload an audio file first', true);
                return;
            }
            
            if (!this.audioLoaded) {
                this.showUploadStatus('✗ Audio is still loading, please wait', true);
                return;
            }
            
            console.log("Attempting to play audio...");
            
            if (this.audioContext && this.audioContext.state === 'suspended') {
                console.log("Resuming audio context...");
                await this.audioContext.resume();
            }
            
            await this.currentAudio.play();
            this.isPlaying = true;
            this.updatePlaybackButtons();
            console.log('Audio playing successfully');
            
        } catch (error) {
            console.error('Play failed:', error);
            this.showUploadStatus('✗ Playback failed: ' + error.message, true);
        }
    }
    
    pause() {
        if (this.currentAudio && this.audioLoaded) {
            this.currentAudio.pause();
            this.isPlaying = false;
            this.updatePlaybackButtons();
            console.log('Audio paused');
        }
    }
    
    stop() {
        if (this.currentAudio && this.audioLoaded) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.isPlaying = false;
            this.updatePlaybackButtons();
            this.updateProgress();
            console.log('Audio stopped');
        }
    }
    
    updatePlaybackButtons() {
        const playBtn = document.getElementById('playBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        
        if (playBtn) playBtn.disabled = this.isPlaying || !this.audioLoaded;
        if (pauseBtn) pauseBtn.disabled = !this.isPlaying || !this.audioLoaded;
    }
    
    enablePlaybackControls() {
        const playBtn = document.getElementById('playBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const stopBtn = document.getElementById('stopBtn');
        
        if (playBtn) playBtn.disabled = false;
        if (pauseBtn) pauseBtn.disabled = true; // Initially disabled until playing
        if (stopBtn) stopBtn.disabled = false;
        
        console.log("Playback controls enabled");
    }
    
    updateAudioInfo(filename) {
        const audioTitle = document.getElementById('audioTitle');
        const audioInfo = document.getElementById('audioInfo');
        
        if (audioTitle) audioTitle.textContent = filename;
        if (audioInfo) audioInfo.style.display = 'block';
        
        console.log("Audio info updated:", filename);
    }
    
    updateProgress() {
        if (this.currentAudio && this.audioLoaded) {
            const progress = (this.currentAudio.currentTime / this.currentAudio.duration) * 100;
            const progressFill = document.getElementById('progressFill');
            if (progressFill) progressFill.style.width = progress + '%';
            
            const currentTime = this.formatTime(this.currentAudio.currentTime);
            const duration = this.formatTime(this.currentAudio.duration);
            const audioTime = document.getElementById('audioTime');
            if (audioTime) audioTime.textContent = `${currentTime} / ${duration}`;
        }
    }
    
    formatTime(seconds) {
        if (isNaN(seconds)) return '00:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    showLoading(show) {
        const loading = document.getElementById('loading');
        if (loading) loading.style.display = show ? 'flex' : 'none';
    }
    
    setupPresetControls() {
        const savePresetBtn = document.getElementById('savePresetBtn');
        const loadPresetBtn = document.getElementById('loadPresetBtn');
        const deletePresetBtn = document.getElementById('deletePresetBtn');
        const resetBtn = document.getElementById('resetBtn');
        const exportBtn = document.getElementById('exportBtn');
        const importBtn = document.getElementById('importBtn');
        const importFile = document.getElementById('importFile');
        
        if (savePresetBtn) {
            savePresetBtn.addEventListener('click', () => this.savePreset());
        }
        if (loadPresetBtn) {
            loadPresetBtn.addEventListener('click', () => this.loadPreset());
        }
        if (deletePresetBtn) {
            deletePresetBtn.addEventListener('click', () => this.deletePreset());
        }
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetSettings());
        }
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportSettings());
        }
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                if (importFile) importFile.click();
            });
        }
        if (importFile) {
            importFile.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.importSettings(e.target.files[0]);
                }
            });
        }
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ignore if typing in input fields
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    if (this.isPlaying) {
                        this.pause();
                    } else {
                        this.play();
                    }
                    break;
                    
                case 'KeyT':
                    e.preventDefault();
                    this.toggleUI();
                    break;
                    
                case 'KeyH':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.settings.autoHideUI = !this.settings.autoHideUI;
                        const autoHideCheckbox = document.getElementById('autoHideUI');
                        if (autoHideCheckbox) autoHideCheckbox.checked = this.settings.autoHideUI;
                        this.updateAutoHide();
                        this.saveUIState();
                    }
                    break;
            }
        });
        
        // Mouse movement for auto-hide
        document.addEventListener('mousemove', () => {
            if (this.settings.autoHideUI && !this.isMouseOverUI) {
                this.showUITemporarily();
            }
        });
    }
    
    savePreset() {
        const presetName = document.getElementById('presetName');
        if (!presetName || !presetName.value.trim()) {
            alert('Please enter a preset name');
            return;
        }
        
        const presets = JSON.parse(localStorage.getItem('narratorOrbPresets') || '{}');
        presets[presetName.value.trim()] = { ...this.settings };
        localStorage.setItem('narratorOrbPresets', JSON.stringify(presets));
        
        this.updatePresetSelect();
        const name = presetName.value.trim();
        presetName.value = '';
        alert(`Preset "${name}" saved!`);
    }
    
    loadPreset() {
        const presetSelect = document.getElementById('presetSelect');
        if (!presetSelect || !presetSelect.value) return;
        
        const presets = JSON.parse(localStorage.getItem('narratorOrbPresets') || '{}');
        if (presets[presetSelect.value]) {
            this.settings = { ...presets[presetSelect.value] };
            this.applySettings();
        }
    }
    
    deletePreset() {
        const presetSelect = document.getElementById('presetSelect');
        if (!presetSelect || !presetSelect.value) return;
        
        if (confirm(`Delete preset "${presetSelect.value}"?`)) {
            const presets = JSON.parse(localStorage.getItem('narratorOrbPresets') || '{}');
            delete presets[presetSelect.value];
            localStorage.setItem('narratorOrbPresets', JSON.stringify(presets));
            this.updatePresetSelect();
        }
    }
    
    resetSettings() {
        this.settings = {
            gain: 1.0,
            particles: 50000,
            intensity: 1.0,
            volume: 0.5,
            autoHideUI: true,
            autoHideDelay: 3000
        };
        this.applySettings();
    }
    
    applySettings() {
        const gainSlider = document.getElementById('gainSlider');
        const particleSlider = document.getElementById('particleSlider');
        const intensitySlider = document.getElementById('intensitySlider');
        const volumeSlider = document.getElementById('volumeSlider');
        const autoHideCheckbox = document.getElementById('autoHideUI');
        
        if (gainSlider) gainSlider.value = this.settings.gain;
        if (particleSlider) particleSlider.value = this.settings.particles;
        if (intensitySlider) intensitySlider.value = this.settings.intensity;
        if (volumeSlider) volumeSlider.value = this.settings.volume;
        if (autoHideCheckbox) autoHideCheckbox.checked = this.settings.autoHideUI;
        
        if (gainSlider) gainSlider.dispatchEvent(new Event('input'));
        if (particleSlider) particleSlider.dispatchEvent(new Event('input'));
        if (intensitySlider) intensitySlider.dispatchEvent(new Event('input'));
        if (volumeSlider) volumeSlider.dispatchEvent(new Event('input'));
        
        this.updateAutoHide();
        this.saveUIState();
    }
    
    loadPresets() {
        this.updatePresetSelect();
    }
    
    updatePresetSelect() {
        const presetSelect = document.getElementById('presetSelect');
        if (!presetSelect) return;
        
        const presets = JSON.parse(localStorage.getItem('narratorOrbPresets') || '{}');
        
        presetSelect.innerHTML = '<option value="">Select preset...</option>';
        Object.keys(presets).forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            presetSelect.appendChild(option);
        });
    }
    
    exportSettings() {
        const data = {
            settings: this.settings,
            presets: JSON.parse(localStorage.getItem('narratorOrbPresets') || '{}'),
            uiState: JSON.parse(localStorage.getItem('narratorOrbUIState') || '{}')
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'narrator-orb-settings.json';
        a.click();
        URL.revokeObjectURL(url);
    }
    
    async importSettings(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            if (data.settings) {
                this.settings = { ...data.settings };
                this.applySettings();
            }
            
            if (data.presets) {
                localStorage.setItem('narratorOrbPresets', JSON.stringify(data.presets));
                this.updatePresetSelect();
            }
            
            if (data.uiState) {
                localStorage.setItem('narratorOrbUIState', JSON.stringify(data.uiState));
            }
            
            alert('Settings imported successfully!');
        } catch (error) {
            console.error('Import failed:', error);
            alert('Failed to import settings. Please check the file format.');
        }
    }
    
    handleResize() {
        if (!this.renderer || !this.camera) return;
        
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    animate(currentTime = 0) {
        this.animationId = requestAnimationFrame((time) => this.animate(time));
        
        const deltaTime = this.lastTime ? Math.min((currentTime - this.lastTime) / 1000, 0.1) : 0;
        this.lastTime = currentTime;
        
        if (this.starfield?.material?.uniforms) {
            this.starfield.material.uniforms.time.value = currentTime * 0.001;
        }
        
        if (this.narratorOrb) {
            try {
                this.narratorOrb.update(deltaTime);
            } catch (error) {
                console.error("Error updating NarratorOrb:", error);
            }
            
            if (this.reflectionGroup && this.narratorOrb.orbGroup) {
                this.reflectionGroup.rotation.copy(this.narratorOrb.orbGroup.rotation);
                this.reflectionGroup.rotation.x *= -1;
                
                if (this.reflectionCore && this.narratorOrb.nebulaMaterial) {
                    this.reflectionCore.material.uniforms.time.value = this.narratorOrb.nebulaMaterial.uniforms.time.value;
                    this.reflectionCore.material.uniforms.audioLevel.value = this.narratorOrb.nebulaMaterial.uniforms.audioLevel.value;
                    this.reflectionCore.material.uniforms.breathingPhase.value = this.narratorOrb.nebulaMaterial.uniforms.breathingPhase.value;
                }
                
                if (this.reflectionTendrils && this.narratorOrb.tendrilMaterial) {
                    this.reflectionTendrils.material.uniforms.time.value = this.narratorOrb.tendrilMaterial.uniforms.time.value;
                    this.reflectionTendrils.material.uniforms.audioLevel.value = this.narratorOrb.tendrilMaterial.uniforms.audioLevel.value;
                    if (this.reflectionTendrils.material.uniforms.breathingPhase && this.narratorOrb.tendrilMaterial.uniforms.breathingPhase) {
                        this.reflectionTendrils.material.uniforms.breathingPhase.value = this.narratorOrb.tendrilMaterial.uniforms.breathingPhase.value;
                    }
                }
            }
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        if (this.narratorOrb) {
            this.narratorOrb.destroy();
        }
        
        if (this.reflectionGroup) {
            this.scene.remove(this.reflectionGroup);
        }
        
        if (this.currentAudio) {
            this.currentAudio.pause();
            if (this.currentAudio.src && this.currentAudio.src.startsWith('blob:')) {
                URL.revokeObjectURL(this.currentAudio.src);
            }
        }
        
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        this.clearAutoHideTimeout();
    }
}

// Initialize the application
const app = new AudiobookNarratorVisualizer();

// Handle page unload
window.addEventListener('beforeunload', () => {
    app.destroy();
});
