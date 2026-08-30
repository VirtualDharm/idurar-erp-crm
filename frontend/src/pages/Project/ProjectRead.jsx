import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Button, Card, Checkbox, Col, Descriptions, Input, InputNumber, Modal, Progress, Row,
  Select, Space, Statistic, Table, Tag, Typography, message,
} from 'antd';
import { CheckCircleTwoTone, FileTextOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import { request } from '@/request';
import useLanguage from '@/locale/useLanguage';

const money = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;

// Fixed set — the subsidy portal asks for exactly these.
const DOCS = [
  ['aadharCard', 'Aadhar Card'],
  ['electricityBill', 'Electricity Bill'],
  ['propertyProof', 'Property Proof'],
  ['bankPassbook', 'Bank Passbook'],
  ['installationCertificate', 'Installation Certificate'],
  ['inspectionReport', 'Inspection Report'],
];

/** Everything operations needs for one installation: milestone checklist,
 *  subsidy paperwork, and the money actually collected against it. */
export default function ProjectRead() {
  const translate = useLanguage();
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [payModal, setPayModal] = useState(null);
  const [payAmount, setPayAmount] = useState(0);

  const load = async () => {
    const res = await request.read({ entity: 'project', id });
    if (res?.success) setProject(res.result);
  };

  useEffect(() => {
    load();
  }, [id]);

  const toggleMilestone = async (index, done) => {
    const res = await request.patch({ entity: `project/milestone/${id}`, jsonData: { index, done } });
    if (res?.success) setProject(res.result);
  };

  const setDocument = async (key) => {
    const url = window.prompt(`Paste a link for "${key}" (file upload comes with the storage module)`);
    if (url === null) return;
    const res = await request.patch({ entity: `project/document/${id}`, jsonData: { key, url } });
    if (res?.success) setProject(res.result);
  };

  const savePayment = async () => {
    const res = await request.patch({
      entity: `project/payment/${id}`,
      jsonData: { index: payModal.index, amountReceived: payAmount },
    });
    if (res?.success) {
      setProject(res.result);
      setPayModal(null);
      message.success('Payment recorded');
    }
  };

  const updateField = async (patch) => {
    const res = await request.update({ entity: 'project', id, jsonData: patch });
    if (res?.success) setProject(res.result);
  };

  if (!project) return <Card loading />;

  const done = (project.milestones || []).filter((m) => m.done).length;
  const total = project.milestones?.length || 1;

  const received = (project.paymentSchedule || []).reduce((s, p) => s + (p.amountReceived || 0), 0);
  const outstanding = (project.paymentSchedule || []).reduce(
    (s, p) => s + Math.max((p.amountDue || 0) - (p.amountReceived || 0), 0), 0
  );

  const paymentColumns = [
    { title: translate('Milestone'), dataIndex: 'milestone' },
    { title: translate('Amount Due'), dataIndex: 'amountDue', render: money },
    {
      title: translate('Due Date'),
      dataIndex: 'dueDate',
      render: (d) => (d ? dayjs(d).format('DD MMM YYYY') : '—'),
    },
    {
      title: translate('Status'),
      dataIndex: 'status',
      render: (s) => <Tag color={s === 'Received' ? 'green' : s === 'Overdue' ? 'red' : 'default'}>{s}</Tag>,
    },
    { title: translate('Received'), dataIndex: 'amountReceived', render: money },
    {
      title: '',
      render: (_, r, index) => (
        <Button size="small" onClick={() => { setPayModal({ index, row: r }); setPayAmount(r.amountDue); }}>
          {translate('Record')}
        </Button>
      ),
    },
  ];

  return (
    <>
      <Card
        title={<Typography.Title level={4} style={{ margin: 0 }}>{project.projectName}</Typography.Title>}
        extra={
          <Space>
            <Select
              value={project.status}
              style={{ width: 150 }}
              onChange={(status) => updateField({ status })}
              options={['Not Started', 'In Progress', 'Completed', 'On Hold', 'Cancelled'].map((v) => ({ value: v, label: v }))}
            />
          </Space>
        }
      >
        <Descriptions column={{ xs: 1, sm: 2, lg: 4 }} size="small">
          <Descriptions.Item label={translate('System Size')}>{project.systemSizeKw} kW</Descriptions.Item>
          <Descriptions.Item label={translate('Location')}>{project.location || '—'}</Descriptions.Item>
          <Descriptions.Item label={translate('Project Value')}>{money(project.projectValue)}</Descriptions.Item>
          <Descriptions.Item label={translate('Expected Subsidy')}>{money(project.expectedSubsidy)}</Descriptions.Item>
        </Descriptions>
        <Progress percent={Math.round((done / total) * 100)} style={{ marginTop: 12 }} />
      </Card>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card title={`${translate('Installation Milestones')} (${done}/${total})`}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {(project.milestones || []).map((m, index) => (
                <Card
                  key={index}
                  size="small"
                  styles={{ body: { padding: '8px 12px', background: m.done ? '#f6ffed' : undefined } }}
                >
                  <Row justify="space-between" align="middle">
                    <Space>
                      <Checkbox checked={m.done} onChange={(e) => toggleMilestone(index, e.target.checked)} />
                      <Typography.Text delete={m.done}>{m.title}</Typography.Text>
                      <Tag color={m.done ? 'green' : 'default'}>{m.done ? 'Done' : 'Pending'}</Tag>
                    </Space>
                    {m.completedAt && (
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(m.completedAt).format('DD MMM')}
                      </Typography.Text>
                    )}
                  </Row>
                </Card>
              ))}
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title={translate('Subsidy Tracking')}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Typography.Text type="secondary">{translate('Portal Status')}</Typography.Text>
                <Select
                  value={project.portalStatus}
                  style={{ width: '100%' }}
                  onChange={(portalStatus) => updateField({ portalStatus })}
                  options={['Not Started', 'Applied', 'Under Review', 'Approved', 'Disbursed', 'Rejected'].map((v) => ({ value: v, label: v }))}
                />
              </div>
              <div>
                <Typography.Text type="secondary">{translate('Net Meter')}</Typography.Text>
                <Select
                  value={project.netMeterStatus}
                  style={{ width: '100%' }}
                  onChange={(netMeterStatus) => updateField({ netMeterStatus })}
                  options={['Not Applied', 'Applied', 'Inspection Done', 'Installed'].map((v) => ({ value: v, label: v }))}
                />
              </div>
            </Space>
          </Card>

          <Card title={translate('Subsidy Documents')} style={{ marginTop: 16 }}>
            <Row gutter={[8, 8]}>
              {DOCS.map(([key, label]) => {
                const url = project.documents?.[key];
                return (
                  <Col span={12} key={key}>
                    <Card size="small" styles={{ body: { padding: 10, background: url ? '#f6ffed' : undefined } }}>
                      <Space direction="vertical" size={4} style={{ width: '100%' }}>
                        <Space size={4}>
                          {url ? <CheckCircleTwoTone twoToneColor="#52c41a" /> : <FileTextOutlined />}
                          <Typography.Text style={{ fontSize: 12 }}>{label}</Typography.Text>
                        </Space>
                        <Button size="small" block onClick={() => setDocument(key)}>
                          {url ? translate('Replace') : translate('Add Link')}
                        </Button>
                        {url && (
                          <a href={url} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>
                            {translate('View')}
                          </a>
                        )}
                      </Space>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </Card>
        </Col>
      </Row>

      <Card title={translate('Payment Schedule & Collections')} style={{ marginTop: 16 }}>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={8}><Statistic title={translate('Total Project Value')} value={project.projectValue} prefix="₹" /></Col>
          <Col xs={24} sm={8}><Statistic title={translate('Total Received')} value={received} prefix="₹" valueStyle={{ color: '#3f8600' }} /></Col>
          <Col xs={24} sm={8}><Statistic title={translate('Balance Outstanding')} value={outstanding} prefix="₹" valueStyle={{ color: '#cf1322' }} /></Col>
        </Row>
        <Table
          rowKey={(r, i) => `${r.milestone}-${i}`}
          dataSource={project.paymentSchedule || []}
          columns={paymentColumns}
          pagination={false}
        />
      </Card>

      <Modal
        title={`${translate('Record Payment')} — ${payModal?.row?.milestone || ''}`}
        open={!!payModal}
        onCancel={() => setPayModal(null)}
        onOk={savePayment}
      >
        <Typography.Paragraph type="secondary">
          Due {money(payModal?.row?.amountDue)}. A partial amount keeps the milestone Pending.
        </Typography.Paragraph>
        <InputNumber
          value={payAmount}
          onChange={setPayAmount}
          min={0}
          prefix="₹"
          style={{ width: '100%' }}
        />
      </Modal>
    </>
  );
}
