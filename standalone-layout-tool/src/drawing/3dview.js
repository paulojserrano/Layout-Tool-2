import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { calculateLayout, calculateElevationLayout } from '../calculations.js';
import { bomList } from '../dom.js';

let scene, camera, renderer, controls, animationId;

// State for visibility toggles
const visibilityState = {
    totes: true,
    uprights: true,
    beams: true,
    basePlates: false,
    anchors: false,
    crossbars: true,
    cantilevers: true,
    spacers: false,
    ties: false,
    pipes: false
};

// Track previous toggle state to handle resets
let previousDetailView = null;

// Mesh references for toggling
const meshRefs = {};

// Initialize the 3D Scene
export function init3DView(container) {
    if (renderer) return; // Already initialized

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    scene.fog = new THREE.Fog(0xf8fafc, 40000, 120000);

    // Camera
    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 100, 200000);
    camera.position.set(-20000, 15000, 20000);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.02;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xe2e8f0, 0.5);
    hemiLight.position.set(0, 20000, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(-15000, 30000, 10000);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 50000;
    dirLight.shadow.camera.bottom = -50000;
    dirLight.shadow.camera.left = -50000;
    dirLight.shadow.camera.right = 50000;
    dirLight.shadow.mapSize.width = 4096;
    dirLight.shadow.mapSize.height = 4096;
    dirLight.shadow.bias = -0.0002;
    scene.add(dirLight);

    // --- Floor ---
    const floorGeometry = new THREE.PlaneGeometry(200000, 200000);
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.8, metalness: 0.1 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, -5, 0);
    floor.receiveShadow = true;
    scene.add(floor);

    const gridHelper = new THREE.GridHelper(200000, 100, 0xcbd5e1, 0xe2e8f0);
    scene.add(gridHelper);

    // Handle Resize
    window.addEventListener('resize', () => {
        if (!container || !renderer) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}

// Geometry Helper
function createOpenToteGeometry(width, height, length, thickness) {
    const floorGeo = new THREE.BoxGeometry(width, thickness, length);
    floorGeo.translate(0, -height/2 + thickness/2, 0);

    const wallLGeo = new THREE.BoxGeometry(thickness, height, length);
    wallLGeo.translate(-width/2 + thickness/2, 0, 0);

    const wallRGeo = new THREE.BoxGeometry(thickness, height, length);
    wallRGeo.translate(width/2 - thickness/2, 0, 0);

    const wallFGeo = new THREE.BoxGeometry(width - 2*thickness, height, thickness);
    wallFGeo.translate(0, 0, length/2 - thickness/2);

    const wallBGeo = new THREE.BoxGeometry(width - 2*thickness, height, thickness);
    wallBGeo.translate(0, 0, -length/2 + thickness/2);

    return BufferGeometryUtils.mergeGeometries([floorGeo, wallLGeo, wallRGeo, wallFGeo, wallBGeo]);
}

// Clean up meshes
function clearScene() {
    for (let i = scene.children.length - 1; i >= 0; i--) {
        const obj = scene.children[i];
        const isLight = obj.isLight;
        const isCam = obj.isCamera;
        const isFloor = (obj.geometry && obj.geometry.type === 'PlaneGeometry' && obj.geometry.parameters.width > 10000);
        const isGrid = obj.type === 'GridHelper';

        if (!isLight && !isCam && !isFloor && !isGrid) {
            scene.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
        }
    }
    // Clear refs
    for (const key in meshRefs) delete meshRefs[key];
}

// --- Interaction Logic ---

function setVisibility(key, visible) {
    visibilityState[key] = visible;
    if (meshRefs[key]) meshRefs[key].visible = visible;

    // Checkbox sync
    const cb = bomList.querySelector(`input[data-key="${key}"]`);
    if (cb) cb.checked = visible;
}

function isolateItem(targetKey, isDetailMode) {
    // Check if we are currently isolated on this key (i.e., only this is true)
    const activeKeys = Object.keys(visibilityState).filter(k => visibilityState[k]);
    const isAlreadyIsolated = activeKeys.length === 1 && activeKeys[0] === targetKey;

    if (isAlreadyIsolated) {
        // Restore Default State
        restoreDefaultVisibility(isDetailMode);
    } else {
        // Isolate
        for (const key in visibilityState) {
            setVisibility(key, key === targetKey);
        }
    }
}

function restoreDefaultVisibility(isDetailMode) {
    // Core always on
    setVisibility('totes', true);
    setVisibility('uprights', true);
    setVisibility('beams', true);

    // Details based on mode
    const detailKeys = ['basePlates', 'anchors', 'crossbars', 'cantilevers', 'spacers', 'ties', 'pipes'];
    detailKeys.forEach(k => setVisibility(k, isDetailMode));
}

// Helper to update BOM
function updateBOM(stats, isDetailView) {
    if (!bomList) return;

    // Build Table Rows
    const createRow = (label, key, count, unit = '') => `
        <tr class="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors group">
            <td class="py-1.5 pl-1 pr-2">
                <input type="checkbox" data-key="${key}" ${visibilityState[key] ? 'checked' : ''} class="rounded text-blue-600 w-3 h-3 border-slate-300 focus:ring-0 cursor-pointer align-middle">
            </td>
            <td class="py-1.5 cursor-pointer font-medium text-slate-700 group-hover:text-blue-600 select-none isolate-trigger" data-key="${key}">
                ${label}
            </td>
            <td class="py-1.5 text-right font-mono font-bold text-slate-900">
                ${count.toLocaleString()}<span class="text-[10px] text-slate-400 ml-0.5 font-normal">${unit}</span>
            </td>
        </tr>
    `;

    bomList.innerHTML = `
        <table class="w-full text-xs">
            <tbody>
                ${createRow('Storage Totes', 'totes', stats.totes)}
                ${createRow('Uprights', 'uprights', stats.uprights)}
                ${createRow('Base Plates', 'basePlates', stats.basePlates)}
                ${createRow('Anchors', 'anchors', stats.anchors)}
                ${createRow('Step Beams', 'beams', stats.beams)}
                ${createRow('Crossbars', 'crossbars', stats.crossbars)}
                ${createRow('Cantilever CB', 'cantilevers', stats.cantilevers)}
                ${createRow('Spacers', 'spacers', stats.spacers)}
                ${createRow('Aisle Ties', 'ties', stats.ties)}
                ${createRow('Sprinkler Pipe', 'pipes', stats.pipeLength, 'm')}
            </tbody>
        </table>
    `;

    // Add Checkbox Listeners
    const checkboxes = bomList.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.addEventListener('change', (e) => {
            setVisibility(e.target.dataset.key, e.target.checked);
        });
    });

    // Add Label Listeners (Isolation)
    const labels = bomList.querySelectorAll('.isolate-trigger');
    labels.forEach(lbl => {
        lbl.addEventListener('click', (e) => {
            isolateItem(e.target.dataset.key, isDetailView);
        });
    });
}

// Main Draw Function
export function draw3DView(sysLength, sysWidth, sysHeight, config, solverResults, pathSettings, isDetailView = false) {
    if (!renderer) return;

    // Sync Visibility State on toggle switch logic
    if (isDetailView !== previousDetailView) {
        restoreDefaultVisibility(isDetailView);
        previousDetailView = isDetailView;
    }

    const layout = calculateLayout(sysLength, sysWidth, config, pathSettings);

    // Elevation Logic
    let numLevels = 0;
    let levelLayout = [];

    const coreElevationInputs = {
        WH: sysHeight,
        BaseHeight: config['base-beam-height'] || 0,
        BW: config['beam-width'] || 0,
        TH: config['tote-height'] || 0,
        MC: config['min-clearance'] || 0,
        OC: config['overhead-clearance'] || 0,
        SC: config['sprinkler-clearance'] || 0,
        ST: config['sprinkler-threshold'] || 0
    };
    const hasBufferLayer = config['hasBufferLayer'] || false;
    const elevResult = calculateElevationLayout(coreElevationInputs, false, hasBufferLayer);

    if (solverResults && solverResults.maxLevels > 0 && elevResult) {
        numLevels = solverResults.maxLevels;
        levelLayout = elevResult.levels.slice(0, numLevels);
    } else if (elevResult) {
        numLevels = elevResult.N;
        levelLayout = elevResult.levels;
    }

    if (numLevels === 0 || levelLayout.length === 0) {
        clearScene();
        return;
    }

    clearScene();

    // --- Params ---
    const toteWidth = config['tote-width'] || 0;
    const toteLength = config['tote-length'] || 0;
    const toteHeight = config['tote-height'] || 300;
    const toteThickness = 15;
    const toteQtyPerBay = config['tote-qty-per-bay'] || 1;
    const totesDeep = config['totes-deep'] || 1;
    const toteToTote = config['tote-to-tote-dist'] || 0;
    const toteToUpright = config['tote-to-upright-dist'] || 0;
    const toteBackToBack = config['tote-back-to-back-dist'] || 0;
    const uprightLength = config['upright-length'] || 0;
    const uprightWidth = config['upright-width'] || 0;
    const beamHeight = config['beam-width'] || 0;
    const beamThickness = 40;
    const hookAllowance = config['hook-allowance'] || 0;
    const flueSpace = config['rack-flue-space'] || 0;

    const layoutOffsetX_world = layout.layoutOffsetX_world;
    const layoutOffsetY_world = layout.layoutOffsetY_world;
    const setbackLeft = layout.setbackLeft;
    const setbackTop = layout.setbackTop;

    // --- Calculate Upright Height ---
    const topLevel = levelLayout[levelLayout.length - 1];
    const rackHeight = topLevel.toteTop + 200;

    // --- Spacer Calculation ---
    const spacerRatio = 6 / 9000;
    const numSpacersPerColumn = Math.ceil(rackHeight * spacerRatio);
    const spacerGap = rackHeight / (numSpacersPerColumn + 1);

    // --- Crossbar Calculation ---
    // 2 crossbars for <= 500mm length (e.g. 450), 3 for > 500 (e.g. 650)
    const numCrossbarsPerTote = (toteLength <= 500) ? 2 : 3;

    // --- Setup Instances Counts ---
    const totalBayPositions = layout.baysPerRack || 0;
    const numRows = layout.layoutItems.filter(i => i.type === 'rack').length;

    // Estimates for buffers
    const countTotes = layout.allBays.length * numLevels * toteQtyPerBay * totesDeep;
    const countUprights = numRows * (totalBayPositions + 1) * 4;
    const countBeams = layout.allBays.length * numLevels * 4;

    const countPlates = countUprights;
    const countTies = (numRows * totalBayPositions);
    const countPipes = (numRows * numLevels * totalBayPositions * 2);
    const countSpacers = (numRows * (totalBayPositions + 1) * numSpacersPerColumn);
    const countCrossbars = (countTotes * numCrossbarsPerTote);
    const countCantilevers = (layout.allBays.length * toteQtyPerBay * numCrossbarsPerTote);

    // --- Create Meshes ---
    const toteGeo = createOpenToteGeometry(toteWidth, toteHeight, toteLength, toteThickness);
    const toteMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.6, metalness: 0.1 });
    const toteMesh = new THREE.InstancedMesh(toteGeo, toteMat, countTotes + 5000);
    toteMesh.castShadow = true; toteMesh.receiveShadow = true;
    toteMesh.visible = visibilityState.totes;
    scene.add(toteMesh);
    meshRefs.totes = toteMesh;

    const uprightGeo = new THREE.BoxGeometry(uprightWidth, rackHeight, uprightLength);
    const uprightMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7, metalness: 0.3 });
    const uprightMesh = new THREE.InstancedMesh(uprightGeo, uprightMat, countUprights + 1000);
    uprightMesh.castShadow = true; uprightMesh.receiveShadow = true;
    uprightMesh.visible = visibilityState.uprights;
    scene.add(uprightMesh);
    meshRefs.uprights = uprightMesh;

    const standardClearOpening = layout.clearOpening;
    const stdBeamGeo = new THREE.BoxGeometry(beamThickness, beamHeight, standardClearOpening);
    const beamMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.6, metalness: 0.3 });
    const beamMesh = new THREE.InstancedMesh(stdBeamGeo, beamMat, countBeams + 5000);
    beamMesh.castShadow = true; beamMesh.receiveShadow = true;
    beamMesh.visible = visibilityState.beams;
    scene.add(beamMesh);
    meshRefs.beams = beamMesh;

    const plateGeo = new THREE.BoxGeometry(100, 10, 100);
    const plateMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.5 });
    const plateMesh = new THREE.InstancedMesh(plateGeo, plateMat, countPlates + 1000);
    plateMesh.visible = visibilityState.basePlates;
    scene.add(plateMesh);
    meshRefs.basePlates = plateMesh;

    const tieGeo = new THREE.BoxGeometry(100, 50, 50);
    const tieMat = new THREE.MeshStandardMaterial({ color: 0xfacc15 });
    const tieMesh = new THREE.InstancedMesh(tieGeo, tieMat, countTies + 500);
    tieMesh.visible = visibilityState.ties;
    scene.add(tieMesh);
    meshRefs.ties = tieMesh;

    const pipeGeo = new THREE.CylinderGeometry(25, 25, 100, 16);
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0xdc2626 });
    const pipeMesh = new THREE.InstancedMesh(pipeGeo, pipeMat, countPipes + 2000);
    pipeMesh.visible = visibilityState.pipes;
    scene.add(pipeMesh);
    meshRefs.pipes = pipeMesh;

    const spacerGeo = new THREE.BoxGeometry(100, 50, 50);
    const spacerMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });
    const spacerMesh = new THREE.InstancedMesh(spacerGeo, spacerMat, countSpacers + 500);
    spacerMesh.visible = visibilityState.spacers;
    scene.add(spacerMesh);
    meshRefs.spacers = spacerMesh;

    const crossbarGeo = new THREE.BoxGeometry(100, 15, 25);
    const crossbarMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.4 });
    const crossbarMesh = new THREE.InstancedMesh(crossbarGeo, crossbarMat, countCrossbars + 5000);
    crossbarMesh.visible = visibilityState.crossbars;
    scene.add(crossbarMesh);
    meshRefs.crossbars = crossbarMesh;

    // Cantilever Crossbar (Same visual as CB, just length differs logic)
    const cantiGeo = new THREE.BoxGeometry(100, 15, 25);
    const cantiMat = new THREE.MeshStandardMaterial({ color: 0x60a5fa, metalness: 0.2 });
    const cantiMesh = new THREE.InstancedMesh(cantiGeo, cantiMat, countCantilevers + 500);
    cantiMesh.visible = visibilityState.cantilevers;
    scene.add(cantiMesh);
    meshRefs.cantilevers = cantiMesh;

    // --- BOM Stats ---
    const bomStats = {
        totes: 0,
        uprights: 0,
        basePlates: 0,
        anchors: 0,
        beams: 0,
        crossbars: 0,
        cantilevers: 0,
        spacers: 0,
        ties: 0,
        pipeLength: 0
    };

    // --- Loop Variables ---
    const dummy = new THREE.Object3D();
    let idxTote = 0, idxUpright = 0, idxBeam = 0, idxPlate = 0, idxTie = 0, idxPipe = 0, idxSpacer = 0, idxCrossbar = 0, idxCanti = 0;

    const offsetX = -layout.totalLayoutWidth / 2;
    const offsetZ = -layout.totalRackLength_world / 2;
    const repeatingBayUnitWidth = layout.repeatingBayUnitWidth;
    const TUNNEL_ROUTING_HEIGHT = 6700;

    const layoutItems = layout.layoutItems || [];

    layoutItems.forEach((item, itemIndex) => {
        if (item.type !== 'rack') return;

        const rowX_world = item.x + offsetX;
        const rowZ_start_world = offsetZ;
        const rackDepth = item.width;

        const calculatedSingleDepth = (1 * toteWidth) + hookAllowance;
        let forceSingleDeep = false;
        if (Math.abs(rackDepth - calculatedSingleDepth) < 50) forceSingleDeep = true;

        const currentTotesDeep = forceSingleDeep ? 1 : totesDeep;

        // --- SHARED UPRIGHTS ---
        const numBaysInRow = layout.baysPerRack;
        if (numBaysInRow === 0) return;

        const uprightXOffsets = [];
        uprightXOffsets.push(uprightWidth / 2);

        let spacerX_Center = 0;
        let hasSpacers = false;

        if (item.rackType === 'double') {
            const singleRackWidth = (rackDepth - flueSpace) / 2;
            uprightXOffsets.push(singleRackWidth - (uprightWidth / 2));
            uprightXOffsets.push(singleRackWidth + flueSpace + (uprightWidth / 2));
            uprightXOffsets.push(rackDepth - (uprightWidth / 2));

            spacerX_Center = singleRackWidth + (flueSpace/2);
            hasSpacers = true;
        } else {
            uprightXOffsets.push(rackDepth - (uprightWidth / 2));
        }

        for (let i = 0; i <= numBaysInRow; i++) {
            const uprightZ = rowZ_start_world + (i * repeatingBayUnitWidth) + (uprightLength / 2);

            uprightXOffsets.forEach(xOffset => {
                const uX = rowX_world + xOffset;

                // Upright
                dummy.scale.set(1, 1, 1); dummy.rotation.set(0, 0, 0);
                dummy.position.set(uX, rackHeight / 2, uprightZ);
                dummy.updateMatrix(); uprightMesh.setMatrixAt(idxUpright++, dummy.matrix);

                bomStats.uprights++;
                bomStats.basePlates++;
                bomStats.anchors += 2;

                // --- BASE PLATES ---
                const plateShift = (100 - uprightWidth) / 2;
                let shiftAmt = 0;
                if (Math.abs(xOffset - (uprightWidth/2)) < 1) shiftAmt = plateShift;
                else if (Math.abs(xOffset - (rackDepth - uprightWidth/2)) < 1) shiftAmt = -plateShift;
                else shiftAmt = 0;

                dummy.position.set(uX + shiftAmt, 5, uprightZ);
                dummy.updateMatrix(); plateMesh.setMatrixAt(idxPlate++, dummy.matrix);
            });

            // --- SPACERS (Back-to-Back) ---
            if (hasSpacers) {
                const spacerXPos = rowX_world + spacerX_Center;
                const scaleX = flueSpace / 100;

                for (let s = 1; s <= numSpacersPerColumn; s++) {
                    bomStats.spacers++;
                    const sY = s * spacerGap;
                    dummy.rotation.set(0, 0, 0);
                    dummy.scale.set(scaleX, 1, 1);
                    dummy.position.set(spacerXPos, sY, uprightZ);
                    dummy.updateMatrix(); spacerMesh.setMatrixAt(idxSpacer++, dummy.matrix);
                }
            }
        }

        // --- AISLE TIES ---
        if (itemIndex + 2 < layoutItems.length) {
            const nextItem = layoutItems[itemIndex + 1];
            const nextNextItem = layoutItems[itemIndex + 2];

            if (nextItem.type === 'aisle' && nextNextItem.type === 'rack') {
                const tieStartX = rowX_world + rackDepth - (uprightWidth / 2);
                const tieEndX = nextNextItem.x + offsetX + (uprightWidth / 2);

                const dist = tieEndX - tieStartX;
                const midX = (tieStartX + tieEndX) / 2;

                for (let i = 0; i <= numBaysInRow; i++) {
                    bomStats.ties++;
                    const tieZ = rowZ_start_world + (i * repeatingBayUnitWidth) + (uprightLength / 2);
                    dummy.rotation.set(0, 0, 0);
                    dummy.position.set(midX, rackHeight, tieZ);
                    dummy.scale.set(dist / 100, 1, 1);
                    dummy.updateMatrix();
                    tieMesh.setMatrixAt(idxTie++, dummy.matrix);
                }
            }
        }

        // --- SPRINKLER PIPES ---
        const baysInThisRow = layout.allBays.filter(b => b.row === item.row);
        const pipeX = rowX_world + (rackDepth / 2);

        for (let l = 0; l < numLevels; l++) {
            const levelInfo = levelLayout[l];
            if (levelInfo.sprinklerAdded > 0) {

                const standardPipeY = levelInfo.toteTop + config['min-clearance'] + (config['sprinkler-clearance'] / 2);
                let previousPipeY = standardPipeY;

                for (let i = 0; i < numBaysInRow; i++) {
                    const currentBay = baysInThisRow.find(b => b.bay === i);
                    const isTunnel = currentBay && currentBay.bayType === 'tunnel';

                    let currentPipeY = standardPipeY;
                    if (isTunnel && standardPipeY < 6500) {
                        currentPipeY = TUNNEL_ROUTING_HEIGHT;
                    }

                    const zCenterStart = rowZ_start_world + (i * repeatingBayUnitWidth) + (uprightLength / 2);
                    const zCenterEnd = rowZ_start_world + ((i + 1) * repeatingBayUnitWidth) + (uprightLength / 2);
                    const segLength = zCenterEnd - zCenterStart;

                    bomStats.pipeLength += (segLength / 1000);

                    const zMid = (zCenterStart + zCenterEnd) / 2;
                    dummy.rotation.set(Math.PI / 2, 0, 0);
                    dummy.position.set(pipeX, currentPipeY, zMid);
                    dummy.scale.set(1, segLength / 100, 1);
                    dummy.updateMatrix();
                    pipeMesh.setMatrixAt(idxPipe++, dummy.matrix);

                    if (i > 0 && Math.abs(currentPipeY - previousPipeY) > 1) {
                        const vertLen = Math.abs(currentPipeY - previousPipeY);
                        bomStats.pipeLength += (vertLen / 1000);

                        const vertY = (currentPipeY + previousPipeY) / 2;
                        const vertZ = zCenterStart;
                        dummy.rotation.set(0, 0, 0);
                        dummy.position.set(pipeX, vertY, vertZ);
                        dummy.scale.set(1, vertLen / 100, 1);
                        dummy.updateMatrix();
                        pipeMesh.setMatrixAt(idxPipe++, dummy.matrix);
                    }
                    previousPipeY = currentPipeY;
                }
            }
        }

        // --- BAYS (Beams, Totes, Crossbars) ---
        baysInThisRow.forEach(bay => {
            const bayZ = (bay.y - layout.setbackTop - layout.layoutOffsetY_world) + offsetZ;
            const bayX = rowX_world + (rackDepth/2);

            const isTunnel = bay.bayType === 'tunnel';
            const isBackpack = bay.bayType === 'backpack';

            const bayLen = (toteQtyPerBay * toteLength) + (2 * toteToUpright) + ((toteQtyPerBay-1) * toteToTote);

            // Determine Crossbar Multiplier
            const numCB = (toteLength <= 500) ? 2 : 3;

            for (let l = 0; l < numLevels; l++) {
                const levelInfo = levelLayout[l];

                if (isTunnel && levelInfo.beamBottom < 6500) continue;
                if (isBackpack && hasBufferLayer && levelInfo.levelLabel === 'B') continue;

                const beamY = levelInfo.beamBottom + (beamHeight/2);
                const isBufferLayer = (levelInfo.levelLabel === 'B');

                // --- BEAMS, CROSSBARS & CANTILEVERS ---

                // Add Standard Crossbars
                const addCrossbars = (centerX, span) => {
                    const firstToteZ = (bayZ - (bayLen/2)) + toteToUpright + (toteLength/2);
                    for (let tZ = 0; tZ < toteQtyPerBay; tZ++) {
                        const toteCenterZ = firstToteZ + (tZ * (toteLength + toteToTote));
                        bomStats.crossbars += numCB;

                        const offsets = (numCB === 2) ? [-toteLength/4, toteLength/4] : [-toteLength/3, 0, toteLength/3];
                        offsets.forEach(zOff => {
                            dummy.rotation.set(0, 0, 0);
                            dummy.position.set(centerX, beamY, toteCenterZ + zOff);
                            dummy.scale.set(span / 100, 1, 1);
                            dummy.updateMatrix();
                            crossbarMesh.setMatrixAt(idxCrossbar++, dummy.matrix);
                        });
                    }
                };

                // Add Cantilever Crossbars (Level B)
                // anchorX is the inner face of the aisle-facing beam
                const addCantilevers = (anchorX, direction) => {
                    const firstToteZ = (bayZ - (bayLen/2)) + toteToUpright + (toteLength/2);
                    const cantiLen = toteLength + 50;

                    for (let tZ = 0; tZ < toteQtyPerBay; tZ++) {
                        const toteCenterZ = firstToteZ + (tZ * (toteLength + toteToTote));
                        bomStats.cantilevers += numCB;

                        const offsets = (numCB === 2) ? [-toteLength/4, toteLength/4] : [-toteLength/3, 0, toteLength/3];
                        offsets.forEach(zOff => {
                            // Anchor is at one end. direction is +/- 1.
                            // Center is at anchor + (dir * len/2)
                            const centerX = anchorX + (direction * cantiLen / 2);

                            dummy.rotation.set(0, 0, 0);
                            dummy.position.set(centerX, beamY, toteCenterZ + zOff);
                            dummy.scale.set(cantiLen / 100, 1, 1);
                            dummy.updateMatrix();
                            cantiMesh.setMatrixAt(idxCanti++, dummy.matrix);
                        });
                    }
                };

                // --- BEAM & CB GENERATION PER SUB-RACK ---
                const singleRackWidth = (item.rackType === 'double') ? (rackDepth - flueSpace) / 2 : rackDepth;

                // Helper to calculate beam coordinates for THIS specific bay/subrack
                // We don't want to draw the whole double rack if we are just processing subId 1.

                let beamFrontX, beamBackX;
                let cantiAnchorX, cantiDir;
                let cbCenterX, cbSpan;

                if (item.rackType === 'single') {
                    // Single Rack
                    beamFrontX = rowX_world + (uprightWidth/2) + (beamThickness/2);
                    beamBackX = rowX_world + rackDepth - (uprightWidth/2) - (beamThickness/2);

                    cbSpan = rackDepth - uprightWidth - (2*beamThickness);
                    cbCenterX = rowX_world + (rackDepth/2);

                    // Cantilever Direction:
                    // If First Row (index 0) -> Aisle Right -> Anchor Back -> Dir Left (-1)
                    // If Last Row (index N) -> Aisle Left -> Anchor Front -> Dir Right (+1)
                    // Else (Middle Single?) Assume Aisle Left -> Dir Right (+1)
                    if (itemIndex === 0) {
                        cantiAnchorX = beamBackX - (beamThickness/2); // Inner Face of Back Beam
                        cantiDir = -1;
                    } else {
                        cantiAnchorX = beamFrontX + (beamThickness/2); // Inner Face of Front Beam
                        cantiDir = 1;
                    }

                } else {
                    // Double Rack
                    if (bay.rackSubId === 1) {
                        // Left Unit
                        beamFrontX = rowX_world + (uprightWidth/2) + (beamThickness/2);
                        beamBackX = rowX_world + singleRackWidth - (uprightWidth/2) - (beamThickness/2);

                        cbSpan = singleRackWidth - uprightWidth - (2*beamThickness);
                        cbCenterX = rowX_world + (singleRackWidth/2);

                        // Aisle Left -> Anchor Front -> Dir Right (+1)
                        cantiAnchorX = beamFrontX + (beamThickness/2);
                        cantiDir = 1;

                    } else {
                        // Right Unit (SubId 2)
                        beamFrontX = rowX_world + singleRackWidth + flueSpace + (uprightWidth/2) + (beamThickness/2);
                        beamBackX = rowX_world + rackDepth - (uprightWidth/2) - (beamThickness/2);

                        cbSpan = singleRackWidth - uprightWidth - (2*beamThickness);
                        cbCenterX = rowX_world + singleRackWidth + flueSpace + (singleRackWidth/2);

                        // Aisle Right -> Anchor Back -> Dir Left (-1)
                        cantiAnchorX = beamBackX - (beamThickness/2);
                        cantiDir = -1;
                    }
                }

                // Draw Beams
                bomStats.beams += 2; // 2 beams per bay level (regardless of single/double context because we run per sub-id)

                dummy.scale.set(1, 1, 1); dummy.rotation.set(0, 0, 0);
                dummy.position.set(beamFrontX, beamY, bayZ);
                if (Math.abs(bayLen - standardClearOpening) > 1) dummy.scale.set(1, 1, bayLen / standardClearOpening);
                dummy.updateMatrix(); beamMesh.setMatrixAt(idxBeam++, dummy.matrix);

                dummy.position.set(beamBackX, beamY, bayZ);
                dummy.updateMatrix(); beamMesh.setMatrixAt(idxBeam++, dummy.matrix);

                // Draw Crossbars / Cantilevers
                if (isBufferLayer) {
                    if (!isTunnel && !isBackpack) {
                        addCantilevers(cantiAnchorX, cantiDir);
                    }
                } else {
                    addCrossbars(cbCenterX, cbSpan);
                }

                // --- TOTES ---
                if (!isBufferLayer) {
                    const toteY = levelInfo.toteTop - (toteHeight/2);
                    const firstToteZ = (bayZ - (bayLen/2)) + toteToUpright + (toteLength/2);

                    let frontFaceX = 0;
                    let depthDir = 1;

                    if (item.rackType === 'single') {
                        frontFaceX = rowX_world;
                        depthDir = 1;
                    } else {
                        if (bay.rackSubId === 1) {
                            frontFaceX = rowX_world;
                            depthDir = 1;
                        } else {
                            frontFaceX = rowX_world + rackDepth;
                            depthDir = -1;
                        }
                    }

                    for (let tZ = 0; tZ < toteQtyPerBay; tZ++) {
                        const zPos = firstToteZ + (tZ * (toteLength + toteToTote));
                        for (let tX = 0; tX < currentTotesDeep; tX++) {
                            bomStats.totes++;
                            const dist = (toteWidth/2) + (tX * (toteWidth + toteBackToBack));
                            const xPos = frontFaceX + (depthDir * dist);
                            dummy.scale.set(1,1,1);
                            dummy.rotation.set(0,0,0);
                            dummy.position.set(xPos, toteY, zPos);
                            dummy.updateMatrix();
                            toteMesh.setMatrixAt(idxTote++, dummy.matrix);
                        }
                    }
                }
            }
        });
    });

    // Finalize BOM Stats
    bomStats.pipeLength = Math.ceil(bomStats.pipeLength);
    updateBOM(bomStats, isDetailView);

    // Cleanup
    toteMesh.count = idxTote;
    uprightMesh.count = idxUpright;
    beamMesh.count = idxBeam;
    toteMesh.instanceMatrix.needsUpdate = true;
    uprightMesh.instanceMatrix.needsUpdate = true;
    beamMesh.instanceMatrix.needsUpdate = true;

    plateMesh.count = idxPlate;
    tieMesh.count = idxTie;
    pipeMesh.count = idxPipe;
    spacerMesh.count = idxSpacer;
    crossbarMesh.count = idxCrossbar;
    cantiMesh.count = idxCanti;

    plateMesh.instanceMatrix.needsUpdate = true;
    tieMesh.instanceMatrix.needsUpdate = true;
    pipeMesh.instanceMatrix.needsUpdate = true;
    spacerMesh.instanceMatrix.needsUpdate = true;
    crossbarMesh.instanceMatrix.needsUpdate = true;
    cantiMesh.instanceMatrix.needsUpdate = true;

    if (controls) {
        controls.target.set(0, 0, 0);
        controls.update();
    }
}

export function animate3D() {
    animationId = requestAnimationFrame(animate3D);
    if (controls) controls.update();
    if (renderer && scene && camera) renderer.render(scene, camera);
}

export function stopAnimate3D() {
    if (animationId) cancelAnimationFrame(animationId);
}