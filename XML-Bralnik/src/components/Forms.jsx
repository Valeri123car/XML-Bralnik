import { useEffect, useState } from "react";
import { useXmlData } from "./XmlContext";

function Forms({ index = 0 }) {
  const { extractedData } = useXmlData();
  const [loading, setLoading] = useState(true);
  const [currentFile, setCurrentFile] = useState(null);

  useEffect(() => {
    if (extractedData && extractedData.length > index) {
      setCurrentFile(extractedData[index]);
      setLoading(false);
    } else {
      setLoading(true);
    }
  }, [extractedData, index]);

  if (loading || !currentFile) {
    return (
      <div className="forms">
        <div className="loading-message">
          <p>Please select XML files and click "Process Data" to view content for Form #{index + 1}.</p>
        </div>
      </div>
    );
  }

  const getTextContentByTag = (xmlDoc, tagName) => {
    const elements = xmlDoc.getElementsByTagName(tagName);
    return elements.length > 0 ? elements[0].textContent.trim() : null;
  };

  const countKatastrskiPostopki = (xmlDoc) => {
    return xmlDoc.getElementsByTagName("katastrskiPostopek").length;
  };

  const getVrstaKatPos = (xmlDoc, imePostopka) => {
    const elements = xmlDoc.getElementsByTagName(imePostopka);
    const vrstaSet = new Set();

    Array.from(elements).forEach(el => {
      const value = el.textContent.trim();
      if (value) {
        vrstaSet.add(value);
      }
    });

    return Array.from(vrstaSet);
  };

  const vsotaEid = (xmlDoc, prefix) => {
    let count = 0;
    const katastrskiPostopki = xmlDoc.getElementsByTagName("katastrskiPostopek");

    Array.from(katastrskiPostopki).forEach(postopek => {
      const sestavine = postopek.getElementsByTagName("sestavina");

      Array.from(sestavine).forEach(sestavina => {
        const sestavinaEid = sestavina.getElementsByTagName("sestavinaEid")[0]?.textContent.trim();
        if (sestavinaEid && sestavinaEid.startsWith(prefix)) {
          count += 1;
        }
      });
    });

    return count;
  };

  const countTockeChanges = (tocke, type) => {
    let count = 0;
    
    if (Array.isArray(tocke)) {
      tocke.forEach(tocka => {
        if (tocka.sprememba === type) {
          count += 1;
        }
      });
    }
    
    return count;
  };

  const extractJsonFromCdata = (xmlDoc) => {
    const datotekaElement = xmlDoc.getElementsByTagName("datoteka")[0];
    const cdataContent = datotekaElement ? datotekaElement.textContent.trim() : '';
    try {
      return JSON.parse(cdataContent);
    } catch (error) {
      console.error("Error parsing JSON from CDATA:", error);
      return null;
    }
  };

  const xmlDoc = currentFile.xmlContent;
  const pooblascenecId = getTextContentByTag(xmlDoc, "pooblascenecId");
  const numKP = countKatastrskiPostopki(xmlDoc);
  const vrstaKatPos = getVrstaKatPos(xmlDoc, "vrstaKatastrskegaPostopka");
  const parcelCount = vsotaEid(xmlDoc, "1001");
  const buildingCount = vsotaEid(xmlDoc, "1002");
  const buildingPartCount = vsotaEid(xmlDoc, "1003");
  const boniteta = vsotaEid(xmlDoc, "1201");

  const jsonData = extractJsonFromCdata(xmlDoc);
  
  const tocke = jsonData ? jsonData.podatki.tocke : [];
  const changedPoints = countTockeChanges(tocke, "S");
  const addedPoints = countTockeChanges(tocke, "D");
  const deletedPoints = countTockeChanges(tocke, "B");

  const daljica = jsonData ? jsonData.podatki.daljice : [];
  const spremenjenaDaljica = countTockeChanges(daljica, "S");
  const dodanaDaljica = countTockeChanges(daljica, "D");
  const izbrisanaDaljica = countTockeChanges(daljica, "B");

  const parcele = jsonData ? jsonData.podatki.parcele : [];
  const neSpremenjenaParc = countTockeChanges(parcele, "N");
  const spremenjenaParc = countTockeChanges(parcele, "S");
  const dodaneParc = countTockeChanges(parcele, "D");
  const parcDel = countTockeChanges(parcele, "B");
  return (
    <div className="forms">
      <div className="form-box">
        <div className="form-header">
          <h3>Form #{index + 1}: {currentFile.fileName}</h3>
        </div>
      </div>
      <div className="form-box">
        <p><strong>Pooblaščenec ID:</strong> {pooblascenecId}</p>
        <p><strong>Število katastrskih postopkov:</strong> {numKP}</p>
        <p><strong>VrstaKatPos:</strong> {vrstaKatPos.length > 0 ? vrstaKatPos.join(", ") : "Ni podatkov"}</p>
        <p><strong>Število sestavin parcel:</strong> {parcelCount}</p>
        <p><strong>Število sestavin stavb:</strong> {buildingCount}</p>
        <p><strong>Število sestavin delov stavb:</strong> {buildingPartCount}</p>
        <p><strong>Število sestavin bonitet:</strong> {boniteta}</p>
        <p>TOČKE S: {changedPoints} D: {addedPoints} B: {deletedPoints}</p>
        <p>DALJICE S: {spremenjenaDaljica} D: {dodanaDaljica} B: {izbrisanaDaljica}</p>
        <p>PARCELE N: {neSpremenjenaParc} S: {spremenjenaParc} D: {dodaneParc} B: {parcDel}</p>
      </div>
    </div>
  );
}

export default Forms;
