import { Tag } from 'antd';
import useLanguage from '@/locale/useLanguage';
import CrudModule from '@/modules/CrudModule/CrudModule';
import ProductForm from '@/forms/ProductForm';

export default function Product() {
  const translate = useLanguage();
  const entity = 'product';

  const dataTableColumns = [
    { title: translate('Item Name'), dataIndex: 'itemName' },
    { title: translate('Brand'), dataIndex: 'brand' },
    { title: translate('Unit'), dataIndex: 'unit' },
    {
      title: translate('Rate'),
      dataIndex: 'defaultRate',
      render: (v) => `₹ ${Number(v || 0).toLocaleString('en-IN')}`,
    },
    { title: translate('GST %'), dataIndex: 'gstPercent', render: (v) => `${v}%` },
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
    PANEL_TITLE: translate('Product Catalog'),
    DATATABLE_TITLE: translate('Product List'),
    ADD_NEW_ENTITY: translate('Add Product'),
    ENTITY_NAME: translate('Product'),
    dataTableColumns,
    searchConfig: { displayLabels: ['itemName'], searchFields: 'itemName,brand' },
    deleteModalLabels: ['itemName'],
  };

  return (
    <CrudModule
      createForm={<ProductForm />}
      updateForm={<ProductForm isUpdateForm={true} />}
      config={config}
    />
  );
}
