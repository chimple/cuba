import { badgeNumbers } from './badgeGenerator';
import Badge from './Badge';

const Badges = () => (
  <div className="badges-grid" id="badges-grid">
    {badgeNumbers.map((badgeNumber) => (
      <Badge key={badgeNumber} number={badgeNumber} />
    ))}
  </div>
);

export default Badges;
