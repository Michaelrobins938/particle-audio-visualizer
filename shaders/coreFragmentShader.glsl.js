export default `
precision mediump float;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vColor;

void main() {
    vec3 lightDirection = normalize(vec3(0.0, 1.0, 1.0));
    float lightIntensity = max(dot(normalize(vNormal), lightDirection), 0.0);

    float dist = length(vPosition);
    float glow = exp(-dist * 4.0);

    // Softened final color to reduce overexposure
    vec3 finalColor = mix(vColor * 1.1, vec3(1.0), glow * 0.2);

    gl_FragColor = vec4(finalColor * lightIntensity, 1.0);
}
`;
