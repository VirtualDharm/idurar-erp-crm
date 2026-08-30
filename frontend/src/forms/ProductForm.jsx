import { Form, Input, InputNumber, Switch } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';

/** Catalog item used by quotation line items. GST sits on the product because a
 *  panel (12%) and an inverter (18%) attract different rates on one quote. */
export default function ProductForm() {
  const translate = useLanguage();
  return (
    <>
      <Form.Item label={translate('Item Name')} name="itemName" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item label={translate('Brand')} name="brand">
        <Input placeholder="Waaree, Growatt…" />
      </Form.Item>
      <Form.Item label={translate('Unit')} name="unit" initialValue="Nos">
        <Input placeholder="Nos / Set / Mtr" />
      </Form.Item>
      <Form.Item
        label={translate('Default Rate')}
        name="defaultRate"
        rules={[{ required: true, type: 'number', min: 0 }]}
      >
        <InputNumber min={0} prefix="₹" style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item
        label={translate('GST %')}
        name="gstPercent"
        initialValue={18}
        rules={[{ required: true, type: 'number', min: 0, max: 100 }]}
      >
        <InputNumber min={0} max={100} suffix="%" style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item label={translate('enabled')} name="enabled" valuePropName="checked" initialValue={true}>
        <Switch checkedChildren={<CheckOutlined />} unCheckedChildren={<CloseOutlined />} />
      </Form.Item>
    </>
  );
}
