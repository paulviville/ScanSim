import * as THREE from './three.module.js';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast, MeshBVHHelper } from './bhv.js';
import { GLTFLoader } from './GLTFLoader.js';
import { OrbitControls } from './CMapJS/Libs/OrbitsControls.js';
import { GUI } from './CMapJS/Libs/dat.gui.module.js';
import IncidenceGraph from './CMapJS/CMap/IncidenceGraph.js';
import Renderer from './CMapJS/Rendering/Renderer.js';


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

// const grid1 = new THREE.GridHelper(1, 10)
// grid1.lookAt(0, 1, 0)
// scene.add(grid1);

const ambient = new THREE.HemisphereLight( 0xffffff, 0x999999, 2 );
scene.add( ambient );

window.addEventListener('resize', function() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});

let mesh;
const loader = new GLTFLoader();
loader.load( './LeePerrySmith.glb', function ( gltf ) {

	mesh = gltf.scene.children[ 0 ];
	// mesh.material.wireframe = true;
	mesh.scale.set(0.05, 0.05, 0.05)

	mesh.geometry.computeBoundsTree();
	console.log(mesh)
	


	// let bvhHelper = new MeshBVHHelper(mesh)
	// bvhHelper.color.set( 0xE91E63 );
	// bvhHelper.depth = 20
	// bvhHelper.update()
	// console.log(bvhHelper)
	// scene.add(bvhHelper)

	scene.add(mesh);
} );

const raycaster = new THREE.Raycaster;
raycaster.setFromCamera(new THREE.Vector2(0, 0), camera)

console.log(raycaster)

const lidarPos = new THREE.Vector3(-0.5, -0.1, 1);
lidarPos.normalize().multiplyScalar(0.7);
/// TODO create position from angle Z lidar/origin 

const ratio = 1.71;
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


console.log(raycaster)
// console.log(raycaster.intersectObject(mesh))

window.raycaster = raycaster

window.helper = lidar0Helper
window.lidar0 = lidar0


const pointCloud = new IncidenceGraph()
pointCloud.createEmbedding(pointCloud.vertex)
const pointCloudPosition = pointCloud.addAttribute(pointCloud.vertex, "position");

const pointCloudRenderer = new Renderer(pointCloud);
pointCloudRenderer.vertices.create({size: 0.00036125}).addTo(scene);
console.log(pointCloudRenderer.vertices.mesh)

const pointCloud1 = new IncidenceGraph()
pointCloud1.createEmbedding(pointCloud1.vertex)
const pointCloud1Position = pointCloud1.addAttribute(pointCloud1.vertex, "position");

const pointCloud1Renderer = new Renderer(pointCloud1);
pointCloud1Renderer.vertices.create({size: 0.00036125, color: new THREE.Color(0x00FF00)}).addTo(scene);
console.log(pointCloud1Renderer.vertices.mesh)


function addPoint(p) {
	const v = pointCloud.addVertex();
	pointCloudPosition[v] = p;
}

function addPoint1(p) {
	const v = pointCloud1.addVertex();
	pointCloud1Position[v] = p;

}


function updatePoints() {
	console.log(pointCloud.nbCells(pointCloud.vertex))
	pointCloudRenderer.vertices.update();
	pointCloud1Renderer.vertices.update();
}

const guiParams = {
	pointer: new THREE.Vector2,
	showMesh: function() {
		mesh.visible = !mesh.visible;
	},
	filter: true,
	noise: false,
	accumulate: false,
	accumulation: 1,

	castRay: function() {
		raycaster.setFromCamera(this.pointer, lidar0);
		const intersections = raycaster.intersectObject(mesh);
		if(intersections[0]) {
			const point = intersections[0].point.clone()
			if(this.noise) {

				let dist = intersections[0].distance * (0.04 * Math.random() - 0.02);
				
				if(this.accumulate){
					for(let i = 1; i < this.accumulation; ++i) {
						dist += intersections[0].distance * (0.04 * Math.random() - 0.02);
					}
					dist /= this.accumulation;
				}

				const dir = raycaster.ray.direction.clone().multiplyScalar(dist);
				point.add(dir);
			}

			addPoint(point);
		}
		else {
			if(!this.filter)
				addPoint(raycaster.ray.origin.clone().addScaledVector(raycaster.ray.direction, 2))
		}
	},

	resolution: 200,

	castRayGrid: function () {
		const stepW = 2.0 / this.resolution;
		const stepH = stepW / ratio;
		for(let i = -1; i < 1; i += stepH) {
			for(let j = -1; j < 1; j += stepW) {
				this.pointer.set(i, j);
				this.castRay()
			}	
		}

		updatePoints()
	},

	castRay1: function() {
		raycaster.setFromCamera(this.pointer, lidar1);
		const intersections = raycaster.intersectObject(mesh);

		if(intersections[0]) {
			const point = intersections[0].point.clone()
			if(this.noise) {
				let dist = intersections[0].distance * (0.04 * Math.random() - 0.02);
				
				if(this.accumulate){
					for(let i = 1; i < this.accumulation; ++i) {
						dist += intersections[0].distance * (0.04 * Math.random() - 0.02);
					}
					dist /= this.accumulation;
				}

				const dir = raycaster.ray.direction.clone().multiplyScalar(dist);
				point.add(dir);
			}

			addPoint1(point);
		}
		else {
			if(!this.filter)
				addPoint1(raycaster.ray.origin.clone().addScaledVector(raycaster.ray.direction, 2))
		}
	},

	castRayGrid1: function () {
		const stepW = 2.0 / this.resolution;
		const stepH = stepW / ratio;
		for(let i = -1; i < 1; i += stepH) {
			for(let j = -1; j < 1; j += stepW) {
				this.pointer.set(i, j);
				this.castRay1()
			}	
		}

		updatePoints()
	}

	// function 
};

const gui = new GUI();
gui.add(guiParams, "showMesh")
gui.add(guiParams, "castRayGrid")
gui.add(guiParams, "castRayGrid1")
gui.add(guiParams, "filter")
gui.add(guiParams, "noise")
gui.add(guiParams, "accumulate")
gui.add(guiParams, "resolution", 100, 1000, 1);
gui.add(guiParams, "accumulation", 1, 1000, 1);
gui.add(guiParams.pointer, "x", -1, 1, 0.05);
gui.add(guiParams.pointer, "y", -1, 1, 0.05);








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