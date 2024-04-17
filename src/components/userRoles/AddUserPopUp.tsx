import { Dialog, DialogContent, TextField } from '@mui/material';
import { t } from 'i18next';
import React, { useState } from 'react';

import { IoIosSearch } from 'react-icons/io';
import './AddUserPopUp.css'
import { IoCloseCircle } from 'react-icons/io5';
interface AddUserPopUpProps {
    showDialogBox: boolean;
    handleClose
}

const AddUserPopUp: React.FC<AddUserPopUpProps> = ({ showDialogBox, handleClose }) => {
    const [isMailSerach, setIsMailSearch] = useState(false);
    return (
        <div>
            <Dialog
                sx={{
                    "& .MuiPaper-root": { borderRadius: "2vh !important" },
                }}
                open={showDialogBox}
            >

                <div className='dialog-box'>
                    <DialogContent className='dialog-box-context'>
                        <div className='search-text-bar'>
                            <IoCloseCircle
                                size={"4vh"}
                                onClick={handleClose}
                                className="close-icon"
                            />
                            <h1 className="search-text">{t('Search')}</h1>
                        </div>
                        <div className='search-field'>
                            <TextField
                                onChange={(evt) => { }}
                                placeholder={!isMailSerach ? 'Email' : 'PhoneNumber'}
                            />
                            <div className='search-icon'>
                                <IoIosSearch />
                            </div>
                        </div>
                        <button className="use-another-search" onClick={() => {
                            setIsMailSearch(!isMailSerach)

                         }}>{!isMailSerach?t('Use Phone Number Instead'):t('Use Email Instead')}</button>
                    </DialogContent>
                </div>

            </Dialog>
        </div>
    );
};

export default AddUserPopUp;