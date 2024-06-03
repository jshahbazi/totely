import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import FileUpload from './components/FileUpload';
import FileList from './components/FileList';
import FileDetail from './components/FileDetail';
import SearchComponent from './components/SearchComponent';
import SearchResult from './components/SearchResult';
import { Container, Sidebar, MainContent } from './styles';
import { toast } from "react-toastify";
import axios from "axios";

const App = () => {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    fetchFilesFromD1();
  }, []);

  const fetchFilesFromD1 = async () => {
    try {
      const response = await axios.get("/get_files_from_D1");
      const fetchedFiles = response.data.map(file => ({
        id: file.id,
        name: file.name,
        size: file.size,
        type: file.type,
        last_modified: new Date(Number(file.last_modified)).toISOString(),
        hash: file.hash,
        extension: file.extension,
        filePath: file.file_path,
        bucket: file.bucket,
      }));

      setFiles(fetchedFiles);
    } catch (error) {
      toast.error("Error fetching files: " + error.message, { autoClose: 2000 });
      console.error(error.message);
    }
  };

  const handleFileUpload = async (file) => {
    const generatedUUID = uuidv4();
    const fileExtension = getExtensionFromMimeType(file.type);
    const newFileName = `${generatedUUID}.${fileExtension}`;

    try {
      const response = await axios.post('/upload_to_R2', {
        fileName: newFileName,
        fileType: file.type,
      });

      const { signedUrl } = response.data;

      if (signedUrl) {
        const uploadResult = await axios.put(signedUrl, file, {
          headers: {
            "Content-Type": file.type,
          },
        });

        if (uploadResult.status === 200) {
          const fileHash = await hashImage(file);

          const newFile = {
            id: generatedUUID,
            name: file.name,
            size: file.size,
            type: file.type,
            last_modified: file.lastModified, 
            hash: fileHash,
            extension: fileExtension,
            filePath: newFileName,
            bucket: process.env.REACT_APP_R2_BUCKET_NAME,
          };

          const dbResponse = await axios.post('/write_to_D1', newFile);

          if (dbResponse.status === 200) {
            const { action, filePath } = dbResponse.data;

            if (action === "add") {
              setFiles([...files, newFile]);
              await vectorizeFile(newFile); // Vectorize the file
              return { id: newFile.id, signedUrl };
            } else if (action === "retrieve") {
              const existingFile = { ...newFile, filePath };
              setFiles([...files, existingFile]);
              return { id: existingFile.id, signedUrl };
            }
          } else {
            throw new Error("Failed to write file info to the database");
          }
        } else {
          throw new Error("Failed to upload the file to R2");
        }
      } else {
        throw new Error("Signed URL not received from the server");
      }
    } catch (error) {
      toast.error("Error uploading file: " + error.message, { autoClose: 2000 });
      console.error("File Upload Error:", error);
    }
  };

  const vectorizeFile = async (file) => {
    try {
      const response = await axios.post('/vectorize_file', { filePath: file.filePath, fileType: file.type, fileId: file.id, fileName: file.name, bucket: file.bucket });
      const { rows_inserted } = response.data;
      console.log('File vector rows_inserted:', rows_inserted);
    } catch (error) {
      toast.error("Error vectorizing file: " + error.message, { autoClose: 2000 });
      console.error("Vectorization Error:", error);
    }
  };

  const handleFileClick = async (file) => {
    if (selectedFile?.id === file.id) {
      setSelectedFile(null);
    } else {
      try {
        const response = await axios.get(`/get_file_details/${file.id}`);
        const fileDetails = response.data;
        const updatedFile = {
          ...file,
          ...fileDetails,
        };
        const updatedFiles = files.map(f => f.id === file.id ? updatedFile : f);
        setFiles(updatedFiles);
        setSelectedFile(updatedFile);
      } catch (error) {
        toast.error("Error fetching file details: " + error.message, { autoClose: 2000 });
        console.error(error.message);
      }
    }
  };

  const handleFileDelete = async (id) => {
    const fileToDelete = files.find((file) => file.id === id);
    if (!fileToDelete) {
      console.error("File not found for deletion:", id); 
      return;
    }

    try {
      const response = await axios.post('/delete_from_R2', {
        method: 'DELETE',
        fileName: fileToDelete.filePath
      });

      if (response.status === 200) {
        const dbResponse = await axios.post('/delete_from_D1', { id });

        if (dbResponse.status === 200) {
          setFiles(files.filter((file) => file.id !== id));
          if (selectedFile?.id === id) {
            setSelectedFile(null);
          }
          toast.info("File deleted successfully", { autoClose: 2000 });
        } else {
          throw new Error("Failed to delete file info from the database");
        }
      } else {
        throw new Error(response.data.error || 'Error deleting file from R2');
      }
    } catch (error) {
      toast.error("Error deleting file: " + error.message, { autoClose: 2000 });
      console.error("File Deletion Error:", error);
    }
  };

  const handleFileDownload = async (file) => {
    try {
      const response = await axios.get(`/download_from_R2?fileName=${file.filePath}`);
      if (!response.data || !response.data.signedUrl) {
        throw new Error("Signed URL not received");
      }
      const { signedUrl } = response.data;

      const fileResponse = await axios.get(signedUrl, {
        responseType: 'blob',
      });

      if (!fileResponse.data) {
        throw new Error("Failed to fetch file data");
      }

      const fileURL = window.URL.createObjectURL(new Blob([fileResponse.data]));
      const link = document.createElement('a');
      link.href = fileURL;
      link.setAttribute('download', file.name);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast.error("Error downloading file: " + error.message, { autoClose: 2000 });
      console.error("Download Error:", error);
    }
  };

  async function hashImage(file) {
    const arrayBuffer = await file.arrayBuffer();
    const crypto = window.crypto;
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return hashHex;
  }

  function getExtensionFromMimeType(mimeType) {
    const mimeToExtension = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/gif": "gif",
      "image/webp": "webp",
      "image/tiff": "tif",
      "image/bmp": "bmp",
      "image/svg+xml": "svg",
      "audio/mpeg": "mp3",
      "audio/wav": "wav",
      "video/mp4": "mp4",
      "application/pdf": "pdf",
    };

    return mimeToExtension[mimeType] || null;
  }

  const handleSearchResults = (results) => {
    setSearchResults(results);
  };

  return (
    <Container>
      <Sidebar>
        <FileUpload onFileUpload={handleFileUpload} />
        <FileList files={files} onFileClick={handleFileClick} onFileDelete={handleFileDelete} onFileDownload={handleFileDownload} />
      </Sidebar>
      <MainContent>
        <SearchComponent onSearchResults={handleSearchResults} />
        {selectedFile && <FileDetail file={selectedFile} />}
        {searchResults.length > 0 && (
          <SearchResult files={searchResults} onFileClick={handleFileClick} />
        )}
      </MainContent>
    </Container>
  );
};

export default App;
