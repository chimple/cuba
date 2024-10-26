import React, { useState } from 'react';
import './PhoneSelectionModal.css'; // Import the CSS file
import { IonButton, IonContent, IonItem, IonLabel, IonList, IonModal, IonRadio, IonRadioGroup } from '@ionic/react';

const PhoneSelectionModal = ({ phoneNumbers, isOpen, onClose, onSelect }) => {
  const [selectedPhone, setSelectedPhone] = useState(null);
console.log('HHHHHHHHHHHHHHHHHHHHHHJJJJ')
  const handleSelection = (phone) => {
    setSelectedPhone(phone);
  };

  const handleNoneOfAbove = () => {
    setSelectedPhone(null);
    onSelect(null);
    onClose();
  };

  const handleSubmit = () => {
    if (selectedPhone) {
      onSelect(selectedPhone);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
    <IonContent>
      <h2>Select a Phone Number</h2>
      <IonRadioGroup
        value={selectedPhone}
        onIonChange={(e) => setSelectedPhone(e.detail.value)}
      >
        <IonList>
          {phoneNumbers.map((phone, index) => (
            <IonItem key={index}>
              <IonLabel>{phone}</IonLabel>
              <IonRadio slot="start" value={phone} />
            </IonItem>
          ))}
        </IonList>
      </IonRadioGroup>

      <div className="button-container">
        <IonButton onClick={handleNoneOfAbove} color="medium">None of the Above</IonButton>
        <IonButton onClick={handleSubmit} color="primary">Submit</IonButton>
      </div>
    </IonContent>
  </IonModal>
  );
};

export default PhoneSelectionModal;
