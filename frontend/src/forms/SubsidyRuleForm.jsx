import { Form, Input, InputNumber, Switch } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';

/** State top-up on top of the national PM Surya Ghar subsidy. Always capped —
 *  the cap, not the rate, is what usually binds on a 3kW residential system. */
export default function SubsidyRuleForm() {
  const translate = useLanguage();
  return (
    <>
      <Form.Item label={translate('State')} name="state" rules={[{ required: true }]}>
        <Input placeholder="Maharashtra" />
      </Form.Item>
      <Form.Item
        label={translate('Subsidy per kW')}
        name="subsidyPerKw"
        rules={[{ required: true, type: 'number', min: 0 }]}
      >
        <InputNumber min={0} prefix="₹" style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item
        label={translate('Maximum Cap')}
        name="maxCap"
        rules={[{ required: true, type: 'number', min: 0 }]}
      >
        <InputNumber min={0} prefix="₹" style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item label={translate('enabled')} name="enabled" valuePropName="checked" initialValue={true}>
        <Switch checkedChildren={<CheckOutlined />} unCheckedChildren={<CloseOutlined />} />
      </Form.Item>
    </>
  );
}
