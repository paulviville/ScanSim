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

const lidarPos = new THREE.Vector3(-0.75, -0.0, 1);
// const lidarPos = new THREE.Vector3(-0.5, -0.1, 1);
lidarPos.normalize().multiplyScalar(0.7);
/// TODO create position from angle Z lidar/origin 

const screen = {
	x: 160,
	y: 90,
}

const near = 0.5;
const far = 4;

const sphere = new THREE.Mesh(
	new THREE.SphereGeometry(0.05, 10, 10),
	new THREE.MeshLambertMaterial({color: 0xFF0000})
)
	sphere.geometry.computeBoundsTree();
sphere.position.copy(lidarPos).multiplyScalar(0.5);
scene.add(sphere)


const ratio = screen.x / screen.y;
const lidar0 = new THREE.PerspectiveCamera(58, ratio, near, far);
lidar0.position.copy(lidarPos);
lidar0.lookAt(0,0,0)
lidar0.updateMatrixWorld();

const lidar0Helper = new THREE.CameraHelper(lidar0);
lidar0Helper.update();
scene.add(lidar0Helper)

lidarPos.x *= -1;

const lidar1 = new THREE.PerspectiveCamera(58, ratio, near, far);
lidar1.position.copy(lidarPos);
lidar1.lookAt(0,0,0)
lidar1.updateMatrixWorld();
// lidar1.matrixWorld.copy(lidar0.matrixWorldInverse)



const lidar1Helper = new THREE.CameraHelper(lidar1);
lidar1Helper.update();
// scene.add(lidar1Helper)




console.log(lidar1)
console.log(raycaster)
// console.log(raycaster.intersectObject(mesh))

window.raycaster = raycaster

window.helper = lidar0Helper
window.lidar0 = lidar0

const pixelGrid = new IncidenceGraph();
pixelGrid.createEmbedding(pixelGrid.vertex)
const pixelGridPosition = pixelGrid.addAttribute(pixelGrid.vertex, "position");

const stepX = 2 / screen.x;
const stepY = 2 / screen.y;

for(let i = 0; i < screen.x; ++i) {
	for(let j = 0; j < screen.y; ++j) {
		const v = pixelGrid.addVertex(); // v = i * screen.y + j
		pixelGridPosition[v] = new THREE.Vector3(i * stepX - 1, j * stepY - 1, near);
	}	
}


const pixelGridRenderer = new Renderer(pixelGrid);
pixelGridRenderer.vertices.create({size: 0.0025}).addTo(scene);




const pointCloud = new IncidenceGraph()
pointCloud.createEmbedding(pointCloud.vertex)
const pointCloudPosition = pointCloud.addAttribute(pointCloud.vertex, "position");




const pointCloudRenderer = new Renderer(pointCloud);
pointCloudRenderer.vertices.create({size: 0.0036125}).addTo(scene);
console.log(pointCloudRenderer.vertices.mesh)

const pointCloud1 = new IncidenceGraph()
pointCloud1.createEmbedding(pointCloud1.vertex)
const pointCloud1Position = pointCloud1.addAttribute(pointCloud1.vertex, "position");

const pointCloud1Renderer = new Renderer(pointCloud1);
pointCloud1Renderer.vertices.create({size: 0.0036125, color: new THREE.Color(0x00FF00)}).addTo(scene);
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

	getPixelGrid0: function () {

		// lidar0.position.copy(camera.position);
		// lidar0.lookAt(0,0,0)
		// lidar0.updateMatrixWorld();
		for(let i = 0; i < screen.x; ++i) {
			for(let j = 0; j < screen.y; ++j) {
				this.pointer.set(i * stepX - 1, j * stepY - 1);
				raycaster.setFromCamera(this.pointer, lidar0);
				// const intersections = raycaster.intersectObjects([mesh, sphere]);
				const intersections = raycaster.intersectObject(mesh);
				const z = (intersections[0]?.distance || far);
				pixelGridPosition[i * screen.y + j].z = z;
				// pixelGridPosition[i * screen.y + j].z = (z - near) / (far-near) * 2 - 1;
				// pixelGridPosition[i * screen.y + j].z /= ;
				// console.log(z)
				// const o = raycaster.ray.origin.clone();
				// const r = raycaster.ray.direction.clone();
				// pixelGridPosition[i * screen.y + j].copy(
				// 	o.clone().addScaledVector(r, z)
				// )
			}	
		}
		pixelGridRenderer.vertices.update();
	},

	getPixelGrid1: function () {
		const N = lidar0.position.clone().multiplyScalar(-1).normalize();
		const O = lidar0.position.clone();

		// lidar0.position.copy(camera.position);
		// lidar0.lookAt(0,0,0)
		// lidar0.updateMatrixWorld();
		for(let i = 0; i < screen.x; ++i) {
			for(let j = 0; j < screen.y; ++j) {
				
				// // const intersections = raycaster.intersectObjects([mesh, sphere]);
				// const z = (intersections[0]?.distance || far);
				// // pixelGridPosition[i * screen.y + j].z = z;
				// pixelGridPosition[i * screen.y + j].z = (z - near) / (far-near) * 2 - 1;


				this.pointer.set(i * stepX - 1, j * stepY - 1);
				raycaster.setFromCamera(this.pointer, lidar0);
				const intersections = raycaster.intersectObject(mesh);
				if(!intersections[0])
					pixelGridPosition[i * screen.y + j].z = far;
				else {
					const pos = intersections[0].point.clone().sub(O);
					const dist = pos.dot(N);
					pixelGridPosition[i * screen.y + j].z = (dist - near) / (far-near) * 2 - 1;
					// pixelGridPosition[i * screen.y + j].z = dist;
				}

				
				
			}	
		}
		pixelGridRenderer.vertices.update();
	},

	convertGridToCloud: function() {
		const projection = lidar0.projectionMatrix.clone();
		const world = lidar0.matrixWorld.clone();
		// world.identity()

		const viewMatrix = world.clone().invert();
		const invViewMatrix = viewMatrix.clone().invert();
		const invProj = projection.clone().invert();

		const o = new THREE.Vector3().applyMatrix4(world);

		// invWorld.multiply(invProj);
		// invProj.multiply(invWorld);

		const invProjView = projection.clone().multiply(viewMatrix).invert();


		console.log(world)

		for(let i = 0; i < screen.x; ++i) {
			for(let j = 0; j < screen.y; ++j) {
				// v = i * screen.y + j
			
				const pixel = pixelGridPosition[i * screen.y + j].clone();


				// pixelGridPosition[i * screen.y + j].applyMatrix4(invProj)
				// pixelGridPosition[i * screen.y + j].applyMatrix4(world)

				const t = pixel.z;
				// pixel.z = (pixel.z - near) / (far-near) * 2 - 1;
				// pixel.z = -1;
				// const viewSpacePos = new THREE.Vector4(pixel.x, pixel.y, pixel.z, 1.0).applyMatrix4(invProj);
				// const worldSpacePos = viewSpacePos.clone().applyMatrix4(world);

				// const worldSpacePos = new THREE.Vector4(pixel.x, pixel.y, pixel.z, 1.0).applyMatrix4(invProj);
				// const worldSpacePos = new THREE.Vector4(pixel.x, pixel.y, pixel.z, 1.0).applyMatrix4(invWorld);
				const worldSpacePos = new THREE.Vector4(pixel.x, pixel.y, pixel.z, 1.0).applyMatrix4(invProjView);

				
				pixelGridPosition[i * screen.y + j].set(worldSpacePos.x, worldSpacePos.y, worldSpacePos.z)
				pixelGridPosition[i * screen.y + j].multiplyScalar(1 / worldSpacePos.w);



				// const dir = pixelGridPosition[i * screen.y + j].clone().sub(o);
				// dir.normalize();
				// pixelGridPosition[i * screen.y + j].copy(o).addScaledVector(dir, t)

				

				// pixelGridPosition[i * screen.y + j].applyMatrix4(invProj);
				// pixelGridPosition[i * screen.y + j].applyMatrix4(world);
				
			}	
		}

		pixelGridRenderer.vertices.update();

	},

	test: function() {

		const projection = lidar0.projectionMatrix.clone();
		const world = lidar0.matrixWorld.clone();
		// world.identity()

		const invWorld = world.clone().invert();
		const invProj = projection.clone().invert();
		pointCloud.foreach(pointCloud.vertex, v => {
			pointCloudPosition[v].applyMatrix4(invWorld);
			pointCloudPosition[v].applyMatrix4(projection);
			// pointCloudPosition[v].z = (pointCloudPosition[v].z + 1) / 2 * (far - near) + near// / 2 + near) * (far - near)
			// console.log(pointCloudPosition[v])
		});

		console.log(lidar0.position.distanceTo(sphere.position))
		sphere.position.applyMatrix4(invWorld)
		sphere.position.applyMatrix4(projection)
		sphere.z = ((sphere.z + 1) / 2 + near) * (far - near)
		console.log(sphere.position)
		updatePoints();
	},

	test2: function() {

		const projection = lidar0.projectionMatrix.clone();
		const world = lidar0.matrixWorld.clone();
		// world.identity()

		const invWorld = world.clone().invert();
		const invProj = projection.clone().invert();
		pointCloud.foreach(pointCloud.vertex, v => {
			pointCloudPosition[v].applyMatrix4(invProj);
			pointCloudPosition[v].applyMatrix4(world);
			// console.log(pointCloudPosition[v])
		});

		updatePoints();
	},

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
				addPoint(raycaster.ray.origin.clone().addScaledVector(raycaster.ray.direction, far))
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
gui.add(guiParams, "getPixelGrid0")
gui.add(guiParams, "getPixelGrid1")
gui.add(guiParams, "test")
gui.add(guiParams, "test2")
gui.add(guiParams, "convertGridToCloud")
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