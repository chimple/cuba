import React, { useRef, useState } from 'react';
import { AppBar, MenuItem, Select } from '@mui/material';
import { useHistory } from 'react-router-dom';
import BackButton from '../../components/common/BackButton';
import "./ClassCode.css"
import { t } from 'i18next';
import QRCodeGenerator from '../../components/classcode/QrCodeGenerator';
import DropDown from '../../components/DropDown';
import CodeDropDown from '../../components/classcode/CodeDropDown';
import html2canvas from 'html2canvas';

interface ClassCodeProps {

}
const ClassCode: React.FC<ClassCodeProps> = () => {
    const screenRef = useRef(null);

    const captureScreen = () => {
        console.log('**************')
        const screen = screenRef.current;
        if (!screen) return null;
        html2canvas(screen)
          .then((canvas) => {
            const base64Image = canvas.toDataURL();
            console.log('FFFFFFFFFFFFFFFFF',base64Image)
            const whatsappURL = `whatsapp://send?text=Check%20out%20this%20image&attachment=${base64Image}`;
            window.open(whatsappURL);
          })
          .catch((error) => {
            console.error('Error capturing screen:', error);
          });
      };
    return (
        <div className='class-code-page' ref={screenRef}>
            <div className="back-button">
                <BackButton onClicked={() => { }} />
            </div>
            <AppBar
                position="static"
                sx={{
                    flexDirection: "inherit",
                    justifyContent: "space-evenly",
                    padding: "2vh 3vw 2vh 3vw",
                    backgroundColor: "#FFFBEC",
                }}
            >
                <p className='app-bar-title'>{t('Class Code')}</p>
            </AppBar>
            <div className='class-code-body'>
                <p className='share-text'>{t('Share the ClassCode to your Class')}</p>
                <div className='code-button'>
                    <p className='share-code'>529786</p>
                    <CodeDropDown onChange={() => { }} />
                </div>
                <button onClick={captureScreen} className='share-butoon'>{t('Share ClassCode')}</button>
                <QRCodeGenerator value={'529786'} />
            </div>
        </div>
    )
};

export default ClassCode;
