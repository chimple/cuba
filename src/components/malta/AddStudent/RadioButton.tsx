import React from 'react';
import { t } from 'i18next';

const RadioButton = ({ id, name, checked, onChange, label }) => {
    console.log("fsfsdfdsf", onChange);
  return (
    <>
      <input
        type="radio"
        id={id}
        name={name}
        value={id}
        checked={checked === id}
        onChange={onChange}
      />
      <label htmlFor={id}>{t(label)}</label>
    </>
  );
};

export default RadioButton;
