#!/bin/bash

echo "Creating shader files..."

# Create coreVertexShader.glsl.js
cat > coreVertexShader.glsl.js << 'EOF'
export default `
    attribute float size;
    attribute vec3 customColor;
    attribute float alpha;
    attribute float phase;
    
    varying vec3 vColor;
    varying float vAlpha;
    varying float vDistance;
    
    uniform float time;
    uniform float audioLevel;
    uniform float breathingPhase;
    
    void main() {
        vColor = customColor;
        vAlpha = alpha;
        
        vec3 pos = position;
        
        // Breathing motion
        float breathing = sin(breathingPhase + phase) * 0.1;
        pos *= (1.0 + breathing + audioLevel * 0.3);
        
        // Audio-reactive size
        float audioSize = size * (1.0 + audioLevel * 2.0);
        
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        vDistance = length(mvPosition.xyz);
        
        gl_PointSize = audioSize * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
    }
`;
EOF

# Create coreFragmentShader.glsl.js
cat > coreFragmentShader.glsl.js << 'EOF'
export default `
    varying vec3 vColor;
    varying float vAlpha;
    varying float vDistance;
    
    void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float dist = length(uv);
        
        // Radial gradient
        float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
        alpha *= vAlpha;
        
        // Distance fade
        alpha *= (1.0 - smoothstep(50.0, 100.0, vDistance));
        
        // Electric glow effect
        float glow = exp(-dist * 4.0);
        vec3 finalColor = vColor * (1.0 + glow * 0.5);
        
        gl_FragColor = vec4(finalColor, alpha);
    }
`;
EOF

# Create auraVertexShader.glsl.js
cat > auraVertexShader.glsl.js << 'EOF'
export default `
    attribute float size;
    attribute vec3 customColor;
    attribute float alpha;
    attribute float phase;
    attribute vec3 noiseOffset;
    
    varying vec3 vColor;
    varying float vAlpha;
    
    uniform float time;
    uniform float audioLevel;
    
    // Simplex noise function
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    
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
        vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        
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
        vColor = customColor;
        vAlpha = alpha;
        
        vec3 pos = position;
        
        // Slow drift with noise
        float noiseScale = 0.5;
        float timeScale = time * 0.3;
        vec3 noisePos = pos + noiseOffset + vec3(timeScale);
        
        float noise1 = snoise(noisePos * noiseScale);
        float noise2 = snoise(noisePos * noiseScale * 2.0 + vec3(100.0));
        float noise3 = snoise(noisePos * noiseScale * 0.5 + vec3(200.0));
        
        vec3 drift = vec3(noise1, noise2, noise3) * 0.2;
        pos += drift;
        
        // Gentle audio sway
        pos += normalize(pos) * audioLevel * 0.15;
        
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = size * (200.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
    }
`;
EOF

# Create auraFragmentShader.glsl.js
cat > auraFragmentShader.glsl.js << 'EOF'
export default `
    varying vec3 vColor;
    varying float vAlpha;
    
    void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float dist = length(uv);
        
        // Soft, dreamy fade
        float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
        alpha = pow(alpha, 2.0);
        alpha *= vAlpha;
        
        // Ethereal glow
        float glow = exp(-dist * 2.0);
        vec3 finalColor = vColor * (0.8 + glow * 0.4);
        
        gl_FragColor = vec4(finalColor, alpha * 0.6);
    }
`;
EOF

# Create vignetteVertexShader.glsl.js
cat > vignetteVertexShader.glsl.js << 'EOF'
export default `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;
EOF

# Create vignetteFragmentShader.glsl.js
cat > vignetteFragmentShader.glsl.js << 'EOF'
export default `
    uniform sampler2D tDiffuse;
    uniform float intensity;
    varying vec2 vUv;
    
    void main() {
        vec4 color = texture2D(tDiffuse, vUv);
        
        vec2 center = vec2(0.5, 0.5);
        float dist = distance(vUv, center);
        float vignette = 1.0 - smoothstep(0.0, 1.0, dist * intensity);
        
        gl_FragColor = vec4(color.rgb * vignette, color.a);
    }
`;
EOF

echo "✅ Created 6 shader files:"
echo "   - coreVertexShader.glsl.js"
echo "   - coreFragmentShader.glsl.js"
echo "   - auraVertexShader.glsl.js"
echo "   - auraFragmentShader.glsl.js"
echo "   - vignetteVertexShader.glsl.js"
echo "   - vignetteFragmentShader.glsl.js"
echo ""
echo "🚀 Now update your main.js with the refactored code!"
