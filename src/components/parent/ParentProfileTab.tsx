import ProfileCard from './ProfileCard';
import { TableTypes } from '../../common/constants';

type ParentProfileTabProps = {
  setReloadProfiles: React.Dispatch<React.SetStateAction<boolean>>;
  studentMode?: string;
  userProfile: TableTypes<'user'>[];
};

const ParentProfileTab = ({
  setReloadProfiles,
  studentMode,
  userProfile,
}: ParentProfileTabProps) => (
  <div id="parent-page-profile">
    {userProfile.map((element, index) => {
      let studentUserType: boolean = true;
      if (element === undefined) {
        studentUserType = false;
      }
      return (
        <ProfileCard
          key={element?.id ?? `empty-profile-${index}`}
          width={'var(--profile-card-width)'}
          height={'auto'}
          userType={studentUserType}
          user={element}
          showText={true}
          setReloadProfiles={setReloadProfiles}
          profiles={userProfile}
          studentCurrMode={studentMode}
        />
      );
    })}
  </div>
);

export default ParentProfileTab;
