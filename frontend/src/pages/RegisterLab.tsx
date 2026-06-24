import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Form, Input, Button, Typography, Steps, Space, Result, message,
} from 'antd';
import {
  ExperimentOutlined, BankOutlined, UserOutlined, LockOutlined,
  MailOutlined, NumberOutlined, HomeOutlined, ArrowLeftOutlined,
} from '@ant-design/icons';
import { registerLab } from '../api';

const { Title, Text, Paragraph } = Typography;

export default function RegisterLab() {
  const nav = useNavigate();
  const [form] = Form.useForm();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const next = async () => {
    try {
      await form.validateFields(['labName', 'contactEmail']);
      setStep(1);
    } catch {
      /* validation errors shown inline */
    }
  };

  const submit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await registerLab(values);
      setDone(true);
    } catch (e: any) {
      if (e?.response) {
        message.error(e?.response?.data?.message ?? 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const wrapper = (children: React.ReactNode) => (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f3460 0%, #16213e 40%, #1a1a2e 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 540 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg, #1677ff, #0958d9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px', boxShadow: '0 8px 32px rgba(22,119,255,0.4)',
          }}>
            <ExperimentOutlined style={{ fontSize: 28, color: '#fff' }} />
          </div>
          <Title level={3} style={{ color: '#fff', margin: 0 }}>Register Your Lab</Title>
          <Text style={{ color: '#8c9db5', fontSize: 13 }}>Join the CLMS calibration platform</Text>
        </div>
        {children}
      </div>
    </div>
  );

  if (done) {
    return wrapper(
      <Card style={{ borderRadius: 16 }}>
        <Result
          status="success"
          title="Registration Submitted!"
          subTitle="Your lab registration is pending approval by the platform administrator. You will be able to sign in once your lab is approved."
          extra={[
            <Button type="primary" key="login" onClick={() => nav('/login')}>Go to Sign In</Button>,
          ]}
        />
      </Card>,
    );
  }

  return wrapper(
    <Card style={{ borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }} styles={{ body: { padding: 32 } }}>
      <Steps
        current={step}
        size="small"
        style={{ marginBottom: 28 }}
        items={[{ title: 'Lab Details' }, { title: 'Admin Account' }]}
      />

      <Form form={form} layout="vertical" size="large">
        <div style={{ display: step === 0 ? 'block' : 'none' }}>
          <Form.Item name="labName" label="Laboratory Name" rules={[{ required: true, message: 'Lab name is required' }]}>
            <Input prefix={<BankOutlined />} placeholder="Acme Calibration Services" />
          </Form.Item>
          <Form.Item name="accreditationNumber" label="NABL Accreditation Number (optional)">
            <Input prefix={<NumberOutlined />} placeholder="CC-XXXX" />
          </Form.Item>
          <Form.Item name="address" label="Address (optional)">
            <Input prefix={<HomeOutlined />} placeholder="City, State, Country" />
          </Form.Item>
          <Form.Item name="contactEmail" label="Lab Contact Email" rules={[{ required: true, type: 'email' }]}>
            <Input prefix={<MailOutlined />} placeholder="info@acmecalib.com" />
          </Form.Item>
        </div>

        <div style={{ display: step === 1 ? 'block' : 'none' }}>
          <Paragraph type="secondary" style={{ fontSize: 13 }}>
            This account will be the Lab Administrator with full control over users and permissions.
          </Paragraph>
          <Form.Item name="adminFullName" label="Admin Full Name" rules={[{ required: true }]}>
            <Input prefix={<UserOutlined />} placeholder="Jane Doe" />
          </Form.Item>
          <Form.Item name="adminEmail" label="Admin Email" rules={[{ required: true, type: 'email' }]}>
            <Input prefix={<MailOutlined />} placeholder="admin@acmecalib.com" />
          </Form.Item>
          <Form.Item name="adminPassword" label="Password" rules={[{ required: true, min: 8, message: 'Minimum 8 characters' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Minimum 8 characters" />
          </Form.Item>
        </div>

        <Space style={{ width: '100%', justifyContent: 'space-between', marginTop: 8 }}>
          {step === 0 ? (
            <Button icon={<ArrowLeftOutlined />} onClick={() => nav('/login')}>Back to Sign In</Button>
          ) : (
            <Button onClick={() => setStep(0)}>Previous</Button>
          )}
          {step === 0 ? (
            <Button type="primary" onClick={next}>Continue</Button>
          ) : (
            <Button type="primary" loading={loading} onClick={submit}>Submit Registration</Button>
          )}
        </Space>
      </Form>
    </Card>,
  );
}
