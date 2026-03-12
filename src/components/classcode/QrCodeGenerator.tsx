import React from 'react';

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  value,
  size = 128,
}) => {
  return <></>;
};

export default QRCodeGenerator;
