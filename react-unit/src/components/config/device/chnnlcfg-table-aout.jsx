import React, { useState, useEffect, useMemo } from 'react';
import { Table, Button, Modal, Form, Input, Tooltip } from 'antd';
import { useSelector, useDispatch } from 'react-redux'

const AoutModal = props => {
  const [form] = Form.useForm()
  const { visible, modify, record, onCancel, onConfirm } = props

  const dispatch = useDispatch()

  useEffect(() => {
    form.setFieldsValue({
      name: record.name,
      slotbd: record.slot,
      slotport: record.port,
    });
  }, [record])

  const formItemLayout = {
    labelCol: {
      xs: { span: 24 },
      sm: { span: 4 },
    },
    wrapperCol: {
      xs: { span: 24 },
      sm: { span: 18 },
    },
  };

  const handleOK = async () => {
    try {
      const values = await form.validateFields();
      dispatch({ type: '/msp/v2/chn/rename/config', payload: { name: values.name, chntype: record.chntype, id: record.id } });
      onConfirm();
    } catch (error) {
      console.log('Failed:', error);
    }
  }

  return (
    <Modal visible={visible} title={"配置"}
      okText="确认" cancelText="取消" onCancel={onCancel} onOk={handleOK} >
      <Form {...formItemLayout} form={form}>
        <Form.Item label="通道名称" name="name" rules={[{ required: true, message: '请输入通道名称' }]}>
          <Input maxLength={20} />
        </Form.Item>
        <Form.Item label="单板槽位号" name="slotbd" rules={[{ required: true, message: '请输入槽位号' }]}>
          <Input disabled maxLength={20} />
        </Form.Item>
        <Form.Item label="端口编号" name="slotport" rules={[{ required: true, message: '请输入端口号' }]}>
          <Input disabled maxLength={20} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

const ChnCfgAouts = props => {
  const [visible, setVisible] = useState(false)
  const [cfgData, setCfgData] = useState({})

  const ext = useSelector(({ mspsDev }) => mspsDev.aouts)

  const handleCfg = (record) => {
    setVisible(true)
    setCfgData(record)
  };

  const handleCancel = () => {
    setVisible(false)
  };

  const handleConfirm = () => {
    setVisible(false)
  };

  const columns = [
    { title: '序号', dataIndex: 'key', width: 50 },
    {
      title: '通道名称', dataIndex: 'name', width: 200, ellipsis: { showTitle: false, },
      render: text => <Tooltip placement="topLeft" title={text}> {text} </Tooltip>,
    },
    { title: '机箱号', dataIndex: 'boxno' },
    { title: '单板槽位号', dataIndex: 'slot' },
    { title: '端口编号', dataIndex: 'port' },
    { title: '逻辑地址', dataIndex: 'hid' },
    {
      title: '详细配置', dataIndex: 'detail', width: 120,
      render: (text, record, index) => <div><Button size="small" onClick={() => handleCfg(record)}>配置</Button></div>
    },
  ];


  const chnls = useMemo(() => {
    const devs = Object.values(ext) || []
    return devs.map((m, i) => ({
      key: i + 1,
      boxno: m.base.id >> 24, slot: m.base.id << 8 >> 24,
      port: m.base.id << 16 >> 24, ...m, ...m.base
    }))
  }, [ext])

  return (
    <div>
      <Table columns={columns} dataSource={chnls} bordered={true} size="small" scroll={{y:'67vh'}} pagination={{size: 'default', showSizeChanger:false}} />
      {visible && <AoutModal visible={visible} record={cfgData} onCancel={handleCancel} onConfirm={handleConfirm} />}
    </div>
  )
}

export default ChnCfgAouts