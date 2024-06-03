import React, { useState } from 'react';
import { toast } from "react-toastify";
import axios from "axios";
import { Button, TextInput } from '../styles';

const SearchComponent = ({ onSearchResults }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/search_vector', { query: searchQuery });
      onSearchResults(response.data.results);
    } catch (error) {
      toast.error("Error performing search: " + error.message, { autoClose: 2000 });
      console.error("Search Error:", error);
    }
  };

  return (
    <div>
      <form onSubmit={handleSearch}>
        <TextInput
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search..."
        />
        <Button type="submit">Search</Button>
      </form>
    </div>
  );
};

export default SearchComponent;
