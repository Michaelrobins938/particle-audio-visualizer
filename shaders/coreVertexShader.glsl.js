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
