import React, { FC, useState, useRef, useEffect } from "react";
import { IonList, IonItem, IonPopover } from "@ionic/react";
import "./CustomDropdown.css";

const CustomDropdown: FC<{
  placeholder: string;
  options: { id: string; displayName: string }[];
  currentlySelected: string | undefined;
  onDropdownChange: (event: string) => void;
}> = ({ placeholder, options, currentlySelected, onDropdownChange }) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const dropdownRef = useRef<HTMLIonListElement>(null);
  const popoverRef = useRef<HTMLIonPopoverElement>(null);

  const handleSelectOpen = () => setPopoverOpen(true);
  const handleSelectClose = () => setPopoverOpen(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setPopoverOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  return (
    <IonList mode="ios" ref={dropdownRef} placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>
      <IonItem lines="none" fill="outline" mode="ios" onClick={handleSelectOpen} placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>
        {currentlySelected
          ? options.find((option) => option.id === currentlySelected)?.displayName
          : placeholder}
      </IonItem>

      <IonPopover
        isOpen={popoverOpen}
        onDidDismiss={handleSelectClose}
        ref={popoverRef}
        backdropDismiss={false} placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}      >
        <div>
          {options.map((option) => (
            <IonItem
              key={option.id}
              button
              onClick={() => {
                onDropdownChange(option.id);
                handleSelectClose();
              } } placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}            >
              {option.displayName}
            </IonItem>
          ))}
        </div>
      </IonPopover>
    </IonList>
  );
};

export default CustomDropdown;
