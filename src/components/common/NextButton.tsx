import { IonIcon } from '@ionic/react'
import { t } from 'i18next'
import { chevronForward } from 'ionicons/icons'
import "./NextButton.css"


 const NextButton: React.FC<{
  onClicked:React.MouseEventHandler<HTMLButtonElement>,
  disabled:boolean
  
  
}> = ({onClicked,disabled}) => {
  return (
    <button
    id='common-next-button'
    disabled={disabled}
    onClick={onClicked}
    // style={{
    //   position:'absolute'
    // }} 
      >
        {t("Next")}
        <IonIcon
          className="arrow-icon"
          slot="end"
          icon={chevronForward}
        ></IonIcon>
    
    </button>
  )
}

export default NextButton





