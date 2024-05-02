import React from 'react';
import { t } from 'i18next';

const InputField = ({ label, type, id, value, onChange }) => {
  return (
    <div className="profile-row">
      <label htmlFor={id}>{t(label)}:</label>
      <input
        type={type}
        id={id}
        value={value}
        onChange={onChange}
      />
    </div>
  );
};

export default InputField;
