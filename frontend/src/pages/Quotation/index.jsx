import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Select, Space, Table, Tag, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import { request } from '@/request';
import useLanguage from '@/locale/useLanguage';

const STATUS_COLOR = { Draft: 'default', Sent: 'blue', Accepted: 'green', Rejected: 'red', Expired: 'orange' };
const money = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;

export default function Quotation() {
  const translate = useLanguage();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await request.list({ entity: 'quotation', options: { items: 500 } });
    if (res?.success) setRows(res.result || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const data = status ? rows.filter((r) => r.status === status) : rows;

  const columns = [
    {
      title: translate('Quote No'),
      dataIndex: 'quoteNumber',
      render: (v, r) => <Link to={`/quotation/update/${r._id}`}>{v}</Link>,
    },
    {
      title: translate('Customer'),
      dataIndex: 'lead',
      render: (lead) => lead?.name || '—',
    },
    { title: translate('Size'), dataIndex: 'systemSizeKw', render: (v) => `${v} kW` },
    { title: translate('Total'), dataIndex: 'grandTotal', render: money },
    {
      // The number the customer actually cares about — grand total minus both
      // subsidies — so it gets emphasis over the gross figure.
      title: translate('Net Cost'),
      dataIndex: 'netCustomerCost',
      render: (v) => <Typography.Text strong>{money(v)}</Typography.Text>,
    },
    {
      title: translate('Validity'),
      dataIndex: 'validityDate',
      render: (d) => (d ? dayjs(d).format('DD MMM YYYY') : '—'),
    },
    {
      title: translate('Status'),
      dataIndex: 'status',
      render: (s) => <Tag color={STATUS_COLOR[s]}>{s}</Tag>,
    },
  ];

  return (
    <Card
      title={translate('Quotations')}
      loading={loading}
      extra={
        <Space>
          <Select
            allowClear
            placeholder="All statuses"
            style={{ width: 160 }}
            value={status || undefined}
            onChange={(v) => setStatus(v || '')}
            options={Object.keys(STATUS_COLOR).map((v) => ({ value: v, label: v }))}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/quotation/create')}>
            {translate('New Quotation')}
          </Button>
        </Space>
      }
    >
      <Table rowKey="_id" dataSource={data} columns={columns} pagination={{ pageSize: 20 }} />
    </Card>
  );
}
