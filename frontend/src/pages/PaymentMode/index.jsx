import { Tag } from 'antd';
import useLanguage from '@/locale/useLanguage';
import CrudModule from '@/modules/CrudModule/CrudModule';
import PaymentModeForm from '@/forms/PaymentModeForm';

export default function PaymentMode() {
  const translate = useLanguage();
  const entity = 'paymentMode';
  const searchConfig = {
    displayLabels: ['name'],
    searchFields: 'name',
  };
  const deleteModalLabels = ['name'];

  const dataTableColumns = [
    {
      title: translate('Payment Mode'),
      dataIndex: 'name',
    },
    {
      title: translate('Description'),
      dataIndex: 'description',
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
    PANEL_TITLE: translate('payment_mode'),
    DATATABLE_TITLE: translate('payment_mode_list'),
    ADD_NEW_ENTITY: translate('add_new_payment_mode'),
    ENTITY_NAME: translate('payment_mode'),
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
      createForm={<PaymentModeForm />}
      updateForm={<PaymentModeForm isUpdateForm={true} />}
      config={config}
    />
  );
}
