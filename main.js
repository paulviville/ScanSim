import * as THREE from './three.module.js';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast, MeshBVHHelper } from './bhv.js';
import { GLTFLoader } from './GLTFLoader.js';
import { OrbitControls } from './CMapJS/Libs/OrbitsControls.js';

// Add the extension functions
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );


const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

const camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 100 );
camera.position.z = 10;

const orbit_controls = new OrbitControls(camera, renderer.domElement)

const axesHelper = new THREE.AxesHelper(100);
scene.add(axesHelper)

const ambient = new THREE.HemisphereLight( 0xffffff, 0x999999, 2 );
scene.add( ambient );

const loader = new GLTFLoader();
loader.load( './LeePerrySmith.glb', function ( gltf ) {

	const mesh = gltf.scene.children[ 0 ];
	console.log(mesh)

	scene.add(mesh);
} );


function update (t)
{

}

function render()
{
	renderer.render(scene, camera);
}

function mainloop(t)
{
    update(t);
    render();
	requestAnimationFrame(mainloop);
}

mainloop(0);