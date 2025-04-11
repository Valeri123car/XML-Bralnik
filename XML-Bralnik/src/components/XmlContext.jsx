import { createContext, useContext, useState } from 'react';

const XmlContext = createContext();

export const XmlProvider = ({ children }) => {
  const [xmlFiles, setXmlFiles] = useState([]);
  const [extractedData, setExtractedData] = useState([]);
  const [extractingData, setExtractingData] = useState(false);
  const [formData, setFormData] = useState([]);
  const [extractedDataByXml, setExtractedDataByXml] = useState([]);
  const [currentXmlIndex, setCurrentXmlIndex] = useState(0);

  const updateFormData = (index, data) => {
    setFormData((prevForms) => {
      const newForms = [...prevForms];
      newForms[index] = { ...newForms[index], ...data }; 
      return newForms;
    });
  };

  const updateExtractedDataForXml = (xmlIndex, data) => {
    setExtractedDataByXml((prevData) => {
      const newData = [...prevData];
      newData[xmlIndex] = { ...newData[xmlIndex], ...data }; 
      return newData;
    });
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
      }}
    >
      {children}
    </XmlContext.Provider>
  );
};

export const useXmlData = () => useContext(XmlContext);