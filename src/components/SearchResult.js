import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { toast } from "react-toastify";

const SearchResult = ({ files, onFileClick }) => {
  const [signedUrls, setSignedUrls] = useState({});

  useEffect(() => {
    const fetchSignedUrls = async () => {
      try {
        const urls = {};
        for (const file of files) {
          const response = await axios.get(`/get_signed_url?fileName=${file.filePath}`);
          urls[file.id] = response.data.signedUrl;
        }
        setSignedUrls(urls);
      } catch (error) {
        toast.error("Error fetching signed URLs: " + error.message, { autoClose: 2000 });
        console.error("Signed URL Fetch Error:", error);
      }
    };

    fetchSignedUrls();
  }, [files]);

  return (
    <div className="search-results">
      {files.map(file => (
        <div key={file.id} className="search-result-item" onClick={() => onFileClick(file)}>
          {signedUrls[file.id] && <img src={signedUrls[file.id]} alt={file.name} className="thumbnail" />}
          <div className="file-name">{file.name}</div>
        </div>
      ))}
    </div>
  );
};

SearchResult.propTypes = {
  files: PropTypes.array.isRequired,
  onFileClick: PropTypes.func.isRequired,
};

export default SearchResult;
