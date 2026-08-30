import { Tag } from 'antd';
import useLanguage from '@/locale/useLanguage';
import CrudModule from '@/modules/CrudModule/CrudModule';
import SubsidyRuleForm from '@/forms/SubsidyRuleForm';

export default function SubsidyRule() {
  const translate = useLanguage();
  const entity = 'subsidyrule';
  const money = (v) => `₹ ${Number(v || 0).toLocaleString('en-IN')}`;

  const dataTableColumns = [
    { title: translate('State'), dataIndex: 'state' },
    { title: translate('Subsidy per kW'), dataIndex: 'subsidyPerKw', render: money },
    { title: translate('Max Cap'), dataIndex: 'maxCap', render: money },
    {
      title: translate('enabled'),
      dataIndex: 'enabled',
      render: (_, r) => (
        <Tag color={r.enabled ? 'blue' : 'default'}>
          {r.enabled ? translate('enabled') : translate('disabled')}
        </Tag>
      ),
    },
  ];

  const config = {
    entity,
    PANEL_TITLE: translate('State Subsidy Rules'),
    DATATABLE_TITLE: translate('Subsidy Rules'),
    ADD_NEW_ENTITY: translate('Add State Rule'),
    ENTITY_NAME: translate('Subsidy Rule'),
    dataTableColumns,
    searchConfig: { displayLabels: ['state'], searchFields: 'state' },
    deleteModalLabels: ['state'],
  };

  return (
    <CrudModule
      createForm={<SubsidyRuleForm />}
      updateForm={<SubsidyRuleForm isUpdateForm={true} />}
      config={config}
    />
  );
}
