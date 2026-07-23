import { useSelectIconImage } from '../../hooks/useSelectIconImage';
import './SelectIconImage.css';

const SelectIconImage = (props: Parameters<typeof useSelectIconImage>[0]) => {
  const viewProps = useSelectIconImage(props);

  const {
    CachedImage,
    activeSrc,
    disableLoader,
    handleImageError,
    handleImageLoad,
    imageHeight,
    imageWidth,
    isLoading,
    showLoader,
  } = viewProps;

  return (
    <div
      style={{
        position: 'relative',
        width: imageWidth,
        height: imageHeight,
      }}
    >
      {isLoading && <div className="placeholder" />}
      {showLoader && !disableLoader && (
        <div className="select-icon-image-loading-indicator-container">
          <div className="select-icon-image-loading-indicator" />
        </div>
      )}
      {activeSrc && (
        <CachedImage
          src={activeSrc}
          alt=""
          className={`select-icon-image ${!isLoading ? 'imageLoaded' : ''}`}
          style={{
            width: imageWidth,
            height: imageHeight,
            objectFit: 'contain',
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}
    </div>
  );
};

export default SelectIconImage;
