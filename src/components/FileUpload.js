import React from 'react';
import { FileInput, Label } from '../styles';

const FileUpload = ({ onFileUpload }) => {
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <div>
      <FileInput id="file-upload" type="file" onChange={handleFileChange} />
      <Label htmlFor="file-upload">Upload File</Label>
    </div>
  );
};

export default FileUpload;
