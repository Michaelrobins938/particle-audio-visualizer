// HUD Shader for Sci-Fi Audio Visualizer Overlay
export const HUDShader = {
    uniforms: {
        u_time: { value: 0.0 },
        u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        u_audioBands: { value: new Array(64).fill(0.0) },
        u_amplitude: { value: 0.0 },
        u_theme: { value: new THREE.Color(0.118, 0.580, 0.643) }, // Jarvis blue
        u_alpha: { value: 0.85 }
    },

    vertexShader: `
        varying vec2 vUv;
        
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,

    fragmentShader: `
        uniform float u_time;
        uniform vec2 u_resolution;
        uniform float u_audioBands[64];
        uniform float u_amplitude;
        uniform vec3 u_theme;
        uniform float u_alpha;
        
        varying vec2 vUv;
        
        #define PI 3.14159265359
        #define TAU 6.28318530718
        #define ASPECT (u_resolution.x / u_resolution.y)
        
        // Hash function for noise
        float hash11(float p) {
            p = fract(p * 0.1031);
            p *= p + 33.33;
            p *= p + p;
            return fract(p);
        }
        
        // SDF Circle with smooth edges
        float circle(in vec2 uv, in float rad) {
            float bias = 8.0 / u_resolution.x;
            return smoothstep(rad, rad - bias, length(uv) - rad);
        }
        
        // Hexagon math functions
        vec2 s = vec2(1.0, 1.7320508);
        
        float hex(in vec2 p) {
            p = abs(p);
            return max(dot(p, s * 0.5), p.x);
        }
        
        vec4 getHex(vec2 p) {
            vec4 hC = floor(vec4(p, p - vec2(0.5, 1.0)) / s.xyxy) + 0.5;
            vec4 h = vec4(p - hC.xy * s, p - (hC.zw + 0.5) * s);
            return dot(h.xy, h.xy) < dot(h.zw, h.zw) 
                ? vec4(h.xy, hC.xy) 
                : vec4(h.zw, hC.zw + 0.5);
        }
        
        // HSB to RGB conversion
        vec3 hsb2rgb(in vec3 c) {
            vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
            rgb = rgb * rgb * (3.0 - 2.0 * rgb);
            return c.z * mix(vec3(1.0), rgb, c.y);
        }
        
        // Hexagon grid layer
        vec3 hex_layer(in vec2 uv, in float scale, in vec3 color) {
            vec2 hv = getHex(scale * uv * vec2(ASPECT, 1.0)).xy;
            float d = hex(hv);
            return mix(vec3(0.0), vec3(1.0), smoothstep(0.0, 0.03, d - 0.5 + 0.04)) * color;
        }
        
        // Rotating arc reactor rings
        vec3 arc_layer(in vec2 uv, in float r, in float o, in vec3 color) {
            float d = circle(uv, r);
            d -= circle(uv, r - o);
            
            float angle = atan(uv.y, uv.x) + PI;
            float rot_speed = u_time / 2.0;
            angle += rot_speed;
            
            float lSegments = 3.0, sSegments = 48.0;
            float lAngleSegment = TAU / lSegments;
            float sAngleSegment = TAU / sSegments;
            
            float largeSegs = 0.0, smallSegs = 0.0;
            if (abs(mod(angle, lAngleSegment) - lAngleSegment / 2.0) < 0.06) {
                largeSegs = 1.0;
            }
            if (abs(mod(angle, sAngleSegment) - sAngleSegment / 2.0) < 0.01) {
                smallSegs = 1.0;  
            }
            
            d -= smallSegs;
            d -= largeSegs;
            
            return max(0.0, d) * color * 0.2;
        }
        
        void main() {
            // Setup coordinates
            vec2 uv = gl_FragCoord.xy / u_resolution.xy;
            vec2 p = (uv - vec2(0.5)) * vec2(ASPECT, 1.0);
            vec3 col = vec3(0.0);
            vec3 _theme = u_theme;
            
            // Enhanced theme with subtle color cycling
            _theme = hsb2rgb(vec3(u_time * 0.01, 0.8, 1.2));
            
            // Audio data processing
            int audioIndex = int(clamp(uv.x * 63.0, 0.0, 63.0));
            float audio = u_audioBands[audioIndex];
            audio = pow(audio, 3.5); // Smooth audio response
            
            // Arc reactor ring
            col += arc_layer(p, 0.18, 0.025, _theme * vec3(0.75, 0.75, 1.25));
            
            // Polar audio waveform ring
            float r = 0.4, thin = 0.02;
            float d = length(p) - r;
            
            // Wave mask to create gaps
            vec3 wave_mask = vec3(1.0);
            wave_mask *= smoothstep(0.2, 0.4, uv.x);
            wave_mask *= smoothstep(0.2, 0.4, 1.0 - uv.x);
            
            // Audio waveform visualization
            col += (1.0 - smoothstep(0.0, thin, abs(audio - d))) * _theme * max(0.001, audio * 5.0) * wave_mask;
            col += pow(abs(0.025 / d * audio), 1.2) * _theme * wave_mask;
            
            // Hexagon overlay
            vec3 hexLayer = hex_layer(uv, 25.0, _theme * 1.5);
            col += col * hexLayer * 0.15; // Subtle hex blend
            
            // Additional circular elements with audio reactivity
            float innerRing = circle(p, 0.15);
            innerRing -= circle(p, 0.12);
            col += innerRing * _theme * u_amplitude * 2.0;
            
            // Outer scanning rings
            float scanRing1 = circle(p, 0.6 + sin(u_time * 2.0) * 0.1);
            scanRing1 -= circle(p, 0.58 + sin(u_time * 2.0) * 0.1);
            col += scanRing1 * _theme * 0.3;
            
            float scanRing2 = circle(p, 0.8 + cos(u_time * 1.5) * 0.15);
            scanRing2 -= circle(p, 0.77 + cos(u_time * 1.5) * 0.15);
            col += scanRing2 * _theme * 0.2;
            
            // Radial audio visualization
            float angle = atan(p.y, p.x) + PI;
            int radialIndex = int(mod(angle / TAU * 32.0, 32.0));
            float radialAudio = u_audioBands[radialIndex];
            
            float radialViz = smoothstep(0.3, 0.31, length(p)) * 
                             smoothstep(0.35, 0.34, length(p)) *
                             (1.0 + radialAudio * 3.0);
            col += radialViz * _theme * 0.5;
            
            // Gradient overlay for depth
            float gradient = 1.0 - length(p) * 0.5;
            col *= gradient;
            
            // ACES tone mapping
            col = (col * (2.51 * col + 0.03)) / (col * (2.43 * col + 0.59) + 0.14);
            col = pow(col, vec3(1.0 / 2.2));
            
            // Output with transparency
            float alpha = length(col) * u_alpha;
            alpha = clamp(alpha, 0.0, u_alpha);
            
            gl_FragColor = vec4(col, alpha);
        }
    `
};
