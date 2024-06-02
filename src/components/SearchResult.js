import React from 'react';
import PropTypes from 'prop-types';

const SearchResult = ({ files, onFileClick }) => {
  return (
    <div className="search-results">
      {files.map(file => (
        <div key={file.id} className="search-result-item" onClick={() => onFileClick(file)}>
          <img src={`/thumbnail/${file.filePath}`} alt={file.name} className="thumbnail" />
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
