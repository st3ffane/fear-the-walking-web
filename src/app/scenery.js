import * as THREE from 'three';
import * as AR from 'jsartoolkit5';

/**
 * Initialise la scene 3D
 */
export function initScene() {
    // initialisation de la scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({color: 0xe3e3e3, wireframe: true});
    const cube_mesh = new THREE.Mesh(geometry, material);
    scene.add(cube_mesh);
    camera.position.z = 5;
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