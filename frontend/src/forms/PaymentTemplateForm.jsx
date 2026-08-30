import { Form, Input, InputNumber, Switch } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';

/** Payment split preset. Converting a quote to a project turns these three
 *  percentages into dated payment milestones, so they should total 100. */
export default function PaymentTemplateForm() {
  const translate = useLanguage();
  const pct = { min: 0, max: 100, suffix: '%', style: { width: '100%' } };
  return (
    <>
      <Form.Item label={translate('Template Name')} name="templateName" rules={[{ required: true }]}>
        <Input placeholder="Standard 30-50-20" />
      </Form.Item>
      <Form.Item label={translate('Advance %')} name="advancePercent" initialValue={30} rules={[{ required: true, type: 'number' }]}>
        <InputNumber {...pct} />
      </Form.Item>
      <Form.Item label={translate('Delivery %')} name="deliveryPercent" initialValue={50} rules={[{ required: true, type: 'number' }]}>
        <InputNumber {...pct} />
      </Form.Item>
      <Form.Item label={translate('Commissioning %')} name="commissioningPercent" initialValue={20} rules={[{ required: true, type: 'number' }]}>
        <InputNumber {...pct} />
      </Form.Item>
      <Form.Item label={translate('enabled')} name="enabled" valuePropName="checked" initialValue={true}>
        <Switch checkedChildren={<CheckOutlined />} unCheckedChildren={<CloseOutlined />} />
      </Form.Item>
    </>
  );
}
