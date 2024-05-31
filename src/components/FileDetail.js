import React from 'react';

const FileDetail = ({ file }) => {
  if (!file) return null;

  return (
    <div>
      <h2>File Details</h2>
      <p><strong>Name:</strong> {file.name}</p>
      <p><strong>Size:</strong> {file.size} bytes</p>
      <p><strong>Type:</strong> {file.type}</p>
      <p><strong>Last Modified:</strong> {file.last_modified}</p>
      <p><strong>Hash:</strong> {file.hash}</p>
      <p><strong>Extension:</strong> {file.extension}</p>
      <p><strong>File Path:</strong> {file.filePath}</p>
      <p><strong>Bucket:</strong> {file.bucket}</p>
    </div>
  );
};

export default FileDetail;
