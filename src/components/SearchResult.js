import React from 'react';
import PropTypes from 'prop-types';

const SearchResult = ({ files, onFileClick }) => {
  return (
    <div className="search-results">
      {files.map(file => (
        <div key={file.id} className="search-result-item" onClick={() => onFileClick(file)}>
          <img src={file.signedUrl} alt={file.name} className="thumbnail" />
          <div className="file-info">
            <div className="file-name">{file.name}</div>
            <div className="file-score">Score: {file.score.toFixed(2)}</div>
          </div>
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
