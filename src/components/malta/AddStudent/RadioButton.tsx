import React from 'react';
import { t } from 'i18next';

const RadioButton = ({ id, name, checked, onChange, label }) => {
  return (
    <>
      <input
        type="radio"
        id={id}
        name={name}
        value={id}
        checked={checked}
        onChange={onChange}
      />
      <label htmlFor={id}>{t(label)}</label>
    </>
  );
};

export default RadioButton;
