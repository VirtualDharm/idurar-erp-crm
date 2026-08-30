import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Badge, Button, Card, Col, DatePicker, Empty, Form, Input, InputNumber, Modal, Row,
  Segmented, Select, Space, Table, Tag, Typography, message,
} from 'antd';
import { PlusOutlined, WhatsAppOutlined, EnvironmentOutlined, ThunderboltOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import { request } from '@/request';
import useLanguage from '@/locale/useLanguage';

/**
 * Sales pipeline.
 *
 * Kanban is the default view because a solar sales team works the funnel by
 * stage, not by row: "who is sitting in Quote Sent" is the daily question.
 * Cards move with the stage dropdown (no drag library — one less dependency,
 * and it works on a phone in the field).
 */
const STAGES = ['New', 'Contacted', 'Survey Scheduled', 'Quote Sent', 'Negotiation', 'Won', 'Lost'];

const STAGE_COLOR = {
  New: 'blue',
  Contacted: 'cyan',
  'Survey Scheduled': 'purple',
  'Quote Sent': 'gold',
  Negotiation: 'orange',
  Won: 'green',
  Lost: 'red',
};

const SOURCES = ['Manual', 'Referral', 'Website Solar Calculator', 'Walk-in', 'Phone', 'Social Media'];

const money = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;

export default function Lead() {
  const translate = useLanguage();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('Kanban');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    // items=1000: the board must show the whole funnel, not page one of it.
    const res = await request.list({ entity: 'lead', options: { items: 1000 } });
    if (res?.success) setLeads(res.result || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter((l) =>
      [l.name, l.mobile, l.city, l.state].filter(Boolean).join(' ').toLowerCase().includes(q)
    );
  }, [leads, search]);

  const byStage = useMemo(() => {
    const map = Object.fromEntries(STAGES.map((s) => [s, []]));
    filtered.forEach((l) => (map[l.status] ||= []).push(l));
    return map;
  }, [filtered]);

  const moveStage = async (lead, status) => {
    // Optimistic: the board should feel instant; a failed patch reloads truth.
    setLeads((prev) => prev.map((l) => (l._id === lead._id ? { ...l, status } : l)));
    const res = await request.patch({ entity: `lead/status/${lead._id}`, jsonData: { status } });
    if (!res?.success) load();
  };

  const onCreate = async (values) => {
    setSaving(true);
    const res = await request.create({
      entity: 'lead',
      jsonData: {
        ...values,
        followUpDate: values.followUpDate ? values.followUpDate.toISOString() : undefined,
      },
    });
    setSaving(false);
    if (res?.success) {
      message.success(`${values.name} added to the pipeline`);
      form.resetFields();
      setOpen(false);
      load();
    }
  };

  const LeadCard = (lead) => (
    <Card key={lead._id} size="small" style={{ marginBottom: 8 }} styles={{ body: { padding: 12 } }}>
      <Space direction="vertical" size={4} style={{ width: '100%' }}>
        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
          <Link to={`/lead/read/${lead._id}`}>
            <Typography.Text strong>{lead.name}</Typography.Text>
          </Link>
          {lead.mobile && (
            <a
              href={`https://wa.me/${String(lead.mobile).replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              title="WhatsApp"
            >
              <WhatsAppOutlined style={{ color: '#25D366', fontSize: 16 }} />
            </a>
          )}
        </Space>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          <ThunderboltOutlined /> {money(lead.monthlyBill)} / mo
        </Typography.Text>
        {(lead.city || lead.state) && (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            <EnvironmentOutlined /> {[lead.city, lead.state].filter(Boolean).join(', ')}
          </Typography.Text>
        )}
        {lead.followUpDate && (
          <Tag color={dayjs(lead.followUpDate).isBefore(dayjs()) ? 'red' : 'default'}>
            follow-up {dayjs(lead.followUpDate).format('DD MMM')}
          </Tag>
        )}
        <Select
          size="small"
          value={lead.status}
          style={{ width: '100%' }}
          onChange={(v) => moveStage(lead, v)}
          options={STAGES.map((s) => ({ value: s, label: s }))}
        />
      </Space>
    </Card>
  );

  const columns = [
    {
      title: translate('Name'),
      dataIndex: 'name',
      render: (_, r) => <Link to={`/lead/read/${r._id}`}>{r.name}</Link>,
    },
    { title: translate('Mobile'), dataIndex: 'mobile' },
    {
      title: translate('Location'),
      render: (_, r) => [r.city, r.state].filter(Boolean).join(', '),
    },
    { title: translate('Monthly Bill'), dataIndex: 'monthlyBill', render: money },
    { title: translate('Source'), dataIndex: 'leadSource' },
    {
      title: translate('Status'),
      dataIndex: 'status',
      render: (s) => <Tag color={STAGE_COLOR[s]}>{s}</Tag>,
    },
    {
      title: translate('Follow-up'),
      dataIndex: 'followUpDate',
      render: (d) =>
        d ? (
          <Tag color={dayjs(d).isBefore(dayjs()) ? 'red' : 'default'}>
            {dayjs(d).format('DD MMM YYYY')}
          </Tag>
        ) : (
          '—'
        ),
    },
  ];

  return (
    <>
      <Card
        title={translate('Leads')}
        extra={
          <Space>
            <Input.Search
              placeholder={translate('Search leads…')}
              allowClear
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 220 }}
            />
            <Segmented options={['Kanban', 'List']} value={view} onChange={setView} />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
              {translate('New Lead')}
            </Button>
          </Space>
        }
        loading={loading}
      >
        {view === 'List' ? (
          <Table rowKey="_id" dataSource={filtered} columns={columns} pagination={{ pageSize: 20 }} />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <Row gutter={12} wrap={false} style={{ minWidth: 1100 }}>
              {STAGES.map((stage) => (
                <Col key={stage} flex="0 0 260px">
                  <Card
                    size="small"
                    title={
                      <Space>
                        <span style={{ fontSize: 12, letterSpacing: 0.4 }}>{stage.toUpperCase()}</span>
                        <Badge count={byStage[stage]?.length || 0} showZero color={STAGE_COLOR[stage]} />
                      </Space>
                    }
                    styles={{ body: { background: '#fafafa', minHeight: 220, padding: 8 } }}
                  >
                    {byStage[stage]?.length ? (
                      byStage[stage].map(LeadCard)
                    ) : (
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={false} />
                    )}
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}
      </Card>

      <Modal
        title={translate('New Lead')}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saving}
        width={620}
      >
        <Form form={form} layout="vertical" onFinish={onCreate} initialValues={{ leadSource: 'Manual', roofOwnership: 'Owned' }}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label={translate('Name')} name="name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={translate('Mobile')} name="mobile" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={translate('Email')} name="email">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={translate('Monthly Bill')} name="monthlyBill">
                <InputNumber min={0} prefix="₹" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={translate('City')} name="city">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={translate('State')}
                name="state"
                extra="Drives the state subsidy on quotations"
              >
                <Input placeholder="Maharashtra" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={translate('Lead Source')} name="leadSource">
                <Select options={SOURCES.map((v) => ({ value: v, label: v }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={translate('Follow-up Date')} name="followUpDate">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label={translate('Address')} name="address">
                <Input.TextArea rows={2} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </>
  );
}
