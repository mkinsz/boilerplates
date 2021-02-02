import React from "react";
import { connect, useDispatch } from 'react-redux'
import { Table, Button, Modal, Form, Input, Space, InputNumber } from 'antd';
import { CONFIG } from "../../../actions";

const CaseForm = props => {
  const [form] = Form.useForm()
  const { visible, onCancel, onConfirm } = props

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const row = await form.validateFields();
      row.port = parseInt(row.port)
      CONFIG.setRdBox({ box: row, op: 'add' })
      onConfirm();
      form.resetFields();
    } catch (err) {
      console.log('Validate Failed:', err);
    }
  };

  const formLayout = {
    labelCol: { span: 5 },
    wrapperCol: { span: 16 },
  };

  return (
    <Modal visible={visible} title="新建"
      okText="确认" cancelText="取消" onCancel={onCancel} onOk={handleSubmit}>
      <Form form={form} {...formLayout}>
        <Form.Item name='ip' label="IP" rules={[{ required: true, message: '请输入IP' },
        { pattern: /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/, message: 'Ip地址格式有误!' }]}>
          <Input maxLength={20} /></Form.Item>
        <Form.Item name='port' label="端口" rules={[{ required: true, message: '请输入端口号' }]}><InputNumber style={{width: '100%'}}/></Form.Item>
      </Form>
    </Modal>
  );
};

const CaseIdle = props => {
  const [visible, setVisible] = React.useState(false)

  const dispatch = useDispatch();

  React.useEffect(() => {
    dispatch({type: '/msp/v2/devex/box/redundancy/query'})
  }, [])

  const handleCancel = () => {
    setVisible(false)
  }

  const handleConfirm = () => {
    setVisible(false)
  }

  const handleDel = record => {
    dispatch({ type: '/msp/v2/devex/port/redundancy/delete', payload: { id: record.id } })
  }

  const handleMain = record => {
    !record.main && CONFIG.setRdBox({ box: { ...record, main: true }, op: 'mod' })
  }

  const columns = [
    { title: "主控IP", dataIndex: "ip", key: "ip", width: 120 },
    {
      title: "在线状态", dataIndex: "state", key: "state", width: 120,
      render: text => text ? text : '未知状态'
    },
    {
      title: "默认", dataIndex: "main", key: "main", width: 120,
      render: (text, record) => <Button style={{ width: 'inherit' }} onClick={() => handleMain(record)}>{text ? '主' : '副'}</Button>
    },
    {
      title: '编辑', key: 'action', width: 100,
      render: (text, record) => <Button onClick={() => handleDel(record)}>删除</Button>
    },
  ];

  const boxes = props.ext.boxes ? props.ext.boxes.map((m, i) => ({ key: i, ...m })) : []

  return <>
    <Space style={{ marginBottom: 16 }}>
      <Button type='primary' onClick={() => setVisible(true)}>新建</Button>
      <Button type="primary" onClick={() => CONFIG.setRdBox({})}>保存</Button>
    </Space>
    <Table
      columns={columns}
      bordered
      dataSource={boxes}
      size='small'
      pagination={{size: 'default', showSizeChanger:false}}
    />
    <CaseForm visible={visible} onCancel={handleCancel} onConfirm={handleConfirm} />
  </>
}

const mapStateToProps = state => {
  return { ext: state.mspsCfg.ext };
};

export default connect(mapStateToProps)(CaseIdle)