import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Checkbox, Col, Input, Row, Select, Space, Statistic, Table, Tag } from 'antd';
import dayjs from 'dayjs';

import { request } from '@/request';
import useLanguage from '@/locale/useLanguage';

const PORTAL_COLOR = {
  'Not Started': 'default', Applied: 'blue', 'Under Review': 'gold',
  Approved: 'cyan', Disbursed: 'green', Rejected: 'red',
};
const money = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;

/**
 * Subsidy pipeline across every project.
 *
 * "Days elapsed" counts from the date the application was submitted, not from
 * project creation — an install finished last year but applied for last week is
 * not stuck. Anything past the threshold with no disbursal is money the customer
 * is still waiting for, so it gets its own filter.
 */
export default function SubsidyTracker() {
  const translate = useLanguage();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [portal, setPortal] = useState('');
  const [search, setSearch] = useState('');
  const [stuckOnly, setStuckOnly] = useState(false);

  const THRESHOLD = 45;

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await request.list({ entity: 'project', options: { items: 500 } });
      if (res?.success) setRows(res.result || []);
      setLoading(false);
    })();
  }, []);

  const enriched = useMemo(
    () =>
      rows.map((p) => {
        const days = p.subsidyAppliedDate
          ? Math.floor((Date.now() - new Date(p.subsidyAppliedDate)) / 86400000)
          : null;
        return {
          ...p,
          daysElapsed: days,
          isStuck: days !== null && days > THRESHOLD && !['Disbursed', 'Rejected'].includes(p.portalStatus),
        };
      }),
    [rows]
  );

  const data = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enriched.filter(
      (p) =>
        (!portal || p.portalStatus === portal) &&
        (!stuckOnly || p.isStuck) &&
        (!q || `${p.projectName} ${p.state || ''}`.toLowerCase().includes(q))
    );
  }, [enriched, portal, stuckOnly, search]);

  const totalExpected = enriched.reduce((s, p) => s + (p.expectedSubsidy || 0), 0);
  const stuckCount = enriched.filter((p) => p.isStuck).length;

  const columns = [
    {
      title: translate('Project / Customer'),
      render: (_, r) => <Link to={`/project/read/${r._id}`}>{r.projectName}</Link>,
    },
    { title: translate('Location'), dataIndex: 'state', render: (v) => v || '—' },
    { title: translate('Expected Subsidy'), dataIndex: 'expectedSubsidy', render: money },
    {
      title: translate('Portal Status'),
      dataIndex: 'portalStatus',
      render: (s) => <Tag color={PORTAL_COLOR[s]}>{s}</Tag>,
    },
    {
      title: translate('Net Meter'),
      dataIndex: 'netMeterStatus',
      render: (s) => <Tag color={s === 'Installed' ? 'green' : 'gold'}>{s}</Tag>,
    },
    {
      title: translate('Applied On'),
      dataIndex: 'subsidyAppliedDate',
      render: (d) => (d ? dayjs(d).format('DD MMM YYYY') : '—'),
    },
    {
      title: translate('Time Elapsed'),
      dataIndex: 'daysElapsed',
      sorter: (a, b) => (a.daysElapsed || 0) - (b.daysElapsed || 0),
      render: (d, r) =>
        d === null ? '—' : <Tag color={r.isStuck ? 'red' : 'default'}>{d} days</Tag>,
    },
  ];

  return (
    <Card
      title={translate('Subsidy Tracker')}
      loading={loading}
      extra={
        <Space>
          <Statistic title={translate('Total Expected')} value={totalExpected} prefix="₹" valueStyle={{ fontSize: 16 }} />
          <Statistic title={translate('Stuck')} value={stuckCount} valueStyle={{ fontSize: 16, color: stuckCount ? '#cf1322' : undefined }} />
        </Space>
      }
    >
      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search placeholder="Search customer or project…" allowClear style={{ width: 260 }}
          onChange={(e) => setSearch(e.target.value)} />
        <Select allowClear placeholder="All statuses" style={{ width: 170 }}
          value={portal || undefined} onChange={(v) => setPortal(v || '')}
          options={Object.keys(PORTAL_COLOR).map((v) => ({ value: v, label: v }))} />
        <Checkbox checked={stuckOnly} onChange={(e) => setStuckOnly(e.target.checked)}>
          {translate(`Show stuck only (>${THRESHOLD} days)`)}
        </Checkbox>
      </Space>
      <Table rowKey="_id" dataSource={data} columns={columns} pagination={{ pageSize: 20 }} />
    </Card>
  );
}
