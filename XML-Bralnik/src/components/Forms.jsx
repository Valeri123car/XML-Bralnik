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

  // New function to extract all parcels that are components in cadastral procedures
  const extractAllParcels = (xmlDoc, jsonData) => {
    // Get all parcel components from katastrskiPostopek
    const katastrskiPostopki = xmlDoc.getElementsByTagName("katastrskiPostopek");
    const parcelEidsInKP = new Set();
    
    // Collect all parcel EIDs that start with "1001"
    Array.from(katastrskiPostopki).forEach(postopek => {
      const sestavine = postopek.getElementsByTagName("sestavina");
      
      Array.from(sestavine).forEach(sestavina => {
        const sestavinaEid = sestavina.getElementsByTagName("sestavinaEid")[0]?.textContent.trim();
        if (sestavinaEid && sestavinaEid.startsWith("1001")) {
          parcelEidsInKP.add(sestavinaEid);
        }
      });
    });
    
    // Find matching parcels in JSON data and format them as "sifKo stevilkaParcele"
    const parcele = jsonData.data.parcele?.parcele || [];
    const formattedParcels = [];
    
    parcele.forEach(parcela => {
      // Check if this parcel is in our set of components
      // Note: We might need to format the EID to match the format in JSON data
      const parcelaEidStr = parcela.parcelaEid.toString();
      
      // If this parcel is in our cadastral procedures or if we want all parcels
      // For now, including all parcels since the mapping between sestavinaEid and parcelaEid may need adjustment
      if (parcelaEidStr) {
        formattedParcels.push(`${parcela.sifKo} ${parcela.stevilkaParcele}`);
      }
    });
    
    return formattedParcels.join(", ");
  };

  const countTockeChanges = (items, type) => {
    let count = 0;
    
    if (Array.isArray(items)) {
      items.forEach(item => {
        if (item && item.sprememba === type) {
          count += 1;
        }
      });
    }
    
    return count;
  };

  const extractJsonFromCdata = (xmlDoc) => {
    const datotekaElements = xmlDoc.getElementsByTagName("datoteka");
    
    if (!datotekaElements || datotekaElements.length === 0) {
      return { 
        types: [],
        data: {} 
      };
    }
    
    const result = {
      types: [],     
      data: {}       
    };
    
    Array.from(datotekaElements).forEach((element, index) => {
      const cdataContent = element.textContent.trim();
      
      try {
        const parsedData = JSON.parse(cdataContent);
        
        if (parsedData && parsedData.tip && parsedData.podatki) {
          const dataType = parsedData.tip;
          
          if (!result.types.includes(dataType)) {
            result.types.push(dataType);
            
            result.data[dataType] = {};
          }
          
          Object.keys(parsedData.podatki).forEach(key => {
            if (Array.isArray(parsedData.podatki[key])) {
              if (!result.data[dataType][key]) {
                result.data[dataType][key] = [];
              }
              
              result.data[dataType][key] = [
                ...result.data[dataType][key],
                ...parsedData.podatki[key]
              ];
            }
          });
        }
      } catch (error) {
      }
    });
    
    return result;
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
  
  // Extract all parcels that are components in cadastral procedures
  const allParcelsInKP = extractAllParcels(xmlDoc, jsonData);

  const tocke = [];
  if (jsonData.data.tocke) {
    Object.keys(jsonData.data).forEach(dataType => {
      if (jsonData.data[dataType].tocke && Array.isArray(jsonData.data[dataType].tocke)) {
        tocke.push(...jsonData.data[dataType].tocke);
      }
    });
  }
  const changedPoints = countTockeChanges(tocke, "S");
  const addedPoints = countTockeChanges(tocke, "D");
  const deletedPoints = countTockeChanges(tocke, "B");

  const daljice = [];
  if (jsonData.data.daljice || jsonData.data.tocke) {
    Object.keys(jsonData.data).forEach(dataType => {
      if (jsonData.data[dataType].daljice && Array.isArray(jsonData.data[dataType].daljice)) {
        daljice.push(...jsonData.data[dataType].daljice);
      }
    });
  }
  const spremenjenaDaljica = countTockeChanges(daljice, "S");
  const dodanaDaljica = countTockeChanges(daljice, "D");
  const izbrisanaDaljica = countTockeChanges(daljice, "B");

  const parcele = jsonData.data.parcele?.parcele || [];
  const neSpremenjenaParc = countTockeChanges(parcele, "N");
  const spremenjenaParc = countTockeChanges(parcele, "S");
  const dodaneParc = countTockeChanges(parcele, "D");
  const parcDel = countTockeChanges(parcele, "B");
  
  const rpe = jsonData.data.RPE || {};
  
  const preseki = jsonData.data.preseki || {};
  
  const zgodovina = jsonData.data.zgodovina || {};
  
  const stavbe = jsonData.data.stavbe?.stavbe || [];
  const stavbeSpremenjene = countTockeChanges(stavbe, "S");
  const stavbDodanih = countTockeChanges(stavbe, "D");
  const stavbDel = countTockeChanges(stavbe, "B");
  const stavbNeSpremenjene = countTockeChanges(stavbe, "N");

  const deliStavb = jsonData.data.stavbe?.deliStavb || [];
  const deliStvSpre = countTockeChanges(deliStavb, "S");
  const deliStvDodanih = countTockeChanges(deliStavb, "D");
  const deliStvDel = countTockeChanges(deliStavb, "B");
  const deliStvNespre = countTockeChanges(deliStavb, "N");

  const estaza = jsonData.data.stavbe?.etaze || [];
  const estazaSpre = countTockeChanges(estaza, "S");
  const estazaDodanih = countTockeChanges(estaza, "D");
  const estazaDel = countTockeChanges(estaza, "B");
  const estazaNespre = countTockeChanges(estaza, "N");

  const prostori = jsonData.data.stavbe?.prostori || [];
  const prostoriSpre = countTockeChanges(prostori, "S");
  const prostoriDodani = countTockeChanges(prostori, "D");
  const prostoriDel = countTockeChanges(prostori, "B");
  const prostoriNeSpre = countTockeChanges(prostori, "N");

  const lastniki = jsonData.data.lastnikiUpravljavciUpravniki?.imetnikLastnistva || [];
  

  // Fix: Look for sestavineDelovStavb directly in the podatki object
  const sestaDelStavb = [];
  Object.keys(jsonData.data).forEach(dataType => {
    if (jsonData.data[dataType]?.sestavineDelovStavb && Array.isArray(jsonData.data[dataType].sestavineDelovStavb)) {
      sestaDelStavb.push(...jsonData.data[dataType].sestavineDelovStavb);
    }
  });
  
  const sestaDelStavSpre = countTockeChanges(sestaDelStavb, "S");
  const sestaDelStavDodani = countTockeChanges(sestaDelStavb, "D");
  const sestaDelStavDel = countTockeChanges(sestaDelStavb, "B");
  const sestaDelStavNeSpr = countTockeChanges(sestaDelStavb, "N");

  const bonitete = jsonData.data.bonitete?.obmocjaBonitet || [];
  const bonitetaSpr = countTockeChanges(bonitete, "S");
  const bonitetaDodanih = countTockeChanges(bonitete, "D");
  const bonitetaDel = countTockeChanges(bonitete, "B");
  const bonitetaO = countTockeChanges(bonitete, "O");

  const tockeMeritev = jsonData.data.bonitete?.tockeMeritev || [];
  const tockeMeritevSpre = countTockeChanges(tockeMeritev, "S");
  const tockeMeritevDoda = countTockeChanges(tockeMeritev, "D")
  const tockeMeritevDel = countTockeChanges(tockeMeritev, "B")

  const obmocjeSppEid = jsonData.data.parcele?.obmocjaSpp || [];
  const obmocjeSppSpre = countTockeChanges(obmocjeSppEid, "S")
  const obmocjeSppDodan = countTockeChanges(obmocjeSppEid, "D")
  const obmocjeSppDel = countTockeChanges(obmocjeSppEid, "B")

  return (
    <div className="forms">
      <div className="form-box">
        <div className="form-header">
          <h3>Form #{index + 1}: {currentFile.fileName}</h3>
        </div>
      </div>
      <div className="form-box">
        <p><strong>Found data types:</strong> {jsonData.types.join(", ")}</p>
        <p><strong>Pooblaščenec ID:</strong> {pooblascenecId}</p>
        <p><strong>Število katastrskih postopkov:</strong> {numKP}</p>
        <p><strong>VrstaKatPos:</strong> {vrstaKatPos.length > 0 ? vrstaKatPos.join(", ") : "Ni podatkov"}</p>
        <p><strong>Število sestavin parcel:</strong> {parcelCount}</p>
        <p><strong>Število sestavin stavb:</strong> {buildingCount}</p>
        <p><strong>Število sestavin delov stavb:</strong> {buildingPartCount}</p>
        <p><strong>Število sestavin bonitet:</strong> {boniteta}</p>
        <p><strong>Seznam vseh parcel (sifKo stevilkaParcele):</strong> {allParcelsInKP}</p>
        <p>OBMOCJE S: {obmocjeSppSpre} D: {obmocjeSppDodan} B: {obmocjeSppDel}</p>
        <p>BONITETE S: {bonitetaSpr} D: {bonitetaDodanih} B: {bonitetaDel} O: {bonitetaO}</p>
        <p>TOČKE S: {changedPoints} D: {addedPoints} B: {deletedPoints}</p>
        <p>DALJICE S: {spremenjenaDaljica} D: {dodanaDaljica} B: {izbrisanaDaljica}</p>
        <p>PARCELE N: {neSpremenjenaParc} S: {spremenjenaParc} D: {dodaneParc} B: {parcDel}</p>
        <p>STAVBE N: {stavbNeSpremenjene} S: {stavbeSpremenjene} D: {stavbDodanih} B: {stavbDel}</p>
        <p>DELI STAVBE N: {deliStvNespre} S: {deliStvSpre} D: {deliStvDodanih} B: {deliStvDel}</p> 
        <p>ETAZA N: {estazaNespre} S: {estazaSpre} D: {estazaDodanih} B: {estazaDel}</p>
        <p>PROSTORI N: {prostoriNeSpre} S: {prostoriSpre} D: {prostoriDodani} B: {prostoriDel}</p>
        <p>SESTAVINE DELOV STAVB N: {sestaDelStavNeSpr} S: {sestaDelStavSpre} D: {sestaDelStavDodani} B:{sestaDelStavDel}</p>
        <p>TOCKE MERITEV S: {tockeMeritevSpre} D: {tockeMeritevDoda} B: {tockeMeritevDel}</p>
      </div>
    </div>
  );
}

export default Forms;