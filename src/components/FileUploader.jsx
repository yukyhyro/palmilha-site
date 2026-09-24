import React, { useCallback, useState } from 'react';
import { parseFile } from '../services/fileParser';

/**
 * FileUploader
 *
 * Componente para upload de arquivos TXT de dados de pressão plantar.
 * Suporta drag-and-drop e clique.
 * Mostra status, nome do arquivo, quantidade de registros e sensores.
 */
export default function FileUploader({ label, side, onDataLoaded }) {
  const [status, setStatus] = useState('idle'); // idle | loading | loaded | error
  const [fileName, setFileName] = useState('');
  const [info, setInfo] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const processFile = useCallback((file) => {
    if (!file) return;

    setFileName(file.name);
    setStatus('loading');
    setErrorMsg('');
    setInfo(null);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const result = parseFile(e.target.result);

        if (result.error) {
          setStatus('error');
          setErrorMsg(result.error);
          onDataLoaded(null, null, null);
          return;
        }

        setStatus('loaded');
        setInfo({
          records: result.samples.length,
          sensors: result.sensorNames.length,
          duration: result.stats.duration,
          warning: result.warning,
        });

        onDataLoaded(result.samples, result.sensorNames, result.stats);
      } catch (err) {
        console.error('Erro ao processar arquivo:', err);
        setStatus('error');
        setErrorMsg('Erro inesperado ao processar o arquivo');
        onDataLoaded(null, null, null);
      }
    };

    reader.onerror = () => {
      setStatus('error');
      setErrorMsg('Erro ao ler o arquivo');
      onDataLoaded(null, null, null);
    };

    reader.readAsText(file);
  }, [onDataLoaded]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const statusLabels = {
    idle: 'Nenhum arquivo selecionado',
    loading: 'Processando arquivo...',
    loaded: 'Arquivo processado',
    error: 'Erro no arquivo',
  };

  const statusIcons = {
    idle: '📂',
    loading: '⏳',
    loaded: '✅',
    error: '❌',
  };

  return (
    <div
      className={`file-uploader ${status} ${dragOver ? 'drag-over' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className="file-uploader-header">
        <span className="file-uploader-icon">{statusIcons[status]}</span>
        <span className="file-uploader-label">{label}</span>
        <span className={`file-uploader-badge badge-${side}`}>
          {side === 'right' ? 'Direito' : 'Esquerdo'}
        </span>
      </div>

      <label className="file-uploader-area">
        <input
          type="file"
          accept=".txt,.csv,.tsv"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        {status === 'idle' ? (
          <div className="file-uploader-prompt">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span>Arraste um arquivo ou clique para selecionar</span>
            <span className="file-uploader-hint">.txt, .csv, .tsv</span>
          </div>
        ) : (
          <div className="file-uploader-info">
            <span className="file-name">{fileName}</span>
            <span className={`file-status status-${status}`}>
              {statusLabels[status]}
            </span>
          </div>
        )}
      </label>

      {info && status === 'loaded' && (
        <div className="file-uploader-stats">
          <div className="stat-item">
            <span className="stat-value">{info.records}</span>
            <span className="stat-label">registros</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{info.sensors}</span>
            <span className="stat-label">sensores</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{info.duration.toFixed(1)}s</span>
            <span className="stat-label">duração</span>
          </div>
          {info.warning && (
            <div className="file-warning">{info.warning}</div>
          )}
        </div>
      )}

      {status === 'error' && (
        <div className="file-error">{errorMsg}</div>
      )}
    </div>
  );
}
