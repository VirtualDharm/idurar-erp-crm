import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Input, Select, Space, Table, Tag } from 'antd';
import dayjs from 'dayjs';

import { request } from '@/request';
import useLanguage from '@/locale/useLanguage';

const STATUS_COLOR = { Scheduled: 'blue', Completed: 'green', Cancelled: 'red' };

export default function Survey() {
  const translate = useLanguage();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await request.list({ entity: 'survey', options: { items: 500 } });
      if (res?.success) setRows(res.result || []);
      setLoading(false);
    })();
  }, []);

  const data = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(
      (r) => (!status || r.status === status) && (!q || (r.lead?.name || '').toLowerCase().includes(q))
    );
  }, [rows, status, search]);

  const columns = [
    {
      title: translate('Customer'),
      dataIndex: 'lead',
      render: (lead, r) => <Link to={`/survey/read/${r._id}`}>{lead?.name || '—'}</Link>,
    },
    {
      title: translate('Survey Date'),
      dataIndex: 'surveyDate',
      sorter: (a, b) => new Date(a.surveyDate) - new Date(b.surveyDate),
      render: (d) => dayjs(d).format('DD MMM YYYY, hh:mm A'),
    },
    {
      title: translate('Technician'),
      dataIndex: 'technician',
      render: (t) => t?.name || 'Unassigned',
    },
    {
      title: translate('Recommended'),
      dataIndex: 'recommendedKw',
      render: (v) => (v ? `${v} kW` : '—'),
    },
    {
      title: translate('Status'),
      dataIndex: 'status',
      render: (s) => <Tag color={STATUS_COLOR[s]}>{s}</Tag>,
    },
  ];

  return (
    <Card
      title={translate('Site Surveys')}
      loading={loading}
      extra={
        <Space>
          <Input.Search placeholder="Search by customer…" allowClear style={{ width: 220 }}
            onChange={(e) => setSearch(e.target.value)} />
          <Select allowClear placeholder="All statuses" style={{ width: 150 }}
            value={status || undefined} onChange={(v) => setStatus(v || '')}
            options={Object.keys(STATUS_COLOR).map((v) => ({ value: v, label: v }))} />
        </Space>
      }
    >
      <Table rowKey="_id" dataSource={data} columns={columns} pagination={{ pageSize: 20 }} />
    </Card>
  );
}
