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
      
      // Define all field headers
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
        // OBMOCJE - individual fields
        'OBMOCJE - S',
        'OBMOCJE - D',
        'OBMOCJE - B',
        // BONITETE - individual fields
        'BONITETE - S',
        'BONITETE - D',
        'BONITETE - B',
        'BONITETE - O',
        // TOČKE - individual fields
        'TOČKE - S',
        'TOČKE - D',
        'TOČKE - B',
        // DALJICE - individual fields
        'DALJICE - S',
        'DALJICE - D',
        'DALJICE - B',
        // PARCELE - individual fields
        'PARCELE - N',
        'PARCELE - S',
        'PARCELE - D',
        'PARCELE - B',
        // STAVBE - individual fields
        'STAVBE - N',
        'STAVBE - S',
        'STAVBE - D',
        'STAVBE - B',
        // DELI STAVBE - individual fields
        'DELI STAVBE - N',
        'DELI STAVBE - S',
        'DELI STAVBE - D',
        'DELI STAVBE - B',
        // ETAZA - individual fields
        'ETAZA - N',
        'ETAZA - S',
        'ETAZA - D',
        'ETAZA - B',
        // PROSTORI - individual fields
        'PROSTORI - N',
        'PROSTORI - S',
        'PROSTORI - D',
        'PROSTORI - B',
        // SESTAVINE DELOV STAVB - individual fields
        'SESTAVINE DELOV STAVB - N',
        'SESTAVINE DELOV STAVB - S',
        'SESTAVINE DELOV STAVB - D',
        'SESTAVINE DELOV STAVB - B',
        // TOCKE MERITEV - individual fields
        'TOCKE MERITEV - S',
        'TOCKE MERITEV - D',
        'TOCKE MERITEV - B',
        // Metadata fields
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
        alert("No existing file found or error reading file, creating new file", err);
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
        
        // Add the row data with proper handling of numeric values and individual fields
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
          
          // Individual fields for each category
          'OBMOCJE - S': ensureNumericValue(data.obmocjeSppSpre),
          'OBMOCJE - D': ensureNumericValue(data.obmocjeSppDodan),
          'OBMOCJE - B': ensureNumericValue(data.obmocjeSppDel),
          
          'BONITETE - S': ensureNumericValue(data.bonitetaSpr),
          'BONITETE - D': ensureNumericValue(data.bonitetaDodanih),
          'BONITETE - B': ensureNumericValue(data.bonitetaDel), 
          'BONITETE - O': ensureNumericValue(data.bonitetaO),
          
          'TOČKE - S': ensureNumericValue(data.tockeS),
          'TOČKE - D': ensureNumericValue(data.tockeD),
          'TOČKE - B': ensureNumericValue(data.tockeB),
          
          'DALJICE - S': ensureNumericValue(data.daljiceS),
          'DALJICE - D': ensureNumericValue(data.daljiceD),
          'DALJICE - B': ensureNumericValue(data.daljiceB),
          
          'PARCELE - N': ensureNumericValue(data.parceleN),
          'PARCELE - S': ensureNumericValue(data.parceleS),
          'PARCELE - D': ensureNumericValue(data.parceleD),
          'PARCELE - B': ensureNumericValue(data.parceleB),
          
          'STAVBE - N': ensureNumericValue(data.stavbeN),
          'STAVBE - S': ensureNumericValue(data.stavbeS),
          'STAVBE - D': ensureNumericValue(data.stavbeD),
          'STAVBE - B': ensureNumericValue(data.stavbeB),
          
          'DELI STAVBE - N': ensureNumericValue(data.deliStavbN),
          'DELI STAVBE - S': ensureNumericValue(data.deliStavbS),
          'DELI STAVBE - D': ensureNumericValue(data.deliStavbD),
          'DELI STAVBE - B': ensureNumericValue(data.deliStavbB),
          
          'ETAZA - N': ensureNumericValue(data.etazaN),
          'ETAZA - S': ensureNumericValue(data.etazaS),
          'ETAZA - D': ensureNumericValue(data.etazaD),
          'ETAZA - B': ensureNumericValue(data.etazaB),
          
          'PROSTORI - N': ensureNumericValue(data.prostoriN),
          'PROSTORI - S': ensureNumericValue(data.prostoriS),
          'PROSTORI - D': ensureNumericValue(data.prostoriD),
          'PROSTORI - B': ensureNumericValue(data.prostoriB),
          
          'SESTAVINE DELOV STAVB - N': ensureNumericValue(data.sestavineDelovStavbN),
          'SESTAVINE DELOV STAVB - S': ensureNumericValue(data.sestavineDelovStavbS),
          'SESTAVINE DELOV STAVB - D': ensureNumericValue(data.sestavineDelovStavbD),
          'SESTAVINE DELOV STAVB - B': ensureNumericValue(data.sestavineDelovStavbB),
          
          'TOCKE MERITEV - S': ensureNumericValue(data.tockeMeritevS),
          'TOCKE MERITEV - D': ensureNumericValue(data.tockeMeritevD),
          'TOCKE MERITEV - B': ensureNumericValue(data.tockeMeritevB),
          
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