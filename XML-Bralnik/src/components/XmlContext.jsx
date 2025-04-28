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
    
    // Create headers for all the individual fields
    const allFields = [
      'fileName',
      'dataTypes',
      'pooblascenecId',
      'numKP',
      'vrstaKatPos',
      'parcelCount',
      'buildingCount',
      'buildingPartCount',
      'boniteta',
      'allParcelsInKP',
      'allStavbe',
      'allBonitete',
      'obmocjeSppSpre',
      'obmocjeSppDodan',
      'obmocjeSppDel',
      'bonitetaSpr',
      'bonitetaDodanih',
      'bonitetaDel',
      'bonitetaO',
      'tockeS',
      'tockeD',
      'tockeB',
      'daljiceS',
      'daljiceD',
      'daljiceB',
      'parceleN',
      'parceleS',
      'parceleD',
      'parceleB',
      'stavbeN',
      'stavbeS',
      'stavbeD',
      'stavbeB',
      'deliStavbN',
      'deliStavbS',
      'deliStavbD',
      'deliStavbB',
      'etazaN',
      'etazaS',
      'etazaD',
      'etazaB',
      'prostoriN',
      'prostoriS',
      'prostoriD',
      'prostoriB',
      'sestavineDelovStavbN',
      'sestavineDelovStavbS',
      'sestavineDelovStavbD',
      'sestavineDelovStavbB',
      'tockeMeritevS',
      'tockeMeritevD',
      'tockeMeritevB'
    ];
    
    // Create a formatted string of all form data
    const formattedLines = formData.map(form => {
      if (!form) return '';
      
      // Format each piece of data with its label
      const entries = allFields.map(key => {
        if (!form[key] && form[key] !== 0) return `${key}: `;
        return `${key}: ${form[key]}`;
      });
      
      // Create the line with all entries separated by semicolons
      return entries.join('; ');
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
        formatDataForExport,
      }}
    >
      {children}
    </XmlContext.Provider>
  );
};

export const useXmlData = () => useContext(XmlContext);