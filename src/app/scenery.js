import * as THREE from 'three';
import * as AR from 'jsartoolkit5';

/**
 * Initialise la scene 3D
 */
export function initScene() {
    // initialisation de la scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderFcts = [];

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    // init AR
    const arToolkitSource = new AR.artoolkit.arToolkitSource({sourceType: 'webcam'});
    arToolkitSource.init(() => {
        arToolkitSource.onResize(renderer.domElement);
    });
    // change with window
    window.addEventListener('resize', () => {
        arToolkitSource.onResize(renderer.domElement);
    });
    // defini le context pour AR
    const arToolkitContext = new AR.artoolkit.arToolkitContext({
        cameraParameterUrl: 'data/camera_para.dat',
        detectionMode: 'mono',
        canvasWidth: 80 * 3,
        canvasHeight: 60 * 3
    });
    arToolkitContext.init(() => {
        camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
    });
    renderFcts.push(() => {
        if (arToolkitContext.ready === false) {
            return;
        }
        arToolkitContext.update(arToolkitSource.domElement);
    });
    const markerRoot = new THREE.Group();
    scene.add(markerRoot);
    // const arToolkitMarker = new AR.artoolkit.

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({color: 0xe3e3e3, wireframe: true});
    const cube_mesh = new THREE.Mesh(geometry, material);
    scene.add(cube_mesh);

    return {
        renderer,
        scene,
        camera,
        cube_mesh
    };
}

/**
 * lance la boucle d'affichage
 */
export function start(scenery) {

    /**
     * inner method: le render de l'application
     */
    function animate() {
        requestAnimationFrame(animate);
        const {renderer, scene, camera, cube_mesh} = scenery;
        cube_mesh.rotation.x += 0.01;
        cube_mesh.rotation.y += 0.01;
        renderer.render(scene, camera);
    }
    animate();
}