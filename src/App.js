import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import FileUpload from './components/FileUpload';
import FileList from './components/FileList';
import FileDetail from './components/FileDetail';
import { Container } from './styles';
import { toast } from "react-toastify";
import UploadButton from "./components/Button";
import Spinner from "./components/Spinner";
import ImageList from "./components/Images";

import axios from "axios";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { S3Client } from "@aws-sdk/client-s3";

const App = () => {
  const [files, setFiles] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState(null);

  // const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState([]);
  // const [status, setStatus] = useState("");
  // const [objectData, setObjectData] = useState([]);


  const handleFileUpload = (file) => {
    const newFile = {
      id: uuidv4(),
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    };
    setFiles([...files, newFile]);
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
        endpoint: `https://${process.env.REACT_APP_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
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

  // async function uploadFile(fileOrBlob, signedUrl, mimeType) {
  //   try {
  //     const options = {
  //       headers: {
  //         "Content-Type": mimeType || fileOrBlob.type || "application/octet-stream", // Use provided mimeType, or fileOrBlob's type, or default to 'application/octet-stream'
  //       },
  //     };
  //     const result = await axios.put(signedUrl, fileOrBlob, options);
  //     return result.status;
  //   } catch (error) {
  //     console.error("Error:", error.message);
  //   }
  // }

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

  async function uploadImage(file, bucket, filePath) {
    let signedUrl = await getSignedUrlForFile(filePath, bucket, "putObject");
    // let uploadStatus = await uploadFile(file, signedUrl, "image/jpeg");
    // console.log("uploadStatus: ", uploadStatus);
    signedUrl = await getSignedUrlForFile(filePath, bucket, "getObject");
    return signedUrl;
  }

  async function addOrRetrieveImage(dataToSave) {
    const options = {
      headers: {
        "Content-Type": "application/json",
      },
    };
    const result = await axios.post("/write_to_r1", dataToSave, options);
    return result.data;
  }

  async function handleImage(file, imageData) {
    const { action, filePath } = await addOrRetrieveImage(imageData);
    let signedUrl = null;

    if (action === "add") {
      toast.info("Uploading image...", { autoClose: 2000 });
      // setStatus("Uploading image...")
      signedUrl = await uploadImage(file, imageData.bucket, filePath);
    } else if (action === "retrieve") {
      toast.info("Image already exists. Retrieving...", { autoClose: 2000 });
      // setStatus("Image already exists. Retrieving...")
      signedUrl = await getSignedUrlForFile(filePath, imageData.bucket, "getObject");
    }
    return signedUrl;
  }

  const removeImage = (id) => {
    setImages((prevImages) => prevImages.filter((image) => image !== id));
  };


  const onImagesError = (image) => {
    removeImage(image);
    toast.error("Failed to load the image.");
  };

  const onChange = (e) => {
    const files = Array.from(e.target.files);
    setUploading(true);

    const promises = files.map(async (file) => {
      const id = uuidv4();
      const hash = await hashImage(file);
      const extension = getExtensionFromMimeType(file.type);
      const filePath = `images/${hash}.${extension}`;
      const imageData = {
        id,
        hash,
        extension,
        filePath,
        bucket: process.env.REACT_APP_R1_BUCKET_NAME,
      };

      const signedUrl = await handleImage(file, imageData);
      return { id, signedUrl };
    });

    Promise.all(promises)
      .then((images) => {
        setImages((prevImages) => [...prevImages, ...images]);
        setUploading(false);
      })
      .catch((error) => {
        console.error("Error:", error.message);
        setUploading(false);
      });
  }

  const content = () => {
    switch (true) {
      case uploading:
        return <Spinner />;
      case images.length > 0:
        return (
          <div className="container">
            <div className="image-list">
              <ImageList images={images} removeImage={removeImage} onError={onImagesError} />
            </div>
          </div>
        );
      default:
        return (
          <div>
            <UploadButton onChange={onChange} />
          </div>
        );
    }
  };  

  return (
    <Container>
      <h1>Digital Asset Manager</h1>
      <FileUpload onFileUpload={handleFileUpload} />
      <FileList files={files} onFileClick={handleFileClick} onFileDelete={handleFileDelete} />
      {selectedFile && <FileDetail file={selectedFile} />}
      <div className="buttons">{content()}</div>      
    </Container>
  );
};

export default App;
