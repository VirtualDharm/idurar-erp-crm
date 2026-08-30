import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Col, Empty, Input, Progress, Row, Select, Space, Tag, Typography } from 'antd';
import { EnvironmentOutlined, ThunderboltOutlined } from '@ant-design/icons';

import { request } from '@/request';
import useLanguage from '@/locale/useLanguage';

const STATUS_COLOR = {
  'Not Started': 'default', 'In Progress': 'blue', Completed: 'green',
  'On Hold': 'orange', Cancelled: 'red',
};
const money = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;

/** Installation pipeline. Cards, not a table — milestone progress is the whole
 *  point and a progress bar per row reads far faster than a "4/10" cell. */
export default function Project() {
  const translate = useLanguage();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await request.list({ entity: 'project', options: { items: 500 } });
      if (res?.success) setRows(res.result || []);
      setLoading(false);
    })();
  }, []);

  const data = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (!status || r.status === status) &&
        (!q || `${r.projectName} ${r.location}`.toLowerCase().includes(q))
    );
  }, [rows, status, search]);

  return (
    <Card
      title={translate('Installation Pipeline')}
      loading={loading}
      extra={
        <Space>
          <Input.Search placeholder="Search project or customer…" allowClear style={{ width: 240 }}
            onChange={(e) => setSearch(e.target.value)} />
          <Select allowClear placeholder="All statuses" style={{ width: 160 }}
            value={status || undefined} onChange={(v) => setStatus(v || '')}
            options={Object.keys(STATUS_COLOR).map((v) => ({ value: v, label: v }))} />
        </Space>
      }
    >
      {!data.length && <Empty description="No projects yet — convert an accepted quotation." />}
      <Row gutter={[16, 16]}>
        {data.map((p) => {
          const done = (p.milestones || []).filter((m) => m.done).length;
          const total = (p.milestones || []).length || 1;
          return (
            <Col key={p._id} xs={24} sm={12} lg={8}>
              <Card size="small" hoverable>
                <Space direction="vertical" size={6} style={{ width: '100%' }}>
                  <Tag color={STATUS_COLOR[p.status]}>{p.status}</Tag>
                  <Link to={`/project/read/${p._id}`}>
                    <Typography.Text strong>{p.projectName}</Typography.Text>
                  </Link>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    <ThunderboltOutlined /> {p.systemSizeKw} kW System
                  </Typography.Text>
                  {p.location && (
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      <EnvironmentOutlined /> {p.location}
                    </Typography.Text>
                  )}
                  <Typography.Text>{money(p.projectValue)}</Typography.Text>
                  <div>
                    <Row justify="space-between" style={{ fontSize: 12 }}>
                      <span>{translate('Progress')}</span>
                      <span>{done}/{total} milestones</span>
                    </Row>
                    <Progress percent={Math.round((done / total) * 100)} showInfo={false} />
                  </div>
                </Space>
              </Card>
            </Col>
          );
        })}
      </Row>
    </Card>
  );
}
