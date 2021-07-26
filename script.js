import './style.css'
import * as dat from 'dat.gui'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { BufferAttribute } from 'three'
import firefliesVertexShader from './shaders/fireflies/vertex.glsl'
import portalVertexShader from './shaders/portal/vertex.glsl'
import firefliesFragmentShader from './shaders/fireflies/fragment.glsl'
import portalFragmentShader from './shaders/portal/fragment.glsl'
/**
 * Base
 */


// Debug
const debugObject = {
    uTime: { value: 0 }
}
const gui = new dat.GUI({
    width: 400
})

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader()

// Draco loader
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('draco/')

// GLTF loader
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

/**
 * Object
 */
// Textures
const bakedTexture = textureLoader.load('baked.jpg')
bakedTexture.flipY = false
bakedTexture.encoding = THREE.sRGBEncoding

const bakedMaterial = new THREE.MeshBasicMaterial( { map: bakedTexture })

const poleLightMaterial = new THREE.MeshBasicMaterial( {color: 0xffffe5 } )
const portalLightMaterial = new THREE.ShaderMaterial( {
    uniforms: {
        uTime: { value: 0 },
        uColorStart: {value: new THREE.Color(0xff0000)},
        uColorEnd: {value: new THREE.Color(0x0000ff)}
    },
    fragmentShader: portalFragmentShader,
    vertexShader: portalVertexShader    
} )
debugObject.uColorStart = '#ff0000'
debugObject.uColorEnd = '#0000ff'
gui.addColor(debugObject, 'uColorStart').name('startColor').onChange(()=>{
    portalLightMaterial.uniforms.uColorStart.value.set(debugObject.uColorStart)
})
gui.addColor(debugObject, 'uColorEnd').name('colorEnd').onChange(()=>{
    portalLightMaterial.uniforms.uColorEnd.value.set(debugObject.uColorEnd)
})
// Model
gltfLoader.load(
    'portal.glb',
    (gltf)=>{
        gltf.scene.traverse(child => {
            if(child.name == 'poleLight1' ||
             child.name == 'poleLight2') child.material = poleLightMaterial
            else if(child.name == 'portalLight' ) child.material = portalLightMaterial 
            else child.material = bakedMaterial
        })
        scene.add(gltf.scene)
    }
)
// Fireflies
const firefliesGeometry = new THREE.BufferGeometry()
const firefliesCount = 50
const positionArray = new Float32Array(firefliesCount * 3)
const scalesArray = new Float32Array(firefliesCount * 3)

for(let i=0; i<firefliesCount; i++) {
    positionArray[i*3] = (Math.random()-0.5) * 4
    positionArray[i*3 + 1] = Math.random()  * 2
    positionArray[i*3 + 2] = (Math.random()-0.5) *4

    scalesArray[i] = Math.random()
}
firefliesGeometry.setAttribute('position', new BufferAttribute(positionArray,3))
firefliesGeometry.setAttribute('aScale', new BufferAttribute(scalesArray,1))

// Material
const firefliesMaterial = new THREE.ShaderMaterial(
    { 
        uniforms: {
            uTime: { value: 0 },
            uPixelRatio : { value: Math.min(window.devicePixelRatio,2) },
            uSize: { value : 100 }
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fragmentShader: firefliesFragmentShader, 
        vertexShader: firefliesVertexShader
    })
gui.add(firefliesMaterial.uniforms.uSize, 'value').min(0.2).max(200).step(0.001).name('uSize')

const fireflies = new THREE.Points(firefliesGeometry,firefliesMaterial)
scene.add(fireflies)
/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    // Update fireflies
    firefliesMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio,2)
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 4
camera.position.y = 2
camera.position.z = 4
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputEncoding = THREE.sRGBEncoding

debugObject.clearColor = '#201919'
renderer.setClearColor(debugObject.clearColor)
gui.addColor(debugObject, 'clearColor').onChange(()=> {
    renderer.setClearColor(debugObject.clearColor)
})
/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Update controls
    controls.update()

    // Update uTime
    firefliesMaterial.uniforms.uTime.value = elapsedTime
    portalLightMaterial.uniforms.uTime.value = elapsedTime
    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()