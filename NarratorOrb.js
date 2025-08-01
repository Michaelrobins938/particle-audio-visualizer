// NarratorOrb.js — Enhanced Nebula-style particle orb (BALANCED VERSION with improved audio reactivity)

import * as THREE from 'https://unpkg.com/three@0.150.1/build/three.module.js';

const nebulaVertexShader = `
    varying vec3 vColor;
    varying vec3 vPosition;
    varying vec3 vOriginalPosition;
    varying float vDistance;
    varying float vNoise;
    varying float vDensity;
    varying float vFlow;

    uniform float time;
    uniform float audioLevel;
    uniform float breathingPhase;

    // Enhanced 3D noise for more organic flow
    vec3 mod289(vec3 x) {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
    }

    vec4 mod289(vec4 x) {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
    }

    vec4 permute(vec4 x) {
        return mod289(((x*34.0)+1.0)*x);
    }

    vec4 taylorInvSqrt(vec4 r) {
        return 1.79284291400159 - 0.85373472095314 * r;
    }

    float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        
        vec3 i = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        
        i = mod289(i);
        vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        
        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;
        
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
        
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;
        
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }

    // Fractal Brownian Motion for more complex structures
    float fbm(vec3 p) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 1.0;
        
        for(int i = 0; i < 4; i++) {
            value += amplitude * snoise(p * frequency);
            frequency *= 2.0;
            amplitude *= 0.5;
        }
        return value;
    }

    void main() {
        vOriginalPosition = position;
        vColor = color;
        
        // Create flowing, organic motion with subtle audio enhancement
        float timeScale = time * 0.2;
        vec3 flowField = vec3(
            fbm(position * 0.5 + vec3(timeScale, 0.0, 0.0)),
            fbm(position * 0.5 + vec3(0.0, timeScale, 0.0)),
            fbm(position * 0.5 + vec3(0.0, 0.0, timeScale))
        );
        
        // Nebula density based on distance from center and noise
        float centerDistance = length(position);
        vDensity = smoothstep(3.0, 0.5, centerDistance);
        vDensity *= (0.5 + 0.5 * fbm(position * 1.2 + vec3(time * 0.1)));
        
        // Flowing tendrils effect with subtle audio reactivity
        vec3 curlNoise = vec3(
            snoise(position * 0.8 + vec3(time * 0.15, 0.0, 0.0)),
            snoise(position * 0.8 + vec3(0.0, time * 0.15, 0.0)),
            snoise(position * 0.8 + vec3(0.0, 0.0, time * 0.15))
        );
        
        // Combine flow effects with gentle audio response
        vec3 flow = flowField * 0.3 + curlNoise * 0.2;
        flow *= (1.0 + audioLevel * 0.4); // Subtle flow enhancement
        vFlow = length(flow);
        
        // More responsive but still gentle audio-reactive expansion
        float audioReactivity = audioLevel * (1.0 + sin(time * 5.0 + centerDistance * 3.0)) * 0.6;
        
        // Apply all transformations
        vec3 displaced = position + flow;
        displaced += normalize(position) * audioReactivity * 0.5;
        
        // Breathing animation with subtle audio enhancement
        float breathingScale = 1.0 + sin(breathingPhase) * 0.1 + audioLevel * 0.3;
        displaced *= breathingScale;
        
        vPosition = displaced;
        vDistance = length(displaced);
        vNoise = fbm(displaced * 1.5 + vec3(time * 0.1));
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
        
        // Slightly more responsive point sizes
        float pointSize = (2.0 + vDensity * 6.0) * (1.0 + audioLevel * 4.0);
        gl_PointSize = clamp(pointSize, 1.0, 14.0);
    }
`;

const nebulaFragmentShader = `
    varying vec3 vColor;
    varying vec3 vPosition;
    varying vec3 vOriginalPosition;
    varying float vDistance;
    varying float vNoise;
    varying float vDensity;
    varying float vFlow;

    uniform float time;
    uniform float audioLevel;
    uniform float intensity;

    // Convert HSV to RGB
    vec3 hsv2rgb(vec3 c) {
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    void main() {
        // Soft, organic point shape
        vec2 circCoord = 2.0 * gl_PointCoord - 1.0;
        float dist = length(circCoord);
        if (dist > 1.0) discard;
        
        // Nebula color mapping based on density and flow - BALANCED VERSION
        float colorZone = vDensity + vFlow * 0.3 + sin(time * 0.3 + vDistance) * 0.1;
        
        float hue;
        if (colorZone > 0.7) {
            // Dense core - bright cyan to blue (like reference)
            hue = 0.5 + colorZone * 0.08 + audioLevel * 0.04; // Slightly more audio response
        } else if (colorZone > 0.4) {
            // Mid density - purple to blue
            hue = 0.65 + colorZone * 0.15 + sin(time * 0.5) * 0.02;
        } else {
            // Outer wisps - magenta to pink (like reference)
            hue = 0.85 + colorZone * 0.12 + vNoise * 0.03; // Magenta range
        }
        
        // Balanced saturation and brightness
        float saturation = 0.85 + vDensity * 0.1 + audioLevel * 0.06;
        
        // MUCH more balanced brightness - less obnoxious
        float brightness = 1.2 + vDensity * 1.8 + vFlow * 0.8;
        brightness += audioLevel * 1.0; // Slightly more audio response
        brightness += sin(time * 1.5 + vDistance * 2.0) * 0.2;
        brightness *= intensity;
        brightness = clamp(brightness, 0.4, 2.5); // More controlled range
        
        vec3 nebulaColor = hsv2rgb(vec3(hue, saturation, brightness));
        
        // Much more subtle core glow - less white
        float coreGlow = smoothstep(0.3, 1.0, vDensity);
        nebulaColor += coreGlow * vec3(0.3, 0.6, 0.8) * (0.8 + audioLevel * 0.4); // Slightly more audio glow
        
        // Much more subtle star-like points - way less obnoxious
        float starPoint = smoothstep(0.85, 1.0, vDensity) * smoothstep(0.7, 1.0, vFlow);
        nebulaColor += starPoint * vec3(0.4, 0.6, 0.9) * 0.5; // Very subtle white points
        
        // Soft falloff for gaseous appearance
        float gasAlpha = 1.0 - smoothstep(0.0, 1.0, dist);
        gasAlpha = pow(gasAlpha, 1.2); // Softer edges
        
        // Balanced density-based transparency
        float densityAlpha = vDensity * 1.2 + 0.2;
        
        // Flow-based wispy effects
        float flowAlpha = smoothstep(0.0, 0.5, vFlow) * 0.6;
        
        // Combine alpha effects with balanced values
        float finalAlpha = gasAlpha * (densityAlpha + flowAlpha);
        finalAlpha *= (0.5 + audioLevel * 0.4); // Slightly more audio response
        
        // Subtle flickering like real gas with gentle audio enhancement
        float flicker = sin(time * 2.0 + vDistance * 4.0) * 0.08 + 0.92;
        flicker += sin(time * 6.0 + audioLevel * 10.0) * audioLevel * 0.05; // Gentle audio flicker
        finalAlpha *= flicker;
        
        // Ensure minimum visibility
        finalAlpha = clamp(finalAlpha, 0.08, 0.9);
        
        gl_FragColor = vec4(nebulaColor, finalAlpha);
    }
`;

const tendrilVertexShader = `
    varying vec3 vColor;
    varying vec3 vPosition;
    varying float vDistance;
    varying float vFlow;

    uniform float time;
    uniform float audioLevel;

    // Same noise functions as above...
    vec3 mod289(vec3 x) {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
    }

    vec4 mod289(vec4 x) {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
    }

    vec4 permute(vec4 x) {
        return mod289(((x*34.0)+1.0)*x);
    }

    vec4 taylorInvSqrt(vec4 r) {
        return 1.79284291400159 - 0.85373472095314 * r;
    }

    float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        
        vec3 i = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        
        i = mod289(i);
        vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        
        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;
        
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
        
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;
        
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }

    void main() {
        vColor = color;
        
        // Create flowing tendrils extending outward
        vec3 direction = normalize(position);
        float distanceFromCenter = length(position);
        
        // Curl noise for tendril flow with gentle audio enhancement
        vec3 curlNoise = vec3(
            snoise(position * 0.3 + vec3(time * 0.1)),
            snoise(position * 0.3 + vec3(time * 0.1 + 50.0)),
            snoise(position * 0.3 + vec3(time * 0.1 + 100.0))
        );
        
        // Flow along tendrils with subtle audio response
        vec3 flow = curlNoise * (0.5 + audioLevel * 0.3);
        vFlow = length(flow);
        
        // Audio-reactive streaming with gentle response
        float audioStream = audioLevel * sin(time * 3.0 + distanceFromCenter) * 0.4;
        
        vec3 displaced = position + flow + direction * audioStream;
        
        vPosition = displaced;
        vDistance = length(displaced);
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
        
        // Slightly more responsive point sizes for tendrils
        gl_PointSize = 2.0 + audioLevel * 4.0;
    }
`;

const tendrilFragmentShader = `
    varying vec3 vColor;
    varying vec3 vPosition;
    varying float vDistance;
    varying float vFlow;

    uniform float time;
    uniform float audioLevel;
    uniform float intensity;

    vec3 hsv2rgb(vec3 c) {
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    void main() {
        vec2 circCoord = 2.0 * gl_PointCoord - 1.0;
        float dist = length(circCoord);
        if (dist > 1.0) discard;
        
        // Tendril colors - outer wisps, magenta/pink like reference
        float hue = 0.85 + vFlow * 0.06 + sin(time * 0.5 + vDistance) * 0.02; // Magenta range
        float saturation = 0.8 + audioLevel * 0.12;
        
        // More balanced tendril brightness with gentle audio response
        float brightness = (1.0 + vFlow * 1.2 + audioLevel * 1.0) * intensity;
        brightness = clamp(brightness, 0.4, 2.0);
        
        vec3 tendrilColor = hsv2rgb(vec3(hue, saturation, brightness));
        
        // Subtle magenta glow to tendrils
        tendrilColor += vec3(0.4, 0.2, 0.6) * vFlow * (0.3 + audioLevel * 0.2);
        
        // Balanced alpha for tendrils with gentle audio response
        float alpha = (1.0 - dist) * (0.3 + audioLevel * 0.2);
        alpha *= smoothstep(3.0, 6.0, vDistance); // Fade with distance
        alpha *= (0.25 + audioLevel * 0.35);
        alpha = clamp(alpha, 0.03, 0.6); // More subtle visibility
        
        gl_FragColor = vec4(tendrilColor, alpha);
    }
`;

class NarratorOrb {
    constructor(scene, camera, renderer, analyserNode = null, config = {}) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.analyserNode = analyserNode;

        this.config = {
            coreParticleCount: config.coreParticleCount || 4000,
            tendrilParticleCount: config.tendrilParticleCount || 3000,
            coreRadius: config.coreRadius || 1.2,
            tendrilRadius: config.tendrilRadius || 3.5,
            baseHue: config.baseHue || 200,
            ...config
        };

        this.frequencyData = new Uint8Array(this.analyserNode ? this.analyserNode.frequencyBinCount : 1024);

        this.time = 0;
        this.breathingPhase = 0;
        this.lastAudioLevel = 0;

        this.createNebulaOrb();
    }

    createNebulaOrb() {
        // Main nebula material with balanced intensity
        this.nebulaMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                audioLevel: { value: 0 },
                breathingPhase: { value: 0 },
                intensity: { value: 1.8 } // Back to balanced intensity
            },
            vertexShader: nebulaVertexShader,
            fragmentShader: nebulaFragmentShader,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            vertexColors: true
        });

        // Tendril material with balanced intensity
        this.tendrilMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                audioLevel: { value: 0 },
                intensity: { value: 1.5 } // Back to balanced for subtle magenta wisps
            },
            vertexShader: tendrilVertexShader,
            fragmentShader: tendrilFragmentShader,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            vertexColors: true
        });

        this.createCoreNebula();
        this.createTendrils();

        this.orbGroup = new THREE.Group();
        this.orbGroup.add(this.nebulaCore);
        this.orbGroup.add(this.nebulaTendrils);
        this.scene.add(this.orbGroup);
    }

    createCoreNebula() {
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];

        // Create organic, cloud-like distribution with higher density
        for (let i = 0; i < this.config.coreParticleCount; i++) {
            const theta = Math.random() * 2 * Math.PI;
            const phi = Math.acos(2 * Math.random() - 1);
            
            // Use multiple noise-based layers for organic shape
            const noiseValue = this.fbm(new THREE.Vector3(
                Math.sin(phi) * Math.cos(theta),
                Math.sin(phi) * Math.sin(theta),
                Math.cos(phi)
            ).multiplyScalar(3));
            
            const radius = this.config.coreRadius * (0.2 + Math.abs(noiseValue) * 0.8 + Math.random() * 0.6);

            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);

            positions.push(x, y, z);

            // More balanced base colors matching reference
            const distanceFromCenter = Math.sqrt(x*x + y*y + z*z);
            const hue = (180 + distanceFromCenter * 35 + Math.random() * 70) % 360;
            const color = new THREE.Color(`hsl(${hue}, 85%, 70%)`);
            colors.push(color.r, color.g, color.b);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        this.nebulaCore = new THREE.Points(geometry, this.nebulaMaterial);
    }

    createTendrils() {
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];

        // Create flowing tendrils extending outward
        for (let i = 0; i < this.config.tendrilParticleCount; i++) {
            const theta = Math.random() * 2 * Math.PI;
            const phi = Math.acos(2 * Math.random() - 1);
            
            // Tendrils extend further out
            const radius = this.config.tendrilRadius * (0.4 + Math.random() * 1.8);

            let x = radius * Math.sin(phi) * Math.cos(theta);
            let y = radius * Math.sin(phi) * Math.sin(theta);
            let z = radius * Math.cos(phi);

            // Add some curl/flow to tendrils
            const curlNoise = this.fbm(new THREE.Vector3(x, y, z).multiplyScalar(0.5));
            x += curlNoise * 0.5;
            y += curlNoise * 0.3;
            z += curlNoise * 0.4;

            positions.push(x, y, z);

            // More balanced tendril colors - magenta range to match reference
            const hue = (300 + Math.random() * 50) % 360;
            const color = new THREE.Color(`hsl(${hue}, 80%, 65%)`);
            colors.push(color.r, color.g, color.b);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        this.nebulaTendrils = new THREE.Points(geometry, this.tendrilMaterial);
    }

    // Simple FBM implementation for noise
    fbm(position) {
        const x = position.x || position[0] || 0;
        const y = position.y || position[1] || 0;
        const z = position.z || position[2] || 0;
        
        // Simple pseudo-noise
        return Math.sin(x * 2.1 + y * 1.3 + z * 0.7) * 0.5 +
               Math.sin(x * 4.2 + y * 2.6 + z * 1.4) * 0.25 +
               Math.sin(x * 8.4 + y * 5.2 + z * 2.8) * 0.125;
    }

    getAudioData() {
        if (!this.analyserNode) return { average: 0.2 };
        this.analyserNode.getByteFrequencyData(this.frequencyData);
        const sum = this.frequencyData.reduce((a, b) => a + b, 0);
        const average = sum / this.frequencyData.length / 255;
        return { average: Math.max(average, 0.1) };
    }

    update(deltaTime) {
        this.time += deltaTime;
        this.breathingPhase += deltaTime * 0.5;

        const audioData = this.getAudioData();
        // More responsive audio smoothing for better reactivity
        this.lastAudioLevel = THREE.MathUtils.lerp(this.lastAudioLevel, audioData.average, 0.2);

        // Update nebula core
        if (this.nebulaMaterial?.uniforms) {
            this.nebulaMaterial.uniforms.time.value = this.time;
            this.nebulaMaterial.uniforms.audioLevel.value = this.lastAudioLevel;
            this.nebulaMaterial.uniforms.breathingPhase.value = this.breathingPhase;
        }

        // Update tendrils
        if (this.tendrilMaterial?.uniforms) {
            this.tendrilMaterial.uniforms.time.value = this.time;
            this.tendrilMaterial.uniforms.audioLevel.value = this.lastAudioLevel * 0.7;
        }

        // Slightly more responsive but still gentle rotation
        const rotationSpeed = 0.001 + this.lastAudioLevel * 0.005;
        if (this.orbGroup) {
            this.orbGroup.rotation.y += rotationSpeed;
            this.orbGroup.rotation.x += rotationSpeed * 0.3;
            this.orbGroup.rotation.z += rotationSpeed * 0.1;

            // Gentle breathing and audio scaling with better responsiveness
            const breathingScale = 1 + Math.sin(this.breathingPhase) * 0.05 + this.lastAudioLevel * 0.3;
            this.orbGroup.scale.setScalar(breathingScale);
        }
    }

    setIntensity(intensity) {
        // Apply intensity with balanced multiplier
        const adjustedIntensity = intensity * 1.5;
        if (this.nebulaMaterial?.uniforms) {
            this.nebulaMaterial.uniforms.intensity.value = adjustedIntensity;
        }
        if (this.tendrilMaterial?.uniforms) {
            this.tendrilMaterial.uniforms.intensity.value = adjustedIntensity * 0.8;
        }
    }

    destroy() {
        if (this.orbGroup) this.scene.remove(this.orbGroup);
        if (this.nebulaCore) {
            this.nebulaCore.geometry.dispose();
            this.nebulaMaterial.dispose();
        }
        if (this.nebulaTendrils) {
            this.nebulaTendrils.geometry.dispose();
            this.tendrilMaterial.dispose();
        }
    }
}

export { NarratorOrb };