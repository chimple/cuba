import React, { useRef, useState } from 'react';
import { AppBar, } from '@mui/material';
import BackButton from '../../components/common/BackButton';
import "./ClassCode.css"
import { t } from 'i18next';
import QRCodeGenerator from '../../components/classcode/QrCodeGenerator';
import CodeDropDown from '../../components/classcode/CodeDropDown';
import html2canvas from 'html2canvas';
import { Share } from '@capacitor/share';



interface ClassCodeProps {

}
const ClassCode: React.FC<ClassCodeProps> = () => {
    const screenRef = useRef(null);

    const handleShare = async () => {
        try {
            const screen = screenRef.current;

            if (!screen) return null;
           const canvas=  await html2canvas(screen)
        //    console.log(canvas.toDataURL())
            await Share.share({
                title: 'Share Image',
                text:'Hai',
                files:[],
                url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Red_Apple.jpg/1200px-Red_Apple.jpg',
                dialogTitle: 'Share with:',
              });
            // const screen = screenRef.current;
            // if (!screen) return null;
            // const canvas = await html2canvas(screen);

            // if (navigator.share) {
            //     await navigator.share({
            //         files: [canvas],
            //     });
            // } else {
            //     // Fallback if Web Share API is not supported
            //     console.log('Web Share API not supported');
            //     // Handle share fallback
            // }
            // canvas.toBlob(async (blob) => {
            //     if (navigator.share && blob) {
            //         await navigator.share({
            //             files: [new File([blob], 'screenshot.png', { type: 'image/png' })],
            //         });
            //     } else {
            //         // Fallback if Web Share API is not supported
            //         console.log('Web Share API not supported');
            //         // Handle share fallback
            //     }
            // }, 'image/png');
        } catch (error) {
            console.error('Error sharing image:', error);
            // Handle error
        }
    };

    return (
        <div className='class-code-page' ref={screenRef}>


            <AppBar
                position="static"
                sx={{
                    flexDirection: "inherit",
                    justifyContent: "space-evenly",
                    padding: "2vh 3vw 2vh 3vw",
                    backgroundColor: "#FFFBEC",
                    height: '10vh'
                }}
            >

                <div className="back-button">
                    <BackButton onClicked={() => { }} />
                </div>

                <p className='app-bar-title'>{t('Class Code')}</p>
            </AppBar>
            <div className='class-code-body'>
                <p className='share-text'>{t('Share the ClassCode to your Class')}</p>
                <div className='code-button'>
                    <p className='share-code'>529786</p>
                    <CodeDropDown onChange={() => { }} />
                </div>
                <button onClick={handleShare} className='share-butoon'>{t('Share ClassCode')}</button>
                <QRCodeGenerator value={'529786'} />
            </div>
        </div>
    )
};

export default ClassCode;
