void main() {
    // Set the background color
    vec3 backgroundColor = vec3(0.1, 0.1, 0.1);
    gl_FragColor = vec4(backgroundColor, 1.0);
    
    // Add post-processing effects here
    // Example: simple vignette effect
    float dist = length(gl_FragCoord.xy / resolution.xy - vec2(0.5));
    float vignette = smoothstep(0.8, 0.5, dist);
    
    gl_FragColor.rgb *= vignette;
}