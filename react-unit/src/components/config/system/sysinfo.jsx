import React, { useState, useEffect } from 'react'
import { Input, InputNumber, Button, Form, Row, Col } from "antd";
import { useSelector, useDispatch } from 'react-redux'
import { Prompt } from 'react-router-dom';
import './index.less'

const layout = {
  labelCol: {
    span: 4,
  },
  wrapperCol: {
    span: 12,
  },
};

const gutter = [10, 6]

const SystemInfo = () => {
  const [prompt, setPrompt] = useState(false)

  const [form] = Form.useForm();
  const dispatch = useDispatch()

  const mpu = useSelector(({ mspsCfg }) => mspsCfg.system.mpu)

  useEffect(() => {
    dispatch({ type: '/msp/v2/sys/query' })
  }, [])

  useEffect(() => {
    form.setFieldsValue({ box: mpu.box, name: mpu.name })
  }, [mpu])

  const handleClick = async () => {
    try {
      const row = await form.validateFields()
      dispatch({ type: '/msp/v2/sys/config', payload: { ...mpu, ...row } })
      setPrompt(false);
    } catch (error) {
      console.log(error)
    }
  }

  return <>
    <Prompt message={location => "修改未保存, 是否确认离开?"} when={prompt} />
    <Row gutter={gutter}>
      <Col span={4}>槽位号</Col>
      <Col span={12}>{mpu.slot}</Col>
    </Row>
    <Row gutter={gutter}>
      <Col span={4}>MAC地址</Col>
      <Col span={12}>{mpu.mac}</Col>
    </Row>
    <Row gutter={gutter}>
      <Col span={4}>软件版本</Col>
      <Col span={12}>{mpu.softver}</Col>
    </Row>
    <Row gutter={gutter}>
      <Col span={4}>硬件版本</Col>
      <Col span={12}>{mpu.hwver}</Col>
    </Row>
    <Row gutter={gutter}>
      <Col span={4}>序列号</Col>
      <Col span={12}>{mpu.sn}</Col>
    </Row>
    <Row gutter={gutter}>
      <Col span={4}>类型</Col>
      <Col span={12}>{mpu.model}</Col>
    </Row>
    <Form className='sysinfo' form={form} {...layout} onValuesChange={() => setPrompt(true)} labelAlign='left' size='middle'>
      <Form.Item name="box" label="机箱号" rules={[{ required: true, message: '请选择机箱号' }]}>
        <InputNumber min={1} max={7} ></InputNumber>
      </Form.Item>
      <Form.Item name="name" label="别名" rules={[
        { required: true, message: '请输入名称' },
        {
          validator: (_, value) => {
            const reg = /^[-_a-zA-Z0-9\u4e00-\u9fa5]+$/
            if (!!value && !reg.test(value)) return Promise.reject('请输入正确格式的名称')
            let len = 0;
            Array.from(value).map(m => /[\u4e00-\u9fa5]/.test(m) ? len += 3 : len++)
            return len < 64 ? Promise.resolve() : Promise.reject('请输入正确长度的名称')
          },
        }]}><Input style={{ width: 300 }} /></Form.Item>
    </Form>
    <Form.Item noStyle>
      <Button onClick={handleClick} style={{ marginRight: 20 }}>保存</Button>
    </Form.Item>
  </>
}

export default SystemInfo
