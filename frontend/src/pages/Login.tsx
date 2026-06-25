import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, Alert, Divider } from 'antd';
import { UserOutlined, LockOutlined, ExperimentOutlined } from '@ant-design/icons';
import { login } from '../api';

const { Title, Text, Paragraph } = Typography;

export default function Login({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form] = Form.useForm();

  const submit = async (values: { email: string; password: string }) => {
    setError('');
    setLoading(true);
    try {
      await login(values.email, values.password);
      onSuccess();
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      setError(msg || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f3460 0%, #16213e 40%, #1a1a2e 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo & Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, #1677ff, #0958d9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 32px rgba(22,119,255,0.4)',
          }}>
            <ExperimentOutlined style={{ fontSize: 32, color: '#fff' }} />
          </div>
          <Title level={2} style={{ color: '#fff', margin: 0, letterSpacing: 1 }}>CLMS</Title>
          <Text style={{ color: '#8c9db5', fontSize: 13 }}>Calibration Laboratory Management System</Text>
        </div>

        <Card
          style={{
            borderRadius: 16,
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            border: 'none',
          }}
          styles={{ body: { padding: '36px 40px' } }}
        >
          <Title level={4} style={{ marginBottom: 4, color: '#1a1a2e' }}>Welcome back</Title>
          <Paragraph style={{ color: '#666', marginBottom: 28, fontSize: 13 }}>
            Sign in to access your calibration laboratory dashboard
          </Paragraph>

          {error && (
            <Alert type="error" message={error} showIcon style={{ marginBottom: 20 }} />
          )}

          <Form form={form} onFinish={submit} layout="vertical" size="large">
            <Form.Item
              name="email"
              label="Email Address"
              rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#bbb' }} />}
                placeholder="admin@clms.lab"
                autoComplete="email"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#bbb' }} />}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{ height: 44, borderRadius: 8, fontWeight: 600, fontSize: 15 }}
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>

          <Divider style={{ margin: '24px 0 16px' }} plain>
            <Text style={{ color: '#999', fontSize: 12 }}>New to CLMS?</Text>
          </Divider>
          <Link to="/register-lab">
            <Button block style={{ height: 42, borderRadius: 8, fontWeight: 500 }}>
              Register Your Calibration Lab
            </Button>
          </Link>

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <Text style={{ color: '#999', fontSize: 12 }}>
              ISO/IEC 17025 · NABL Accredited System
            </Text>
          </div>
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <Link to="/portal" style={{ color: '#52c41a', fontSize: 13 }}>
              Customer Portal →
            </Link>
          </div>
        </Card>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Text style={{ color: '#4a5568', fontSize: 12 }}>
            © 2025 Calibration Laboratory Management System. All rights reserved.
          </Text>
        </div>
      </div>
    </div>
  );
}
