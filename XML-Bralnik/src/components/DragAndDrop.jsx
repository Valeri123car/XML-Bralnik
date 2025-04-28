import { useState } from "react";
import { useXmlData } from "./XmlContext";

function DragAndDrop({ setNumForms }) {
  const { 
    xmlFiles, 
    setXmlFiles, 
    setExtractedData, 
    setExtractingData 
  } = useXmlData();
  
  const [fileNames, setFileNames] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [folderPath, setFolderPath] = useState("Select a folder");

  const handleSelectFolder = async () => {
    try {
      // Use the browser's directory picker API
      const dirHandle = await window.showDirectoryPicker({
        mode: "read"
      });
      
      // Get folder path info
      const folderName = dirHandle.name;
      setFolderPath(folderName);
      
      // Get all files in the directory
      const files = [];
      for await (const entry of dirHandle.values()) {
        if (entry.kind === "file" && entry.name.toLowerCase().endsWith(".xml")) {
          files.push(entry);
        }
      }
      
      // Process XML files
      const xmlFileEntries = [];
      const xmlFileNames = [];
      
      for (const fileEntry of files) {
        if (fileEntry.name.toLowerCase().endsWith(".xml")) {
          xmlFileEntries.push(fileEntry);
          xmlFileNames.push(fileEntry.name);
        }
      }
      
      setFileNames(xmlFileNames);
      setXmlFiles(xmlFileEntries.map(fileEntry => ({ handle: fileEntry, name: fileEntry.name })));
      setNumForms(xmlFileEntries.length);
    } catch (error) {
      console.error("Error accessing folder:", error);
      if (error.name !== "AbortError") {
        alert(`Error accessing folder: ${error.message}`);
      }
    }
  };

  const extractDataFromXML = async (fileHandle) => {
    try {
      const file = await fileHandle.getFile();
      const text = await file.text();
      
      // Parse XML content
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "text/xml");
      
      // Convert XML to text representation
      const serializer = new XMLSerializer();
      const xmlString = serializer.serializeToString(xmlDoc);
      return { fileName: fileHandle.name, xmlContent: xmlDoc, text: xmlString };
    } catch (error) {
      console.error("Error reading the XML file:", error);
      return { fileName: fileHandle.name, text: `Error processing ${fileHandle.name}: ${error.message}` };
    }
  };

  const handleProcessData = async () => {
    setProcessing(true);
    setExtractingData(true);

    const extractedTexts = [];

    // Use the xmlFiles from context instead of accessing it inside a function
    for (const xmlFile of xmlFiles) {
      const extractedData = await extractDataFromXML(xmlFile.handle);
      extractedTexts.push(extractedData);
    }

    setExtractedData(extractedTexts);
    setProcessing(false);
    setExtractingData(false);
  };

  const removeFiles = () => {
    setFileNames([]);
    setXmlFiles([]);
    setExtractedData([]);
    setExtractingData(false);
    setProcessing(false);
  };

  return (
    <div className="dragAndDrop">
      
      <div className="reset">CTRL+R</div>
      <div className="folder-path-section">
        <div className="folder-path-container">
          <div className="folder-path-display">
            <span title={folderPath}>{folderPath}</span>
          </div>
        </div>
      </div>
      
      <div className="select-folder-button">
        <button className="select-folder" onClick={handleSelectFolder}>Izberi mapo</button>
        {fileNames.length > 0 && (
          <div className="selected-files">
            <p>Izbrane datoteke ({fileNames.length}):</p>
            <div className="files-list">
              {fileNames.map((name, index) => (
                <p key={index}>{name}</p>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="drag-and-drop-buttons">
        <button 
          onClick={handleProcessData} 
          className="process-data-button" 
          disabled={processing || fileNames.length === 0}
        >
          {processing ? "Processing..." : "Process Data"}
        </button>
        <button 
          onClick={removeFiles} 
          className="remove-file-button"
          disabled={fileNames.length === 0}
        >
          Izbriši datoteke
        </button>
      </div>
    </div>
  );
}

export default DragAndDrop;