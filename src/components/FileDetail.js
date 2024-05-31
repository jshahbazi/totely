import React from 'react';
import { FileDetailContainer } from '../styles';

const FileDetail = ({ file }) => {
  if (!file) return null;

  return (
    <FileDetailContainer>
      <h2>File Details</h2>
      <p><strong>Name:</strong> {file.name}</p>
      <p><strong>Size:</strong> {file.size} bytes</p>
      <p><strong>Type:</strong> {file.type}</p>
      <p><strong>Last Modified:</strong> {new Date(file.lastModified).toLocaleString()}</p>
    </FileDetailContainer>
  );
};

export default FileDetail;
