import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Alert, Button, Card, Col, DatePicker, Divider, Form, Input, InputNumber, Popconfirm,
  Row, Select, Space, Statistic, Table, Tag, Typography, message,
} from 'antd';
import { DeleteOutlined, PlusOutlined, ToolOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import { request } from '@/request';
import useLanguage from '@/locale/useLanguage';

/**
 * Quotation builder.
 *
 * The totals shown here are a local preview so the salesperson sees the effect
 * of a line item immediately; the server recomputes them on save and its answer
 * wins. Two implementations of the same maths is a real risk, so the preview
 * deliberately mirrors calculate.js exactly — including the PM Surya Ghar step
 * function, which is not a per-kW rate.
 */
const money = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;

const centralSubsidyFor = (kw) => {
  if (!kw || kw <= 0) return 0;
  if (kw <= 1) return Math.round(30000 * kw);
  if (kw <= 2) return Math.round(30000 + 18000 * (kw - 1));
  return 78000;
};

export default function QuotationForm() {
  const translate = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams();
  const [params] = useSearchParams();
  const isUpdate = !!id;

  const [form] = Form.useForm();
  const [items, setItems] = useState([]);
  const [leads, setLeads] = useState([]);
  const [products, setProducts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [rules, setRules] = useState([]);
  const [quote, setQuote] = useState(null);
  const [saving, setSaving] = useState(false);

  const [itemForm] = Form.useForm();
  const leadId = Form.useWatch('lead', form);
  const systemSizeKw = Form.useWatch('systemSizeKw', form);

  useEffect(() => {
    (async () => {
      const [l, p, t, r] = await Promise.all([
        request.list({ entity: 'lead', options: { items: 1000 } }),
        request.list({ entity: 'product', options: { items: 500 } }),
        request.list({ entity: 'paymenttemplate', options: { items: 100 } }),
        request.list({ entity: 'subsidyrule', options: { items: 100 } }),
      ]);
      if (l?.success) setLeads(l.result || []);
      if (p?.success) setProducts(p.result || []);
      if (t?.success) setTemplates(t.result || []);
      if (r?.success) setRules(r.result || []);

      if (isUpdate) {
        const q = await request.read({ entity: 'quotation', id });
        if (q?.success) {
          setQuote(q.result);
          setItems(q.result.items || []);
          form.setFieldsValue({
            ...q.result,
            lead: q.result.lead?._id || q.result.lead,
            paymentTemplate: q.result.paymentTemplate?._id || q.result.paymentTemplate,
            validityDate: q.result.validityDate ? dayjs(q.result.validityDate) : undefined,
          });
        }
      } else {
        const preset = params.get('lead');
        form.setFieldsValue({
          lead: preset || undefined,
          systemSizeKw: 3,
          advancePercent: 30,
          deliveryPercent: 50,
          commissioningPercent: 20,
          validityDate: dayjs().add(15, 'day'),
        });
      }
    })();
  }, [id]);

  const state = useMemo(
    () => leads.find((l) => l._id === leadId)?.state,
    [leads, leadId]
  );

  const totals = useMemo(() => {
    let subTotal = 0;
    let taxTotal = 0;
    items.forEach((i) => {
      const base = (Number(i.quantity) || 0) * (Number(i.rate) || 0);
      subTotal += base;
      taxTotal += (base * (Number(i.gstPercent) || 0)) / 100;
    });
    const grandTotal = subTotal + taxTotal;
    const central = centralSubsidyFor(Number(systemSizeKw));
    const rule = rules.find((r) => r.state?.toLowerCase() === String(state || '').toLowerCase());
    const stateSubsidy = rule ? Math.min(rule.subsidyPerKw * Number(systemSizeKw || 0), rule.maxCap) : 0;
    const totalSubsidy = Math.min(central + stateSubsidy, grandTotal);
    return {
      subTotal,
      taxTotal,
      grandTotal,
      central,
      stateSubsidy,
      net: grandTotal - totalSubsidy,
      hasRule: !!rule,
    };
  }, [items, systemSizeKw, state, rules]);

  const addItem = (values) => {
    const product = products.find((p) => p._id === values.product);
    setItems((prev) => [
      ...prev,
      {
        product: product?._id,
        itemName: product?.itemName || values.itemName,
        brand: product?.brand,
        unit: product?.unit || 'Nos',
        quantity: values.quantity,
        rate: values.rate,
        gstPercent: values.gstPercent,
      },
    ]);
    itemForm.resetFields();
  };

  const onProductPick = (productId) => {
    const p = products.find((x) => x._id === productId);
    if (p) itemForm.setFieldsValue({ rate: p.defaultRate, gstPercent: p.gstPercent });
  };

  const applyTemplate = (templateId) => {
    const t = templates.find((x) => x._id === templateId);
    if (t) {
      form.setFieldsValue({
        advancePercent: t.advancePercent,
        deliveryPercent: t.deliveryPercent,
        commissioningPercent: t.commissioningPercent,
        paymentTerms: t.templateName,
      });
    }
  };

  const onSubmit = async (values) => {
    if (!items.length) return message.warning('Add at least one line item');
    setSaving(true);
    const jsonData = {
      ...values,
      items,
      state,
      validityDate: values.validityDate ? values.validityDate.toISOString() : undefined,
    };
    const res = isUpdate
      ? await request.update({ entity: 'quotation', id, jsonData })
      : await request.create({ entity: 'quotation', jsonData });
    setSaving(false);
    if (res?.success) {
      message.success(isUpdate ? 'Quotation updated' : `Created ${res.result.quoteNumber}`);
      navigate(`/quotation/update/${res.result._id}`);
      setQuote(res.result);
    }
  };

  const convert = async () => {
    const res = await request.get({ entity: `quotation/convert/${id}` });
    if (res?.success) {
      message.success(res.message);
      navigate(`/project/read/${res.result._id}`);
    }
  };

  const itemColumns = [
    {
      title: translate('Item'),
      render: (_, r) => (
        <>
          <Typography.Text>{r.itemName}</Typography.Text>
          <br />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>{r.brand}</Typography.Text>
        </>
      ),
    },
    { title: translate('Qty'), render: (_, r) => `${r.quantity} ${r.unit || ''}` },
    { title: translate('Rate'), dataIndex: 'rate', render: money },
    { title: translate('GST'), dataIndex: 'gstPercent', render: (v) => `${v}%` },
    {
      title: translate('Line Total'),
      render: (_, r) => money(r.quantity * r.rate * (1 + (r.gstPercent || 0) / 100)),
    },
    {
      title: '',
      render: (_, __, index) => (
        <Button
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
        />
      ),
    },
  ];

  return (
    <Form form={form} layout="vertical" onFinish={onSubmit}>
      <Card
        title={isUpdate ? `${translate('Edit Quotation')}: ${quote?.quoteNumber || ''}` : translate('New Quotation')}
        extra={
          <Space>
            {isUpdate && (
              <Popconfirm
                title="Convert to project?"
                description="Creates the installation project with milestones and a payment schedule."
                onConfirm={convert}
              >
                <Button icon={<ToolOutlined />}>{translate('Convert to Project')}</Button>
              </Popconfirm>
            )}
            <Button type="primary" htmlType="submit" loading={saving}>
              {isUpdate ? translate('Save Changes') : translate('Create Quotation')}
            </Button>
          </Space>
        }
      >
        <Row gutter={12}>
          <Col xs={24} md={8}>
            <Form.Item label={translate('Customer (Lead)')} name="lead" rules={[{ required: true }]}>
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Select a lead"
                options={leads.map((l) => ({
                  value: l._id,
                  label: `${l.name}${l.state ? ` — ${l.state}` : ''}`,
                }))}
              />
            </Form.Item>
          </Col>
          <Col xs={12} md={4}>
            <Form.Item label={translate('System Size (kW)')} name="systemSizeKw" rules={[{ required: true }]}>
              <InputNumber min={0.5} step={0.5} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item label={translate('Validity Date')} name="validityDate">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={6}>
            <Form.Item label={translate('Status')} name="status" initialValue="Draft">
              <Select options={['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'].map((v) => ({ value: v, label: v }))} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={12}>
          <Col xs={24} md={6}>
            <Form.Item label={translate('Payment Template')} name="paymentTemplate">
              <Select
                allowClear
                placeholder="Custom / manual"
                onChange={applyTemplate}
                options={templates.map((t) => ({ value: t._id, label: t.templateName }))}
              />
            </Form.Item>
          </Col>
          <Col xs={8} md={6}>
            <Form.Item label={translate('Advance %')} name="advancePercent">
              <InputNumber min={0} max={100} suffix="%" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={8} md={6}>
            <Form.Item label={translate('Delivery %')} name="deliveryPercent">
              <InputNumber min={0} max={100} suffix="%" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={8} md={6}>
            <Form.Item label={translate('Commissioning %')} name="commissioningPercent">
              <InputNumber min={0} max={100} suffix="%" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title={translate('Line Items')} style={{ marginTop: 16 }}>
        <Form form={itemForm} layout="inline" onFinish={addItem} style={{ marginBottom: 16 }}>
          <Form.Item name="product" rules={[{ required: true, message: 'Pick a product' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Select a product…"
              style={{ width: 240 }}
              onChange={onProductPick}
              options={products.map((p) => ({ value: p._id, label: `${p.itemName}${p.brand ? ` (${p.brand})` : ''}` }))}
            />
          </Form.Item>
          <Form.Item name="quantity" initialValue={1} rules={[{ required: true }]}>
            <InputNumber min={1} placeholder="Qty" style={{ width: 90 }} />
          </Form.Item>
          <Form.Item name="rate" rules={[{ required: true }]}>
            <InputNumber min={0} prefix="₹" placeholder="Rate" style={{ width: 130 }} />
          </Form.Item>
          <Form.Item name="gstPercent" initialValue={18} rules={[{ required: true }]}>
            <InputNumber min={0} max={100} suffix="%" style={{ width: 90 }} />
          </Form.Item>
          <Form.Item>
            <Button type="dashed" htmlType="submit" icon={<PlusOutlined />}>
              {translate('Add Row')}
            </Button>
          </Form.Item>
        </Form>

        <Table
          rowKey={(r, i) => `${r.itemName}-${i}`}
          dataSource={items}
          columns={itemColumns}
          pagination={false}
          locale={{ emptyText: 'No items yet' }}
        />
      </Card>

      <Card title={translate('Pricing Summary')} style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Row justify="space-between"><span>{translate('Subtotal')}</span><b>{money(totals.subTotal)}</b></Row>
              <Row justify="space-between"><span>{translate('Total GST')}</span><b>{money(totals.taxTotal)}</b></Row>
              <Divider style={{ margin: '8px 0' }} />
              <Row justify="space-between">
                <Typography.Text strong>{translate('Grand Total')}</Typography.Text>
                <Typography.Text strong>{money(totals.grandTotal)}</Typography.Text>
              </Row>
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Row justify="space-between">
                <span>{translate('Central Subsidy')} <Tag>PM Surya Ghar</Tag></span>
                <b style={{ color: '#389e0d' }}>− {money(totals.central)}</b>
              </Row>
              <Row justify="space-between">
                <span>
                  {translate('State Subsidy')} {state ? <Tag>{state}</Tag> : null}
                </span>
                <b style={{ color: '#389e0d' }}>− {money(totals.stateSubsidy)}</b>
              </Row>
              <Divider style={{ margin: '8px 0' }} />
              <Statistic title={translate('Net Customer Cost')} value={totals.net} prefix="₹" />
            </Space>
          </Col>
        </Row>

        {state && !totals.hasRule && (
          <Alert
            style={{ marginTop: 12 }}
            type="warning"
            showIcon
            message={`No subsidy rule configured for ${state}`}
            description="Add one under Settings → Subsidy Rules, or the customer sees only the central subsidy."
          />
        )}
        <Alert
          style={{ marginTop: 12 }}
          type="info"
          message="Subsidies are estimates subject to MNRE guidelines. Installation must be by an MNRE-approved vendor using DCR modules."
        />
      </Card>
    </Form>
  );
}
