import { FC } from "react";
import { IonInput, IonItem, IonLabel } from "@ionic/react";
import "./EditClassField.css";
import { t } from "i18next";

interface EditClassFieldProps {
  className: string;
  setClassName: (name: string) => void;
}

const EditClassField: FC<EditClassFieldProps> = ({
  className,
  setClassName,
}) => {
  return (
    <div className="edit-classname-div">
      <div className="name-div">{t("Class Name")}</div>
      <IonInput
        className="class-text-field"
        value={className}
        onIonChange={(e) => setClassName(e.detail.value!)}
        placeholder={t("Enter class name")??""}
        class="custom"
      />
    </div>
  );
};

export default EditClassField;
