// Spacio - 3D Urban Planning Tool
// Main JavaScript file

// Global variables
let scene, camera, renderer, controls;
let buildings = [];
let gridHelper, terrain;
let isDrawingTerrain = false;
let terrainStartPoint = null;

// Mapbox variables
let map, draw, currentPlot;
let buildingFootprints = [];

// Initialize the 3D scene
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // Create camera
    camera = new THREE.PerspectiveCamera(
        60, // Field of view
        window.innerWidth / window.innerHeight, // Aspect ratio
        0.1, // Near clipping plane
        1000 // Far clipping plane
    );
    camera.position.set(50, 50, 50);
    camera.lookAt(0, 0, 0);

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth - 220, window.innerHeight); // Adjust for sidebar
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Add renderer to DOM
    const viewport = document.getElementById('viewport');
    viewport.appendChild(renderer.domElement);

    // Add orbit controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 10;
    controls.maxDistance = 500;
    controls.maxPolarAngle = Math.PI / 2;

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Add directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    scene.add(directionalLight);

    // Add grid helper
    gridHelper = new THREE.GridHelper(200, 20, 0x888888, 0xcccccc);
    scene.add(gridHelper);

    // Create ground plane
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0xdddddd,
        roughness: 0.8,
        metalness: 0.2,
        side: THREE.DoubleSide
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Window resize handler
    window.addEventListener('resize', onWindowResize);

    // Load buildings from API
    fetchBuildings();

    // Add event listeners
    addEventListeners();

    // Start animation loop
    animate();
}

// Fetch buildings from API
function fetchBuildings() {
    fetch('/api/buildings')
        .then(response => response.json())
        .then(data => {
            data.forEach(buildingData => {
                createBuilding(buildingData);
            });
        })
        .catch(error => console.error('Error fetching buildings:', error));
}

// Create a building from data
function createBuilding(data) {
    const { position, dimensions, style, floors, roofType = 'flat', hasSubVolumes = false } = data;
    
    // Create building group to hold all building parts
    const buildingGroup = new THREE.Group();
    buildingGroup.position.set(position.x, 0, position.z);
    
    // Main building dimensions
    const width = dimensions.width;
    const height = dimensions.height;
    const length = dimensions.length;
    
    // Create materials based on style
    let mainMaterial, accentMaterial, roofMaterial, glassMaterial;
    
    switch (style) {
        case 'modern':
            mainMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x4361ee,
                roughness: 0.3,
                metalness: 0.2
            });
            accentMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x3a0ca3,
                roughness: 0.4,
                metalness: 0.3
            });
            roofMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x333333,
                roughness: 0.6,
                metalness: 0.1
            });
            glassMaterial = new THREE.MeshStandardMaterial({
                color: 0xadd8e6,
                metalness: 0.9,
                roughness: 0.1,
                transparent: true,
                opacity: 0.7
            });
            break;
        case 'corporate':
            mainMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x3a86ff,
                roughness: 0.2,
                metalness: 0.4
            });
            accentMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x0077b6,
                roughness: 0.3,
                metalness: 0.5
            });
            roofMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x222222,
                roughness: 0.6,
                metalness: 0.2
            });
            glassMaterial = new THREE.MeshStandardMaterial({
                color: 0x90e0ef,
                metalness: 0.9,
                roughness: 0.1,
                transparent: true,
                opacity: 0.8
            });
            break;
        case 'residential':
            mainMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xe76f51,
                roughness: 0.7,
                metalness: 0.1
            });
            accentMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xf4a261,
                roughness: 0.8,
                metalness: 0.1
            });
            roofMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x774936,
                roughness: 0.7,
                metalness: 0.1
            });
            glassMaterial = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                metalness: 0.6,
                roughness: 0.2,
                transparent: true,
                opacity: 0.6
            });
            break;
        default:
            mainMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x999999,
                roughness: 0.5,
                metalness: 0.2
            });
            accentMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x777777,
                roughness: 0.5,
                metalness: 0.2
            });
            roofMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x444444,
                roughness: 0.6,
                metalness: 0.1
            });
            glassMaterial = new THREE.MeshStandardMaterial({
                color: 0xadd8e6,
                metalness: 0.8,
                roughness: 0.2,
                transparent: true,
                opacity: 0.7
            });
    }
    
    // Create the main building volume
    const mainVolume = createBuildingVolume(width, height, length, mainMaterial, roofMaterial, roofType);
    mainVolume.position.y = height / 2;
    buildingGroup.add(mainVolume);
    
    // Create facade system based on style
    createFacadeSystem(mainVolume, width, height, length, floors, style, glassMaterial);
    
    // Add secondary volumes if specified
    if (hasSubVolumes) {
        const subVolumesCount = Math.floor(Math.random() * 3) + 1; // 1-3 additional volumes
        
        for (let i = 0; i < subVolumesCount; i++) {
            // Calculate a random size proportional to the main building
            const subWidth = width * (0.3 + Math.random() * 0.4); // 30-70% of main width
            const subHeight = height * (0.2 + Math.random() * 0.3); // 20-50% of main height
            const subLength = length * (0.3 + Math.random() * 0.4); // 30-70% of main length
            
            // Random position on top of the main building
            const xOffset = (width - subWidth) * (Math.random() - 0.5);
            const zOffset = (length - subLength) * (Math.random() - 0.5);
            
            // Create subvolume with either main or accent material
            const material = Math.random() > 0.5 ? mainMaterial : accentMaterial;
            const subVolume = createBuildingVolume(subWidth, subHeight, subLength, material, roofMaterial, 'flat');
            subVolume.position.set(xOffset, height + subHeight / 2, zOffset);
            
            // Create windows for this volume too
            createFacadeSystem(subVolume, subWidth, subHeight, subLength, Math.max(1, Math.floor(subHeight / 3)), style, glassMaterial);
            
            buildingGroup.add(subVolume);
        }
    }
    
    // Add metadata to the building group
    buildingGroup.userData = {
        id: data.id,
        name: data.name,
        floors: floors,
        style: style,
        roofType: roofType,
        dimensions: {
            width: width,
            height: height,
            length: length
        }
    };
    
    // Enable shadows
    buildingGroup.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
    
    // Add to scene and buildings array
    scene.add(buildingGroup);
    buildings.push(buildingGroup);
    
    return buildingGroup;
}

// Create a building volume with the specified roof type
function createBuildingVolume(width, height, length, material, roofMaterial, roofType) {
    const buildingGroup = new THREE.Group();
    
    // Create main body of the building
    let mainHeight = height;
    let roofHeight = 0;
    
    // Adjust height based on roof type
    if (roofType === 'pitched' || roofType === 'hipped') {
        roofHeight = height * 0.2; // Roof is 20% of total height
        mainHeight = height - roofHeight;
    }
    
    // Create main building body
    const bodyGeometry = new THREE.BoxGeometry(width, mainHeight, length);
    const bodyMesh = new THREE.Mesh(bodyGeometry, material);
    bodyMesh.position.y = 0;
    buildingGroup.add(bodyMesh);
    
    // Create roof based on type
    if (roofType === 'flat') {
        // Flat roof with slight overhang
        const roofGeometry = new THREE.BoxGeometry(width * 1.02, height * 0.02, length * 1.02);
        const roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
        roofMesh.position.y = mainHeight / 2 + height * 0.01;
        buildingGroup.add(roofMesh);
    } 
    else if (roofType === 'pitched') {
        // Pitched roof (triangular prism)
        const shape = new THREE.Shape();
        shape.moveTo(-width / 2, 0);
        shape.lineTo(width / 2, 0);
        shape.lineTo(0, roofHeight);
        shape.lineTo(-width / 2, 0);
        
        const extrudeSettings = {
            steps: 1,
            depth: length,
            bevelEnabled: false
        };
        
        const roofGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        roofGeometry.rotateX(Math.PI / 2);
        roofGeometry.translate(0, mainHeight / 2 + roofHeight / 2, 0);
        
        const roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
        buildingGroup.add(roofMesh);
    } 
    else if (roofType === 'hipped') {
        // Hipped roof (more complex roof with sloped edges)
        const roofGroup = new THREE.Group();
        
        // Create roof with beveled corners
        const boxWidth = width * 1.05;
        const boxLength = length * 1.05;
        const boxHeight = roofHeight * 1.2;
        
        const shape = new THREE.Shape();
        shape.moveTo(-boxWidth / 2, -boxLength / 2);
        shape.lineTo(boxWidth / 2, -boxLength / 2);
        shape.lineTo(boxWidth / 2, boxLength / 2);
        shape.lineTo(-boxWidth / 2, boxLength / 2);
        shape.lineTo(-boxWidth / 2, -boxLength / 2);
        
        const extrudeSettings = {
            steps: 1,
            depth: boxHeight,
            bevelEnabled: true,
            bevelThickness: boxHeight,
            bevelSize: boxHeight,
            bevelOffset: 0,
            bevelSegments: 3
        };
        
        const roofGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        roofGeometry.translate(0, mainHeight / 2, 0);
        roofGeometry.rotateX(-Math.PI / 2);
        
        const roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
        roofGroup.add(roofMesh);
        buildingGroup.add(roofGroup);
    }
    
    return buildingGroup;
}

// Create facade system (windows, details, etc.)
function createFacadeSystem(buildingMesh, width, height, length, floors, style, glassMaterial) {
    // Get the main body of the building (first child of the group)
    const mainBody = buildingMesh.children[0];
    
    // Calculate window parameters
    const floorHeight = height / floors;
    
    // Style-specific parameters
    let windowWidth, windowHeight, windowSpacingX, windowSpacingZ;
    let hasCurtainWall = false;
    
    switch (style) {
        case 'modern':
            windowWidth = 1.8;
            windowHeight = floorHeight * 0.7;
            windowSpacingX = 4;
            windowSpacingZ = 4;
            hasCurtainWall = Math.random() > 0.7; // 30% chance of curtain wall for modern buildings
            break;
        case 'corporate':
            windowWidth = 2;
            windowHeight = floorHeight * 0.8;
            windowSpacingX = 3.5;
            windowSpacingZ = 3.5;
            hasCurtainWall = Math.random() > 0.5; // 50% chance of curtain wall for corporate buildings
            break;
        case 'residential':
            windowWidth = 1.2;
            windowHeight = floorHeight * 0.6;
            windowSpacingX = 3;
            windowSpacingZ = 3;
            hasCurtainWall = false; // Residential buildings rarely have curtain walls
            break;
        default:
            windowWidth = 1.5;
            windowHeight = floorHeight * 0.7;
            windowSpacingX = 3.5;
            windowSpacingZ = 3.5;
            hasCurtainWall = Math.random() > 0.8; // 20% chance of curtain wall for generic buildings
    }
    
    // Create a group to hold all windows
    const windowsGroup = new THREE.Group();
    buildingMesh.add(windowsGroup);
    
    // If it's a curtain wall, create a glass facade instead of individual windows
    if (hasCurtainWall) {
        createCurtainWall(windowsGroup, width, height, length, glassMaterial);
    } else {
        // Calculate how many windows will fit on each side
        const widthCount = Math.floor(width / windowSpacingX) - 1;
        const lengthCount = Math.floor(length / windowSpacingZ) - 1;
        
        // Create window geometry once and reuse
        const windowGeometry = new THREE.PlaneGeometry(windowWidth, windowHeight);
        
        // Create windows for each floor
        for (let floor = 0; floor < floors; floor++) {
            const yPos = (floor * floorHeight) - (height / 2) + (floorHeight / 2);
            
            // Front and back windows
            for (let i = 0; i < widthCount; i++) {
                const xPos = (i * windowSpacingX) - (width / 2) + windowSpacingX;
                
                // Front windows
                createFacadeWindow(windowsGroup, xPos, yPos, length / 2 + 0.05, windowGeometry, glassMaterial, 'front');
                
                // Back windows
                createFacadeWindow(windowsGroup, xPos, yPos, -length / 2 - 0.05, windowGeometry, glassMaterial, 'back');
            }
            
            // Left and right windows
            for (let i = 0; i < lengthCount; i++) {
                const zPos = (i * windowSpacingZ) - (length / 2) + windowSpacingZ;
                
                // Right windows
                createFacadeWindow(windowsGroup, width / 2 + 0.05, yPos, zPos, windowGeometry, glassMaterial, 'right');
                
                // Left windows
                createFacadeWindow(windowsGroup, -width / 2 - 0.05, yPos, zPos, windowGeometry, glassMaterial, 'left');
            }
        }
    }
}

// Create a single window for a building facade
function createFacadeWindow(parent, x, y, z, geometry, material, side) {
    // Create window mesh
    const windowMesh = new THREE.Mesh(geometry, material);
    windowMesh.position.set(x, y, z);
    
    // Rotate based on which side it's on
    if (side === 'front') {
        windowMesh.rotation.y = 0;
    } else if (side === 'back') {
        windowMesh.rotation.y = Math.PI;
    } else if (side === 'right') {
        windowMesh.rotation.y = Math.PI / 2;
    } else if (side === 'left') {
        windowMesh.rotation.y = -Math.PI / 2;
    }
    
    // Add to parent group
    parent.add(windowMesh);
    return windowMesh;
}

// Create a curtain wall (glass facade) instead of individual windows
function createCurtainWall(parent, width, height, length, glassMaterial) {
    // Create slightly smaller dimensions for the glass to leave a frame
    const frameSize = 0.2;
    const glassWidth = width - frameSize*2;
    const glassHeight = height - frameSize*2;
    const glassLength = length - frameSize*2;
    
    // Create glass panels for each side with a grid pattern
    const segmentsX = Math.floor(width / 2);
    const segmentsY = Math.floor(height / 2);
    const segmentsZ = Math.floor(length / 2);
    
    // Front panel
    const frontGeometry = new THREE.PlaneGeometry(glassWidth, glassHeight, segmentsX, segmentsY);
    const frontPanel = new THREE.Mesh(frontGeometry, glassMaterial);
    frontPanel.position.z = length / 2 + 0.05;
    parent.add(frontPanel);
    
    // Back panel
    const backGeometry = new THREE.PlaneGeometry(glassWidth, glassHeight, segmentsX, segmentsY);
    const backPanel = new THREE.Mesh(backGeometry, glassMaterial);
    backPanel.position.z = -length / 2 - 0.05;
    backPanel.rotation.y = Math.PI;
    parent.add(backPanel);
    
    // Right panel
    const rightGeometry = new THREE.PlaneGeometry(glassLength, glassHeight, segmentsZ, segmentsY);
    const rightPanel = new THREE.Mesh(rightGeometry, glassMaterial);
    rightPanel.position.x = width / 2 + 0.05;
    rightPanel.rotation.y = -Math.PI / 2;
    parent.add(rightPanel);
    
    // Left panel
    const leftGeometry = new THREE.PlaneGeometry(glassLength, glassHeight, segmentsZ, segmentsY);
    const leftPanel = new THREE.Mesh(leftGeometry, glassMaterial);
    leftPanel.position.x = -width / 2 - 0.05;
    leftPanel.rotation.y = Math.PI / 2;
    parent.add(leftPanel);
}

// Create windows for a building
function createBuildingWindows(building, floors) {
    const buildingWidth = building.geometry.parameters.width;
    const buildingHeight = building.geometry.parameters.height;
    const buildingDepth = building.geometry.parameters.depth;
    
    const windowSize = 1.5;
    const windowSpacing = 3;
    const floorHeight = buildingHeight / floors;
    
    // Calculate how many windows will fit on each side
    const widthWindows = Math.floor(buildingWidth / windowSpacing) - 1;
    const depthWindows = Math.floor(buildingDepth / windowSpacing) - 1;
    
    // Create window material
    const windowMaterial = new THREE.MeshStandardMaterial({
        color: 0xadd8e6,
        metalness: 0.8,
        roughness: 0.2,
        transparent: true,
        opacity: 0.7
    });
    
    // Generate windows for front and back
    for (let floor = 0; floor < floors; floor++) {
        const yPos = (floor * floorHeight) - (buildingHeight / 2) + (floorHeight / 2);
        
        for (let i = 0; i < widthWindows; i++) {
            const xPos = (i * windowSpacing) - (buildingWidth / 2) + windowSpacing;
            
            // Front windows
            createWindow(xPos, yPos, buildingDepth / 2 + 0.1, windowSize, windowMaterial, 'front');
            
            // Back windows
            createWindow(xPos, yPos, -buildingDepth / 2 - 0.1, windowSize, windowMaterial, 'back');
        }
        
        // Generate windows for left and right sides
        for (let i = 0; i < depthWindows; i++) {
            const zPos = (i * windowSpacing) - (buildingDepth / 2) + windowSpacing;
            
            // Right side windows
            createWindow(buildingWidth / 2 + 0.1, yPos, zPos, windowSize, windowMaterial, 'right');
            
            // Left side windows
            createWindow(-buildingWidth / 2 - 0.1, yPos, zPos, windowSize, windowMaterial, 'left');
        }
    }
}

// Create a single window
function createWindow(x, y, z, size, material, side) {
    let windowGeometry;
    let rotation = [0, 0, 0];
    
    // Adjust geometry and rotation based on which side the window is on
    if (side === 'front' || side === 'back') {
        windowGeometry = new THREE.PlaneGeometry(size, size);
        rotation = [0, side === 'front' ? 0 : Math.PI, 0];
    } else {
        windowGeometry = new THREE.PlaneGeometry(size, size);
        rotation = [0, side === 'right' ? Math.PI / 2 : -Math.PI / 2, 0];
    }
    
    const windowMesh = new THREE.Mesh(windowGeometry, material);
    windowMesh.position.set(x, y, z);
    windowMesh.rotation.set(rotation[0], rotation[1], rotation[2]);
    
    scene.add(windowMesh);
}

// Generate a building procedurally
function generateBuilding(position, parameters) {
    const defaultParams = {
        width: 20 + Math.random() * 10,
        length: 20 + Math.random() * 10,
        height: 30 + Math.random() * 50,
        style: 'modern',
        floors: Math.floor(Math.random() * 10) + 5
    };
    
    const params = { ...defaultParams, ...parameters };
    
    const buildingData = {
        id: buildings.length + 1,
        name: `Generated Building ${buildings.length + 1}`,
        position: position,
        dimensions: {
            width: params.width,
            length: params.length,
            height: params.height
        },
        style: params.style,
        floors: params.floors
    };
    
    return createBuilding(buildingData);
}

// Generate building based on UI parameters
function generateBuildingFromUI() {
    const density = document.getElementById('density-slider').value / 100;
    const openness = document.getElementById('openness-slider').value / 100;
    const style = document.getElementById('style-select').value;
    
    // Get additional parameters if they exist
    const roofType = document.getElementById('roof-type-select') ? 
        document.getElementById('roof-type-select').value : 'flat';
    
    // Get complex volume option if it exists
    const hasSubVolumes = document.getElementById('complex-volume-checkbox') ? 
        document.getElementById('complex-volume-checkbox').checked : Math.random() > 0.6;
    
    // Calculate building dimensions based on parameters
    const width = 15 + (density * 25); // Larger range for width
    const length = 15 + (density * 25); // Larger range for length
    const height = 20 + (density * 80); // Larger range for height
    
    // Calculate floors based on height and style
    let floorHeight = 3; // Default floor height
    
    switch (style) {
        case 'modern':
            floorHeight = 3.5;
            break;
        case 'corporate':
            floorHeight = 4;
            break;
        case 'residential':
            floorHeight = 3;
            break;
    }
    
    const floors = Math.max(1, Math.floor(height / floorHeight));
    
    // Make the buildings more varied and interesting based on openness
    // Lower openness = more dense urban area = more complex buildings
    const complexity = 1 - openness;
    
    let posX, posZ;
    let isValidPosition = false;
    let attempts = 0;
    
    // Try to find a valid position within the terrain
    while (!isValidPosition && attempts < 50) {
        attempts++;
        
        if (terrain && window.terrainShape) {
            // Get a random position within the terrain's bounds
            const position = getRandomPositionOnTerrain();
            if (position) {
                posX = position.x;
                posZ = position.z;
                isValidPosition = true;
            } else {
                // Fallback to random position if terrain is complex
                const positionRange = 80 + (openness * 40);
                posX = (Math.random() * positionRange) - (positionRange / 2);
                posZ = (Math.random() * positionRange) - (positionRange / 2);
                
                // Check if position is inside the terrain shape
                if (window.terrainShape.containsPoint(new THREE.Vector2(posX, posZ))) {
                    isValidPosition = true;
                }
            }
        } else {
            // No terrain, use random position
            const positionRange = 80 + (openness * 40);
            posX = (Math.random() * positionRange) - (positionRange / 2);
            posZ = (Math.random() * positionRange) - (positionRange / 2);
            isValidPosition = true;
        }
    }
    
    // If we couldn't find a valid position, use the center
    if (!isValidPosition && terrain) {
        posX = 0;
        posZ = 0;
    }
    
    // Generate building with advanced parameters
    const building = generateBuilding(
        { x: posX, y: 0, z: posZ },
        {
            width: width,
            length: length,
            height: height,
            style: style,
            floors: floors,
            roofType: roofType,
            hasSubVolumes: hasSubVolumes && complexity > 0.3 // Only add sub-volumes if complex enough
        }
    );
    
    // Add building footprint to the map if we have a plot and map
    if (currentPlot && map) {
        addBuildingFootprint(building, currentPlot);
    }
    
    // Update the building coverage stats
    updateMapStats();
    
    // Log the created building
    console.log(`Generated ${style} building with ${floors} floors and ${roofType} roof.`);
    
    return building;
}

// Get a random position on the terrain
function getRandomPositionOnTerrain() {
    if (!terrain) return null;
    
    // Get the terrain's bounding box
    const boundingBox = new THREE.Box3().setFromObject(terrain);
    
    // Add some margin inside the terrain
    const margin = 10;
    const minX = boundingBox.min.x + margin;
    const maxX = boundingBox.max.x - margin;
    const minZ = boundingBox.min.z + margin;
    const maxZ = boundingBox.max.z - margin;
    
    // Get random position within the bounding box
    const x = Math.random() * (maxX - minX) + minX;
    const z = Math.random() * (maxZ - minZ) + minZ;
    
    return { x, z };
}

// Add building footprint to the map
function addBuildingFootprint(building, plot) {
    if (!map || !building || !plot) return;
    
    // Get building position in local coordinates
    const position = new THREE.Vector3();
    building.getWorldPosition(position);
    
    // Get building dimensions
    const width = building.userData.dimensions.width;
    const length = building.userData.dimensions.length;
    
    // Convert the building position from local to geospatial coordinates
    // We need to use the plot's coordinates as a reference
    const plotCoordinates = plot.geometry.coordinates[0];
    
    // Calculate the center of the plot
    const plotCenter = plotCoordinates.reduce((acc, coord) => {
        return [acc[0] + coord[0], acc[1] + coord[1]];
    }, [0, 0]).map(sum => sum / plotCoordinates.length);
    
    // Scale factor should match the one used in importPlotTo3D
    const scaleFactor = 100;
    
    // Convert from local coordinates to geospatial
    const longitude = plotCenter[0] + (position.x / scaleFactor);
    const latitude = plotCenter[1] + (position.z / scaleFactor);
    
    // Create a rectangle for the building footprint
    const halfWidth = width / (2 * scaleFactor);
    const halfLength = length / (2 * scaleFactor);
    
    const footprintCoordinates = [
        [longitude - halfWidth, latitude - halfLength],
        [longitude + halfWidth, latitude - halfLength],
        [longitude + halfWidth, latitude + halfLength],
        [longitude - halfWidth, latitude + halfLength],
        [longitude - halfWidth, latitude - halfLength] // Close the polygon
    ];
    
    // Create the footprint feature
    const footprint = {
        type: 'Feature',
        geometry: {
            type: 'Polygon',
            coordinates: [footprintCoordinates]
        },
        properties: {
            name: building.userData.name,
            style: building.userData.style,
            floors: building.userData.floors,
            area: width * length
        }
    };
    
    // Add to building footprints array
    buildingFootprints.push(footprint);
    
    // Update the map source
    if (map.getSource('building-footprints')) {
        map.getSource('building-footprints').setData({
            type: 'FeatureCollection',
            features: buildingFootprints
        });
    }
    
    // Store the building's footprint reference in the user data
    building.userData.footprintIndex = buildingFootprints.length - 1;
}

// Draw terrain based on mouse positions
function startTerrainDrawing(x, z) {
    terrainStartPoint = { x, z };
    isDrawingTerrain = true;
}

function finishTerrainDrawing(x, z) {
    if (!terrainStartPoint) return;
    
    const width = Math.abs(x - terrainStartPoint.x);
    const depth = Math.abs(z - terrainStartPoint.z);
    
    const centerX = (x + terrainStartPoint.x) / 2;
    const centerZ = (z + terrainStartPoint.z) / 2;
    
    // Create terrain mesh
    const terrainGeometry = new THREE.BoxGeometry(width, 0.5, depth);
    const terrainMaterial = new THREE.MeshStandardMaterial({
        color: 0x91cb3e,
        roughness: 0.8,
        metalness: 0.2
    });
    
    if (terrain) {
        scene.remove(terrain);
    }
    
    terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    terrain.position.set(centerX, 0.25, centerZ);
    terrain.receiveShadow = true;
    
    scene.add(terrain);
    
    isDrawingTerrain = false;
    terrainStartPoint = null;
}

// Handle mouse events for terrain drawing
function getMousePosition(event) {
    const viewportRect = document.getElementById('viewport').getBoundingClientRect();
    const mouseX = ((event.clientX - viewportRect.left) / viewportRect.width) * 2 - 1;
    const mouseY = -((event.clientY - viewportRect.top) / viewportRect.height) * 2 + 1;
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera({ x: mouseX, y: mouseY }, camera);
    
    const intersects = raycaster.intersectObjects([gridHelper]);
    
    if (intersects.length > 0) {
        return {
            x: intersects[0].point.x,
            z: intersects[0].point.z
        };
    }
    
    return null;
}

// Event listeners
function addEventListeners() {
    // Main viewport mouse events
    const viewport = document.getElementById('viewport');
    
    viewport.addEventListener('mousedown', (event) => {
        if (event.button === 0) { // Left mouse button
            const mousePos = getMousePosition(event);
            if (mousePos) {
                startTerrainDrawing(mousePos.x, mousePos.z);
            }
        }
    });
    
    viewport.addEventListener('mouseup', (event) => {
        if (event.button === 0 && isDrawingTerrain) { // Left mouse button
            const mousePos = getMousePosition(event);
            if (mousePos) {
                finishTerrainDrawing(mousePos.x, mousePos.z);
            }
        }
    });
    
    // UI controls - Panel navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            // Update navigation selection
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            // Show the corresponding panel
            const panelId = item.dataset.panel;
            
            // Hide all panels
            document.querySelectorAll('.control-panel').forEach(panel => {
                panel.style.display = 'none';
            });
            
            // Show the selected panel
            const panel = document.getElementById(`${panelId}-panel`);
            if (panel) {
                panel.style.display = 'block';
            }
            
            // Special handling for the buildings panel
            if (panelId === 'buildings') {
                updateBuildingsList();
            }
        });
    });
    
    // Building management functions
    function updateBuildingsList() {
        const listElement = document.getElementById('buildings-list');
        if (!listElement) return;
        
        // Clear the list
        listElement.innerHTML = '';
        
        if (buildings.length === 0) {
            // Show empty state
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.innerHTML = '<p>No buildings yet. Generate some buildings to see them here.</p>';
            listElement.appendChild(emptyState);
            return;
        }
        
        // Add buildings to the list
        buildings.forEach((building, index) => {
            const buildingItem = document.createElement('div');
            buildingItem.className = 'building-item';
            buildingItem.dataset.id = building.userData.id || index;
            
            // Style based on building data
            const style = building.userData.style || 'standard';
            const floors = building.userData.floors || '?';
            const name = building.userData.name || `Building ${index + 1}`;
            
            buildingItem.innerHTML = `
                <div class="building-info">
                    <span class="building-name">${name}</span>
                    <span class="building-details">${capitalize(style)}, ${floors} floors</span>
                </div>
                <div class="building-actions">
                    <button class="building-action focus" title="Focus on this building">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="9"></circle>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                    <button class="building-action delete" title="Delete this building">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                        </svg>
                    </button>
                </div>
            `;
            
            // Add event listener for focusing on building
            buildingItem.querySelector('.focus').addEventListener('click', (e) => {
                e.stopPropagation();
                focusOnBuilding(building);
            });
            
            // Add event listener for deleting building
            buildingItem.querySelector('.delete').addEventListener('click', (e) => {
                e.stopPropagation();
                deleteBuilding(index);
                updateBuildingsList();
            });
            
            // Add event listener for selecting the building
            buildingItem.addEventListener('click', () => {
                // Highlight selected building
                document.querySelectorAll('.building-item').forEach(item => {
                    item.classList.remove('selected');
                });
                buildingItem.classList.add('selected');
                
                // Focus camera on the building
                focusOnBuilding(building);
            });
            
            listElement.appendChild(buildingItem);
        });
    }
    
    // Helper function to focus camera on a specific building
    function focusOnBuilding(building) {
        // Get building position
        const position = new THREE.Vector3();
        building.getWorldPosition(position);
        
        // Get building dimensions
        let size = 20;  // Default size
        if (building.userData.dimensions) {
            const dims = building.userData.dimensions;
            size = Math.max(dims.width, dims.height, dims.length) * 1.5;
        }
        
        // Animate camera to focus on the building
        const targetPosition = new THREE.Vector3(
            position.x + size, 
            position.y + size/2, 
            position.z + size
        );
        
        // Set camera position with smooth animation
        animateCamera(targetPosition, position, 1000);
    }
    
    // Animate camera to a new position
    function animateCamera(newPosition, lookAt, duration) {
        const startPosition = camera.position.clone();
        const startLookAt = controls.target.clone();
        const clock = new THREE.Clock();
        
        function updateCamera() {
            const elapsed = clock.getElapsedTime() * 1000;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease function (cubic ease out)
            const ease = 1 - Math.pow(1 - progress, 3);
            
            // Interpolate position
            camera.position.lerpVectors(startPosition, newPosition, ease);
            
            // Interpolate lookAt
            controls.target.lerpVectors(startLookAt, lookAt, ease);
            controls.update();
            
            // Continue animation if not complete
            if (progress < 1) {
                requestAnimationFrame(updateCamera);
            }
        }
        
        updateCamera();
    }
    
    // Delete a building
    function deleteBuilding(index) {
        if (index >= 0 && index < buildings.length) {
            const building = buildings[index];
            
            // Remove building footprint from map if it exists
            if (building.userData.footprintIndex !== undefined && 
                buildingFootprints[building.userData.footprintIndex]) {
                buildingFootprints.splice(building.userData.footprintIndex, 1);
                
                // Update indices for remaining buildings
                buildings.forEach((b, i) => {
                    if (b.userData.footprintIndex !== undefined && 
                        b.userData.footprintIndex > building.userData.footprintIndex) {
                        b.userData.footprintIndex--;
                    }
                });
                
                // Update map source
                if (map && map.getSource('building-footprints')) {
                    map.getSource('building-footprints').setData({
                        type: 'FeatureCollection',
                        features: buildingFootprints
                    });
                }
                
                // Update map stats
                updateMapStats();
            }
            
            // Remove from scene
            scene.remove(building);
            
            // Remove from buildings array
            buildings.splice(index, 1);
        }
    }
    
    // Clear all buildings
    function clearAllBuildings() {
        buildings.forEach(building => {
            scene.remove(building);
        });
        buildings = [];
        
        // Clear building footprints
        buildingFootprints = [];
        
        // Update map source
        if (map && map.getSource('building-footprints')) {
            map.getSource('building-footprints').setData({
                type: 'FeatureCollection',
                features: []
            });
        }
        
        // Update map stats
        updateMapStats();
        
        // Update buildings list
        updateBuildingsList();
    }
    
    // Load sample buildings from API
    function loadSampleBuildings() {
        fetchBuildings();
    }
    
    // Set up building action buttons
    const clearBuildingsBtn = document.getElementById('clear-buildings-btn');
    if (clearBuildingsBtn) {
        clearBuildingsBtn.addEventListener('click', clearAllBuildings);
    }
    
    const loadBuildingsBtn = document.getElementById('load-buildings-btn');
    if (loadBuildingsBtn) {
        loadBuildingsBtn.addEventListener('click', loadSampleBuildings);
    }
    
    // Helper function to capitalize first letter
    function capitalize(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    
    // Sliders
    document.querySelectorAll('.slider').forEach(slider => {
        slider.addEventListener('input', () => {
            slider.nextElementSibling.textContent = `${slider.value}%`;
        });
    });
    
    // Toggle buttons
    document.querySelectorAll('.toggle').forEach(toggle => {
        toggle.addEventListener('click', () => {
            toggle.parentElement.querySelectorAll('.toggle').forEach(t => {
                t.classList.remove('active');
            });
            toggle.classList.add('active');
        });
    });
    
    // Generate button
    document.querySelector('.btn-primary').addEventListener('click', () => {
        // Get the number of buildings to generate
        const buildingCount = document.getElementById('building-count-slider') ? 
            parseInt(document.getElementById('building-count-slider').value, 10) : 1;
            
        // Generate the specified number of buildings
        for (let i = 0; i < buildingCount; i++) {
            generateBuildingFromUI();
        }
    });
    
    // Building count slider
    const buildingCountSlider = document.getElementById('building-count-slider');
    if (buildingCountSlider) {
        buildingCountSlider.addEventListener('input', () => {
            buildingCountSlider.nextElementSibling.textContent = buildingCountSlider.value;
        });
    }
    
    // Urban layout toggle buttons
    document.querySelectorAll('.toggle-group .toggle').forEach(toggle => {
        toggle.addEventListener('click', () => {
            // Update the active toggle
            toggle.parentElement.querySelectorAll('.toggle').forEach(t => {
                t.classList.remove('active');
            });
            toggle.classList.add('active');
            
            // Update the style based on urban layout selection
            if (toggle.dataset.value) {
                // If this is a layout toggle, update the style select
                if (toggle.dataset.value === 'residential') {
                    document.getElementById('style-select').value = 'residential';
                } else if (toggle.dataset.value === 'commercial') {
                    document.getElementById('style-select').value = 'corporate';
                } else if (toggle.dataset.value === 'mixed') {
                    // For mixed, randomly choose between styles
                    const styles = ['modern', 'corporate', 'residential'];
                    document.getElementById('style-select').value = styles[Math.floor(Math.random() * styles.length)];
                }
            }
        });
    });
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth - 220, window.innerHeight); // Adjust for sidebar
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update controls
    controls.update();
    
    // Render scene
    renderer.render(scene, camera);
}

// Initialize Map
function initMap() {
    // Check if mapbox container exists
    const mapContainer = document.getElementById('mapbox-container');
    if (!mapContainer) return;
    
    // Create map
    map = new mapboxgl.Map({
        container: 'mapbox-container',
        style: 'mapbox://styles/mapbox/satellite-streets-v11',
        center: [-46.6333, -23.5505], // São Paulo, Brasil
        zoom: 12
    });
    
    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    // Add drawing and editing controls (using Mapbox GL Draw API)
    draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
            polygon: true,
            trash: true
        }
    });
    map.addControl(draw);
    
    // Handle map load
    map.on('load', () => {
        console.log('Map loaded');
        
        // Add custom layer for building footprints
        map.addSource('building-footprints', {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: []
            }
        });
        
        map.addLayer({
            id: 'building-footprints-fill',
            type: 'fill',
            source: 'building-footprints',
            paint: {
                'fill-color': '#4361ee',
                'fill-opacity': 0.5
            }
        });
        
        map.addLayer({
            id: 'building-footprints-outline',
            type: 'line',
            source: 'building-footprints',
            paint: {
                'line-color': '#4361ee',
                'line-width': 2
            }
        });
    });
    
    // Handle draw create event (when polygon is drawn)
    map.on('draw.create', (e) => {
        handleDrawEvent(e);
    });
    
    // Handle draw update event (when polygon is edited)
    map.on('draw.update', (e) => {
        handleDrawEvent(e);
    });
    
    // Handle draw delete event
    map.on('draw.delete', () => {
        currentPlot = null;
        updateMapStats();
    });
    
    // Add event listener for map style change
    const mapStyleSelect = document.getElementById('map-style-select');
    if (mapStyleSelect) {
        mapStyleSelect.addEventListener('change', () => {
            map.setStyle(mapStyleSelect.value);
        });
    }
    
    // Add event listeners for draw mode toggles
    document.querySelectorAll('.toggle-group [data-map-mode]').forEach(toggle => {
        toggle.addEventListener('click', () => {
            const mode = toggle.dataset.mapMode;
            if (mode === 'draw') {
                draw.changeMode('draw_polygon');
            } else {
                draw.changeMode('simple_select');
            }
        });
    });
    
    // Add event listener for clear plot button
    const clearPlotBtn = document.getElementById('clear-plot-btn');
    if (clearPlotBtn) {
        clearPlotBtn.addEventListener('click', () => {
            draw.deleteAll();
            currentPlot = null;
            updateMapStats();
        });
    }
    
    // Add event listener for import to 3D button
    const importTo3DBtn = document.getElementById('import-to-3d-btn');
    if (importTo3DBtn) {
        importTo3DBtn.addEventListener('click', () => {
            importPlotTo3D();
        });
    }
}

// Handle draw event
function handleDrawEvent(e) {
    // Get the drawn polygon
    const feature = e.features[0];
    
    // Store current plot
    currentPlot = feature;
    
    // Update map stats
    updateMapStats();
}

// Update map statistics
function updateMapStats() {
    // Get stats elements
    const mapAreaEl = document.getElementById('map-area');
    const buildingCoverageEl = document.getElementById('building-coverage');
    const buildingCoverageRatioEl = document.getElementById('building-coverage-ratio');
    
    if (!mapAreaEl || !buildingCoverageEl || !buildingCoverageRatioEl) return;
    
    // Calculate plot area
    let plotArea = 0;
    if (currentPlot) {
        plotArea = turf.area(currentPlot.geometry);
    }
    
    // Calculate building coverage
    let buildingCoverage = 0;
    buildingFootprints.forEach(footprint => {
        buildingCoverage += turf.area(footprint.geometry);
    });
    
    // Calculate building coverage ratio
    let buildingCoverageRatio = 0;
    if (plotArea > 0) {
        buildingCoverageRatio = (buildingCoverage / plotArea) * 100;
    }
    
    // Format numbers
    const formatArea = (area) => {
        if (area >= 10000) {
            return `${(area / 10000).toFixed(2)} ha`;
        } else {
            return `${area.toFixed(0)} m²`;
        }
    };
    
    // Update stats
    mapAreaEl.textContent = formatArea(plotArea);
    buildingCoverageEl.textContent = formatArea(buildingCoverage);
    buildingCoverageRatioEl.textContent = `${buildingCoverageRatio.toFixed(1)}%`;
}

// Import plot to 3D scene
function importPlotTo3D() {
    if (!currentPlot) {
        alert('No plot selected. Please draw a plot first.');
        return;
    }
    
    // Clear existing terrain
    if (terrain) {
        scene.remove(terrain);
        terrain = null;
    }
    
    // Clear existing buildings
    clearAllBuildings();
    
    // Get plot coordinates
    const coordinates = currentPlot.geometry.coordinates[0];
    
    // Calculate center of plot
    const center = coordinates.reduce((acc, coord) => {
        return [acc[0] + coord[0], acc[1] + coord[1]];
    }, [0, 0]).map(sum => sum / coordinates.length);
    
    // Store the plot center for reference in building placement
    window.plotCenterGeo = [...center];
    
    // Create terrain from plot
    const shape = new THREE.Shape();
    
    // Convert coordinates to local space (centered on 0,0)
    const scaleFactor = 100; // Scale factor for longitude/latitude to scene units
    window.terrainScaleFactor = scaleFactor; // Store for other functions to use
    
    coordinates.forEach((coord, i) => {
        // Convert from longitude/latitude to local space
        const x = (coord[0] - center[0]) * scaleFactor;
        const z = (coord[1] - center[1]) * scaleFactor;
        
        if (i === 0) {
            shape.moveTo(x, z);
        } else {
            shape.lineTo(x, z);
        }
    });
    
    // Store the shape for point-in-polygon tests
    window.terrainShape = shape;
    
    // Create extruded geometry
    const extrudeSettings = {
        depth: 0.5,
        bevelEnabled: false
    };
    
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.rotateX(-Math.PI / 2);
    
    // Create material
    const material = new THREE.MeshStandardMaterial({
        color: 0x91cb3e,
        roughness: 0.8,
        metalness: 0.2,
        transparent: true,
        opacity: 0.7
    });
    
    // Create mesh
    terrain = new THREE.Mesh(geometry, material);
    terrain.receiveShadow = true;
    
    // Store the terrain's bounding box
    terrain.geometry.computeBoundingBox();
    window.terrainBounds = terrain.geometry.boundingBox.clone();
    
    // Add to scene
    scene.add(terrain);
    
    // Calculate area
    const area = turf.area(currentPlot.geometry);
    const perimeter = turf.length(turf.polygonToLine(currentPlot));
    
    // Log area
    console.log(`Plot imported to 3D scene with area: ${area.toFixed(2)} m²`);
    
    // Switch to terrain panel
    const terrainNavItem = document.querySelector('.nav-item[data-panel="terrain"]');
    if (terrainNavItem) {
        terrainNavItem.click();
    }
    
    // Update terrain stats
    updateTerrainStats(area, perimeter);
    
    // Show success message
    showNotification('Terreno importado com sucesso!', 'success');
}

// Update terrain statistics
function updateTerrainStats(area, perimeter) {
    const terrainAreaEl = document.getElementById('terrain-area');
    const terrainPerimeterEl = document.getElementById('terrain-perimeter');
    
    if (terrainAreaEl) {
        terrainAreaEl.textContent = `${area.toFixed(0)} m²`;
    }
    
    if (terrainPerimeterEl) {
        terrainPerimeterEl.textContent = `${perimeter.toFixed(0)} m`;
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notificationContainer = document.getElementById('notification-container');
    
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Add event listener for close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.classList.add('hide');
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        notification.classList.add('hide');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

// Function to save the current scene
function saveScene() {
    // Gather data about all buildings and terrain
    const sceneData = {
        buildings: buildings.map(building => {
            const position = new THREE.Vector3();
            building.getWorldPosition(position);
            
            return {
                position: {
                    x: position.x,
                    y: position.y,
                    z: position.z
                },
                dimensions: building.userData.dimensions,
                style: building.userData.style,
                floors: building.userData.floors,
                roofType: building.userData.roofType,
                hasSubVolumes: building.userData.hasSubVolumes
            };
        }),
        terrain: currentPlot ? currentPlot : null,
        name: `Simulation_${new Date().toISOString().replace(/[:.]/g, '-')}`,
        createdAt: new Date().toISOString()
    };
    
    // Save to localStorage
    const savedScenes = JSON.parse(localStorage.getItem('spacioSavedScenes') || '[]');
    savedScenes.push(sceneData);
    localStorage.setItem('spacioSavedScenes', JSON.stringify(savedScenes));
    
    // Show success message
    showNotification('Simulação salva com sucesso!', 'success');
    
    return sceneData;
}

// Function to load a saved scene
function loadScene(sceneData) {
    // Clear current scene
    clearAllBuildings();
    
    // Load terrain if it exists
    if (sceneData.terrain) {
        // Set the current plot
        currentPlot = sceneData.terrain;
        
        // Import the terrain to 3D
        importPlotTo3D();
    }
    
    // Load buildings
    sceneData.buildings.forEach(buildingData => {
        generateBuilding(
            buildingData.position,
            {
                width: buildingData.dimensions.width,
                length: buildingData.dimensions.length,
                height: buildingData.dimensions.height,
                style: buildingData.style,
                floors: buildingData.floors,
                roofType: buildingData.roofType,
                hasSubVolumes: buildingData.hasSubVolumes
            }
        );
    });
    
    // Show success message
    showNotification(`Simulação "${sceneData.name}" carregada com sucesso!`, 'success');
}

// Import GeoJSON function
function importGeoJSON() {
    // Create file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.geojson,.json';
    
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const geoJSON = JSON.parse(e.target.result);
                
                // Check if it's a valid GeoJSON with a polygon
                if (geoJSON.type === 'Feature' && geoJSON.geometry && 
                    (geoJSON.geometry.type === 'Polygon' || geoJSON.geometry.type === 'MultiPolygon')) {
                    
                    // Set as current plot
                    currentPlot = geoJSON;
                    
                    // Update map display
                    if (map && draw) {
                        draw.deleteAll();
                        draw.add(geoJSON);
                        
                        // Fit map to the bounds of the polygon
                        const bounds = turf.bbox(geoJSON);
                        map.fitBounds([
                            [bounds[0], bounds[1]],
                            [bounds[2], bounds[3]]
                        ], { padding: 50 });
                    }
                    
                    // Update stats
                    updateMapStats();
                    
                    // Show success message
                    showNotification('GeoJSON importado com sucesso!', 'success');
                    
                } else {
                    showNotification('O arquivo GeoJSON não contém um polígono válido.', 'error');
                }
            } catch (error) {
                console.error('Error parsing GeoJSON:', error);
                showNotification('Erro ao importar GeoJSON. Verifique o formato do arquivo.', 'error');
            }
        };
        
        reader.readAsText(file);
    });
    
    // Trigger the file dialog
    fileInput.click();
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    init();
    initMap();
    
    // Add CSS for notifications
    const style = document.createElement('style');
    style.textContent = `
        #notification-container {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .notification {
            background-color: white;
            border-left: 4px solid #4361ee;
            border-radius: 4px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            width: 300px;
            transform: translateX(0);
            transition: transform 0.3s, opacity 0.3s;
        }
        
        .notification.info { border-left-color: #4361ee; }
        .notification.success { border-left-color: #10b981; }
        .notification.warning { border-left-color: #f59e0b; }
        .notification.error { border-left-color: #ef4444; }
        
        .notification.hide {
            transform: translateX(320px);
            opacity: 0;
        }
        
        .notification-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
        }
        
        .notification-close {
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
            color: #666;
        }
    `;
    document.head.appendChild(style);
    
    // Add save button listener
    const saveBtn = document.querySelector('button.btn:not(.btn-primary)');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveScene);
    }
});
