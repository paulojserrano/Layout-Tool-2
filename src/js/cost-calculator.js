import {
    exportCalculatorButton,
    calculatorFileInput,
    calculatorStatus
} from './dom.js';
import { selectedSolverResult } from './solver.js';
import { formatNumber } from './utils.js';

/**
 * Handles the file upload and processing
 * @param {Event} e 
 */
async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!selectedSolverResult) {
        calculatorStatus.textContent = "Error: No solution selected in Solver tab.";
        // Reset file input to allow re-upload
        calculatorFileInput.value = '';
        return;
    }

    calculatorStatus.textContent = "Processing file...";

    try {
        const data = await file.arrayBuffer();
        
        // --- FIX ---
        // Read the workbook, preserving VBA macros (bookVBA: true) 
        // and cell styles (cellStyles: true).
        const workbook = XLSX.read(data, { 
            type: 'array', 
            bookVBA: true, 
            cellStyles: true 
        });
        // --- END FIX ---

        // 1. Create Data for the new sheet
        // We use an Array of Arrays
        const ws_data = [
            ["Solver Output Parameter", "Value", "Unit"],
            ["Configuration Name", selectedSolverResult.configName, ""],
            ["---"], // Spacer
            ["Total Storage Locations", selectedSolverResult.totalLocations, "locs"],
            ["Total Bays", selectedSolverResult.totalBays, "bays"],
            ["Footprint", selectedSolverResult.footprint.toFixed(1), "m²"],
            ["Solved Length", selectedSolverResult.L, "mm"],
            ["Solved Width", selectedSolverResult.W, "mm"],
            ["Max Levels", selectedSolverResult.maxLevels, "levels"],
            ["Rows x Bays/Row", `${formatNumber(selectedSolverResult.numRows)} x ${formatNumber(selectedSolverResult.baysPerRack)}`, ""],
            ["---"],
            ["Perf. Density", selectedSolverResult.density.toFixed(2), "PPH/m²"],
            ["Cap. Utilization", (selectedSolverResult.density / selectedSolverResult.maxPerfDensity * 100).toFixed(1), "%"],
        ];

        // 2. Create a new worksheet
        const ws = XLSX.utils.aoa_to_sheet(ws_data);

        // 3. Add the worksheet to the workbook
        // We will name it "Solver Output"
        XLSX.utils.book_append_sheet(workbook, ws, "Solver Output");

        // 4. Write the workbook and trigger download
        // We must write as 'array' to get an ArrayBuffer, which is needed for the Blob
        // We specify bookType: 'xlsm' to preserve macros
        const wb_out = XLSX.write(workbook, { bookType: 'xlsm', type: 'array' });

        // 5. Create a Blob
        const blob = new Blob([wb_out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

        // 6. Create a download link
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        
        // Create a dynamic filename
        const originalName = file.name.replace(/\.xlsm$|\.xlsx$/i, '');
        const configName = selectedSolverResult.configName.replace(/\s+/g, '_').substring(0, 20);
        a.download = `${originalName}_${configName}_Solved.xlsm`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);

        calculatorStatus.textContent = "Export complete! Check your downloads.";

    } catch (err) {
        console.error("Error processing Excel file:", err);
        calculatorStatus.textContent = "Error: Could not process file.";
    }

    // Reset file input to allow re-upload of the same file
    calculatorFileInput.value = '';
}


/**
 * Initializes the Cost Calculator tab
 */
export function initializeCostCalculator() {
    if (!exportCalculatorButton) return;

    exportCalculatorButton.addEventListener('click', () => {
        if (!selectedSolverResult) {
            calculatorStatus.textContent = "Error: Select a solution in 'Solver' tab first.";
            return;
        }
        // Programmatically click the hidden file input
        calculatorFileInput.click();
    });

    calculatorFileInput.addEventListener('change', handleFileUpload);
}