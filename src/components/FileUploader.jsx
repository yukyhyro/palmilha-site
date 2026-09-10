import React, { useRef, useState, useCallback } from 'react';
import { parseFile } from '../services/fileParser';

export default function FileUploader({ label, onParsed }) {
  const [status, setStatus] = useState('idle'); // idle | success | error
  const [message, setMessage] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const processFile = useCallback(async (file) => {
    if (!file) return;
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!['.txt', '.csv', '.tsv', '.dat'].includes(ext)) {
      setStatus('error');
      setMessage(`Formato "${ext}" não suportado`);
      onParsed(null);
      return;
    }
    try {
      setStatus('idle');
      setMessage('Processando...');
      const text = await file.text();
      const result = parseFile(file.name, text);
      if (result.ok) {
        setStatus('success');
        setMessage(`${result.data.sensorNames.length} sensores · ${result.data.sampleCount} registros`);
        onParsed(result.data);
      } else {
        setStatus('error');
        setMessage(result.error);
        onParsed(null);
      }
    } catch (err) {
      console.error('FileUploader error:', err);
      setStatus('error');
      setMessage('Erro ao ler o arquivo');
      onParsed(null);
    }
  }, [onParsed]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const zoneClass = `upload-zone ${dragging ? 'active' : ''} ${status === 'error' ? 'error' : ''}`;

  return (
    <div
      className={zoneClass}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" accept=".txt,.csv,.tsv,.dat" onChange={handleChange} className="upload-input" />
      <div className="upload-label">{label}</div>
      <div className="upload-hint">Arraste o arquivo ou clique para selecionar</div>
      {message && (
        <div className={`upload-status ${status}`}>
          {status === 'success' && '✓ '}{status === 'error' && '✗ '}{message}
        </div>
      )}
    </div>
  );
}
