import { useEffect, useState } from "react";
import { useXmlData } from "./XmlContext";

function Forms({ index = 0 }) {
  const { extractedData, updateFormData } = useXmlData();
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

  const extractAllParcels = (xmlDoc, jsonData) => {
    const katastrskiPostopki = xmlDoc.getElementsByTagName("katastrskiPostopek");
    const parcelEidsInKP = new Set();
    
    Array.from(katastrskiPostopki).forEach(postopek => {
      const sestavine = postopek.getElementsByTagName("sestavina");
      
      Array.from(sestavine).forEach(sestavina => {
        const sestavinaEid = sestavina.getElementsByTagName("sestavinaEid")[0]?.textContent.trim();
        if (sestavinaEid && sestavinaEid.startsWith("1001")) {
          parcelEidsInKP.add(sestavinaEid);
        }
      });
    });
    
    const parcele = jsonData.data.parcele?.parcele || [];
    const formattedParcels = [];
    
    parcele.forEach(parcela => {
      const parcelaEidStr = parcela.parcelaEid.toString();
      
      if (parcelaEidStr) {
        formattedParcels.push(`${parcela.sifKo} ${parcela.stevilkaParcele}`);
      }
    });
    
    return formattedParcels.join(", ");
  };

  const eAllStavbe = (xmlDoc) => {
    // Step 1: Collect all sestavinaEid values starting with "1002" from katastrski postopki
    const stavbaEidsInKP = new Set();
    const sestavinaElements = xmlDoc.getElementsByTagName("sestavinaEid");
    
    Array.from(sestavinaElements).forEach(element => {
      const eid = element.textContent.trim();
      if (eid.startsWith("1002")) {
        stavbaEidsInKP.add(eid);
      }
    });
    
    
    // If no matching IDs found, return early
    if (stavbaEidsInKP.size === 0) {
      return "";
    }
    
    // Step 2: Look for <stavbe> tag in the document
    const stavbeTags = xmlDoc.getElementsByTagName("stavbe");
    const matchedBuildingInfo = new Map();
    
    if (stavbeTags.length > 0) {
      
      // Process each <stavbe> tag
      Array.from(stavbeTags).forEach((stavbeTag, index) => {
        
        // Get the text content of the stavbe tag
        const stavbeContent = stavbeTag.textContent || "";
        
        // For each building ID, look for its information in the stavbe content
        for (const eid of stavbaEidsInKP) {
          // Only process if we haven't found info for this building yet
          if (!matchedBuildingInfo.has(eid)) {
            // Look for the building ID in the stavbe content
            if (stavbeContent.includes(eid)) {
              
              // Extract a chunk of text around the building ID
              const startIndex = Math.max(0, stavbeContent.indexOf(eid) - 100);
              const endIndex = Math.min(stavbeContent.length, stavbeContent.indexOf(eid) + 500);
              const contextText = stavbeContent.substring(startIndex, endIndex);
              
              // Extract sifKo and stevilkaStavbe using regex
              const sifKoMatch = /"sifKo"\s*:\s*(\d+)/i.exec(contextText);
              const stevilkaStavbeMatch = /"stevilkaStavbe"\s*:\s*(\d+)/i.exec(contextText);
              
              if (sifKoMatch && stevilkaStavbeMatch) {
                const sifKo = sifKoMatch[1];
                const stevilkaStavbe = stevilkaStavbeMatch[1];
                
                matchedBuildingInfo.set(eid, { sifKo, stevilkaStavbe });
              }
            }
          }
        }
      });
    } else {
      
      // If we can't find <stavbe> tag, try finding the information in the entire document
      const docContent = xmlDoc.documentElement.textContent || "";
      
      for (const eid of stavbaEidsInKP) {
        if (docContent.includes(eid)) {
          
          // Extract context around the building ID
          const startIndex = Math.max(0, docContent.indexOf(eid) - 100);
          const endIndex = Math.min(docContent.length, docContent.indexOf(eid) + 500);
          const contextText = docContent.substring(startIndex, endIndex);
          
          // Extract sifKo and stevilkaStavbe using regex
          const sifKoMatch = /"sifKo"\s*:\s*(\d+)/i.exec(contextText);
          const stevilkaStavbeMatch = /"stevilkaStavbe"\s*:\s*(\d+)/i.exec(contextText);
          
          if (sifKoMatch && stevilkaStavbeMatch) {
            const sifKo = sifKoMatch[1];
            const stevilkaStavbe = stevilkaStavbeMatch[1];
            
            matchedBuildingInfo.set(eid, { sifKo, stevilkaStavbe });
          }
        }
      }
    }
    
    // Try another approach using format search if we still haven't found all buildings
    if (matchedBuildingInfo.size < stavbaEidsInKP.size) {
      
      // Look for building information in specific formats
      const docContent = xmlDoc.documentElement.textContent || "";
      
      for (const eid of stavbaEidsInKP) {
        if (!matchedBuildingInfo.has(eid)) {
          // Try finding a pattern like: "stavbaEid": 100200000256359809, "sifKo": 1014, "stevilkaStavbe": 251
          const pattern = new RegExp(`"stavbaEid"\\s*:\\s*${eid}[\\s\\S]*?"sifKo"\\s*:\\s*(\\d+)[\\s\\S]*?"stevilkaStavbe"\\s*:\\s*(\\d+)`, 'i');
          const match = pattern.exec(docContent);
          
          if (match) {
            const sifKo = match[1];
            const stevilkaStavbe = match[2];
            
            matchedBuildingInfo.set(eid, { sifKo, stevilkaStavbe });
          }
        }
      }
    }
    
    // Try one last approach with even more generic pattern matching
    if (matchedBuildingInfo.size < stavbaEidsInKP.size) {
      const docContent = xmlDoc.documentElement.textContent || "";
      
      for (const eid of stavbaEidsInKP) {
        if (!matchedBuildingInfo.has(eid)) {
          // Try various attribute order combinations
          const patterns = [
            // Try with sifKo first, then stevilkaStavbe
            new RegExp(`${eid}[\\s\\S]{0,500}sifKo[^:]*:\\s*(\\d+)[\\s\\S]{0,300}stevilkaStavbe[^:]*:\\s*(\\d+)`, 'i'),
            // Try with stevilkaStavbe first, then sifKo
            new RegExp(`${eid}[\\s\\S]{0,500}stevilkaStavbe[^:]*:\\s*(\\d+)[\\s\\S]{0,300}sifKo[^:]*:\\s*(\\d+)`, 'i'),
            // Try with completely flexible ordering and spacing
            new RegExp(`${eid}[\\s\\S]{0,800}(?:sifKo[^:]*:\\s*(\\d+)|stevilkaStavbe[^:]*:\\s*(\\d+))[\\s\\S]{0,800}(?:sifKo[^:]*:\\s*(\\d+)|stevilkaStavbe[^:]*:\\s*(\\d+))`, 'i')
          ];
          
          for (const pattern of patterns) {
            const match = pattern.exec(docContent);
            if (match) {
              // Extract values based on which pattern matched
              let sifKo, stevilkaStavbe;
              
              if (pattern === patterns[0]) {
                sifKo = match[1];
                stevilkaStavbe = match[2];
              } else if (pattern === patterns[1]) {
                stevilkaStavbe = match[1];
                sifKo = match[2];
              } else if (pattern === patterns[2]) {
                // For the flexible pattern, need to determine which group is which
                if (match[1] && match[4]) {
                  sifKo = match[1];
                  stevilkaStavbe = match[4];
                } else if (match[2] && match[3]) {
                  stevilkaStavbe = match[2];
                  sifKo = match[3];
                }
              }
              
              if (sifKo && stevilkaStavbe) {
                matchedBuildingInfo.set(eid, { sifKo, stevilkaStavbe });
                break; // Break out of pattern loop once we've found a match
              }
            }
          }
        }
      }
    }
  
    // Look through all datoteka elements for JSON content
    if (matchedBuildingInfo.size < stavbaEidsInKP.size) {
      const datotekaTags = xmlDoc.getElementsByTagName("datoteka");
      
      Array.from(datotekaTags).forEach((datotekaTag, index) => {
        const content = datotekaTag.textContent || "";
        
        // Try to extract a JSON object
        try {
          // Find the content that looks like JSON
          const jsonMatches = content.match(/\{[\s\S]*\}/g);
          if (jsonMatches) {
            jsonMatches.forEach(jsonLike => {
              try {
                // Try to parse it as JSON
                const jsonObj = JSON.parse(jsonLike);
                
                // Look for a stavbe array in the parsed JSON
                const stavbeArray = jsonObj.podatki?.stavbe || jsonObj.stavbe || [];
                
                if (Array.isArray(stavbeArray)) {
                  stavbeArray.forEach(stavba => {
                    const stavbaEid = String(stavba.stavbaEid || '');
                    
                    // Check if this stavba is one we're looking for
                    if (stavbaEidsInKP.has(stavbaEid) && !matchedBuildingInfo.has(stavbaEid)) {
                      const sifKo = stavba.sifKo;
                      const stevilkaStavbe = stavba.stevilkaStavbe;
                      
                      if (sifKo !== undefined && stevilkaStavbe !== undefined) {
                        matchedBuildingInfo.set(stavbaEid, { sifKo, stevilkaStavbe });
                      }
                    }
                  });
                }
              } catch (e) {
                // Silent failure for this attempt
              }
            });
          }
        } catch (e) {
          // Continue to the next datoteka tag
        }
      });
    }
    
    // Generate the final result
    const resultStrings = [];
    for (const [eid, info] of matchedBuildingInfo.entries()) {
      const formatted = `${info.sifKo}-${info.stevilkaStavbe}`;
      resultStrings.push(formatted);
    }
    
    return resultStrings.join(", ");
  };
  

  const extractAllBonitete = (xmlDoc, jsonData) => {
    try {
      const katastrskiPostopki = xmlDoc.getElementsByTagName("katastrskiPostopek");
      const bonitetaEidsInKP = new Set();
      
      Array.from(katastrskiPostopki).forEach(postopek => {
        const sestavine = postopek.getElementsByTagName("sestavina");
        
        Array.from(sestavine).forEach(sestavina => {
          const sestavinaEid = sestavina.getElementsByTagName("sestavinaEid")[0]?.textContent.trim();
          if (sestavinaEid && sestavinaEid.startsWith("1201")) {
            bonitetaEidsInKP.add(sestavinaEid);
          }
        });
      });
      
      const formattedBonitete = Array.from(bonitetaEidsInKP);
      
      return formattedBonitete.join(", ");
    } catch (error) {
      console.error("Error in extractAllBonitete:", error);
      return "";
    }
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
    
    Array.from(datotekaElements).forEach((element) => {
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
        // Handle error silently
      }
    });
    
    return result;
  };
  
  // This second useEffect updates the context with all the extracted data
  useEffect(() => {
    if (!loading && currentFile) {
      const xmlDoc = currentFile.xmlContent;
      const jsonData = extractJsonFromCdata(xmlDoc);
      
      // Calculate all the data values
      const pooblascenecId = getTextContentByTag(xmlDoc, "pooblascenecId");
      const numKP = countKatastrskiPostopki(xmlDoc);
      const vrstaKatPos = getVrstaKatPos(xmlDoc, "vrstaKatastrskegaPostopka");
      const parcelCount = vsotaEid(xmlDoc, "1001");
      const buildingCount = vsotaEid(xmlDoc, "1002");
      const buildingPartCount = vsotaEid(xmlDoc, "1003");
      const boniteta = vsotaEid(xmlDoc, "1201");
      
      // Extract all components
      const allParcelsInKP = extractAllParcels(xmlDoc, jsonData);
      const allStavbe = eAllStavbe(xmlDoc, jsonData);
      const allBonitete = extractAllBonitete(xmlDoc, jsonData);
      
      // Process tocke
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
      
      // Process daljice
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
      
      // Process parcele
      const parcele = jsonData.data.parcele?.parcele || [];
      const neSpremenjenaParc = countTockeChanges(parcele, "N");
      const spremenjenaParc = countTockeChanges(parcele, "S");
      const dodaneParc = countTockeChanges(parcele, "D");
      const parcDel = countTockeChanges(parcele, "B");
      
      // Process stavbe
      const stavbe = jsonData.data.stavbe?.stavbe || [];
      const stavbeSpremenjene = countTockeChanges(stavbe, "S");
      const stavbDodanih = countTockeChanges(stavbe, "D");
      const stavbDel = countTockeChanges(stavbe, "B");
      const stavbNeSpremenjene = countTockeChanges(stavbe, "N");
      
      // Process deliStavb
      const deliStavb = jsonData.data.stavbe?.deliStavb || [];
      const deliStvSpre = countTockeChanges(deliStavb, "S");
      const deliStvDodanih = countTockeChanges(deliStavb, "D");
      const deliStvDel = countTockeChanges(deliStavb, "B");
      const deliStvNespre = countTockeChanges(deliStavb, "N");
      
      // Process etaze
      const estaza = jsonData.data.stavbe?.etaze || [];
      const estazaSpre = countTockeChanges(estaza, "S");
      const estazaDodanih = countTockeChanges(estaza, "D");
      const estazaDel = countTockeChanges(estaza, "B");
      const estazaNespre = countTockeChanges(estaza, "N");
      
      // Process prostori
      const prostori = jsonData.data.stavbe?.prostori || [];
      const prostoriSpre = countTockeChanges(prostori, "S");
      const prostoriDodani = countTockeChanges(prostori, "D");
      const prostoriDel = countTockeChanges(prostori, "B");
      const prostoriNeSpre = countTockeChanges(prostori, "N");
      
      // Process sestavineDelovStavb
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
      
      // Process bonitete
      const bonitete = jsonData.data.bonitete?.obmocjaBonitet || [];
      const bonitetaSpr = countTockeChanges(bonitete, "S");
      const bonitetaDodanih = countTockeChanges(bonitete, "D");
      const bonitetaDel = countTockeChanges(bonitete, "B");
      const bonitetaO = countTockeChanges(bonitete, "O");
      
      // Process tockeMeritev
      const tockeMeritev = jsonData.data.bonitete?.tockeMeritev || [];
      const tockeMeritevSpre = countTockeChanges(tockeMeritev, "S");
      const tockeMeritevDoda = countTockeChanges(tockeMeritev, "D");
      const tockeMeritevDel = countTockeChanges(tockeMeritev, "B");
      
      // Process obmocjeSpp
      const obmocjeSppEid = jsonData.data.parcele?.obmocjaSpp || [];
      const obmocjeSppSpre = countTockeChanges(obmocjeSppEid, "S");
      const obmocjeSppDodan = countTockeChanges(obmocjeSppEid, "D");
      const obmocjeSppDel = countTockeChanges(obmocjeSppEid, "B");
      
      // Create the formatted data object to update in context
      // Create the formatted data object to update in context
      const formattedData = {
        fileName: currentFile.fileName,
        dataTypes: jsonData.types.join(", "),
        pooblascenecId: pooblascenecId || "",
        numKP: numKP || 0,
        vrstaKatPos: vrstaKatPos.length > 0 ? vrstaKatPos.join(", ") : "Ni podatkov",
        parcelCount: parcelCount || 0,
        buildingCount: buildingCount || 0,
        buildingPartCount: buildingPartCount || 0,
        boniteta: boniteta || 0,
        allParcelsInKP: allParcelsInKP || "",
        allStavbe: allStavbe || "",
        allBonitete: allBonitete || "",
        
        // Store individual values separately
        obmocjeSppSpre: obmocjeSppSpre || 0,
        obmocjeSppDodan: obmocjeSppDodan || 0,
        obmocjeSppDel: obmocjeSppDel || 0,
        
        bonitetaSpr: bonitetaSpr || 0,
        bonitetaDodanih: bonitetaDodanih || 0,
        bonitetaDel: bonitetaDel || 0,
        bonitetaO: bonitetaO || 0,
        
        tockeS: changedPoints || 0,
        tockeD: addedPoints || 0,
        tockeB: deletedPoints || 0,
        
        daljiceS: spremenjenaDaljica || 0,
        daljiceD: dodanaDaljica || 0,
        daljiceB: izbrisanaDaljica || 0,
        
        parceleN: neSpremenjenaParc || 0,
        parceleS: spremenjenaParc || 0,
        parceleD: dodaneParc || 0,
        parceleB: parcDel || 0,
        
        stavbeN: stavbNeSpremenjene || 0,
        stavbeS: stavbeSpremenjene || 0,
        stavbeD: stavbDodanih || 0,
        stavbeB: stavbDel || 0,
        
        deliStavbN: deliStvNespre || 0,
        deliStavbS: deliStvSpre || 0,
        deliStavbD: deliStvDodanih || 0,
        deliStavbB: deliStvDel || 0,
        
        etazaN: estazaNespre || 0,
        etazaS: estazaSpre || 0,
        etazaD: estazaDodanih || 0,
        etazaB: estazaDel || 0,
        
        prostoriN: prostoriNeSpre || 0,
        prostoriS: prostoriSpre || 0,
        prostoriD: prostoriDodani || 0,
        prostoriB: prostoriDel || 0,
        
        sestavineDelovStavbN: sestaDelStavNeSpr || 0,
        sestavineDelovStavbS: sestaDelStavSpre || 0,
        sestavineDelovStavbD: sestaDelStavDodani || 0,
        sestavineDelovStavbB: sestaDelStavDel || 0,
        
        tockeMeritevS: tockeMeritevSpre || 0,
        tockeMeritevD: tockeMeritevDoda || 0,
        tockeMeritevB: tockeMeritevDel || 0
      };
      
      // Update the form data in context
      updateFormData(index, formattedData);
    }
  }, [loading, currentFile, index, updateFormData]);

  // Add render part for UI display
  if (loading || !currentFile) {
    return (
      <></>
      /*<div className="forms">
        <div className="loading-message">
          <p>Please select XML files and click "Process Data" to view content for Form #{index + 1}.</p>
        </div>
      </div>
      */
    );
  }

  const xmlDoc = currentFile.xmlContent;
  const jsonData = extractJsonFromCdata(xmlDoc);
  
  // Extract all parcels that are components in cadastral procedures


  const tocke = [];
  if (jsonData.data.tocke) {
    Object.keys(jsonData.data).forEach(dataType => {
      if (jsonData.data[dataType].tocke && Array.isArray(jsonData.data[dataType].tocke)) {
        tocke.push(...jsonData.data[dataType].tocke);
      }
    });
  }

  const daljice = [];
  if (jsonData.data.daljice || jsonData.data.tocke) {
    Object.keys(jsonData.data).forEach(dataType => {
      if (jsonData.data[dataType].daljice && Array.isArray(jsonData.data[dataType].daljice)) {
        daljice.push(...jsonData.data[dataType].daljice);
      }
    });
  }


  // Fix: Look for sestavineDelovStavb directly in the podatki object
  const sestaDelStavb = [];
  Object.keys(jsonData.data).forEach(dataType => {
    if (jsonData.data[dataType]?.sestavineDelovStavb && Array.isArray(jsonData.data[dataType].sestavineDelovStavb)) {
      sestaDelStavb.push(...jsonData.data[dataType].sestavineDelovStavb);
    }
  });
  

  // Add the render part
  return (
    <></>
    /*<div className="forms">
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
        <p><strong>Seznam vseh stavb (sifKo stavbe):</strong> {allStavbe}</p>
        <p><strong>Seznam vseh bonitet (boniteta):</strong> {allBonitete}</p>
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
    */
  );
}

export default Forms;