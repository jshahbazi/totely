import React from 'react';
import { FileListContainer, FileItem, Button, FileName } from '../styles';

const FileList = ({ files, onFileClick, onFileDelete, onFileDownload }) => {
  return (
    <FileListContainer>
      {files.map((file) => (
        <FileItem key={file.id} onClick={() => onFileClick(file)}>
          <FileName>{file.name}</FileName>
          <Button onClick={() => onFileDelete(file.id)}>Delete</Button>
          <Button onClick={() => onFileDownload(file)}>Download</Button>
        </FileItem>
      ))}
    </FileListContainer>
  );
};

export default FileList;
