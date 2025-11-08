import { roundUpTo50 } from './utils.js';

// --- Layout Calculation Function (Top-Down) ---
export function calculateLayout(bayWidth, bayDepth, aisleWidth, sysLength, sysWidth, layoutMode, flueSpace, setbackTop, setbackBottom) {
    let layoutItems = [];
    let totalBays = 0;
    let currentX_world = 0;

    // Calculate usable length based on setbacks
    let usableLength = sysLength - setbackTop - setbackBottom;
    if (usableLength <= 0) usableLength = 0;

    const baysPerRack = (bayWidth > 0 && usableLength > 0) ? Math.floor(usableLength / bayWidth) : 0;

    if (layoutMode === 'all-singles') {
        const rackWidth = bayDepth; // bayDepth is the calculated single rack depth
        const itemWidth = rackWidth + aisleWidth;

        // 1. Check if we can fit at least one rack
        if (sysWidth >= rackWidth) {
            // Add first rack
            layoutItems.push({ type: 'rack', x: 0, width: rackWidth, rackType: 'single' });
            totalBays += baysPerRack;
            currentX_world += rackWidth;
        } else {
            // Not enough room for even one rack
            return { layoutItems: [], totalBays: 0, totalLayoutWidth: 0, usableLength: 0 };
        }

        // 2. Loop, adding [Aisle] + [Rack]
        while (currentX_world + aisleWidth + rackWidth <= sysWidth) {
            layoutItems.push({ type: 'aisle', x: currentX_world, width: aisleWidth });
            currentX_world += aisleWidth;

            layoutItems.push({ type: 'rack', x: currentX_world, width: rackWidth, rackType: 'single' });
            totalBays += baysPerRack;
            currentX_world += rackWidth;
        }
    }
    else if (layoutMode === 's-d-s') {
        const singleRackWidth = bayDepth; // calculated single rack depth
        const doubleRackWidth = (bayDepth * 2) + flueSpace; // flueSpace is RACK flue

        // 1. Try to add first [Single Rack]
        if (currentX_world + singleRackWidth <= sysWidth) {
            layoutItems.push({ type: 'rack', x: 0, width: singleRackWidth, rackType: 'single' });
            totalBays += baysPerRack;
            currentX_world += singleRackWidth;
        } else {
            return { layoutItems: [], totalBays: 0, totalLayoutWidth: 0, usableLength: 0 };
        }

        // 2. Loop, adding [Aisle] + [Double Rack]
        while (currentX_world + aisleWidth + doubleRackWidth + aisleWidth + singleRackWidth <= sysWidth) {
            layoutItems.push({ type: 'aisle', x: currentX_world, width: aisleWidth });
            currentX_world += aisleWidth;

            layoutItems.push({ type: 'rack', x: currentX_world, width: doubleRackWidth, rackType: 'double' });
            totalBays += (baysPerRack * 2); // Double rack has two rows of bays
            currentX_world += doubleRackWidth;
        }

        // 3. Try to add final [Aisle] + [Single Rack]
        if (currentX_world + aisleWidth + singleRackWidth <= sysWidth) {
            layoutItems.push({ type: 'aisle', x: currentX_world, width: aisleWidth });
            currentX_world += aisleWidth;

            layoutItems.push({ type: 'rack', x: currentX_world, width: singleRackWidth, rackType: 'single' });
            totalBays += baysPerRack;
            currentX_world += singleRackWidth;
        }
    }

    const lastItem = layoutItems[layoutItems.length - 1];
    const totalLayoutWidth = lastItem ? lastItem.x + lastItem.width : 0;

    return { layoutItems, totalBays, totalLayoutWidth, usableLength };
}

/**
 * Calculates the layout of rack levels.
 * Returns an array of level objects, or null if it fails.
 */
export function calculateElevationLayout(inputs, evenDistribution = false) {
    const { WH, BaseHeight, BW, TH, MC, OC, SC, ST } = inputs;

    if (WH <= 0 || BaseHeight < 0 || BW <= 0 || TH <= 0 || MC < 0 || OC < 0 || SC < 0 || ST <= 0) {
        return null; // Invalid inputs
    }

    const MaxLoadHeight = WH - OC;
    if (MaxLoadHeight < BaseHeight + BW + TH) {
        return { levels: [], N: 0, topToteHeight: 0 }; // Not even space for one level
    }


    let N = 0;
    let currentBeamBottom = BaseHeight;
    let currentToteTop = BaseHeight + BW + TH;
    let sprinklerLevelCount = 1;
    const levels = [];

    // --- PASS 1: Calculate MAX Capacity (always run) ---
    // This loop just stacks levels to find the max N and sprinkler count
    const capacityLayout = [];
    let maxN = 0;
    let numSprinklers = 0;
    let topToteHeightCapacity = 0;

    while (true) {
        if (currentToteTop > MaxLoadHeight) {
            break;
        }

        maxN++;
        const levelInfo = {
            beamBottom: currentBeamBottom,
            beamTop: currentBeamBottom + BW,
            toteTop: currentBeamBottom + BW + TH,
            sprinklerAdded: 0
        };
        capacityLayout.push(levelInfo);
        topToteHeightCapacity = levelInfo.toteTop;

        let requiredGap = MC;
        // Check if *this* level's tote top exceeds the *current* sprinkler threshold
        if (levelInfo.toteTop > (sprinklerLevelCount * ST)) {
            requiredGap += SC;
            levelInfo.sprinklerAdded = SC;
            sprinklerLevelCount++;
            numSprinklers++;
        }

        const actualGap = roundUpTo50(requiredGap);
        const nextBeamBottom = currentBeamBottom + BW + TH + actualGap;
        const nextToteTop = nextBeamBottom + BW + TH;

        currentBeamBottom = nextBeamBottom;
        currentToteTop = nextToteTop;
    }

    // If not trying even distribution, just return the capacity layout
    if (!evenDistribution || numSprinklers === 0) {
        return { levels: capacityLayout, N: maxN, topToteHeight: topToteHeightCapacity };
    }

    // --- PASS 2: Calculate EVEN Distribution ---
    const levelsPerSprinklerGroup = Math.floor(maxN / (numSprinklers + 1));
    const remainderLevels = maxN % (numSprinklers + 1);

    const evenLayout = [];
    let levelCount = 0;
    let sprinklersPlaced = 0;
    currentBeamBottom = BaseHeight;
    currentToteTop = BaseHeight + BW + TH;

    for (let i = 1; i <= maxN; i++) {
        const levelInfo = {
            beamBottom: currentBeamBottom,
            beamTop: currentBeamBottom + BW,
            toteTop: currentBeamBottom + BW + TH,
            sprinklerAdded: 0
        };
        evenLayout.push(levelInfo);
        levelCount++;

        let requiredGap = MC;

        // Check if this is the spot to place a sprinkler
        if (sprinklersPlaced < numSprinklers) {
            const currentGroupSize = levelsPerSprinklerGroup + (sprinklersPlaced < remainderLevels ? 1 : 0);

            if (levelCount === currentGroupSize) {
                requiredGap += SC;
                levelInfo.sprinklerAdded = SC;
                sprinklersPlaced++;
                levelCount = 0; // Reset for next group
            }
        }

        const actualGap = roundUpTo50(requiredGap);

        if (i < maxN) { // Don't calculate next position if we are on the last level
            const nextBeamBottom = currentBeamBottom + BW + TH + actualGap;
            const nextToteTop = nextBeamBottom + BW + TH;

            // Check for fit
            if (nextToteTop > MaxLoadHeight) {
                // This "even" layout FAILED to fit.
                // Revert to the capacity layout which we know fits.
                return { levels: capacityLayout, N: maxN, topToteHeight: topToteHeightCapacity };
            }

            currentBeamBottom = nextBeamBottom;
            currentToteTop = nextToteTop;
        }
    }

    // If we got here, the even layout fits.
    return { levels: evenLayout, N: maxN, topToteHeight: currentToteTop };
}
