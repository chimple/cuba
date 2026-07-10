import React from 'react';
import QRCode from 'qrcode.react';

interface QRCodeGeneratorProps {
    value: string;
    size?: number;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ value, size = 128 }) => {
    return (
        <QRCode value={value} size={size} />
    );
};

export default QRCodeGenerator;
