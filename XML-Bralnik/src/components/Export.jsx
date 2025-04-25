import React, { useState } from 'react';
import { useXmlData } from './XmlContext';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';

function Export() {
  const { formData, xmlFiles } = useXmlData();
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  // Helper function to ensure numeric values default to 0
  const ensureNumericValue = (value) => {
    if (value === undefined || value === null || value === '') {
      return 0;
    }
    return value;
  };

  const exportToCSV = async () => {
    if (formData.length === 0) {
      setError('No data to export. Please process XML files first.');
      return;
    }

    setIsExporting(true);
    setError(null);
    setSuccessMessage("");

    try {
      const fileName = 'xml_data_export.csv';
      const headers = [
        'File Name',
        'Data Types',
        'Pooblaščenec ID',
        'Število katastrskih postopkov',
        'VrstaKatPos',
        'Število sestavin parcel',
        'Število sestavin stavb',
        'Število sestavin delov stavb',
        'Število sestavin bonitet',
        'Seznam vseh parcel',
        'Seznam vseh stavb',
        'Seznam vseh bonitet',
        'OBMOCJE',
        'BONITETE',
        'TOČKE',
        'DALJICE',
        'PARCELE',
        'STAVBE',
        'DELI STAVBE',
        'ETAZA',
        'PROSTORI',
        'SESTAVINE DELOV STAVB',
        'TOCKE MERITEV',
        'ProcessedIdentifier',
        'ProcessedDate'
      ];

      // Try to read existing file
      let existingData = [];
      let processedIdentifiers = new Set();
      
      try {
        // Try to fetch the existing file
        const response = await fetch(fileName);
        if (response.ok) {
          const csvText = await response.text();
          
          // Parse the existing CSV
          const parsedResults = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true
          });
          
          if (parsedResults.data && parsedResults.data.length > 0) {
            existingData = parsedResults.data;
            
            // Extract identifiers of already processed files
            existingData.forEach(row => {
              if (row.ProcessedIdentifier) {
                processedIdentifiers.add(row.ProcessedIdentifier);
              }
            });
          }
        }
      } catch (err) {
        console.log("No existing file found or error reading file, creating new file", err);
      }
      
      // Process each XML's data
      const newRows = [];
      
      formData.forEach((data, index) => {
        if (!data) return;
        
        // Create a unique identifier for this XML based on its content
        const xmlIdentifier = `${data.fileName || ''}-${data.pooblascenecId || ''}-${data.numKP || 0}`;
        
        // Skip if this XML was already processed
        if (processedIdentifiers.has(xmlIdentifier)) {
          return;
        }
        
        // Add the row data with proper handling of numeric values
        const row = {
          'File Name': data.fileName || '',
          'Data Types': data.dataTypes || '',
          'Pooblaščenec ID': data.pooblascenecId || '',
          'Število katastrskih postopkov': ensureNumericValue(data.numKP),
          'VrstaKatPos': data.vrstaKatPos || '',
          'Število sestavin parcel': ensureNumericValue(data.parcelCount),
          'Število sestavin stavb': ensureNumericValue(data.buildingCount),
          'Število sestavin delov stavb': ensureNumericValue(data.buildingPartCount),
          'Število sestavin bonitet': ensureNumericValue(data.boniteta),
          'Seznam vseh parcel': data.allParcelsInKP || '',
          'Seznam vseh stavb': data.allStavbe || '',
          'Seznam vseh bonitet': data.allBonitete || '',
          'OBMOCJE': data.obmocje || 'S: 0, D: 0, B: 0',
          'BONITETE': data.bonitete || 'S: 0, D: 0, B: 0, O: 0',
          'TOČKE': data.tocke || 'S: 0, D: 0, B: 0',
          'DALJICE': data.daljice || 'S: 0, D: 0, B: 0',
          'PARCELE': data.parcele || 'N: 0, S: 0, D: 0, B: 0',
          'STAVBE': data.stavbe || 'N: 0, S: 0, D: 0, B: 0',
          'DELI STAVBE': data.deliStavb || 'N: 0, S: 0, D: 0, B: 0',
          'ETAZA': data.etaza || 'N: 0, S: 0, D: 0, B: 0',
          'PROSTORI': data.prostori || 'N: 0, S: 0, D: 0, B: 0',
          'SESTAVINE DELOV STAVB': data.sestavineDelovStavb || 'N: 0, S: 0, D: 0, B: 0',
          'TOCKE MERITEV': data.tockeMeritev || 'S: 0, D: 0, B: 0',
          'ProcessedIdentifier': xmlIdentifier,
          'ProcessedDate': new Date().toISOString()
        };
        
        newRows.push(row);
        processedIdentifiers.add(xmlIdentifier);
      });
      
      // Combine existing data with new rows
      const allRows = [...existingData, ...newRows];
      
      // Create the CSV content
      const csvContent = Papa.unparse(allRows, {
        delimiter: ';',
        header: true
      });
      
      // Create a Blob with the CSV content
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, fileName);
      
      setSuccessMessage(`Podatki so bili uspešno izvoženi. ${newRows.length} novih vnosov dodanih.`);
    } catch (err) {
      setError(`Error exporting data: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="export">
      <div className="export-polje">
        <div>Število zaznanih obrazcev: {xmlFiles.length}</div>
        <button 
          className="export-button" 
          onClick={exportToCSV}
          disabled={isExporting || formData.length === 0}
        >
          {isExporting ? "Izvažanje..." : "Izvozi podatke"}
        </button>
        {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
        {successMessage && <div style={{ color: 'green', marginTop: '10px' }}>{successMessage}</div>}
      </div>
    </div>
  );
}

export default Export;