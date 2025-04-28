import React, { useState } from 'react';
import './DropdownMenu.css';

interface MenuItemProps {
  icon: string;
  label: string;
  isSelected?: boolean;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, isSelected, onClick }) => (
  <div className="menu-item" onClick={onClick}>
    <img
      src={icon}
      alt={label}
      className={`menu-ItemIcon ${isSelected ? 'icon-img' : ''}`}
    />
    <span className="menu-label">{label}</span>
  </div>
);

const subjects = [
  { label: 'English', icon: '/assets/icons/English.svg' },
  { label: 'Maths', icon: '/assets/icons/Maths.svg' },
  { label: 'Kannada', icon: '/assets/icons/Kannada.svg' },
  { label: 'Hindi', icon: '/assets/icons/Hindi.svg' },
];

const DropdownMenu: React.FC = () => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [selected, setSelected] = useState(subjects[0]);

  const handleSelect = (subject: typeof subjects[0]) => {
    setSelected(subject);
    setExpanded(false);
  };

  const getSortedSubjects = () => {
    return [
      selected,
      ...subjects.filter(subject => subject.label !== selected.label),
    ];
  };

  return (
    <div style={{display: "flex", gap: '0.5vh', flexDirection: "column"}}>
      <div
        className={`dropdown-container ${expanded ? 'expanded' : ''}`}
        onClick={() => setExpanded(prev => !prev)}
      >
        <div className="dropdown-left">
          {!expanded && (
            <div className="selected-icon">
              <img src={selected.icon} alt={selected.label} className="icon-img" />
            </div>
          )}

          {expanded && (
            <div className="dropdown-items">
              {getSortedSubjects().map(subject => (
                <MenuItem
                  key={subject.label}
                  icon={subject.icon}
                  label={subject.label}
                  isSelected={subject.label === selected.label}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(subject);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className={`dropdown-arrow ${expanded ? 'expanded-arrow' : ''}`}>
          <img
            src={expanded ? '/assets/icons/ArrowDropUp.svg' : '/assets/icons/ArrowDropDown.svg'}
            alt="Toggle Arrow"
            className="expand-icon"
          />
        </div>
      </div>

      {!expanded && (
        <div className="dropdown-label">
          {selected.label}
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;
