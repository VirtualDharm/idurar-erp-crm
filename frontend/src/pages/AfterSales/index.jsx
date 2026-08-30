import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Button, Card, DatePicker, Form, Input, InputNumber, Modal, Select, Space, Table, Tabs, Tag, message,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import { request } from '@/request';
import useLanguage from '@/locale/useLanguage';

const TICKET_STATUS = ['Open', 'In Progress', 'Resolved', 'Closed'];
const ISSUE_TYPES = [
  'Inverter Fault', 'Panel Fault', 'Physical Damage', 'Low Generation',
  'Net Meter Issue', 'Wiring Issue', 'Other',
];
const STATUS_COLOR = { Open: 'gold', 'In Progress': 'blue', Resolved: 'green', Closed: 'default' };
const money = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;

/** Service desk: complaints against installed systems, plus the AMC contracts
 *  that pay for the visits. Both live here because ops works them together. */
export default function AfterSales() {
  const translate = useLanguage();
  const [tickets, setTickets] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [modal, setModal] = useState(null); // 'ticket' | 'amc'
  const [form] = Form.useForm();

  const load = async () => {
    const [t, a, p, team] = await Promise.all([
      request.list({ entity: 'serviceticket', options: { items: 500 } }),
      request.list({ entity: 'amccontract', options: { items: 500 } }),
      request.list({ entity: 'project', options: { items: 500 } }),
      request.get({ entity: 'team/list' }),
    ]);
    if (t?.success) setTickets(t.result || []);
    if (a?.success) setContracts(a.result || []);
    if (p?.success) setProjects(p.result || []);
    if (team?.success) setTechnicians(team.result.filter((u) => ['technician', 'owner', 'admin'].includes(u.role)));
  };

  useEffect(() => {
    load();
  }, []);

  const updateTicket = async (id, patch) => {
    const res = await request.update({ entity: 'serviceticket', id, jsonData: patch });
    if (res?.success) load();
  };

  const onSubmit = async (values) => {
    const entity = modal === 'ticket' ? 'serviceticket' : 'amccontract';
    const jsonData =
      modal === 'ticket'
        ? values
        : {
            ...values,
            startDate: values.startDate.toISOString(),
            expiryDate: values.expiryDate.toISOString(),
          };
    const res = await request.create({ entity, jsonData });
    if (res?.success) {
      message.success(res.message);
      form.resetFields();
      setModal(null);
      load();
    }
  };

  const ticketColumns = [
    { title: translate('Ticket No'), dataIndex: 'ticketNumber' },
    {
      title: translate('Project'),
      dataIndex: 'project',
      render: (p) => (p?._id ? <Link to={`/project/read/${p._id}`}>{p.projectName}</Link> : '—'),
    },
    { title: translate('Issue Type'), dataIndex: 'issueType' },
    {
      title: translate('Status'),
      dataIndex: 'status',
      render: (s, r) => (
        <Select
          size="small"
          value={s}
          style={{ width: 130 }}
          onChange={(status) => updateTicket(r._id, { status })}
          options={TICKET_STATUS.map((v) => ({ value: v, label: <Tag color={STATUS_COLOR[v]}>{v}</Tag> }))}
        />
      ),
    },
    {
      title: translate('Reported On'),
      dataIndex: 'reportedOn',
      render: (d) => (d ? dayjs(d).format('DD MMM YYYY') : '—'),
    },
    {
      title: translate('Technician'),
      dataIndex: 'technician',
      render: (t, r) => (
        <Select
          size="small"
          value={t?._id || t || undefined}
          placeholder="Unassigned"
          style={{ width: 150 }}
          allowClear
          onChange={(technician) => updateTicket(r._id, { technician: technician || null })}
          options={technicians.map((x) => ({ value: x._id, label: x.name }))}
        />
      ),
    },
  ];

  const amcColumns = [
    { title: translate('Contract No'), dataIndex: 'contractNumber' },
    {
      title: translate('Project'),
      dataIndex: 'project',
      render: (p) => (p?._id ? <Link to={`/project/read/${p._id}`}>{p.projectName}</Link> : '—'),
    },
    { title: translate('Start'), dataIndex: 'startDate', render: (d) => dayjs(d).format('DD MMM YYYY') },
    {
      title: translate('Expiry'),
      dataIndex: 'expiryDate',
      render: (d) => {
        const days = dayjs(d).diff(dayjs(), 'day');
        // 30 days is the default reminder lead time — colour matches when the
        // renewal call should already have happened.
        return <Tag color={days < 0 ? 'red' : days < 30 ? 'gold' : 'green'}>{dayjs(d).format('DD MMM YYYY')}</Tag>;
      },
    },
    { title: translate('Amount'), dataIndex: 'amount', render: money },
    { title: translate('Visits/yr'), dataIndex: 'visitsPerYear' },
  ];

  return (
    <>
      <Card
        title={translate('Service and AMC Center')}
        extra={
          <Space>
            <Button icon={<PlusOutlined />} type="primary" onClick={() => setModal('ticket')}>
              {translate('New Ticket')}
            </Button>
            <Button icon={<PlusOutlined />} onClick={() => setModal('amc')}>
              {translate('New AMC')}
            </Button>
          </Space>
        }
      >
        <Tabs
          items={[
            {
              key: 'tickets',
              label: `${translate('Service Tickets')} (${tickets.length})`,
              children: <Table rowKey="_id" dataSource={tickets} columns={ticketColumns} pagination={{ pageSize: 15 }} />,
            },
            {
              key: 'amc',
              label: `${translate('AMC Contracts')} (${contracts.length})`,
              children: <Table rowKey="_id" dataSource={contracts} columns={amcColumns} pagination={{ pageSize: 15 }} />,
            },
          ]}
        />
      </Card>

      <Modal
        title={modal === 'ticket' ? translate('Create Service Ticket') : translate('Create AMC Contract')}
        open={!!modal}
        onCancel={() => setModal(null)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={onSubmit}>
          <Form.Item label={translate('Project')} name="project" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={projects.map((p) => ({ value: p._id, label: p.projectName }))}
            />
          </Form.Item>

          {modal === 'ticket' ? (
            <>
              <Form.Item label={translate('Issue Type')} name="issueType" rules={[{ required: true }]}>
                <Select options={ISSUE_TYPES.map((v) => ({ value: v, label: v }))} />
              </Form.Item>
              <Form.Item label={translate('Description')} name="description">
                <Input.TextArea rows={3} />
              </Form.Item>
              <Form.Item label={translate('Assign Technician')} name="technician">
                <Select allowClear options={technicians.map((x) => ({ value: x._id, label: x.name }))} />
              </Form.Item>
            </>
          ) : (
            <>
              <Form.Item label={translate('Start Date')} name="startDate" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label={translate('Expiry Date')} name="expiryDate" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label={translate('Amount')} name="amount">
                <InputNumber min={0} prefix="₹" style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label={translate('Visits per Year')} name="visitsPerYear" initialValue={2}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </>
  );
}
