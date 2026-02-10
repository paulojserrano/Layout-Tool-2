import { initializeUI } from './ui.js';
import { initializeSolver } from './solver.js';
import { configurations } from './config.js';
import {
    warehouseLengthInput, warehouseWidthInput, clearHeightInput,
    detailViewToggle,
    solverStorageReqInput, solverThroughputReqInput, solverAspectRatioInput,
    readOnlyConfigContainer,
    solverRespectConstraintsCheckbox,
    warehouseLengthContainer,
    warehouseWidthContainer,
    solverMethodSelect,
    aspectRatioInputContainer,
    fixedLengthInputContainer,
    fixedWidthInputContainer,
    solverFixedLength,
    solverFixedWidth,
    manualInputContainer,
    solverManualLength,
    solverManualWidth,
    solverStorageReqContainer,
    solverEquivalentVolumeContainer,
    solverOptionsContainer,
    solverTotePresetSelect,
    solverToteHeightInput,
    robotPathTopLinesInput,
    robotPathBottomLinesInput,
    robotPathAddLeftACRCheckbox,
    robotPathAddRightACRCheckbox,
    userSetbackTopInput,
    userSetbackBottomInput,
    userSetbackLeftInput,
    userSetbackRightInput,
    refreshDOMElements,
    solverExpandPDCheckbox,
    solverReduceLevelsCheckbox,
    manualSystemConfigSelect,
    manualToteSizeSelect

} from './dom.js';

function createParamHTML(label, value, unit = '') {
    if (label === null || value === null) {
        return `<div class="config-param-row is-empty"></div>`;
    }
    if (label === "Layout Mode") {
        value = value === 's-d-s' ? 'Single-Double-Single' : 'All Singles';
    }
    else if (typeof value === 'boolean') {
        value = value ? 'Yes' : 'No';
    }
    else if (typeof value === 'number') {
        if (label === "Max Perf. Density") {
             value = value.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
        } else {
            value = value.toLocaleString('en-US');
        }
    }
    return `
        <div class="config-param-row">
            <span class="config-param-label">${label}</span>
            <span class="config-param-value">${value}${unit ? ` ${unit}` : ''}</span>
        </div>
    `;
}

function buildReadOnlyConfigPage() {
    if (!readOnlyConfigContainer) return;
    let allConfigsHTML = '';
    for (const key in configurations) {
        const config = configurations[key];
        const col1Params = [
            { label: "Tote Width", key: 'tote-width', unit: 'mm' },
            { label: "Tote Length", key: 'tote-length', unit: 'mm' },
            { label: "Totes per Bay", key: 'tote-qty-per-bay', unit: 'qty' },
            { label: "Totes Deep", key: 'totes-deep', unit: 'qty' },
            { label: "Tote-to-Tote", key: 'tote-to-tote-dist', unit: 'mm' },
            { label: "Tote-to-Upright", key: 'tote-to-upright-dist', unit: 'mm' },
            { label: "Tote Back-to-Back", key: 'tote-back-to-back-dist', unit: 'mm' }
        ];
        const col2Params = [
            { label: "Upright Length", key: 'upright-length', unit: 'mm' },
            { label: "Upright Width", key: 'upright-width', unit: 'mm' },
            { label: "Aisle Width (<10m)", key: 'aisle-width-low', unit: 'mm' },
            { label: "Aisle Width (>10m)", key: 'aisle-width-high', unit: 'mm' },
            { label: "Rack Flue Space", key: 'rack-flue-space', unit: 'mm' },
            { label: "Top Setback", key: 'top-setback', unit: 'mm' },
            { label: "Bottom Setback", key: 'bottom-setback', unit: 'mm' },
            { label: "Left Setback", key: 'setback-left', unit: 'mm' },
            { label: "Right Setback", key: 'setback-right', unit: 'mm' },
            { label: "Layout Mode", key: 'layout-mode', unit: '' }
        ];
        const col3Params = [
            { label: "Base Beam Height", key: 'base-beam-height', unit: 'mm' },
            { label: "Beam Width", key: 'beam-width', unit: 'mm' },
            { label: "Min. Clearance", key: 'min-clearance', unit: 'mm' },
            { label: "Overhead Clearance", key: 'overhead-clearance', unit: 'mm' },
            { label: "Sprinkler Threshold", key: 'sprinkler-threshold', unit: 'mm' },
            { label: "Sprinkler Clearance", key: 'sprinkler-clearance', unit: 'mm' },
            { label: "Max Perf. Density", key: 'max-perf-density', unit: '' },
            { label: "Consider Tunnels", key: 'considerTunnels', unit: '' },
            { label: "Consider Backpacks", key: 'considerBackpacks', unit: '' },
            { label: "Buffer Layer", key: 'hasBufferLayer', unit: '' }
        ];
        const maxLength = Math.max(col1Params.length, col2Params.length, col3Params.length);
        let paramsHTML = '';
        for (let i = 0; i < maxLength; i++) {
            const p1 = col1Params[i];
            const p2 = col2Params[i];
            const p3 = col3Params[i];
            paramsHTML += createParamHTML(p1 ? p1.label : null, p1 ? config[p1.key] : null, p1 ? p1.unit : '');
            paramsHTML += createParamHTML(p2 ? p2.label : null, p2 ? config[p2.key] : null, p2 ? p2.unit : '');
            paramsHTML += createParamHTML(p3 ? p3.label : null, p3 ? config[p3.key] : null, p3 ? p3.unit : '');
        }
        const configCardHTML = `
            <section class="config-card">
                <h3>${config.name}</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-2">
                    <h4 class="text-sm font-black text-black mb-3 uppercase border-b-2 border-black pb-1 md:col-span-1">1. Rack Specs (Tote)</h4>
                    <h4 class="text-sm font-black text-black mb-3 uppercase border-b-2 border-black pb-1 md:col-span-1">2. Rack Specs (Structure)</h4>
                    <h4 class="text-sm font-black text-black mb-3 uppercase border-b-2 border-black pb-1 md:col-span-1">3. Vertical & Logic</h4>
                    ${paramsHTML}
                </div>
            </section>
        `;
        allConfigsHTML += configCardHTML;
    }
    readOnlyConfigContainer.innerHTML = allConfigsHTML;
}

function updateSolverMethodUI() {
    const method = solverMethodSelect.value;
    const respectConstraints = solverRespectConstraintsCheckbox.checked;

    aspectRatioInputContainer.style.display = (method === 'aspectRatio') ? 'block' : 'none';
    fixedLengthInputContainer.style.display = (method === 'fixedLength') ? 'block' : 'none';
    fixedWidthInputContainer.style.display = (method === 'fixedWidth') ? 'block' : 'none';

    solverStorageReqContainer.style.display = 'block';
    solverEquivalentVolumeContainer.style.display = 'block';
    solverOptionsContainer.style.display = 'block';

    // Removed logic for 'all' option in solverToteSizeSelect as it's replaced

    if (!respectConstraints) {
        warehouseLengthContainer.style.display = 'none';
        warehouseWidthContainer.style.display = 'none';
    } else {
        if (method === 'aspectRatio') {
            warehouseLengthContainer.style.display = 'block';
            warehouseWidthContainer.style.display = 'block';
        } else if (method === 'fixedLength') {
            warehouseLengthContainer.style.display = 'none';
            warehouseWidthContainer.style.display = 'block';
        } else if (method === 'fixedWidth') {
            warehouseLengthContainer.style.display = 'block';
            warehouseWidthContainer.style.display = 'none';
        }
    }

    if (!solverExpandPDCheckbox.checked) {
        solverReduceLevelsCheckbox.checked = false;
        solverReduceLevelsCheckbox.disabled = true;
        const reduceLabel = document.getElementById('reduceLevelsLabel');
        if(reduceLabel) reduceLabel.classList.add('opacity-50');
    } else {
        solverReduceLevelsCheckbox.disabled = false;
        const reduceLabel = document.getElementById('reduceLevelsLabel');
        if(reduceLabel) reduceLabel.classList.remove('opacity-50');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Refresh DOM elements (Header/Sidebar are static now)
    refreshDOMElements();

    // 2. Continue initialization
    buildReadOnlyConfigPage();

    if (manualSystemConfigSelect) {
        manualSystemConfigSelect.innerHTML = '';
        for (const key in configurations) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = configurations[key].name;
            manualSystemConfigSelect.appendChild(option);
        }
        manualSystemConfigSelect.selectedIndex = 0;

        // --- HPC Logic Handler ---
        manualSystemConfigSelect.addEventListener('change', () => {
            const selectedConfig = manualSystemConfigSelect.value;
            const option850 = manualToteSizeSelect.querySelector('option[value="850x650x400"]');

            if (selectedConfig.includes('HPC')) {
                // Force 650
                manualToteSizeSelect.value = "650x450x300";
                if (option850) option850.disabled = true;
            } else {
                if (option850) option850.disabled = false;
            }
        });
        // Trigger once
        manualSystemConfigSelect.dispatchEvent(new Event('change'));
    }

    // Moved inside DOMContentLoaded after refreshDOMElements()
    const redrawInputs = [
        warehouseLengthInput, warehouseWidthInput, clearHeightInput,
        detailViewToggle,
        robotPathTopLinesInput, robotPathBottomLinesInput,
        robotPathAddLeftACRCheckbox, robotPathAddRightACRCheckbox,
        userSetbackTopInput, userSetbackBottomInput,
        userSetbackLeftInput, userSetbackRightInput,
        solverToteHeightInput
    ];

    const numberInputs = [
        warehouseLengthInput, warehouseWidthInput, clearHeightInput,
        solverStorageReqInput, solverThroughputReqInput,
        solverFixedLength,
        solverFixedWidth,
        solverManualLength,
        solverManualWidth,
        userSetbackTopInput,
        userSetbackBottomInput,
        userSetbackLeftInput,
        userSetbackRightInput
    ];

    const decimalInputs = [
        solverAspectRatioInput,
    ];

    initializeUI(redrawInputs, numberInputs, decimalInputs);
    initializeSolver();

    if (solverRespectConstraintsCheckbox) solverRespectConstraintsCheckbox.addEventListener('change', updateSolverMethodUI);
    if (solverMethodSelect) solverMethodSelect.addEventListener('change', updateSolverMethodUI);
    if (solverExpandPDCheckbox) solverExpandPDCheckbox.addEventListener('change', updateSolverMethodUI);

    updateSolverMethodUI();
});
