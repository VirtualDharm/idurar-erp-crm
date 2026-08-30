import { useEffect, useState } from 'react';
import {
  Button, Card, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag, Typography, message,
} from 'antd';
import { PlusOutlined, UserOutlined } from '@ant-design/icons';

import { request } from '@/request';
import useLanguage from '@/locale/useLanguage';
import { selectAuth } from '@/redux/auth/selectors';
import { useSelector } from 'react-redux';

/**
 * Team management — create logins and control what each person may do.
 *
 * The backend (`/api/team/*`) is guarded by hasRole('owner','admin'), so this
 * page is only reachable for those two roles; anyone else gets a plain notice
 * instead of a table that would 403 on every request.
 */

// Colour + description per role, so the table reads as a permission map rather
// than an opaque list of strings.
const ROLE_META = {
  owner: { color: 'gold', hint: 'Full access. Cannot be removed or disabled.' },
  admin: { color: 'geekblue', hint: 'Everything except deleting the owner.' },
  sales: { color: 'green', hint: 'Leads, quotations, customers.' },
  technician: { color: 'purple', hint: 'Surveys, installation milestones.' },
  accounts: { color: 'volcano', hint: 'Invoices, payments, collections.' },
};

export default function Team() {
  const translate = useLanguage();
  const { current: currentUser } = useSelector(selectAuth);

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState(Object.keys(ROLE_META));
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const canManage = ['owner', 'admin'].includes(currentUser?.role);

  const load = async () => {
    setLoading(true);
    const [listRes, rolesRes] = await Promise.all([
      request.get({ entity: 'team/list' }),
      request.get({ entity: 'team/roles' }),
    ]);
    if (listRes?.success) setUsers(listRes.result);
    if (rolesRes?.success) setRoles(rolesRes.result);
    setLoading(false);
  };

  useEffect(() => {
    if (canManage) load();
  }, [canManage]);

  const onCreate = async (values) => {
    setSaving(true);
    const res = await request.post({ entity: 'team/create', jsonData: values });
    setSaving(false);
    if (res?.success) {
      message.success(`${values.name} can now sign in`);
      form.resetFields();
      setOpen(false);
      load();
    }
  };

  const onRoleChange = async (id, role) => {
    const res = await request.patch({ entity: `team/role/${id}`, jsonData: { role } });
    if (res?.success) load();
  };

  const onToggleEnabled = async (record) => {
    const res = await request.patch({
      entity: `team/enabled/${record._id}`,
      jsonData: { enabled: !record.enabled },
    });
    if (res?.success) load();
  };

  const onRemove = async (id) => {
    // request.delete() appends `/delete/<id>` itself — pass the bare entity.
    const res = await request.delete({ entity: 'team', id });
    if (res?.success) load();
  };

  if (!canManage) {
    return (
      <Card>
        <Typography.Title level={4}>{translate('Team Management')}</Typography.Title>
        <Typography.Paragraph type="secondary">
          Only owners and admins can manage team members.
        </Typography.Paragraph>
      </Card>
    );
  }

  const columns = [
    {
      title: translate('Name'),
      dataIndex: 'name',
      render: (_, r) => (
        <Space>
          <UserOutlined />
          <span>{[r.name, r.surname].filter(Boolean).join(' ')}</span>
        </Space>
      ),
    },
    { title: translate('Email'), dataIndex: 'email' },
    {
      title: translate('Role'),
      dataIndex: 'role',
      render: (role, r) => (
        <Select
          value={role}
          style={{ width: 150 }}
          // The only owner cannot be demoted — the API refuses it too.
          disabled={r.role === 'owner' && users.filter((u) => u.role === 'owner').length <= 1}
          onChange={(value) => onRoleChange(r._id, value)}
          options={roles.map((value) => ({
            value,
            label: (
              <Tag color={ROLE_META[value]?.color} style={{ marginInlineEnd: 0 }}>
                {value}
              </Tag>
            ),
          }))}
        />
      ),
    },
    {
      title: translate('Status'),
      dataIndex: 'enabled',
      render: (enabled) => (
        <Tag color={enabled ? 'green' : 'red'}>{enabled ? 'Active' : 'Disabled'}</Tag>
      ),
    },
    {
      title: translate('Actions'),
      render: (_, r) => {
        const isSelf = r._id === currentUser?._id;
        return (
          <Space>
            <Button size="small" disabled={isSelf || r.role === 'owner'} onClick={() => onToggleEnabled(r)}>
              {r.enabled ? translate('Disable') : translate('Enable')}
            </Button>
            <Popconfirm
              title={`Remove ${r.name}?`}
              description="They lose access immediately. Their past records stay."
              onConfirm={() => onRemove(r._id)}
              okText={translate('Remove')}
              cancelText={translate('Cancel')}
            >
              <Button size="small" danger disabled={isSelf || r.role === 'owner'}>
                {translate('Remove')}
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <>
      <Card
        title={translate('Team Management')}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
            {translate('Add Team Member')}
          </Button>
        }
      >
        <Table
          rowKey="_id"
          loading={loading}
          dataSource={users}
          columns={columns}
          pagination={false}
        />
        <Typography.Paragraph type="secondary" style={{ marginTop: 16, marginBottom: 0 }}>
          {roles.map((r) => (
            <div key={r}>
              <Tag color={ROLE_META[r]?.color}>{r}</Tag> {ROLE_META[r]?.hint}
            </div>
          ))}
        </Typography.Paragraph>
      </Card>

      <Modal
        title={translate('Add Team Member')}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saving}
        okText={translate('Create')}
      >
        <Form form={form} layout="vertical" onFinish={onCreate} initialValues={{ role: 'sales' }}>
          <Form.Item label={translate('First name')} name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label={translate('Last name')} name="surname">
            <Input />
          </Form.Item>
          <Form.Item
            label={translate('Email')}
            name="email"
            rules={[{ required: true, type: 'email' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label={translate('Password')}
            name="password"
            rules={[{ required: true, min: 8, message: 'At least 8 characters' }]}
            extra="Share this with them; they can change it from their profile."
          >
            <Input.Password />
          </Form.Item>
          <Form.Item label={translate('Role')} name="role" rules={[{ required: true }]}>
            <Select
              options={roles.map((value) => ({ value, label: `${value} — ${ROLE_META[value]?.hint || ''}` }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
