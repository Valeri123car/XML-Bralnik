import { useState } from 'react';
import DragAndDrop from './components/DragAndDrop';
import './App.css';
import Forms from './components/Forms';
import Export from './components/Export';
import Header from './components/Header';
import { XmlProvider } from "./components/XmlContext";

function App() {
  const [numForms, setNumForms] = useState(1);

  return (
    <>
      <Header />
      <XmlProvider>
        <DragAndDrop setNumForms={setNumForms} /> 
        {[...Array(numForms)].map((_, index) => (
          <Forms key={index} index={index} />
        ))}
        <Export/>
      </XmlProvider>
    </>
  );
}

export default App;