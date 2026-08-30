import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Alert, Card, Col, Empty, List, Progress, Row, Space, Statistic, Table, Tag, Typography,
} from 'antd';
import {
  TeamOutlined, ToolOutlined, WalletOutlined, CustomerServiceOutlined,
  BellOutlined, WarningOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

import { request } from '@/request';
import useLanguage from '@/locale/useLanguage';

const money = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;

const STAGE_COLOR = {
  New: '#1677ff', Contacted: '#13c2c2', 'Survey Scheduled': '#722ed1',
  'Quote Sent': '#faad14', Negotiation: '#fa8c16', Won: '#52c41a', Lost: '#f5222d',
};

/**
 * Business overview.
 *
 * Every widget comes from one `/dashboard/summary` call — the alternative was
 * six requests racing each other and a page that paints three times.
 */
export default function Dashboard() {
  const translate = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await request.get({ entity: 'dashboard/summary' });
      if (res?.success) setData(res.result);
      setLoading(false);
    })();
  }, []);

  const cards = data?.cards || {};
  const maxStage = Math.max(1, ...(data?.pipeline || []).map((p) => p.count));

  const kpis = [
    { title: translate('Leads'), value: cards.leads, icon: <TeamOutlined />, to: '/lead' },
    { title: translate('Active Projects'), value: cards.activeProjects, icon: <ToolOutlined />, to: '/project' },
    { title: translate('Collections'), value: cards.collections, prefix: '₹', icon: <WalletOutlined />, to: '/project' },
    { title: translate('Outstanding'), value: cards.outstanding, prefix: '₹', icon: <WalletOutlined />, to: '/project', danger: true },
    { title: translate('Open Tickets'), value: cards.openTickets, icon: <CustomerServiceOutlined />, to: '/after-sales' },
  ];

  return (
    <div>
      <Row gutter={[16, 16]}>
        {kpis.map((k) => (
          <Col key={k.title} xs={12} md={8} lg={Math.floor(24 / kpis.length) || 4}>
            <Link to={k.to}>
              <Card hoverable loading={loading} size="small">
                <Statistic
                  title={<Space>{k.icon}{k.title}</Space>}
                  value={k.value || 0}
                  prefix={k.prefix}
                  valueStyle={k.danger && k.value ? { color: '#cf1322' } : undefined}
                />
              </Card>
            </Link>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card title={translate('Sales Pipeline')} loading={loading}>
            {(data?.pipeline || []).map((p) => (
              <div key={p.stage} style={{ marginBottom: 10 }}>
                <Row justify="space-between">
                  <Typography.Text>{p.stage}</Typography.Text>
                  <Typography.Text strong>{p.count}</Typography.Text>
                </Row>
                <Progress
                  percent={Math.round((p.count / maxStage) * 100)}
                  showInfo={false}
                  strokeColor={STAGE_COLOR[p.stage]}
                />
              </div>
            ))}
          </Card>

          <Card title={translate('Recent Leads Activity')} style={{ marginTop: 16 }} loading={loading}>
            <Table
              rowKey="_id"
              size="small"
              pagination={false}
              dataSource={data?.recentLeads || []}
              locale={{ emptyText: 'No leads yet' }}
              columns={[
                {
                  title: translate('Customer'),
                  dataIndex: 'name',
                  render: (v, r) => <Link to={`/lead/read/${r._id}`}>{v}</Link>,
                },
                {
                  title: translate('Status'),
                  dataIndex: 'status',
                  render: (s) => <Tag color={s === 'Won' ? 'green' : 'blue'}>{s}</Tag>,
                },
                {
                  title: translate('Added'),
                  dataIndex: 'created',
                  render: (d) => dayjs(d).format('DD MMM YYYY'),
                },
              ]}
            />
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title={<Space><BellOutlined style={{ color: '#cf1322' }} />{translate('Overdue Follow-ups')}</Space>}
            loading={loading}
          >
            {data?.overdueFollowUps?.length ? (
              <List
                dataSource={data.overdueFollowUps}
                renderItem={(l) => (
                  <List.Item actions={[<Link key="v" to={`/lead/read/${l._id}`}>View</Link>]}>
                    <List.Item.Meta
                      title={l.name}
                      description={
                        <Typography.Text type="danger" style={{ fontSize: 12 }}>
                          Due {dayjs(l.followUpDate).format('DD MMM YYYY')}
                        </Typography.Text>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Nothing overdue" />
            )}
          </Card>

          <Card
            title={<Space><WarningOutlined style={{ color: '#faad14' }} />{translate('Stuck Subsidies')}</Space>}
            style={{ marginTop: 16 }}
            loading={loading}
          >
            {data?.stuckSubsidies?.length ? (
              <List
                dataSource={data.stuckSubsidies}
                renderItem={(p) => (
                  <List.Item actions={[<Link key="v" to={`/project/read/${p._id}`}>View</Link>]}>
                    <List.Item.Meta
                      title={p.projectName}
                      description={
                        <Space>
                          <Tag color="red">{p.daysElapsed} days</Tag>
                          <Tag>{p.portalStatus}</Tag>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Typography.Text type="secondary">No stuck applications.</Typography.Text>
            )}
          </Card>

          {cards.expiringAmc > 0 && (
            <Alert
              style={{ marginTop: 16 }}
              type="warning"
              showIcon
              message={`${cards.expiringAmc} AMC contract(s) expiring within 30 days`}
              action={<Link to="/after-sales">Review</Link>}
            />
          )}
        </Col>
      </Row>
    </div>
  );
}
