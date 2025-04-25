import { createContext, useContext, useState } from 'react';

const XmlContext = createContext();

export const XmlProvider = ({ children }) => {
  const [xmlFiles, setXmlFiles] = useState([]);
  const [extractedData, setExtractedData] = useState([]);
  const [extractingData, setExtractingData] = useState(false);
  const [formData, setFormData] = useState([]);
  const [extractedDataByXml, setExtractedDataByXml] = useState([]);
  const [currentXmlIndex, setCurrentXmlIndex] = useState(0);

  // Update form data for a specific XML file index
  const updateFormData = (index, data) => {
    setFormData((prevForms) => {
      const newForms = [...prevForms];
      newForms[index] = { ...newForms[index], ...data }; 
      return newForms;
    });
  };

  // Update extracted data for a specific XML file
  const updateExtractedDataForXml = (xmlIndex, data) => {
    setExtractedDataByXml((prevData) => {
      const newData = [...prevData];
      newData[xmlIndex] = { ...newData[xmlIndex], ...data }; 
      return newData;
    });
  };
  
  // Format data for CSV export (returns a single string with semicolons)
  const formatDataForExport = () => {
    if (formData.length === 0) return '';
    
    // Create a formatted string of all form data
    const formattedLines = formData.map(form => {
      if (!form) return '';
      
      // Format each piece of data with its label
      const entries = Object.entries(form).map(([key, value]) => {
        // Skip fileName since it's handled separately
        if (key === 'fileName') return null;
        
        // Format the label based on key
        let label;
        switch(key) {
          case 'dataTypes': label = 'Found data types'; break;
          case 'pooblascenecId': label = 'Pooblaščenec ID'; break;
          case 'numKP': label = 'Število katastrskih postopkov'; break;
          case 'vrstaKatPos': label = 'VrstaKatPos'; break;
          case 'parcelCount': label = 'Število sestavin parcel'; break;
          case 'buildingCount': label = 'Število sestavin stavb'; break;
          case 'buildingPartCount': label = 'Število sestavin delov stavb'; break;
          case 'boniteta': label = 'Število sestavin bonitet'; break;
          case 'allParcelsInKP': label = 'Seznam vseh parcel'; break;
          case 'allStavbe': label = 'Seznam vseh stavb'; break;
          case 'allBonitete': label = 'Seznam vseh bonitet'; break;
          case 'obmocje': label = 'OBMOCJE'; break;
          case 'bonitete': label = 'BONITETE'; break;
          case 'tocke': label = 'TOČKE'; break;
          case 'daljice': label = 'DALJICE'; break;
          case 'parcele': label = 'PARCELE'; break;
          case 'stavbe': label = 'STAVBE'; break;
          case 'deliStavb': label = 'DELI STAVBE'; break;
          case 'etaza': label = 'ETAZA'; break;
          case 'prostori': label = 'PROSTORI'; break;
          case 'sestavineDelovStavb': label = 'SESTAVINE DELOV STAVB'; break;
          case 'tockeMeritev': label = 'TOCKE MERITEV'; break;
          default: label = key;
        }
        
        return `${label}: ${value}`;
      }).filter(Boolean); // Remove null entries
      
      // Create the line with fileName at the beginning and the rest separated by semicolons
      return `${form.fileName || 'Unknown File'}; ${entries.join('; ')}`;
    });
    
    return formattedLines.join('\n');
  };

  return (
    <XmlContext.Provider
      value={{
        xmlFiles,
        setXmlFiles,
        extractedData,
        setExtractedData,
        extractingData,
        setExtractingData,
        formData,
        setFormData,
        updateFormData,
        extractedDataByXml,
        setExtractedDataByXml,
        updateExtractedDataForXml,
        currentXmlIndex,
        setCurrentXmlIndex,
        formatDataForExport, // Add the new function
      }}
    >
      {children}
    </XmlContext.Provider>
  );
};

export const useXmlData = () => useContext(XmlContext);