import React, { useState, useEffect, useMemo } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tooltip } from 'antd';
import { useDispatch, useSelector } from 'react-redux'

const DecoderModal = props => {
  const [form] = Form.useForm()
  const { visible, record, onCancel, onConfirm } = props

  const dispatch = useDispatch();

  useEffect(() => {
    if (!record) return;

    form.setFieldsValue({
      name: record.name,
      audio: record.audio,
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

  const handleConfirm = async () => {
    try {
      const values = await form.validateFields();
      dispatch({ type: '/msp/v2/chn/rename/config', payload: { name: values.name, chntype: record.chntype, id: record.id } });
      dispatch({ type: '/msp/v2/chn/cfg/audio/config', payload: { type: values.audio, id: record.id } });
      onConfirm()
    } catch (error) {
      console.log('Failed:', error);
    }
  }

  return (
    <Modal visible={visible} title={"配置"}
      okText="确认" cancelText="取消" onCancel={onCancel} onOk={handleConfirm}>
      <Form {...formItemLayout} form={form}>
        <Form.Item label="通道名称" name="name" rules={[{ required: true, message: '请输入通道名称' }]}>
          <Input maxLength={20} />
        </Form.Item>
        <Form.Item label="音频类型" name="audio" rules={[{ required: true }]}>
          <Select style={{ width: 120 }}>
            <Select.Option value={0}>HDMI</Select.Option>
            <Select.Option value={1}>I2S</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label="单板槽位号" name="slotbd" rules={[{ required: true, message: '请输入单板槽位号' }]}>
          <Input maxLength={20} disabled />
        </Form.Item>
        <Form.Item label="端口编号" name="slotport" rules={[{ required: true, message: props.record.port }]}>
          <Input maxLength={20} disabled />
        </Form.Item>
      </Form>
    </Modal>
  );
};


const TableAins = props => {
  const [cfgData, setCfgData] = useState({})
  const [visible, setVisible] = useState(false)

  const dispatch = useDispatch();

  useEffect(() => {
    for (const key in props.data) {
      dispatch({ type: '/msp/v2/chn/cfg/audio/query', payload: { id: props.data[key].id } });
    }
  }, [])

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
    { title: '音频类型', dataIndex: 'model' },
    { title: '机箱号', dataIndex: 'boxno' },
    { title: '单板槽位号', dataIndex: 'slot' },
    { title: '端口编号', dataIndex: 'port' },
    { title: '逻辑地址', dataIndex: 'hid' },
    {
      title: '详细配置', dataIndex: 'detail', width: 120,
      render: (text, record, index) => <Button size="small" onClick={() => handleCfg(record)}>配置</Button>
    }];

  const chnls = useMemo(() => Object.values(props.data).map((m, i) =>
  ({
    key: i + 1, model: m.audio == 0 ? 'HDMI' : 'I2S',
    boxno: m.base.id >> 24, slot: m.base.id << 8 >> 24,
    port: m.base.id << 16 >> 24, ...m, ...m.base
  })), [props.data])

  return (
    <div>
      <Table columns={columns} dataSource={chnls} bordered={true} size="small" scroll={{y:'67vh'}} pagination={{size: 'default', showSizeChanger:false}} />
      {visible && <DecoderModal visible={visible} record={cfgData} onCancel={handleCancel} onConfirm={handleConfirm} />}
    </div>
  )
}

export default TableAins;