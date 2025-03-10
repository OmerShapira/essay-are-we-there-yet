async function init() {
    const THREE = await import('three');
    const { CSS3DRenderer, CSS3DObject } = await import('three/examples/jsm/renderers/CSS3DRenderer.js');
    const { default: TWEEN } = await import('@tweenjs/tween.js');
    const { EffectComposer } = await import('three/examples/jsm/postprocessing/EffectComposer.js');
    const { RenderPass } = await import('three/examples/jsm/postprocessing/RenderPass.js');
    const { ShaderPass } = await import('three/examples/jsm/postprocessing/ShaderPass.js');
    const { DitherShader } = await import('./shader.js');
    
    // Main WebGL scene
    const scene = new THREE.Scene();
    // Create a separate CSS3D scene for CSS elements
    const cssScene = new THREE.Scene();
    
    const camera = new THREE.PerspectiveCamera(
        75, window.innerWidth / window.innerHeight, 0.1, 1000
    );
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    // renderer.setClearColor( 0x000000, 0 );
    renderer.setPixelRatio( window.devicePixelRatio );
    // renderer.shadowMap.enabled = true;
    // document.body.appendChild(renderer.domElement);
    document.querySelector('#webgl').appendChild( renderer.domElement );
    
    // Offscreen canvas for CSS3DRenderer
    const cssCanvas = document.createElement('canvas');
    cssCanvas.width = window.innerWidth;
    cssCanvas.height = window.innerHeight;
    // const cssContext = cssCanvas.getContext('2d');
    // cssContext.fillStyle = '#000000ff';
    // cssContext.fillRect( 0, 0, cssCanvas.width, cssCanvas.height );
    const cssRenderer = new CSS3DRenderer({canvas: cssCanvas});
    cssRenderer.setSize(window.innerWidth, window.innerHeight);
    cssRenderer.domElement.style.position = 'absolute';
    cssRenderer.domElement.style.top = 0;
    document.querySelector('#css').appendChild(cssRenderer.domElement);
    
    // Example WebGL object (spinning cube)
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshPhongMaterial({ color: 0x0000ff });
    const cube = new THREE.Mesh(geometry, material);
    cube.scale.set(100, 100, 100);
    cube.position.set(50, 100, -250);
    scene.add(cube);
    
    const light = new THREE.PointLight(0xffffff,10000000.0);
    light.position.set(0, -200, -100);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040));
    
    camera.position.z = 0;
    
    // Map of slides (CSS content) with their positions and order,
    // but they will be added to cssScene.
    const slides = [
        { name: 'slide01.html', position: new THREE.Vector3(0, 0, -200), rotation: new THREE.Euler(0, 0, 0) },
        { name: 'slide02.html', position: new THREE.Vector3(0, 600, -200), rotation: new THREE.Euler(0, 0, 0) },
        { name: 'slide03.html', position: new THREE.Vector3(0, 800, 0), rotation: new THREE.Euler(-Math.PI/2.0,0,0) },
        
        // Add more slides as needed
    ];
    
    let cameraTweenGroup = new TWEEN.Group();
    let currentSlideIndex = 0;
    
    // Function to load and populate a slide into the cssScene:
    async function loadSlide(slide) {
        const response = await fetch(`/slides/${slide.name}`);
        const slideContent = await response.text();
        
        const element = document.createElement('div');
        element.innerHTML = slideContent;
        element.classList.add('slide');
        const cssObject = new CSS3DObject(element);
        cssObject.position.copy(slide.position);
        cssObject.rotation.copy(slide.rotation);
        cssScene.add(cssObject);
    }
    
    // Load all slides into cssScene
    for (const slide of slides) {
        await loadSlide(slide);
    }
    
    // Function to tween the camera to the next slide (applies to main camera)
    function tweenToSlide(index) {
        const slide = slides[index];
        const slide_time = 1000;
        const distance = 200;
        
        // Create a forward vector (pointing along the default +Z axis)
        const forward = new THREE.Vector3(0, 0, 1);
        // Rotate the forward vector using the slide's rotation
        forward.applyEuler(slide.rotation).normalize();
        // Scale the rotated forward vector by 200 and add the slide's position to get the target camera position
        const targetCameraPosition = slide.position.clone().add(forward.multiplyScalar(distance));
        
        // Tween the camera's position to the computed target.
        cameraTweenGroup.add(new TWEEN.Tween(camera.position)
        .to({ 
            x: targetCameraPosition.x, 
            y: targetCameraPosition.y, 
            z: targetCameraPosition.z 
        }, slide_time)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .start());
        
        // Compute the target quaternion by having a dummy object look at the slide.
        const dummy = new THREE.Object3D();
        dummy.position.copy(targetCameraPosition);
        dummy.rotation.copy(slide.rotation);
        const targetQuaternion = dummy.quaternion.clone();
        const initialQuaternion = camera.quaternion.clone();
        let rotationTween = { t: 0 };
        cameraTweenGroup.add(new TWEEN.Tween(rotationTween)
        .to({ t: 1 }, slide_time)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate(() => {
            let result = initialQuaternion.clone().slerp(targetQuaternion, rotationTween.t)
            camera.quaternion.copy(result);
        })
        .start());
    }
    
    // Event listeners for key presses
    window.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowUp' || event.key === 'PageUp') {
            currentSlideIndex = (currentSlideIndex + 1) % slides.length;
            tweenToSlide(currentSlideIndex);
        } else if (event.key === 'ArrowDown' || event.key === 'PageDown') {
            currentSlideIndex = (currentSlideIndex - 1 + slides.length) % slides.length;
            tweenToSlide(currentSlideIndex);
        } else if (event.key === 'd' || event.key === 'D') {
            const dataURL = cssCanvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataURL;
            link.download = 'screenshot.png';
            link.click();
        }
    });
    
    // Post-processing setup for the main WebGL scene
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);
    const ditherPass = new ShaderPass(DitherShader);
    ditherPass.uniforms['amount'].value = 2.5; // Adjust dither amount
    ditherPass.uniforms['offset'].value = camera.position;
    composer.addPass(ditherPass);
    
    // Create a texture from the offscreen CSS canvas and map it onto a plane in the main scene
    const cssTexture = new THREE.CanvasTexture(cssCanvas);
    const cssMaterial = new THREE.MeshBasicMaterial({ map: cssTexture, transparent: false });
    const cssPlane = new THREE.PlaneGeometry(window.innerWidth, window.innerHeight);
    const cssMesh = new THREE.Mesh(cssPlane, cssMaterial);
    cssMesh.position.z = -1000; // Position behind your primary objects if needed
    scene.add(cssMesh);
    
    function animate(timestamp) {
        requestAnimationFrame(animate);
        cameraTweenGroup.update();
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
        
        // Render the CSS3D scene (only cssScene) into the offscreen canvas
        cssRenderer.render(cssScene, camera);
        cssTexture.image = cssCanvas;
        cssTexture.needsUpdate = true;
        
        // Render the main (WebGL) scene with post-processing
        composer.render();
    }
    
    animate();
    
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        cssRenderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
    });
}

init();