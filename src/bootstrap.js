// global css
import './theme/theme.scss';
import {initScene, start} from './app/scenery';

/**
 * entrance code for SPA
 */
function main() {
    const scenery = initScene();
    document.body.appendChild(scenery.renderer.domElement);
    start(scenery);
}

document.addEventListener('DOMContentLoaded', main);
