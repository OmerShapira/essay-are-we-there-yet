function createShaderProgram(gl, vertexSource, fragmentSource) {
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexSource);
    gl.compileShader(vertexShader);
    if (gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS) === false) {
        console.error('Error compiling vertex shader:', gl.getShaderInfoLog(vertexShader));
        gl.deleteShader(vertexShader);
        return null;
    }

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentSource);
    gl.compileShader(fragmentShader);
    if (gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS) === false) {
        console.error('Error compiling fragment shader:', gl.getShaderInfoLog(fragmentShader));
        gl.deleteShader(fragmentShader);
        return null;
    }

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (gl.getProgramParameter(shaderProgram, gl.LINK_STATUS) === false) {
        console.error('Error linking shader program:', gl.getProgramInfoLog(shaderProgram));
        gl.deleteProgram(shaderProgram);
        return null;
    }

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    return shaderProgram;
}

const DitherShader = {
    uniforms: {
        'tDiffuse': { value: null },
        'amount': { value: 1.0 }, // Controls the influence of the noise offset
        'offset': { value: new THREE.Vector3(0.0, 0.0, 0.0) } 
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float amount;
        uniform vec3 offset;
        varying vec2 vUv;
        
        // 4x4 Bayer Matrix values
        const float matrixSize = 4.0;
        const float bayer[16] = float[16](
             0.0,  8.0,  2.0, 10.0,
            12.0,  4.0, 14.0,  6.0,
             3.0, 11.0,  1.0,  9.0,
            15.0,  7.0, 13.0,  5.0
        );

        void main() {
            vec4 color = texture2D(tDiffuse, vUv);
            // Compute a noise value from UVs (adding offset) to serve as an offset
            float noise = fract(sin(dot(vUv + offset.xy + offset.zz, vec2(12.9898, 78.233))) * 43758.5453);
            
            // Obtain the pixel coordinates from the fragment's position
            vec2 fragCoord = gl_FragCoord.xy;
            float bx = mod(fragCoord.x, matrixSize);
            float by = mod(fragCoord.y, matrixSize);
            int index = int(bx + by * matrixSize);
            // Calculate threshold from Bayer matrix and add the noise offset
            float threshold = (bayer[index] + noise * amount) / 16.0;

            // Dither: quantize each color channel to 4 levels then add our computed threshold.
            vec3 dithered = floor(color.rgb * 4.0 + threshold) / 4.0;
            gl_FragColor = vec4(dithered, color.a);
        }
    `
};

export { createShaderProgram, DitherShader };