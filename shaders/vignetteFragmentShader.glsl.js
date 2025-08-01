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
