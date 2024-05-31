import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import FileUpload from './components/FileUpload';
import FileList from './components/FileList';
import FileDetail from './components/FileDetail';
import { Container } from './styles';
import { toast } from "react-toastify";
// import UploadButton from "./components/Button";
// import Spinner from "./components/Spinner";
// import ImageList from "./components/Images";

import axios from "axios";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { S3Client } from "@aws-sdk/client-s3";

const App = () => {
  const [files, setFiles] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState(null);
  // const [uploading, setUploading] = useState(false);
  // const [images, setImages] = useState([]);


  const handleFileUpload = async (file) => {
    const generatedUUID = uuidv4();
    const hash = await hashImage(file);
    const extension = getExtensionFromMimeType(file.type);
    const filePath = `${generatedUUID}.${extension}`; //`${hash}.${extension}`;

    const newFile = {
      id: generatedUUID,
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      hash: hash,
      extension: extension,
      filePath: filePath,
      bucket: process.env.REACT_APP_R2_BUCKET_NAME,      
    };
    setFiles([...files, newFile]);

    const signedUrl = await handleFile(file, newFile);
    return { id: newFile.id, signedUrl };

  };

  const handleFileClick = (file) => {
    if (selectedFileId === file.id) {
      setSelectedFileId(null); // Deselect if already selected
    } else {
      setSelectedFileId(file.id);
    }
  };

  const handleFileDelete = (id) => {
    setFiles(files.filter((file) => file.id !== id));
    if (selectedFileId === id) {
      setSelectedFileId(null);
    }
  };

  const selectedFile = files.find(file => file.id === selectedFileId);


  async function getSignedUrlForFile(key, bucket, action = "putObject") {
    try {
      const r2 = new S3Client({
        region: "auto",
        endpoint: `https://${process.env.REACT_APP_R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.REACT_APP_R2_BUCKET_NAME}`,
        credentials: {
          accessKeyId: process.env.REACT_APP_R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.REACT_APP_R2_SECRET_ACCESS_KEY,
        },
      });

      let signedUrl = "";
      if (action === "putObject") {
        signedUrl = await getSignedUrl(
          r2,
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
          }),
          { expiresIn: 60 }
        );
      } else if (action === "getObject") {
        signedUrl = await getSignedUrl(
          r2,
          new GetObjectCommand({
            Bucket: bucket,
            Key: key,
          }),
          { expiresIn: 60 }
        );
      }

      return signedUrl;
    } catch (error) {
      console.error("Error:", error.message);
      return error;
    }
  }

  async function uploadFile(fileOrBlob, signedUrl, mimeType) {
    try {
      const options = {
        headers: {
          "Content-Type": mimeType || fileOrBlob.type || "application/octet-stream", // Use provided mimeType, or fileOrBlob's type, or default to 'application/octet-stream'      
        },
      };
      const result = await axios.put(signedUrl, fileOrBlob, options);
      return result.status;
    } catch (error) {
      console.error("Error:", error.message);
    }
  }

  // async function downloadFile(signedUrl) {
  //   try {
  //     const response = await axios.get(signedUrl, { responseType: "blob" });
  //     return response.data;
  //   } catch (error) {
  //     console.error("Error:", error.message);
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

  async function uploadFileWrapper(file, bucket, filePath, mimeType) {
    let signedUrl = await getSignedUrlForFile(filePath, bucket, "putObject");
    let uploadStatus = await uploadFile(file, signedUrl, mimeType);
    console.log("uploadStatus: ", uploadStatus);    
    signedUrl = await getSignedUrlForFile(filePath, bucket, "getObject");
    return signedUrl;
  }

  // async function addOrRetrieveFile(dataToSave) {
  //   const options = {
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //   };
  //   const result = await axios.post("/write_to_D1", dataToSave, options);
  //   return result.data;
  // }

  async function handleFile(file, fileData) {
    // const { action, filePath } = await addOrRetrieveFile(fileData);
    const action = "add";
    const filePath = fileData.filePath;
    console.log("fileData: ", fileData);
    let signedUrl = null;

    if (action === "add") {
      toast.info("Uploading file...", { autoClose: 2000 });
      console.log("Uploading file...")
      signedUrl = await uploadFileWrapper(file, fileData.bucket, filePath);
    } else if (action === "retrieve") {
      toast.info("File already exists. Retrieving...", { autoClose: 2000 });
      console.log("File already exists. Retrieving...")
      signedUrl = await getSignedUrlForFile(filePath, fileData.bucket, "getObject");
    }
    console.log("signedUrl: ", signedUrl);
    return signedUrl;
  }

  // const removeImage = (id) => {
  //   setImages((prevImages) => prevImages.filter((image) => image !== id));
  // };


  // const onImagesError = (image) => {
  //   removeImage(image);
  //   toast.error("Failed to load the image.");
  // };

  // const onChange = (e) => {
  //   const files = Array.from(e.target.files);
  //   setUploading(true);

  //   const promises = files.map(async (file) => {
  //     const id = uuidv4();
  //     const hash = await hashImage(file);
  //     const extension = getExtensionFromMimeType(file.type);
  //     const filePath = `images/${hash}.${extension}`;
  //     const imageData = {
  //       id,
  //       hash,
  //       extension,
  //       filePath,
  //       bucket: process.env.REACT_APP_R2_BUCKET_NAME,
  //     };

  //     const signedUrl = await handleFile(file, imageData);
  //     return { id, signedUrl };
  //   });

  //   Promise.all(promises)
  //     .then((images) => {
  //       setImages((prevImages) => [...prevImages, ...images]);
  //       setUploading(false);
  //     })
  //     .catch((error) => {
  //       console.error("Error:", error.message);
  //       setUploading(false);
  //     });
  // }





  // const content = () => {
  //   switch (true) {
  //     case uploading:
  //       return <Spinner />;
  //     case images.length > 0:
  //       return (
  //         <div className="container">
  //           <div className="image-list">
  //             <ImageList images={images} removeImage={removeImage} onError={onImagesError} />
  //           </div>
  //         </div>
  //       );
  //     default:
  //       return (
  //         <div>
  //           <UploadButton onChange={onChange} />
  //         </div>
  //       );
  //   }
  // };  

  return (
    <Container>
      {/* <ToastContainer /> */}
      <h1>Digital Asset Manager</h1>
      <FileUpload onFileUpload={handleFileUpload} />
      <FileList files={files} onFileClick={handleFileClick} onFileDelete={handleFileDelete} />
      {selectedFile && <FileDetail file={selectedFile} />}
      {/* <div className="buttons">{content()}</div>       */}
    </Container>
  );
};

export default App;
