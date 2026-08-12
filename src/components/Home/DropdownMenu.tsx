import { useDropdownMenu } from '../../hooks/useDropdownMenu';
import './DropdownMenu.css';

const DropdownMenu = (props: Parameters<typeof useDropdownMenu>[0]) => {
  const {
    SelectIconImage,
    courseDetails,
    disabled,
    expanded,
    getCachedImageUrl,
    getDisplayName,
    handleSelect,
    handleToggleExpand,
    hideArrow,
    itemRefs,
    selected,
    truncateName,
  } = useDropdownMenu(props);

  return (
    <div
      className={`dropdownmenu-dropdown-main ${disabled ? 'dropdownmenu-dropdown-disabled' : ''}`}
    >
      <div
        className={`dropdownmenu-dropdown-container ${expanded ? 'dropdownmenu-expanded' : ''}`}
        onClick={handleToggleExpand}
      >
        <div className="dropdownmenu-dropdown-left">
          {selected && (
            <div
              className={`dropdownmenu-menu-selected ${expanded ? 'hide-icon' : ''}`}
            >
              <div className="dropdownmenu-selected-icon">
                <SelectIconImage
                  localSrc={`courses/chapter_icons/${selected.course.id}.webp`}
                  defaultSrc={'assets/icons/DefaultIcon.png'}
                  webSrc={
                    getCachedImageUrl(selected.course) ||
                    'assets/icons/DefaultIcon.png'
                  }
                  enableOfflineDownload={true}
                  disableLoader={true}
                  imageWidth="10vh"
                  imageHeight="auto"
                />
              </div>
            </div>
          )}
          <div
            className={`dropdownmenu-dropdown-items ${expanded ? 'dropdownmenu-open' : 'dropdownmenu-closed'}`}
            onClick={(e) => e.stopPropagation()}
            aria-hidden={!expanded}
          >
            {courseDetails.map((detail, index) => (
              <div
                ref={(el) => {
                  itemRefs.current[detail.course.id] = el;
                }}
                className={`dropdownmenu-menu-item ${
                  selected?.course.id === detail.course.id
                    ? 'dropdownmenu-selected-expanded'
                    : ''
                }`}
                key={detail.course.id}
                onClick={() => handleSelect(detail, index)}
              >
                <div className="dropdownmenu-open-item-icon-autofit">
                  <div className="dropdownmenu-open-item-icon-wrapper">
                    <SelectIconImage
                      key={detail.course.id}
                      localSrc={`courses/chapter_icons/${detail.course.id}.webp`}
                      defaultSrc="assets/icons/DefaultIcon.png"
                      webSrc={
                        getCachedImageUrl(detail.course) ||
                        'assets/icons/DefaultIcon.png'
                      }
                      enableOfflineDownload={true}
                      showLoaderFromStart={true}
                      minimumLoaderVisibleMs={250}
                      imageWidth="30px"
                      imageHeight="30px"
                    />
                  </div>
                </div>
                <div className="dropdownmenu-truncate-style">
                  {truncateName(getDisplayName(detail))}
                </div>
              </div>
            ))}
          </div>
        </div>
        {!hideArrow && (
          <div
            className={`dropdownmenu-dropdown-arrow ${expanded ? 'dropdownmenu-expanded-arrow' : ''}`}
          >
            <SelectIconImage
              defaultSrc={
                expanded
                  ? '/assets/icons/ArrowDropUp.svg'
                  : '/assets/icons/ArrowDropDown.svg'
              }
            />
          </div>
        )}
      </div>

      <div>
        {!expanded && selected && (
          <div className=" dropdownmenu-dropdown-label">
            {getDisplayName(selected)}
          </div>
        )}
      </div>
    </div>
  );
};

export default DropdownMenu;
