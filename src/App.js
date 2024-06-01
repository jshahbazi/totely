import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import FileUpload from './components/FileUpload';
import FileList from './components/FileList';
import FileDetail from './components/FileDetail';
import { Container } from './styles';
import { toast } from "react-toastify";
import axios from "axios";
// import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
// import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const App = () => {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

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
          const newFile = {
            id: generatedUUID,
            name: file.name,
            size: file.size,
            type: file.type,
            last_modified: file.last_modified,
            hash: await hashImage(file),
            extension: fileExtension,
            filePath: newFileName,
            bucket: process.env.REACT_APP_R2_BUCKET_NAME,
          };

          setFiles([...files, newFile]);
          return { id: newFile.id, signedUrl };
        }
      }
    } catch (error) {
      toast.error("Error uploading file: " + error.message, { autoClose: 2000 });
      console.error(error.message);
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
    if (!fileToDelete) return;
  
    try {
      const response = await axios.post('/delete_from_R2', {
        method: 'DELETE',
        fileName: fileToDelete.filePath
      });
  
      if (response.status === 200) {
        setFiles(files.filter((file) => file.id !== id));
        if (selectedFile?.id === id) {
          setSelectedFile(null);
        }
        toast.info("File deleted successfully", { autoClose: 2000 });
      } else {
        throw new Error(response.data.error || 'Error deleting file');
      }
    } catch (error) {
      toast.error("Error deleting file: " + error.message, { autoClose: 2000 });
      console.error(error.message);
    }
  };
  

  const handleFileDownload = async (file) => {
    try {
      const response = await axios.get(`/download_from_R2?fileName=${file.filePath}`);
      if (!response.data || !response.data.signedUrl) {
        throw new Error("Signed URL not received");
      }
      const { signedUrl } = response.data;
      console.log('Signed URL:', signedUrl);  // Debugging
  
      // Fetch the file using the signed URL
      const fileResponse = await axios.get(signedUrl, {
        responseType: 'blob', // Ensure we get the file as a blob
      });
      console.log('File Response:', fileResponse);  // Debugging
  
      if (!fileResponse.data) {
        throw new Error("Failed to fetch file data");
      }
  
      // Create a URL for the file blob and trigger the download
      const fileURL = window.URL.createObjectURL(new Blob([fileResponse.data]));
      console.log('File URL:', fileURL);  // Debugging
      const link = document.createElement('a');
      link.href = fileURL;
      link.setAttribute('download', file.name); // Set the file name for download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast.error("Error downloading file: " + error.message, { autoClose: 2000 });
      console.error("Download Error:", error);
    }
  };
  
  

  // async function getSignedUrlForFile(key, bucket, action = "putObject") {
  //   try {
  //     const r2 = new S3Client({
  //       region: "auto",
  //       endpoint: `https://${process.env.REACT_APP_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  //       credentials: {
  //         accessKeyId: process.env.REACT_APP_R2_ACCESS_KEY_ID,
  //         secretAccessKey: process.env.REACT_APP_R2_SECRET_ACCESS_KEY,
  //       },
  //     });

  //     let signedUrl = "";
  //     if (action === "putObject") {
  //       signedUrl = await getSignedUrl(
  //         r2,
  //         new PutObjectCommand({
  //           Bucket: bucket,
  //           Key: key,
  //         }),
  //         { expiresIn: 60 }
  //       );
  //     } else if (action === "getObject") {
  //       signedUrl = await getSignedUrl(
  //         r2,
  //         new GetObjectCommand({
  //           Bucket: bucket,
  //           Key: key,
  //         }),
  //         { expiresIn: 60 }
  //       );
  //     } else if (action === "deleteObject") {
  //       signedUrl = await getSignedUrl(
  //         r2,
  //         new DeleteObjectCommand({
  //           Bucket: bucket,
  //           Key: key,
  //         }),
  //         { expiresIn: 60 }
  //       );
  //     }

  //     return signedUrl;
  //   } catch (error) {
  //     console.error("Error:", error.message);
  //     return error;
  //   }
  // }


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


  // async function deleteFileFromBucket(filePath, bucket) {
  //   let signedUrl = await getSignedUrlForFile(filePath, bucket, "deleteObject");
  //   try {
  //     const result = await axios.delete(signedUrl);
  //     return result.status;
  //   } catch (error) {
  //     console.error("Error:", error.message);
  //     throw new Error("Failed to delete file from bucket");
  //   }
  // }

  return (
    <Container>
      <h1>Digital Asset Manager</h1>
      <FileUpload onFileUpload={handleFileUpload} />
      <FileList files={files} onFileClick={handleFileClick} onFileDelete={handleFileDelete} onFileDownload={handleFileDownload} />
      {selectedFile && <FileDetail file={selectedFile} />}
    </Container>
  );
};

export default App;
