import React, { useState } from 'react';
import { AppBar, MenuItem, Select } from '@mui/material';
import { useHistory } from 'react-router-dom';
import BackButton from '../../components/common/BackButton';
import "./ClassCode.css"
import { t } from 'i18next';
import QRCodeGenerator from '../../components/classcode/QrCodeGenerator';
import DropDown from '../../components/DropDown';
import CodeDropDown from '../../components/classcode/CodeDropDown';

interface ClassCodeProps {

}
const ClassCode: React.FC<ClassCodeProps> = () => {
    return (
        <div className='class-code-page'>
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
                <button className='share-butoon'>{t('Share ClassCode')}</button>
                <QRCodeGenerator value={'529786'} />
            </div>
        </div>
    )
};

export default ClassCode;
