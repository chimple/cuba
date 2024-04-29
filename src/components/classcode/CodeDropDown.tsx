import React, { useState } from 'react';
import { Select, MenuItem, Button } from '@mui/material';
import './CodeDropDown.css'; // Import your CSS file for styling
import { t } from 'i18next';

interface CodeDropDownProps {
  onChange;
}
const CodeDropDown: React.FC<CodeDropDownProps> = ({ onChange }) => {
  const [selectedOption, setSelectedOption] = useState('');

  const handleOptionChange = (event) => {
    setSelectedOption(event.target.value);
  };


  return (

    <Select value={selectedOption} onChange={onChange} className='dropdown'>
      <MenuItem className='menu-item' value="option1">{t('Copy to ClipBoard')}</MenuItem>
      <MenuItem className='menu-item' value="option2">{t('Generate New ClassCode')}</MenuItem>
    </Select>
  );
};

export default CodeDropDown;
