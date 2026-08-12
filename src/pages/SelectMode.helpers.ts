import { TableTypes } from '../common/constants';

export const getInitialSelectedClass = (
  classes: TableTypes<'class'>[],
  selectedClass?: TableTypes<'class'>,
): TableTypes<'class'> | undefined => {
  if (
    selectedClass &&
    classes.some((classItem) => classItem.id === selectedClass.id)
  ) {
    return selectedClass;
  }

  return classes[0];
};
