import { t } from "i18next";
import "./DeleteParentAccount.css";
import DeleteIcon from '@mui/icons-material/Delete';
import { Browser } from "@capacitor/browser";

const DeleteParentAccount: React.FC = () => {
  const handleDeleteParent = async () => {
    await Browser.open({
      url: "https://docs.google.com/forms/d/e/1FAIpQLSd0q3StMO49k_MvBQ68F_Ygdytpmxv-vNuF5jqsk6dY-4N0BA/viewform?pli=1",
    });
  };

  return (
    <div onClick={handleDeleteParent} className="parent_logout-btn">
      <DeleteIcon />
      <span>{t("Delete Account")}</span>
    </div>
  );
};

export default DeleteParentAccount;
