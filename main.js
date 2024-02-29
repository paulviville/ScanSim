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

const camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 30 );
camera.position.z = 2;

const orbit_controls = new OrbitControls(camera, renderer.domElement)

const axesHelper = new THREE.AxesHelper(1);
scene.add(axesHelper)

const grid0 = new THREE.GridHelper(1, 10)
scene.add(grid0);

const grid1 = new THREE.GridHelper(1, 10)
grid1.lookAt(0, 1, 0)
scene.add(grid1);

const ambient = new THREE.HemisphereLight( 0xffffff, 0x999999, 2 );
scene.add( ambient );

window.addEventListener('resize', function() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});


const loader = new GLTFLoader();
loader.load( './LeePerrySmith.glb', function ( gltf ) {

	const mesh = gltf.scene.children[ 0 ];
	// mesh.material.wireframe = true;
	mesh.scale.set(0.05, 0.05, 0.05)

	mesh.geometry.computeBoundsTree();
	console.log(mesh)

	let bvhHelper = new MeshBVHHelper(mesh)
	bvhHelper.color.set( 0xE91E63 );
	bvhHelper.depth = 20
	bvhHelper.update()
	console.log(bvhHelper)
	scene.add(bvhHelper)

	scene.add(mesh);
} );

const raycaster = new THREE.Raycaster;
raycaster.setFromCamera(new THREE.Vector2(0, 0), camera)

console.log(raycaster)

const lidarPos = new THREE.Vector3(-1, 0, 1);
lidarPos.normalize().multiplyScalar(0.7);
/// TODO create position from angle Z lidar/origin 

const lidar0 = new THREE.PerspectiveCamera( 50, 1.71, 0.5, 4 );
lidar0.position.copy(lidarPos);
lidar0.lookAt(0,0,0)
lidar0.updateMatrixWorld();

const lidar0Helper = new THREE.CameraHelper(lidar0);
lidar0Helper.update();
scene.add(lidar0Helper)

lidarPos.x *= -1;

const lidar1 = new THREE.PerspectiveCamera( 50, 1.71, 0.5, 4 );
lidar1.position.copy(lidarPos);
lidar1.lookAt(0,0,0)
lidar1.updateMatrixWorld();

const lidar1Helper = new THREE.CameraHelper(lidar1);
lidar1Helper.update();
scene.add(lidar1Helper)



window.helper = lidar0Helper
window.lidar0 = lidar0

function update (t)
{

	lidar0Helper.update();

}

function render()
{
	// renderer.render(scene, camera0);
	renderer.render(scene, camera);
}

function mainloop(t)
{
    update(t);
    render();
	requestAnimationFrame(mainloop);
}

mainloop(0);