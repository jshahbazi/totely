import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const Spinner = () => (
  <div className='spinner'>
    <FontAwesomeIcon icon={faSpinner} size='1x' color='#1D3C4C' spin />
  </div>
);

export default Spinner;
