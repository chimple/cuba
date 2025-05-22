import React, { useEffect, useState } from "react";
import "./KeyContacts.css";
import { t } from "i18next";
import { ServiceConfig } from "../../../services/ServiceConfig";

interface Contact {
  name: string;
  role: string;
  contact: string;
}

interface KeyContactsProps {
  contacts: Contact[];
}

const KeyContacts: React.FC<KeyContactsProps> = ({ contacts }) => (
  <div className="key-contacts-container">
    <div className="key-contacts-header">
      <h2 className="key-contacts-title">{t("Key Contacts")}</h2>
    </div>
    <hr className="key-contacts-divider" />
    <div className="key-contacts-content">
      {contacts.map((person, index) => (
        <div className="key-contacts-box" key={index}>
          <div className="key-contacts-left">
            <p>
              <strong>{person.name}</strong>
            </p>
            <p>{person.role}</p>
          </div>
          <span className="key-contacts-phone">{person.contact}</span>
        </div>
      ))}
    </div>
  </div>
);

interface KeyContactsSectionProps {
  id: string;
}

const KeyContactsSection: React.FC<KeyContactsSectionProps> = ({ id }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    async function fetchData() {
      const api = ServiceConfig.getI().apiHandler;
      const [principals, coordinators] = await Promise.all([
        api.getPrincipalsForSchool(id),
        api.getCoordinatorsForSchool(id),
      ]);

      const principalContacts: Contact[] = (principals || []).map((user) => ({
        name: user.name || "Unknown",
        role: "Principal",
        contact: user.phone || user.email || "N/A",
      }));

      const coordinatorContacts: Contact[] = (coordinators || []).map(
        (user) => ({
          name: user.name || "Unknown",
          role: "Coordinator",
          contact: user.phone || user.email || "N/A",
        })
      );

      setContacts([...principalContacts, ...coordinatorContacts]);
    }

    fetchData();
  }, [id]);

  if (!contacts.length) return <div>Loading key contacts...</div>;

  return <KeyContacts contacts={contacts} />;
};

export default KeyContactsSection;
