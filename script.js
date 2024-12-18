import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Információs panel inicializálása
const infoPanel = document.getElementById('info-panel');
const hideInfoButton = document.getElementById('hide-info');

// Gomb eseménykezelő
hideInfoButton.addEventListener('click', () => {
    infoPanel.style.display = 'none';
});

// 'I' billentyű eseménykezelő
document.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() === 'i') {
        infoPanel.style.display = 'block';
    }
});

// Wait for the DOM and modules to load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the scene, camera, and renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const canvas = document.getElementById('torusCanvas');
    const renderer = new THREE.WebGLRenderer({ 
        canvas: canvas,
        antialias: true 
    });
    
    // Set renderer properties
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000);
    document.body.appendChild(renderer.domElement);

    // Camera setup
    camera.position.set(0, 20, 40);
    camera.lookAt(0, 0, 0);

    // Orbit controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;
    controls.zoomSpeed = 0.8;
    controls.minDistance = 20;
    controls.maxDistance = 100;

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 20, 30);
    scene.add(directionalLight);

    // Lemniscate curve class definition
    class LemniscateCurve {
        constructor(scale, majorRadius) {
            this.a = scale;
            this.R = majorRadius;
        }

        calculatePoint(t, rotation, vertical = false) {
            const denominator = 1 + Math.sin(t) * Math.sin(t);
            const x = (this.a * Math.cos(t)) / denominator;
            const y = (this.a * Math.sin(t) * Math.cos(t)) / denominator;
            const angle = (rotation * Math.PI) / 180;

            if (vertical) {
                const rotatedX = x * Math.cos(angle) + this.R;
                const rotatedY = x * Math.sin(angle);
                return new THREE.Vector3(rotatedX, rotatedY, y);
            } else {
                const rotatedX = x * Math.cos(angle) + this.R;
                const rotatedZ = x * Math.sin(angle);
                return new THREE.Vector3(rotatedX, y, rotatedZ);
            }
        }

        isValidPoint(point) {
            return !isNaN(point.x) && !isNaN(point.y) && !isNaN(point.z) &&
                   isFinite(point.x) && isFinite(point.y) && isFinite(point.z);
        }
    }

    // Initialize curve parameters
    const lemniscate = new LemniscateCurve(20, 10);
    const numRotations = 18;

    // Materials
    const horizontalLineMaterial = new THREE.LineBasicMaterial({ 
        color: 0x00ff00,
        linewidth: 2
    });
    const verticalLineMaterial = new THREE.LineBasicMaterial({ 
        color: 0xffd200,
        linewidth: 2
    });
    const pointMaterial = new THREE.PointsMaterial({ 
        color: 0xff0000,
        size: 0.5,
        sizeAttenuation: true
    });

    // Initialize point at the center
    const initialPoint = lemniscate.calculatePoint(-Math.PI/2, 0);
    const pointGeometry = new THREE.BufferGeometry();
    const pointPositions = new Float32Array([initialPoint.x, initialPoint.y, initialPoint.z]);
    pointGeometry.setAttribute('position', new THREE.Float32BufferAttribute(pointPositions, 3));
    const movingPoint = new THREE.Points(pointGeometry, pointMaterial);
    scene.add(movingPoint);

    // Animation state
    let currentRotation = 0;
    let currentT = -Math.PI/2;
    let isVertical = false;
    const horizontalCurves = [];
    const verticalCurves = [];
    let tempPoints = [];

    // Animation parameters
    const mainStepSize = 0.2;
    const subSteps = 8;
    const subStepSize = mainStepSize / (subSteps + 1);

    // Function to update point position
    function updatePointPosition(point) {
        if (!lemniscate.isValidPoint(point)) return;
        const positions = movingPoint.geometry.attributes.position.array;
        positions[0] = point.x;
        positions[1] = point.y;
        positions[2] = point.z;
        movingPoint.geometry.attributes.position.needsUpdate = true;
    }

    // Function to update or create curve
    function updateCurve() {
        if (tempPoints.length < 2) return;
        const curves = isVertical ? verticalCurves : horizontalCurves;
        if (curves[currentRotation]) {
            scene.remove(curves[currentRotation]);
        }
        const geometry = new THREE.BufferGeometry().setFromPoints(tempPoints);
        const line = new THREE.Line(geometry, isVertical ? verticalLineMaterial : horizontalLineMaterial);
        curves[currentRotation] = line;
        scene.add(line);
    }

    // Animation function
    function animate() {
        requestAnimationFrame(animate);
        
        if (currentRotation < numRotations) {
            for (let i = 0; i <= subSteps; i++) {
                const t = currentT + (i * subStepSize);
                const point = isVertical 
                    ? lemniscate.calculatePoint(t, currentRotation * 10, true)
                    : lemniscate.calculatePoint(t, currentRotation * 10);

                if (i === 0) {
                    updatePointPosition(point);
                }

                if (lemniscate.isValidPoint(point)) {
                    tempPoints.push(point.clone());
                    updateCurve();
                }
            }
            
            currentT += mainStepSize;
            
            if (currentT >= (3 * Math.PI) / 2) {
                currentT = -Math.PI/2;
                currentRotation++;
                tempPoints = [];
                
                if (currentRotation >= numRotations && !isVertical) {
                    isVertical = true;
                    currentRotation = 0;
                    currentT = -Math.PI/2;
                }
            }
        }

        controls.update();
        renderer.render(scene, camera);
    }

    // Handle window resize
    function handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }

    window.addEventListener('resize', handleResize);
    animate();
});
