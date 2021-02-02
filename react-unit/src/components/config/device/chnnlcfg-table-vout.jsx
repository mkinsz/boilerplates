import React, { useState, useEffect, useMemo } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tooltip, Checkbox } from 'antd';
import { useDispatch, useSelector } from 'react-redux'

const VoutModal = props => {
  const [form] = Form.useForm()

  const { visible, modify, record, onCancel, onConfirm } = props
  // const [mode, setMode] = useState(0)

  const dispatch = useDispatch();

  const chnnets = useSelector(({ mspsCfg }) => mspsCfg.eqp.chnnets)

  useEffect(() => {
    const net = chnnets[record.id]
    net && form.setFieldsValue({ netenable: net.enable })
  }, [chnnets, record])

  useEffect(() => {
    form.setFieldsValue({
      name: record.name,
      slotbd: record.slot,
      slotport: record.port,
    });
  }, [record])

  const formItemLayout = {
    labelCol: {
      span: 5
    },
    wrapperCol: {
      span: 18
    },
  };

  const handleConfirm = async () => {
    const { id, chntype } = record;
    try {
      const values = await form.validateFields();
      dispatch({ type: '/msp/v2/chn/rename/config', payload: { id, chntype, name: values.name } });
      dispatch({ type: '/msp/v2/chn/cfg/net/config', payload: { list: [{ id, enable: values.netenable }] } })
      values.sync && dispatch({ type: '/msp/v2/chn/cfg/net/sync/config', payload: { id, enable: values.netenable } })
      // dispatch({ type: '/msp/v2/chn/cfg/vedio/audio/config', payload: { id, module: values.mode, hdmi: values.hdmi, line: values.line } });
      onConfirm();
    } catch (error) {
      console.log('Failed:', error);
    }
  }

  return (
    <Modal visible={visible} title={"配置"}
      okText="确认" cancelText="取消" onCancel={onCancel} onOk={handleConfirm}>
      <Form form={form} {...formItemLayout} size='middle'>
        <Form.Item label="通道名称" name="name" rules={[{ required: true, message: '请输入通道名称' },
        {
          validator: (_, value) => {
            const reg = /^[-_a-zA-Z0-9\u4e00-\u9fa5]+$/
            if (!!value && !reg.test(value)) return Promise.reject('请输入正确格式的名称')
            let len = 0;
            Array.from(value).map(m => /[\u4e00-\u9fa5]/.test(m) ? len += 3 : len++)
            return len < 64 ? Promise.resolve() : Promise.reject('请输入正确长度的名称')
          },
        }]}><Input />
        </Form.Item>
        <Form.Item label="网络使能" name="netenable" rules={[{ required: true, message: '请选择网络使能' }]}>
          <Select>
            <Select.Option value={true}>开</Select.Option>
            <Select.Option value={false}>关</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label="单板槽位号" name="slotbd">
          <Input disabled maxLength={20} />
        </Form.Item>
        <Form.Item label="端口编号" name="slotport">
          <Input disabled maxLength={20} />
        </Form.Item>
        <Form.Item label="板卡同步" name='sync' valuePropName='checked'>
          <Checkbox>板卡同步</Checkbox>
        </Form.Item>
        {/* <Form.Item label="模式" name="mode">
          <Radio.Group onChange={handleModeChange}>
            <Radio value={0}>无</Radio>
            <Radio value={1}>手动</Radio>
            <Radio value={2}>自动</Radio>
          </Radio.Group>
        </Form.Item> */}
        {/* <Form.Item label="HDMI" name="hdmi" rules={[{ required: true, message: props.record.type }]}>
          <Select style={{ width: 350 }} disabled={mode == 0}>
            {
              props.ainschnls.map(m => <Select.Option key={m.id} value={m.id}>{m.name}</Select.Option>)
            }
          </Select>
        </Form.Item>
        <Form.Item label="LINE" name="line" rules={[{ required: true, message: props.record.type }]}>
          <Select style={{ width: 350 }} disabled={mode == 0}>
            {
              props.ainschnls.map(m => <Select.Option key={m.id} value={m.id}>{m.name}</Select.Option>)
            }
          </Select>
        </Form.Item> */}
      </Form>
    </Modal>
  );
};

const ChnCfgVouts = props => {
  const [visible, setVisible] = useState(false)
  const [cfgData, setCfgData] = useState({})

  const dispatch = useDispatch()

  const ains = useSelector(({ mspsDev }) => mspsDev.ains)
  const exts = useSelector(({ mspsDev }) => mspsDev.vouts)

  const handleCfg = (record) => {
    dispatch({ type: '/msp/v2/chn/cfg/net/query', payload: { id: record.id } });
    // dispatch({ type: '/msp/v2/chn/cfg/vedio/audio/query', payload: { id: record.id } });

    setCfgData(record)
    setVisible(true)
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
    { title: '音视频同步切换', dataIndex: 'avsync', width: 120, render: t => t ? '是' : '否' },
    { title: '机箱号', dataIndex: 'boxno', },
    { title: '单板槽位号', dataIndex: 'slot', },
    { title: '端口编号', dataIndex: 'port', },
    { title: '逻辑地址', dataIndex: 'hid', },
    {
      title: '详细配置', dataIndex: 'detail', width: 120, render: (text, record, index) =>
        <Button size="small" onClick={() => handleCfg(record)}>配置</Button>
    },
  ];

  const ain_chnls = useMemo(() => {
    const ain_devs = ains ? Object.values(ains).filter(m => { return true }) : []
    return ain_devs.map((m, i) => ({ key: i + 1, ...m.base }))
  }, [ains])

  const chnls = useMemo(() => {
    const devs = Object.values(exts) || []
    return devs.map((m, i) => ({
      key: i + 1,
      audiochnnl: ains[m.aid] ? ains[m.aid].base.name : {},
      boxno: m.base.id >> 24, slot: m.base.id << 8 >> 24,
      port: m.base.id << 16 >> 24, ...m, ...m.base
    }))
  }, [exts])

  return <div>
    <Table columns={columns} dataSource={chnls} bordered={true} size="small" scroll={{ y: '67vh' }} pagination={{size: 'default', showSizeChanger:false}} />
    {visible && <VoutModal ainchnls={ain_chnls} visible={visible} record={cfgData} onCancel={handleCancel} onConfirm={handleConfirm} />}
  </div>
}

export default ChnCfgVouts