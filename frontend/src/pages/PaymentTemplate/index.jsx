import { Tag } from 'antd';
import useLanguage from '@/locale/useLanguage';
import CrudModule from '@/modules/CrudModule/CrudModule';
import PaymentTemplateForm from '@/forms/PaymentTemplateForm';

export default function PaymentTemplate() {
  const translate = useLanguage();
  const entity = 'paymenttemplate';

  const dataTableColumns = [
    { title: translate('Template Name'), dataIndex: 'templateName' },
    { title: translate('Advance %'), dataIndex: 'advancePercent', render: (v) => `${v}%` },
    { title: translate('Delivery %'), dataIndex: 'deliveryPercent', render: (v) => `${v}%` },
    { title: translate('Commissioning %'), dataIndex: 'commissioningPercent', render: (v) => `${v}%` },
    {
      // A split that doesn't add to 100 silently under- or over-bills the
      // customer once it becomes a payment schedule — surface it here.
      title: translate('Total'),
      render: (_, r) => {
        const total = (r.advancePercent || 0) + (r.deliveryPercent || 0) + (r.commissioningPercent || 0);
        return <Tag color={total === 100 ? 'green' : 'red'}>{total}%</Tag>;
      },
    },
  ];

  const config = {
    entity,
    PANEL_TITLE: translate('Payment Templates'),
    DATATABLE_TITLE: translate('Payment Term Templates'),
    ADD_NEW_ENTITY: translate('Add Template'),
    ENTITY_NAME: translate('Payment Template'),
    dataTableColumns,
    searchConfig: { displayLabels: ['templateName'], searchFields: 'templateName' },
    deleteModalLabels: ['templateName'],
  };

  return (
    <CrudModule
      createForm={<PaymentTemplateForm />}
      updateForm={<PaymentTemplateForm isUpdateForm={true} />}
      config={config}
    />
  );
}
