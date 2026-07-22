import { t } from 'i18next';
import { Column } from '../components/DataTableBody';
import type { MigrationTab } from './MigrateSchoolsPageHelpers';

export const buildMigrateSchoolsColumns = (
  activeTab: MigrationTab,
): Column<Record<string, any>>[] =>
  activeTab === 'migrated'
    ? [
        {
          key: 'name',
          label: t('School Name'),
          width: '24%',
          sortable: false,
        },
        {
          key: 'programName',
          label: t('Program Name'),
          width: '16%',
          sortable: false,
        },
        {
          key: 'programModel',
          label: t('Program Model'),
          width: '14%',
          sortable: false,
        },
        {
          key: 'academicYear',
          label: t('Academic Year'),
          width: '13%',
          sortable: false,
        },
        {
          key: 'ukg',
          label: t('UKG'),
          width: '8%',
          sortable: false,
        },
        {
          key: 'class1',
          label: t('Class 1'),
          width: '8%',
          sortable: false,
        },
        {
          key: 'class2',
          label: t('Class 2'),
          width: '8%',
          sortable: false,
        },
        {
          key: 'class3',
          label: t('Class 3'),
          width: '8%',
          sortable: false,
        },
        {
          key: 'class4',
          label: t('Class 4'),
          width: '8%',
          sortable: false,
        },
        {
          key: 'class5',
          label: t('Class 5'),
          width: '8%',
          sortable: false,
        },
      ]
    : [
        {
          key: 'name',
          label: t('School Name'),
          width: '24%',
          sortable: false,
        },
        {
          key: 'programName',
          label: t('Program Name'),
          width: '16%',
          sortable: false,
        },
        {
          key: 'programModel',
          label: t('Program Model'),
          width: '14%',
          sortable: false,
        },
        {
          key: 'academicYear',
          label: t('Academic Year'),
          width: '13%',
          sortable: false,
        },
        {
          key: 'district',
          label: t('District'),
          width: '12%',
          sortable: false,
        },
        {
          key: 'cluster',
          label: t('Cluster'),
          width: '11%',
          sortable: false,
        },
        {
          key: 'block',
          label: t('Block'),
          width: '10%',
          sortable: false,
        },
      ];

export const getMigrateSchoolsFilterConfigs = () => [
  { key: 'program', label: t('Select Program') },
  { key: 'programType', label: t('Select Program Type') },
  { key: 'state', label: t('Select State') },
  { key: 'district', label: t('Select District') },
  { key: 'cluster', label: t('Select Cluster') },
  { key: 'block', label: t('Select Block') },
];
