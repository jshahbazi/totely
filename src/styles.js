import styled from 'styled-components';

export const Container = styled.div`
  display: flex;
  max-width: 100%;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
`;

export const Sidebar = styled.div`
  flex: 1;
  margin-right: 20px;
`;

export const MainContent = styled.div`
  flex: 2;
`;

export const Button = styled.button`
  background-color: #4CAF50;
  border: none;
  color: white;
  padding: 15px 32px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin: 4px 2px;
  border-radius: 12px;
  cursor: pointer;
`;

export const FileInput = styled.input`
  display: none;
`;

export const Label = styled.label`
  background-color: #4CAF50;
  color: white;
  padding: 15px 32px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin: 4px 2px;
  border-radius: 12px;
  cursor: pointer;
`;

export const FileListContainer = styled.div`
  margin-top: 20px;
`;

export const FileItem = styled.div`
  display: flex;
  justify-content: space-between;
  background: #f9f9f9;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 10px;
`;

export const FileDetailContainer = styled.div`
  margin-top: 20px;
  padding: 20px;
  background: #f1f1f1;
  border-radius: 8px;
`;

export const FileName = styled.span`
  font-weight: bold;
`;

export const SearchResultsContainer = styled.div`
  margin-top: 20px;
`;

export const SearchResultItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: left;
  margin: 10px;
  cursor: pointer;
  text-align: left;
`;

export const Thumbnail = styled.img`
  width: 100px;
  height: 100px;
  object-fit: cover;
`;

export const FileInfo = styled.div`
  margin-top: 5px;
`;

export const FileScore = styled.div`
  font-size: 0.9em;
  color: #666;
`;

export const TextInput = styled.input`
  background-color: #fff;
  border: 2px solid #4CAF50;
  color: #4CAF50;
  padding: 15px 32px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin: 4px 2px;
  border-radius: 12px;
  outline: none;
  transition: border-color 0.3s ease;

  &:focus {
    border-color: #45a049;
  }
`;

export const Divider = styled.div`
  height: 100%;
  width: 1px;
  background-color: #ddd;
  margin: 0 20px;
`;