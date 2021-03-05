import React, { useState, useEffect, useLayoutEffect } from 'react';
import { Form, Input, Button, Checkbox, Space, Divider, Tooltip } from 'antd';
import { LockOutlined, UserOutlined, DownloadOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux'
import { useHistory, useLocation } from 'react-router-dom';
import { createUseStyles } from 'react-jss';
import { AUTH } from '../actions'
import * as session from '../utils'
import * as ws from '../services'

const useStyles = createUseStyles({
  loginLogo: {},
  loginTitle: {
    height: 60,
    fontSize: '24px',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  copyRight: {
    textAlign: 'center',
    marginTop: 20,
    color: '#999',
    '& a': {
      color: '#999',
      textDecoration: 'underline',
      '&:hover': {
        color: '#1890ff'
      }
    }
  }
})

const LoginForm = props => {
  const [form] = Form.useForm()
  const history = useHistory()
  const location = useLocation()

  const auth = useSelector(({ mspsAuth }) => mspsAuth.token)

  useEffect(() => {
    const rem = session.getRem()
    if (rem.length && JSON.parse(rem)) {
      const name = session.getUser();
      const pass = session.getPass();
      form.setFieldsValue({
        'username': name,
        'password': pass,
        'remember': true
      })
    }
  }, [])

  useEffect(() => {
    if (!window.unlogin) {
      const release = async () => await ws.release();
      if (location.pathname == '/login') release();
    }
  }, [location])

  useEffect(() => {
    if (!session.isAuth()) return;
    const path = (location.state && location.state.from.pathname) || '/';
    history.push({ pathname: path });
  }, [auth])

  const handleFinish = async values => {
    form.validateFields();
    session.setToken(); // clear auth

    await ws.init();
    console.log('login...')
    AUTH.login(values.username, values.password)
    session.setRem(values.remember)
    session.setUser(values.username)
    session.setPass(values.password)
  };

  return (
    <Form form={form}
      initialValues={{ remember: false }}
      onFinish={handleFinish}
      style={{ padding: '30px 30px 0px 30px' }}
    >
      <Form.Item name="username" rules={[
        { required: true, message: '请输入用户名' },
        { pattern: /^[a-zA-Z]([-_a-zA-Z0-9]{1,19})+$/, message: '用户名格式不符合要求' }]}>
        <Input prefix={<UserOutlined />} autoComplete='off' placeholder="用户名" />
      </Form.Item>
      <Form.Item name='password' rules={[
        { required: true, message: '请输入密码' },
        { pattern: /^[a-zA-Z]([-_a-zA-Z0-9]{7,15})+$/, message: '密码格式不符合要求' }]} >
        <Input prefix={<LockOutlined />} type="password"
          autoComplete="off" placeholder="密码"
          onCut={e => e.preventDefault()}
          onCopy={e => e.preventDefault()}
          onPaste={e => e.preventDefault()} />
      </Form.Item>
      <Form.Item>
        <Form.Item name='remember' valuePropName='checked' noStyle>
          <Checkbox>记住我</Checkbox>
        </Form.Item>
        <a href='/client/Msp1000Setup.exe' style={{ float: 'right' }}>下载客户端</a>
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" style={{ width: '100%' }}>登录</Button>
      </Form.Item>
    </Form>
  );
}

const Login = () => {
  const classes = useStyles();

  const handleDownload = () => {
    fetch('/client/Msp1000Setup.exe').then(res => {
      if (res.ok) return res;
      else throw new Error("下载请求失败...");
    }).then(res => {
      if (!res) return
      res.blob().then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'Msp1000Setup.exe';
        a.click();
        URL.revokeObjectURL(a.herf);
        a.remove();
      }).then(() => {
        console.log('download succesfully...')
      })
    }).catch(err => console.log(err))
  }

  return (
    <div className='login-root'>
      <div className='login-title'>
        <div className='login-logo' />
      </div>
      <div className='login-content'>
        <div className='login-sider' />
        <Space className='login-main' direction='vertical' >
          <div className='login-form'>
            <div className={classes.loginTitle}>
              登录
            </div>
            <Divider />
            <LoginForm />
          </div>
          <div className={classes.copyRight}>
            Copyright &copy;{' '}
            <Space>
              <a href="https://www.kedacom.com" target="_blank"> kedacom.com </a> , 2020
              {/* <Tooltip title='下载客户端'>
                <DownloadOutlined style={{ color: 'white' }} onClick={handleDownload} />
              </Tooltip> */}
            </Space>
          </div>
        </Space>
      </div>
    </div>
  );
};

export default Login