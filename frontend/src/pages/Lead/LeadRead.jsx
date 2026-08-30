import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button, Card, Col, DatePicker, Descriptions, Divider, Form, Input, List, Row, Select,
  Space, Tag, Timeline, Typography, message,
} from 'antd';
import { WhatsAppOutlined, FileAddOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import { request } from '@/request';
import useLanguage from '@/locale/useLanguage';

const STAGES = ['New', 'Contacted', 'Survey Scheduled', 'Quote Sent', 'Negotiation', 'Won', 'Lost'];

/** Everything about one lead on a single screen: stage + follow-up (the two
 *  fields a salesperson actually edits), contact facts, survey scheduling, and
 *  an append-only notes timeline. */
export default function LeadRead() {
  const translate = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();

  const [lead, setLead] = useState(null);
  const [surveys, setSurveys] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [note, setNote] = useState('');
  const [surveyForm] = Form.useForm();

  const load = async () => {
    const [leadRes, surveyRes, teamRes] = await Promise.all([
      request.read({ entity: 'lead', id }),
      request.list({ entity: 'survey', options: { items: 100 } }),
      request.get({ entity: 'team/list' }),
    ]);
    if (leadRes?.success) setLead(leadRes.result);
    if (surveyRes?.success) setSurveys((surveyRes.result || []).filter((s) => (s.lead?._id || s.lead) === id));
    // Only field techs get offered for a site visit — an accountant on the roof
    // is a data-entry mistake waiting to happen.
    if (teamRes?.success) setTechnicians(teamRes.result.filter((u) => ['technician', 'owner', 'admin'].includes(u.role)));
  };

  useEffect(() => {
    load();
  }, [id]);

  const patchStatus = async (payload) => {
    const res = await request.patch({ entity: `lead/status/${id}`, jsonData: payload });
    if (res?.success) setLead(res.result);
  };

  const addNote = async () => {
    if (!note.trim()) return;
    const res = await request.patch({ entity: `lead/note/${id}`, jsonData: { text: note } });
    if (res?.success) {
      setLead(res.result);
      setNote('');
    }
  };

  const scheduleSurvey = async (values) => {
    const res = await request.create({
      entity: 'survey',
      jsonData: {
        lead: id,
        surveyDate: values.surveyDate.toISOString(),
        technician: values.technician,
        status: 'Scheduled',
      },
    });
    if (res?.success) {
      message.success('Site survey scheduled');
      surveyForm.resetFields();
      // Scheduling a visit is itself a pipeline move.
      if (['New', 'Contacted'].includes(lead.status)) patchStatus({ status: 'Survey Scheduled' });
      load();
    }
  };

  if (!lead) return <Card loading />;

  const whatsapp = String(lead.mobile || '').replace(/\D/g, '');

  return (
    <Row gutter={16}>
      <Col xs={24} lg={16}>
        <Card
          title={
            <Space>
              <Typography.Title level={4} style={{ margin: 0 }}>{lead.name}</Typography.Title>
              <Tag>{lead.leadSource}</Tag>
            </Space>
          }
          extra={
            <Space>
              {whatsapp && (
                <Button icon={<WhatsAppOutlined />} href={`https://wa.me/${whatsapp}`} target="_blank">
                  WhatsApp
                </Button>
              )}
              <Button
                type="primary"
                icon={<FileAddOutlined />}
                onClick={() => navigate(`/quotation/create?lead=${id}`)}
              >
                {translate('Create Quotation')}
              </Button>
            </Space>
          }
        >
          <Space wrap size="large">
            <div>
              <Typography.Text type="secondary">{translate('Stage')}</Typography.Text>
              <br />
              <Select
                value={lead.status}
                style={{ width: 190 }}
                onChange={(status) => patchStatus({ status })}
                options={STAGES.map((s) => ({ value: s, label: s }))}
              />
            </div>
            <div>
              <Typography.Text type="secondary">{translate('Follow-up Date')}</Typography.Text>
              <br />
              <DatePicker
                value={lead.followUpDate ? dayjs(lead.followUpDate) : null}
                onChange={(d) => patchStatus({ followUpDate: d ? d.toISOString() : null })}
              />
            </div>
          </Space>

          <Divider />

          <Descriptions column={2} size="small">
            <Descriptions.Item label={translate('Mobile')}>{lead.mobile || '—'}</Descriptions.Item>
            <Descriptions.Item label={translate('Email')}>{lead.email || '—'}</Descriptions.Item>
            <Descriptions.Item label={translate('Monthly Bill')}>
              ₹{Number(lead.monthlyBill || 0).toLocaleString('en-IN')}
            </Descriptions.Item>
            <Descriptions.Item label={translate('Roof Ownership')}>{lead.roofOwnership}</Descriptions.Item>
            <Descriptions.Item label={translate('Location')}>
              {[lead.city, lead.state].filter(Boolean).join(', ') || '—'}
            </Descriptions.Item>
            <Descriptions.Item label={translate('Address')}>{lead.address || '—'}</Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title={translate('Site Surveys')} style={{ marginTop: 16 }}>
          <Form form={surveyForm} layout="inline" onFinish={scheduleSurvey}>
            <Form.Item name="surveyDate" rules={[{ required: true, message: 'Pick a date' }]}>
              <DatePicker showTime placeholder="Survey date & time" />
            </Form.Item>
            <Form.Item name="technician">
              <Select
                placeholder="Assign technician"
                style={{ width: 200 }}
                allowClear
                options={technicians.map((t) => ({ value: t._id, label: `${t.name} (${t.role})` }))}
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">{translate('Schedule')}</Button>
            </Form.Item>
          </Form>

          <List
            style={{ marginTop: 16 }}
            dataSource={surveys}
            locale={{ emptyText: 'No surveys yet' }}
            renderItem={(s) => (
              <List.Item
                actions={[
                  <a key="open" onClick={() => navigate(`/survey/read/${s._id}`)}>open</a>,
                ]}
              >
                <List.Item.Meta
                  title={dayjs(s.surveyDate).format('DD MMM YYYY, hh:mm A')}
                  description={
                    <Space>
                      <Tag color={s.status === 'Completed' ? 'green' : 'blue'}>{s.status}</Tag>
                      {s.recommendedKw ? <span>{s.recommendedKw} kW recommended</span> : null}
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      </Col>

      <Col xs={24} lg={8}>
        <Card title={translate('Notes')}>
          <Input.TextArea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What happened on this call?"
          />
          <Button type="primary" block style={{ marginTop: 8 }} onClick={addNote}>
            {translate('Add Note')}
          </Button>

          <Timeline
            style={{ marginTop: 20 }}
            items={(lead.notes || [])
              .slice()
              .reverse()
              .map((n) => ({
                children: (
                  <>
                    <Typography.Text>{n.text}</Typography.Text>
                    <br />
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(n.created).format('DD MMM YYYY, hh:mm A')}
                    </Typography.Text>
                  </>
                ),
              }))}
          />
          {!lead.notes?.length && <Typography.Text type="secondary">No notes yet.</Typography.Text>}
        </Card>
      </Col>
    </Row>
  );
}
