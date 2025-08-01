export default `
precision mediump float;

varying vec3 vColor;
varying float vAlpha;
varying float vDist;

void main() {
    float glow = exp(-vDist * 2.5);

    // Softened final aura color
    vec3 finalColor = mix(vColor * 0.9, vec3(1.0), glow * 0.25);

    float alpha = vAlpha * glow;

    gl_FragColor = vec4(finalColor, alpha * 0.6);
}
`;
