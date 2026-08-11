import { Tag } from 'antd';
import useLanguage from '@/locale/useLanguage';
import CrudModule from '@/modules/CrudModule/CrudModule';
import TaxForm from '@/forms/TaxForm';

export default function Taxes() {
  const translate = useLanguage();
  const entity = 'taxes';
  const searchConfig = {
    displayLabels: ['taxName'],
    searchFields: 'taxName',
  };
  const deleteModalLabels = ['taxName'];

  const dataTableColumns = [
    {
      title: translate('Name'),
      dataIndex: 'taxName',
    },
    {
      title: translate('Value'),
      dataIndex: 'taxValue',
      render: (value) => `${value} %`,
    },
    {
      title: translate('Default'),
      dataIndex: 'isDefault',
      key: 'isDefault',
      onCell: () => ({
        props: {
          style: {
            width: '60px',
          },
        },
      }),
      render: (_, record) => (
        <Tag color={record.isDefault ? 'green' : 'default'}>
          {record.isDefault ? translate('yes') : translate('no')}
        </Tag>
      ),
    },
    {
      title: translate('enabled'),
      dataIndex: 'enabled',
      key: 'enabled',
      onCell: () => ({
        props: {
          style: {
            width: '60px',
          },
        },
      }),
      render: (_, record) => (
        <Tag color={record.enabled ? 'blue' : 'default'}>
          {record.enabled ? translate('enabled') : translate('disabled')}
        </Tag>
      ),
    },
  ];

  const Labels = {
    PANEL_TITLE: translate('taxes'),
    DATATABLE_TITLE: translate('taxes_list'),
    ADD_NEW_ENTITY: translate('add_new_tax'),
    ENTITY_NAME: translate('taxes'),
  };

  const configPage = {
    entity,
    ...Labels,
  };
  const config = {
    ...configPage,
    dataTableColumns,
    searchConfig,
    deleteModalLabels,
  };
  return (
    <CrudModule
      createForm={<TaxForm />}
      updateForm={<TaxForm isUpdateForm={true} />}
      config={config}
    />
  );
}
