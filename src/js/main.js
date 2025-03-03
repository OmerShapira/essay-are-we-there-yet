async function init() {
    const THREE = await import('three');
    const { CSS3DRenderer, CSS3DObject } = await import('three/examples/jsm/renderers/CSS3DRenderer.js');
    const { default: TWEEN } = await import('@tweenjs/tween.js');
    const { EffectComposer } = await import('three/examples/jsm/postprocessing/EffectComposer.js');
    const { RenderPass } = await import('three/examples/jsm/postprocessing/RenderPass.js');
    const { ShaderPass } = await import('three/examples/jsm/postprocessing/ShaderPass.js');
    const { DitherShader } = await import('./shader.js');

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const cssRenderer = new CSS3DRenderer();
    cssRenderer.setSize(window.innerWidth, window.innerHeight);
    cssRenderer.domElement.style.position = 'absolute';
    cssRenderer.domElement.style.top = '0';
    document.body.appendChild(cssRenderer.domElement);

    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    cube.scale.set(100, 100, 100);
    cube.position.set(0, 0, -250);
    scene.add(cube);

    const light = new THREE.PointLight(0xffffff, 1, 1000);
    light.position.set(100,0,0);
    scene.add(light);

    camera.position.z = 0;

    // Map of slides with their positions and order
    const slides = [
        { name: 'slide01.html', position: new THREE.Vector3(0, 0, -200), rotation: new THREE.Euler(0, 0, 0) },
        { name: 'slide02.html', position: new THREE.Vector3(0, 600, -200), rotation: new THREE.Euler(0, 0, 0) },
        // Add more slides as needed
    ];

    let cameraTweenGroup = new TWEEN.Group();

    let currentSlideIndex = 0;

    // Function to load and populate a slide
    async function loadSlide(slide) {
        const response = await fetch(`/slides/${slide.name}`);
        const slideContent = await response.text();

        const element = document.createElement('div');
        element.innerHTML = slideContent;
        element.classList.add('slide');
        const cssObject = new CSS3DObject(element);
        cssObject.position.copy(slide.position);
        cssObject.rotation.copy(slide.rotation);
        scene.add(cssObject);
    }

    // Load all slides
    for (const slide of slides) {
        await loadSlide(slide);
    }

    // Function to tween the camera to the next slide
    function tweenToSlide(index) {
        const slide = slides[index];
        const slide_time = 1000;
        cameraTweenGroup.add(new TWEEN.Tween(camera.position)
            .to({ x: slide.position.x, y: slide.position.y, z: slide.position.z + 200 }, slide_time)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .start());

        cameraTweenGroup.add(new TWEEN.Tween(camera.rotation)
            .to({ x: slide.rotation.x, y: slide.rotation.y, z: slide.rotation.z }, slide_time)
            .easing(TWEEN.Easing.Quadratic.InOut)
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
        }
    });
    
    // Post-processing
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const ditherPass = new ShaderPass(DitherShader);
    ditherPass.uniforms['amount'].value = 0.5; // Adjust the dither amount as needed
    composer.addPass(ditherPass);

    function animate() {
        requestAnimationFrame(animate);
        cameraTweenGroup.update();
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
        // renderer.render(scene, camera);
        composer.render();
        cssRenderer.render(scene, camera);
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