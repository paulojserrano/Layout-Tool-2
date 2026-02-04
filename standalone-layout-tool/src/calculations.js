import { roundUpTo50 } from '../utils.js';

// --- Helper function to add bays (No changes here, just passing through) ---
function addBaysToMasterList(allBays, rowItem, verticalBayTemplate, config, layoutOffsetX_world, layoutOffsetY_world) {
    const setbackLeft = config['setback-left'] || 0;
    const setbackTop = config['top-setback'] || 0;
    const flueSpace = config['rack-flue-space'] || 0;

    // Calculate the 'config' depth (used for double racks)
    const configBayDepth = (config['totes-deep'] * config['tote-width']) +
                           (Math.max(0, config['totes-deep'] - 1) * config['tote-back-to-back-dist']) +
                           config['hook-allowance'];

    // Iterate through the vertical template
    for (const bayTpl of verticalBayTemplate) {

        const final_y = setbackTop + layoutOffsetY_world + bayTpl.y_center;

        // --- Rack 1 (or Single Rack) ---
        // X-center is the row's X + offset + half its width
        // For double racks, 'item.width' is the total width, so we use configBayDepth
        const rack1_width = (rowItem.rackType === 'single') ? rowItem.width : configBayDepth;
        const bay_x_center_rack1 = layoutOffsetX_world + rowItem.x + (rack1_width / 2);
        const final_x_rack1 = setbackLeft + bay_x_center_rack1;

        allBays.push({
            id: `R${rowItem.row}-B${bayTpl.bayColumn}-1`,
            row: rowItem.row,
            bay: bayTpl.bayColumn,
            rackSubId: 1, // First rack in the row
            x: final_x_rack1,
            y: final_y,
            bayType: bayTpl.bayType,
            rackType: rowItem.rackType,
            rowWidth: rowItem.width,
            rackWidth: rack1_width
        });

        // --- Rack 2 (If Double Rack) ---
        if (rowItem.rackType === 'double') {
            const rack2_width = configBayDepth; // Second part of a double is always configBayDepth
            const bay_x_center_rack2 = layoutOffsetX_world + rowItem.x + configBayDepth + flueSpace + (rack2_width / 2);
            const final_x_rack2 = setbackLeft + bay_x_center_rack2;

             allBays.push({
                id: `R${rowItem.row}-B${bayTpl.bayColumn}-2`,
                row: rowItem.row,
                bay: bayTpl.bayColumn,
                rackSubId: 2, // Second rack in the row
                x: final_x_rack2,
                y: final_y,
                bayType: bayTpl.bayType,
                rackType: rowItem.rackType,
                rowWidth: rowItem.width,
                rackWidth: rack2_width
            });
        }
    }
}

export function calculateLayout(sysLength, sysWidth, config, pathSettings = null) {
    // 1. Extract params
    let setbackTop = config['top-setback'] || 0;
    let setbackBottom = config['bottom-setback'] || 0;
    let setbackLeft = config['setback-left'] || 0;
    let setbackRight = config['setback-right'] || 0;

    const uprightLength = config['upright-length'] || 0;
    const toteLength = config['tote-length'] || 0;
    const toteQtyPerBay = config['tote-qty-per-bay'] || 1;
    const toteToToteDist = config['tote-to-tote-dist'] || 0;
    const toteToUprightDist = config['tote-to-upright-dist'] || 0;
    const toteWidth = config['tote-width'] || 0;
    const totesDeep = config['totes-deep'] || 1;
    const toteBackToBackDist = config['tote-back-to-back-dist'] || 0;
    const hookAllowance = config['hook-allowance'] || 0;

    // Use dynamic aisle width from config (calculated in getMetrics)
    const aisleWidth = config['aisle-width'] || 0;

    const flueSpace = config['rack-flue-space'] || 0;
    const layoutMode = config['layout-mode'] || 's-d-s';
    const considerTunnels = config['considerTunnels'] || false;
    const considerBackpacks = config['considerBackpacks'] || false;

    // Path parameters
    const robotPathFirstOffset = config['robot-path-first-offset'] || 500;
    const robotPathGap = config['robot-path-gap'] || 600;
    const acrPathOffsetTop = config['acr-path-offset-top'] || 1000;
    const acrPathOffsetBottom = config['acr-path-offset-bottom'] || 1000;
    const amrPathOffset = config['amr-path-offset'] || 850;

    // Dynamic Setback Calculation
    if (pathSettings) {
        const topLines = pathSettings.topAMRLines || 0;
        const bottomLines = pathSettings.bottomAMRLines || 0;
        const userAdditionalTop = pathSettings.userSetbackTop || 0;
        const userAdditionalBottom = pathSettings.userSetbackBottom || 0;

        const topPathSpace = (topLines * amrPathOffset) + (0.5 * amrPathOffset);
        const bottomPathSpace = (bottomLines * amrPathOffset) + (0.5 * amrPathOffset);

        setbackTop = topPathSpace + userAdditionalTop;
        setbackBottom = bottomPathSpace + userAdditionalBottom;

        const userAdditionalLeft = pathSettings.userSetbackLeft || 0;
        const userAdditionalRight = pathSettings.userSetbackRight || 0;

        const leftPathSpace = pathSettings.addLeftACR ? acrPathOffsetTop : 0;
        const rightPathSpace = pathSettings.addRightACR ? acrPathOffsetTop : 0;

        setbackLeft = leftPathSpace + userAdditionalLeft;
        setbackRight = rightPathSpace + userAdditionalRight;
    }

    // 2. Core dimensions
    const clearOpening = (toteQtyPerBay * toteLength) + (2 * toteToUprightDist) + (Math.max(0, toteQtyPerBay - 1) * toteToToteDist);
    const configBayDepth = (totesDeep * toteWidth) + (Math.max(0, totesDeep - 1) * toteBackToBackDist) + hookAllowance;
    const singleBayDepth = (1 * toteWidth) + (Math.max(0, 1 - 1) * toteBackToBackDist) + hookAllowance;

    // 3. Vertical Template
    const verticalBayTemplate = [];
    const usableLength_v_calc = sysLength - setbackTop - setbackBottom - uprightLength;
    const repeatingBayUnitWidth = clearOpening + uprightLength;

    let totalBayPositions = 0;
    if (usableLength_v_calc > 0 && repeatingBayUnitWidth > 0) {
        totalBayPositions = Math.floor(usableLength_v_calc / repeatingBayUnitWidth);
    }

    let tunnelPositions = new Set();
    if (considerTunnels) {
        const numTunnelBays = Math.floor(totalBayPositions / 9);
        if (numTunnelBays > 0) {
            const spacing = (totalBayPositions + 1) / (numTunnelBays + 1);
            for (let k = 1; k <= numTunnelBays; k++) {
                tunnelPositions.add(Math.round(k * spacing) - 1);
            }
        }
    }

    let backpackPositions = new Set();
    if (considerBackpacks) {
        const tunnelIndices = Array.from(tunnelPositions).sort((a, b) => a - b);
        const boundaries = [0, ...tunnelIndices, totalBayPositions];
        for (let j = 0; j < boundaries.length - 1; j++) {
            let sectionStart = (j === 0) ? 0 : boundaries[j] + 1;
            let sectionEnd = boundaries[j+1];
            let sectionLength = (tunnelPositions.has(sectionEnd)) ? (sectionEnd - sectionStart) : (sectionEnd - sectionStart);
            if (sectionLength < 1) continue;
            const numBackpackBays = Math.floor(sectionLength / 5);
            if (numBackpackBays === 0) continue;
            const backpackSpacing = (sectionLength + 1) / (numBackpackBays + 1);
            for (let k = 1; k <= numBackpackBays; k++) {
                const backpackIndexInSection = Math.round(k * backpackSpacing) - 1;
                const backpackIndexGlobal = sectionStart + backpackIndexInSection;
                if (!tunnelPositions.has(backpackIndexGlobal)) backpackPositions.add(backpackIndexGlobal);
            }
        }
    }

    for (let i = 0; i < totalBayPositions; i++) {
        const isTunnel = tunnelPositions.has(i);
        const isBackpack = !isTunnel && backpackPositions.has(i);
        let bayType = 'standard';
        if (isTunnel) bayType = 'tunnel';
        else if (isBackpack) bayType = 'backpack';

        const y_center = uprightLength + (i * repeatingBayUnitWidth) + (clearOpening / 2);
        verticalBayTemplate.push({
            bayColumn: i, y_center: y_center, bayType: bayType, bayHeight: clearOpening
        });
    }

    const totalRackLength_world = (totalBayPositions > 0) ? (totalBayPositions * repeatingBayUnitWidth) + uprightLength : 0;
    const usableLength_v = sysLength - setbackTop - setbackBottom;
    const layoutOffsetY_world = (usableLength_v - totalRackLength_world) / 2;

    // 4. Horizontal Rows
    const allBays = [];
    const layoutItems = [];
    let currentX_world = 0;
    let rowCounter = 0;

    const usableWidth_h = sysWidth - setbackLeft - setbackRight;
    if (usableWidth_h <= 0) {
        return {
            layoutItems: [], allBays: [], verticalBayTemplate: [], paths: [],
            totalLayoutWidth: 0, totalRackLength_world: 0,
            usableLength_v, usableWidth_h,
            layoutOffsetX_world: 0, layoutOffsetY_world,
            baysPerRack: totalBayPositions, clearOpening,
            numStorageBays: 0, numTunnelBays: 0, numBackpackBays: 0,
            repeatingBayUnitWidth, setbackTop, setbackBottom, setbackLeft, setbackRight
        };
    }

    if (layoutMode === 'all-singles') {
        const singleRackWidth = singleBayDepth;
        const configRackWidth = configBayDepth;

        if (usableWidth_h >= singleRackWidth) {
            rowCounter++;
            layoutItems.push({ type: 'rack', x: 0, width: singleRackWidth, rackType: 'single', row: rowCounter });
            currentX_world += singleRackWidth;

            while (true) {
                if (currentX_world + aisleWidth + singleRackWidth <= usableWidth_h) {
                    if (currentX_world + aisleWidth + configRackWidth + aisleWidth + singleRackWidth <= usableWidth_h) {
                        layoutItems.push({ type: 'aisle', x: currentX_world, width: aisleWidth, row: -1 });
                        currentX_world += aisleWidth;
                        rowCounter++;
                        layoutItems.push({ type: 'rack', x: currentX_world, width: configRackWidth, rackType: 'single', row: rowCounter });
                        currentX_world += configRackWidth;
                    } else {
                        layoutItems.push({ type: 'aisle', x: currentX_world, width: aisleWidth, row: -1 });
                        currentX_world += aisleWidth;
                        rowCounter++;
                        layoutItems.push({ type: 'rack', x: currentX_world, width: singleRackWidth, rackType: 'single', row: rowCounter });
                        currentX_world += singleRackWidth;
                        break;
                    }
                } else {
                    break;
                }
            }
        }
    }
    else if (layoutMode === 's-d-s') {
        const singleRackWidth = configBayDepth;
        const doubleRackWidth = (configBayDepth * 2) + flueSpace;

        if (currentX_world + singleRackWidth <= usableWidth_h) {
            rowCounter++;
            layoutItems.push({ type: 'rack', x: 0, width: singleRackWidth, rackType: 'single', row: rowCounter });
            currentX_world += singleRackWidth;
        } else {
             return {
                layoutItems: [], allBays: [], verticalBayTemplate: [], paths: [],
                totalLayoutWidth: 0, totalRackLength_world: 0,
                usableLength_v, usableWidth_h,
                layoutOffsetX_world: 0, layoutOffsetY_world,
                baysPerRack: totalBayPositions, clearOpening,
                numStorageBays: 0, numTunnelBays: 0, numBackpackBays: 0,
                repeatingBayUnitWidth, setbackTop, setbackBottom, setbackLeft, setbackRight
            };
        }

        while (true) {
            const nextUnitEndX = currentX_world + aisleWidth + doubleRackWidth;
            if (nextUnitEndX > usableWidth_h) break;
            if (nextUnitEndX + aisleWidth + singleRackWidth > usableWidth_h) break;

            layoutItems.push({ type: 'aisle', x: currentX_world, width: aisleWidth, row: -1 });
            currentX_world += aisleWidth;
            rowCounter++;
            layoutItems.push({ type: 'rack', x: currentX_world, width: doubleRackWidth, rackType: 'double', row: rowCounter });
            currentX_world += doubleRackWidth;
        }

        if (currentX_world + aisleWidth + singleRackWidth <= usableWidth_h) {
            if (layoutItems.length > 0 && layoutItems[layoutItems.length - 1].rackType !== 'single') {
                layoutItems.push({ type: 'aisle', x: currentX_world, width: aisleWidth, row: -1 });
                currentX_world += aisleWidth;
                rowCounter++;
                layoutItems.push({ type: 'rack', x: currentX_world, width: singleRackWidth, rackType: 'single', row: rowCounter });
                currentX_world += singleRackWidth;
            }
        }
    }

    const lastItem = layoutItems[layoutItems.length - 1];
    const totalLayoutWidth = lastItem ? lastItem.x + lastItem.width : 0;
    const layoutOffsetX_world = (usableWidth_h - totalLayoutWidth) / 2;

    const renderConfig = {
        ...config,
        'top-setback': setbackTop, 'bottom-setback': setbackBottom,
        'setback-left': setbackLeft, 'setback-right': setbackRight
    };

    for (const item of layoutItems) {
        if (item.type === 'rack') {
            addBaysToMasterList(allBays, item, verticalBayTemplate, renderConfig, layoutOffsetX_world, layoutOffsetY_world);
        }
    }

    const numStorageBays = allBays.filter(b => b.bayType !== 'tunnel').length;
    const numTunnelBays = allBays.filter(b => b.bayType === 'tunnel').length;
    const numBackpackBays = allBays.filter(b => b.bayType === 'backpack').length;
    const numStandardBays = allBays.filter(b => b.bayType === 'standard').length;

    // 7. Robot Paths (omitted for brevity, no changes in calculations.js related to paths)
    // NOTE: The path logic was already correct in previous turns.
    const paths = [];
    if (pathSettings && robotPathFirstOffset > 0) {
        const rackStructureTopY = setbackTop + layoutOffsetY_world;
        const rackStructureBottomY = rackStructureTopY + totalRackLength_world;
        const yAcrTop = rackStructureTopY - acrPathOffsetTop;
        const yAcrBottom = rackStructureBottomY + acrPathOffsetBottom;
        const pathStartY = yAcrTop;
        const pathEndY = yAcrBottom;

        let minBayPathX = Infinity;
        let maxBayPathX = -Infinity;
        let firstAisleX = null;
        let lastAisleX = null;

        const createBayPaths = (startX, direction, count) => {
            const amrCountTop = pathSettings.topAMRLines || 0;
            const amrCountBottom = pathSettings.bottomAMRLines || 0;
            const maxAmrOffsetTop = amrPathOffset * amrCountTop;
            const maxAmrOffsetBottom = amrPathOffset * amrCountBottom;
            const bayPathStartY = rackStructureTopY - maxAmrOffsetTop;
            const bayPathEndY = rackStructureBottomY + maxAmrOffsetBottom;

            let currentDistance = robotPathFirstOffset;
            for(let i=0; i<count; i++) {
                if (i > 0) {
                    let gap = 0;
                    if (Array.isArray(robotPathGap)) {
                        const gapIndex = i - 1;
                        if (gapIndex < robotPathGap.length) gap = robotPathGap[gapIndex];
                        else gap = robotPathGap[robotPathGap.length - 1];
                    } else {
                        gap = robotPathGap;
                    }
                    currentDistance += gap;
                }
                const x = startX + (direction * currentDistance);
                if (x < minBayPathX) minBayPathX = x;
                if (x > maxBayPathX) maxBayPathX = x;
                paths.push({ type: 'bay', x1: x, y1: bayPathStartY, x2: x, y2: bayPathEndY, orientation: 'vertical' });
            }
        };

        layoutItems.forEach((item, index) => {
            const itemAbsX = setbackLeft + layoutOffsetX_world + item.x;
            if (item.type === 'aisle') {
                const aisleCenterX = itemAbsX + (item.width / 2);
                paths.push({ type: 'aisle', x1: aisleCenterX, y1: pathStartY, x2: aisleCenterX, y2: pathEndY, orientation: 'vertical' });
                if (firstAisleX === null) firstAisleX = aisleCenterX;
                lastAisleX = aisleCenterX;
            }
            else if (item.type === 'rack') {
                 if (item.rackType === 'single') {
                    if (index === 0) createBayPaths(itemAbsX + item.width, -1, totesDeep);
                    else createBayPaths(itemAbsX, 1, totesDeep);
                }
                else if (item.rackType === 'double') {
                    createBayPaths(itemAbsX, 1, totesDeep);
                    createBayPaths(itemAbsX + item.width, -1, totesDeep);
                }
            }
        });

        if (minBayPathX !== Infinity && maxBayPathX !== -Infinity) {
            verticalBayTemplate.forEach(bayTpl => {
                 if (bayTpl.bayType !== 'tunnel') {
                    const bayRelativeY = (bayTpl.bayColumn * repeatingBayUnitWidth) + uprightLength;
                    let currentY = bayRelativeY + toteToUprightDist + (toteLength / 2);
                    for (let t = 0; t < toteQtyPerBay; t++) {
                        const yAbs = rackStructureTopY + currentY;
                        paths.push({ type: 'cross-aisle', x1: minBayPathX, y1: yAbs, x2: maxBayPathX, y2: yAbs, orientation: 'horizontal' });
                        currentY += (toteLength + toteToToteDist);
                    }
                 }
            });

            const numTopAMR = pathSettings.topAMRLines || 0;
            const numBottomAMR = pathSettings.bottomAMRLines || 0;
            const baseTopY = rackStructureTopY - amrPathOffset;
            const baseBottomY = rackStructureBottomY + amrPathOffset;

            for (let i = 0; i < numTopAMR; i++) {
                 const y = baseTopY - (i * amrPathOffset);
                paths.push({ type: 'amr', x1: minBayPathX, y1: y, x2: maxBayPathX, y2: y, orientation: 'horizontal' });
            }
            for (let i = 0; i < numBottomAMR; i++) {
                const y = baseBottomY + (i * amrPathOffset);
                paths.push({ type: 'amr', x1: minBayPathX, y1: y, x2: maxBayPathX, y2: y, orientation: 'horizontal' });
            }

            if (firstAisleX !== null && lastAisleX !== null) {
                let acrStartX = firstAisleX;
                let acrEndX = lastAisleX;

                if (pathSettings.addLeftACR) {
                     const layoutStartX = setbackLeft + layoutOffsetX_world;
                     const spacingX = acrPathOffsetTop;
                     const leftAcrXPos = layoutStartX - spacingX;
                    paths.push({ type: 'acr', x1: leftAcrXPos, y1: yAcrTop, x2: leftAcrXPos, y2: yAcrBottom, orientation: 'vertical' });
                    acrStartX = leftAcrXPos;
                }
                if (pathSettings.addRightACR) {
                    const layoutEndX = setbackLeft + layoutOffsetX_world + totalLayoutWidth;
                    const spacingX = acrPathOffsetTop;
                    const rightAcrXPos = layoutEndX + spacingX;
                    paths.push({ type: 'acr', x1: rightAcrXPos, y1: yAcrTop, x2: rightAcrXPos, y2: yAcrBottom, orientation: 'vertical' });
                    acrEndX = rightAcrXPos;
                }

                paths.push({ type: 'acr', x1: acrStartX, y1: yAcrTop, x2: acrEndX, y2: yAcrTop, orientation: 'horizontal' });
                paths.push({ type: 'acr', x1: acrStartX, y1: yAcrBottom, x2: acrEndX, y2: yAcrBottom, orientation: 'horizontal' });

                const tunnelIndices = [];
                verticalBayTemplate.forEach((bay, index) => {
                    if (bay.bayType === 'tunnel') tunnelIndices.push(index);
                });

                tunnelIndices.forEach(tunnelIdx => {
                    const bayTpl = verticalBayTemplate[tunnelIdx];
                    const absY_Center = rackStructureTopY + bayTpl.y_center;
                    paths.push({ type: 'acr', x1: acrStartX, y1: absY_Center, x2: acrEndX, y2: absY_Center, orientation: 'horizontal' });

                    const quarterHeight = repeatingBayUnitWidth / 4;
                    const amrY_Top = absY_Center - quarterHeight;
                    const amrY_Bottom = absY_Center + quarterHeight;

                    if (minBayPathX !== Infinity && maxBayPathX !== -Infinity) {
                         paths.push({ type: 'amr', x1: minBayPathX, y1: amrY_Top, x2: maxBayPathX, y2: amrY_Top, orientation: 'horizontal' });
                         paths.push({ type: 'amr', x1: minBayPathX, y1: amrY_Bottom, x2: maxBayPathX, y2: amrY_Bottom, orientation: 'horizontal' });
                    }
                });
            }
        }
    }

    return {
        layoutItems, allBays, verticalBayTemplate, paths,
        totalLayoutWidth, totalRackLength_world,
        usableLength_v, usableWidth_h,
        layoutOffsetX_world, layoutOffsetY_world,
        baysPerRack: totalBayPositions, clearOpening,
        numStorageBays, numTunnelBays, numBackpackBays, numStandardBays,
        numRows: rowCounter, repeatingBayUnitWidth,
        setbackTop, setbackBottom, setbackLeft, setbackRight
    };
}

export function calculateElevationLayout(inputs, evenDistribution = false, hasBufferLayer = false) {
    const { WH, BaseHeight, BW, TH, MC, OC, SC, ST } = inputs;

    if (WH <= 0 || BaseHeight < 0 || BW <= 0 || TH <= 0 || MC < 0 || OC < 0 || SC < 0 || ST <= 0) return null;

    const MaxLoadHeight = WH - OC;
    if (MaxLoadHeight < BaseHeight + BW + TH) return { levels: [], N: 0, topToteHeight: 0 };

    let maxN = 0;
    let currentBeamBottom = BaseHeight;
    let currentToteTop = BaseHeight + BW + TH;
    let sprinklerLevelCount = 1;
    let numSprinklers = 0;
    const capacityLayout = [];
    let topToteHeightCapacity = 0;

    while (true) {
        if (currentToteTop > MaxLoadHeight) break;

        const currentLevelIndex = maxN;
        const levelLabel = hasBufferLayer ? (currentLevelIndex === 0 ? 'B' : `${currentLevelIndex}`) : `${currentLevelIndex + 1}`;
        maxN++;

        const levelInfo = {
            beamBottom: currentBeamBottom,
            beamTop: currentBeamBottom + BW,
            toteTop: currentBeamBottom + BW + TH,
            sprinklerAdded: 0,
            levelLabel: levelLabel
        };
        capacityLayout.push(levelInfo);
        topToteHeightCapacity = levelInfo.toteTop;

        let requiredGap = MC;
        if (levelInfo.toteTop > (sprinklerLevelCount * ST)) {
            requiredGap += SC;
            levelInfo.sprinklerAdded = SC;
            sprinklerLevelCount++;
            numSprinklers++;
        }

        const actualGap = roundUpTo50(requiredGap);
        currentBeamBottom = currentBeamBottom + BW + TH + actualGap;
        currentToteTop = currentBeamBottom + BW + TH;
    }

    if (!evenDistribution || numSprinklers === 0) {
        return { levels: capacityLayout, N: maxN, topToteHeight: topToteHeightCapacity };
    }

    const levelsPerSprinklerGroup = Math.floor(maxN / (numSprinklers + 1));
    const remainderLevels = maxN % (numSprinklers + 1);
    const evenLayout = [];
    let levelCount = 0;
    let sprinklersPlaced = 0;
    currentBeamBottom = BaseHeight;
    currentToteTop = BaseHeight + BW + TH;

    for (let i = 1; i <= maxN; i++) {
        const currentLevelIndex = i - 1;
        const levelLabel = hasBufferLayer ? (currentLevelIndex === 0 ? 'B' : `${currentLevelIndex}`) : `${currentLevelIndex + 1}`;

        const levelInfo = {
            beamBottom: currentBeamBottom, beamTop: currentBeamBottom + BW, toteTop: currentBeamBottom + BW + TH,
            sprinklerAdded: 0, levelLabel: levelLabel
        };
        evenLayout.push(levelInfo);
        levelCount++;

        let requiredGap = MC;
        if (sprinklersPlaced < numSprinklers) {
            const currentGroupSize = levelsPerSprinklerGroup + (sprinklersPlaced < remainderLevels ? 1 : 0);
            if (levelCount === currentGroupSize) {
                requiredGap += SC;
                levelInfo.sprinklerAdded = SC;
                sprinklersPlaced++;
                levelCount = 0;
            }
        }

        const actualGap = roundUpTo50(requiredGap);
        if (i < maxN) {
            const nextBeamBottom = currentBeamBottom + BW + TH + actualGap;
            const nextToteTop = nextBeamBottom + BW + TH;
            if (nextToteTop > MaxLoadHeight) return { levels: capacityLayout, N: maxN, topToteHeight: topToteHeightCapacity };
            currentBeamBottom = nextBeamBottom;
            currentToteTop = nextToteTop;
        }
    }
    return { levels: evenLayout, N: maxN, topToteHeight: currentToteTop };
}

// MODIFIED: Accept toteHeightOverride
export function getMetrics(sysLength, sysWidth, sysHeight, config, pathSettings = null, levelOverride = null, toteHeightOverride = null) {
    if (!config) return { totalLocations: 0, footprint: 0, L: 0, W: 0 };

    // 1. Get params & Apply Override
    const toteHeight = toteHeightOverride ? Number(toteHeightOverride) : (config['tote-height'] || 0);
    const toteWidth = config['tote-width'] || 0;
    const toteLength = config['tote-length'] || 0;
    const toteQtyPerBay = config['tote-qty-per-bay'] || 1;
    const totesDeep = config['totes-deep'] || 1;
    const hasBufferLayer = config['hasBufferLayer'] || false;

    // 2. Create Resolved Config
    const resolvedConfig = { ...config, 'tote-height': toteHeight };

    // 3. Elevation Calc for Aisle Width
    const coreElevationInputs = {
        WH: sysHeight,
        BaseHeight: config['base-beam-height'] || 0,
        BW: config['beam-width'] || 0,
        TH: toteHeight, // Use resolved height
        MC: config['min-clearance'] || 0,
        OC: config['overhead-clearance'] || 0,
        SC: config['sprinkler-clearance'] || 0,
        ST: config['sprinkler-threshold'] || 0,
        UW_front: 0, NT_front: 0, TW_front: 0, TTD_front: 0, TUD_front: 0,
        UW_side: 0, TotesDeep: 0, ToteDepth: 0, ToteDepthGap: 0, HookAllowance: 0,
    };

    const layoutResult = calculateElevationLayout(coreElevationInputs, false, hasBufferLayer);
    const calculatedMaxLevels = layoutResult ? layoutResult.N : 0;
    const maxLevels = (levelOverride !== null && levelOverride > 0 && levelOverride <= calculatedMaxLevels) ? levelOverride : calculatedMaxLevels;
    const allLevels = layoutResult ? layoutResult.levels : [];

    // 4. Dynamic Aisle Width using Config Low/High
    let maxPickHeight = 0;
    if (maxLevels > 0 && allLevels.length >= maxLevels) {
        const topLevel = allLevels[maxLevels - 1];
        maxPickHeight = topLevel.beamTop;
    }

    let calculatedAisleWidth = config['aisle-width-low'] || config['aisle-width'] || 2400; // Default fallback
    const threshold = 10000; // 10m

    // If config has specific low/high values, use them logic
    if (config['aisle-width-low'] && config['aisle-width-high']) {
        calculatedAisleWidth = (maxPickHeight < threshold) ? config['aisle-width-low'] : config['aisle-width-high'];
    }

    resolvedConfig['aisle-width'] = calculatedAisleWidth;

    // 5. Calculate Horizontal Layout
    const layout = calculateLayout(sysLength, sysWidth, resolvedConfig, pathSettings);

    // 6. Calculate Locations (UPDATED LOGIC)
    let storageLevels = maxLevels;
    if (hasBufferLayer && maxLevels > 0) storageLevels = maxLevels - 1;
    if (storageLevels < 0) storageLevels = 0;

    // Calculate Tunnel Levels
    const tunnelThreshold = 6500;
    const usedLevels = allLevels.slice(0, maxLevels);
    const numTunnelLevels = usedLevels.filter(level => level.beamBottom >= tunnelThreshold).length;

    // Calculate Single Deep Width Reference (for detection)
    const hookAllowance = config['hook-allowance'] || 0;
    const singleDeepWidthRef = (1 * toteWidth) + hookAllowance;

    let totalLocations = 0;

    // Iterate through specific bays to calculate exact capacity
    for (const bay of layout.allBays) {
        // Determine Bay Depth (1 vs Config) based on physical width
        let currentTotesDeep = totesDeep; // Default to config

        // If bay width matches single-deep width (with small tolerance), treat as 1-deep
        if (Math.abs(bay.rackWidth - singleDeepWidthRef) < 50) {
            currentTotesDeep = 1;
        }

        // Determine Levels for this bay type
        let levelsForBay = 0;
        if (bay.bayType === 'tunnel') {
            levelsForBay = numTunnelLevels;
        } else {
            // Standard or Backpack
            levelsForBay = storageLevels;
        }

        // Add to total
        totalLocations += (levelsForBay * toteQtyPerBay * currentTotesDeep);
    }

    const area = (sysLength / 1000) * (sysWidth / 1000);
    const toteVolume_m3 = (toteWidth / 1000) * (toteLength / 1000) * (toteHeight / 1000);
    const maxPerfDensity = config['max-perf-density'] || 50;
    const density = (area > 0) ? (totalLocations / area) : 0; // Totes/m2

    return {
        totalLocations, footprint: area, L: sysLength, W: sysWidth,
        totalBays: layout.allBays.length, baysPerRack: layout.baysPerRack, numRows: layout.numRows,
        maxLevels, calculatedMaxLevels, toteVolume_m3, maxPerfDensity, numTunnelLevels, density,
        resolvedAisleWidth: calculatedAisleWidth, resolvedToteHeight: toteHeight
    };
}