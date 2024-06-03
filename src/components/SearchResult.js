import React from 'react';
import PropTypes from 'prop-types';
import { SearchResultsContainer, SearchResultItem, Thumbnail, FileInfo, FileScore } from '../styles';

const SearchResult = ({ files, onFileClick }) => {
  return (
    <SearchResultsContainer>
      {files.map(file => (
        <SearchResultItem key={file.id} onClick={() => onFileClick(file)}>
          <Thumbnail src={file.signedUrl} alt={file.name} />
          <FileInfo>
            <div className="file-name">{file.name}</div>
            <FileScore>Score: {file.score.toFixed(2)}</FileScore>
          </FileInfo>
        </SearchResultItem>
      ))}
    </SearchResultsContainer>
  );
};

SearchResult.propTypes = {
  files: PropTypes.array.isRequired,
  onFileClick: PropTypes.func.isRequired,
};

export default SearchResult;
