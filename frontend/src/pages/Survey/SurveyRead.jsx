import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Alert, Button, Card, Col, Descriptions, Form, Input, InputNumber, Row, Select, Space, Typography, message,
} from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import { request } from '@/request';
import useLanguage from '@/locale/useLanguage';

/**
 * The technician's field form.
 *
 * `recommendedKw` is deliberately read-only: the server derives it from monthly
 * consumption capped by roof area, so the number on the survey and the number on
 * the quote can never disagree.
 */
export default function SurveyRead() {
  const translate = useLanguage();
  const { id } = useParams();
  const [survey, setSurvey] = useState(null);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await request.read({ entity: 'survey', id });
    if (res?.success) {
      setSurvey(res.result);
      form.setFieldsValue(res.result);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const onSave = async (values) => {
    setSaving(true);
    const res = await request.update({ entity: 'survey', id, jsonData: values });
    setSaving(false);
    if (res?.success) {
      setSurvey(res.result);
      form.setFieldsValue(res.result);
      message.success('Survey saved');
    }
  };

  const captureLocation = () => {
    if (!navigator.geolocation) return message.warning('Geolocation not available on this device');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        form.setFieldsValue({
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
        });
        message.success('Location captured');
      },
      () => message.error('Could not get location — check browser permission')
    );
  };

  if (!survey) return <Card loading />;
  const lead = survey.lead || {};

  return (
    <>
      <Card title={translate('1. Customer Details')}>
        <Descriptions column={{ xs: 1, md: 2 }} size="small">
          <Descriptions.Item label={translate('Name')}>{lead.name || '—'}</Descriptions.Item>
          <Descriptions.Item label={translate('Mobile')}>{lead.mobile || '—'}</Descriptions.Item>
          <Descriptions.Item label={translate('Address')}>{lead.address || '—'}</Descriptions.Item>
          <Descriptions.Item label={translate('Monthly Bill')}>
            ₹{Number(lead.monthlyBill || 0).toLocaleString('en-IN')}
          </Descriptions.Item>
          <Descriptions.Item label={translate('Survey Date')}>
            {dayjs(survey.surveyDate).format('DD MMM YYYY, hh:mm A')}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title={translate('2. Technical Specs')} style={{ marginTop: 16 }}>
        <Form form={form} layout="vertical" onFinish={onSave}>
          <Row gutter={12}>
            <Col xs={24} md={8}>
              <Form.Item label={translate('Roof Area (SqFt)')} name="roofArea">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label={translate('Shading')} name="shading">
                <Select options={['None', 'Partial', 'Heavy'].map((v) => ({ value: v, label: v }))} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label={translate('Connection Type')} name="connectionType">
                <Select options={['Single-phase', 'Three-phase'].map((v) => ({ value: v, label: v }))} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label={translate('Sanctioned Load (kW)')} name="sanctionedLoad">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label={translate('Monthly Units (kWh)')} name="monthlyUnits">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label={translate('Recommended kW (auto)')}>
                <InputNumber value={survey.recommendedKw} disabled style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Card size="small" title={translate('Location Details')} style={{ marginBottom: 16 }}
            extra={<Button size="small" icon={<EnvironmentOutlined />} onClick={captureLocation}>{translate('Get Location')}</Button>}>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item label={translate('Latitude')} name="latitude"><InputNumber style={{ width: '100%' }} /></Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label={translate('Longitude')} name="longitude"><InputNumber style={{ width: '100%' }} /></Form.Item>
              </Col>
            </Row>
          </Card>

          <Form.Item label={translate('Status')} name="status">
            <Select options={['Scheduled', 'Completed', 'Cancelled'].map((v) => ({ value: v, label: v }))} />
          </Form.Item>
          <Form.Item label={translate('Notes')} name="notes">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={saving}>
            {translate('Save Technical Specs')}
          </Button>
        </Form>
      </Card>

      <Card title={translate('3. Photo Gallery')} style={{ marginTop: 16 }}>
        {survey.photos?.length ? (
          <Space wrap>
            {survey.photos.map((url) => (
              <img key={url} src={url} alt="site" style={{ width: 180, borderRadius: 6 }} />
            ))}
          </Space>
        ) : (
          <Alert
            type="info"
            showIcon
            message="No photos yet"
            description="Photo upload arrives with the file-storage module; links added to the survey record show up here."
          />
        )}
      </Card>
    </>
  );
}
