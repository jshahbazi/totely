import React, { useState } from 'react';
import { toast } from "react-toastify";
import axios from "axios";
import { Button, TextInput } from '../styles';
import Spinner from './Spinner';

const SearchComponent = ({ onSearchResults }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      setSearching(true);
      const response = await axios.post('/search_vector', { query: searchQuery });
      onSearchResults(response.data.results);
      setSearching(false);
    } catch (error) {
      toast.error("Error performing search: " + error.message, { autoClose: 2000 });
      console.error("Search Error:", error);
    }
  };

  const vectorSearchContent = () => {
    switch (true) {
      case searching:
        return <Spinner />;
      default:
        return (
            <Button type="submit">Search</Button>
        );
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
        {vectorSearchContent()}
      </form>
    </div>
  );
};

export default SearchComponent;
