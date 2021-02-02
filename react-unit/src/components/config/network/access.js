import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { Modal, Form, Table, Input, Button, Select, Switch, Space, Divider, Popconfirm, InputNumber } from 'antd';
import { CONFIG } from "../../../actions";

const { Option } = Select;

const formLayout = {
  labelCol: { span: 5 },
  wrapperCol: { span: 18 },
};

const StreamForm = props => {
  const [form] = Form.useForm()
  const { data, onCancel, onConfirm } = props
  const [rtsp, setRtsp] = useState(0)

  const dispatch = useDispatch();

  useEffect(() => {
    data && setRtsp(data.type)
  }, [data])

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const row = await form.validateFields();
      row.type = parseInt(row.type)
      row.port = parseInt(row.port)
      dispatch({ type: '/msp/v2/net/umt/config', payload: { ...data, ...row } })
      onConfirm();
    } catch (err) {
      console.log('Validate Failed:', err);
    }
  };

  return (
    <Modal
      centered
      visible={true}
      title={data ? "修改" : "新建"}
      okText="确认" cancelText="取消"
      onCancel={onCancel}
      onOk={handleSubmit}
    >
      <Form form={form}
        initialValues={{
          ip: data ? data.ip : null,
          port: data ? data.port : null,
          name: data ? data.name : null,
          user: data ? data.user : null,
          pass: data ? data.pass : null,
          type: data ? data.type : 0,
          rtsp: data ? data.rtsp : null,
          ipcmedia: data ? data.ipcmedia : 0,
          mtmedia: data ? data.mtmedia : 0,
          conf: data ? data.conf : 0,
          device: data ? data.device : 0,
        }} {...formLayout}>
        <Form.Item name="type" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
          <Select onChange={v => setRtsp(v)}>
            <Select.Option value={0}>流媒体</Select.Option>
            <Select.Option value={1}>新流媒体</Select.Option>
            <Select.Option value={2}>统一设备</Select.Option>
            <Select.Option value={3}>会议服务</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item name='ip' label="服务地址" rules={[
          { required: true, message: '请输入服务地址' },
          {
            pattern: /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/,
            message: 'IP地址格式不符合要求'
          }]}>
          <Input maxLength={20} /></Form.Item>
        {rtsp == 1 && <Form.Item name='rtsp' label="码流地址" rules={[{ required: true, message: '请输入码流地址' }]}><Input maxLength={20} /></Form.Item>}
        <Form.Item name='port' label="端口" rules={[{ required: true, message: '请输入端口' }]}><InputNumber min={1} max={65535} /></Form.Item>
        <Form.Item name='name' label="名称" rules={[
          { required: true, message: '请输入名称' },
          {
            validator: (_, value) => {
              const reg = /^[-_a-zA-Z0-9\u4e00-\u9fa5]+$/
              if (!!value && !reg.test(value)) return Promise.reject('请输入正确格式的名称')
              let len = 0;
              Array.from(value).map(m => /[\u4e00-\u9fa5]/.test(m) ? len += 3 : len++)
              return len < 64 ? Promise.resolve() : Promise.reject('请输入正确长度的名称')
            },
          }]}><Input /></Form.Item>
        <Form.Item name='user' label="用户名" rules={[
          { pattern: /^[a-zA-Z]([-_a-zA-Z0-9]{1,19})+$/, message: '用户名格式不符合要求' }]}><Input /></Form.Item>
        <Form.Item name='pass' label="密码" rules={[
          { pattern: /^[a-zA-Z]([-_a-zA-Z0-9]{1,19})+$/, message: '密码格式不符合要求' }]}>
          <Input.Password onCut={e => e.preventDefault()}
            onCopy={e => e.preventDefault()}
            onPaste={e => e.preventDefault()} />
        </Form.Item>
        {/* <Form.Item name='user' label="用户名" rules={[{ required: true, message: '请输入用户名' }]}><Input maxLength={20}/></Form.Item>
        <Form.Item name='pass' label="密码" rules={[{ required: true, message: '请输入密码' }]}><Input.Password maxLength={20}/></Form.Item> */}
        {!!rtsp && <Divider />}
        {rtsp == 1 &&
          <>
            <Form.Item name='mtmedia' label='监控MediaID' rules={[{ required: true, message: '请输入监控MediaID' }]}><Input /></Form.Item>
            <Form.Item name='ipcmedia' label='会议MediaID' rules={[{ required: true, message: '请输入会议MediaID' }]}><Input /></Form.Item>
          </>}
        {rtsp == 2 &&
          <>
            <Form.Item name='device' label='设备获取模式' rules={[{ required: true, message: '请选择获设备取模式' }]}>
              <Select>
                <Option value={1}>ES查询</Option>
                <Option value={2}>一机一档查询</Option>
              </Select>
            </Form.Item>
          </>}
        {rtsp == 3 &&
          <>
            <Form.Item name='conf' label='会议对接模式' rules={[{ required: true, message: '请选择会议对接模式' }]}>
              <Select>
                <Option value={1}>查询模式</Option>
                <Option value={2}>订阅模式</Option>
              </Select>
            </Form.Item>
          </>}

      </Form>
    </Modal>
  );
};

const DecForm = props => {
  const [form] = Form.useForm()
  const { onCancel, onConfirm } = props

  const dispatch = useDispatch();

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const row = await form.validateFields();
      const { box, slot, mode } = row;

      dispatch({
        type: '/msp/v2/net/umtdec/add', payload: {
          id: props.id, box: parseInt(box), slot: parseInt(slot), mode
        }
      })

      onConfirm();
    } catch (err) {
      console.log('Validate Failed:', err);
    }
  };

  return (
    <Modal
      visible={true}
      title={"新建"}
      okText="确认" cancelText="取消"
      onCancel={onCancel}
      onOk={handleSubmit}
    >
      <Form form={form} {...formLayout}>
        <Form.Item name='box' label="机箱号" rules={[{ required: true, message: '请输入机箱号' }]}><Input /></Form.Item>
        <Form.Item name='slot' label="槽位号" rules={[{ required: true, message: '请输入槽位号' }]}><Input /></Form.Item>
        <Form.Item name='mode' label="拉取码流方式" rules={[{ required: true, message: '请选择拉取码流方式' }]}>
          <Select>
            <Option value={0}>WebRTC</Option>
            <Option value={1}>SDK</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

const Access = props => {
  const [op, setOp] = React.useState(false)
  const [mod, setMod] = React.useState(false)
  const [visible, setVisible] = React.useState(false)
  const [data, setData] = React.useState([])
  const [umtId, setUmtId] = React.useState()
  const [expandRowKeys, setExpandRowKeys] = React.useState([])
  const [selectedRowKeys, setSelectedRowKeys] = React.useState([])

  const dispatch = useDispatch();

  const umts = useSelector(({ mspsCfg }) => mspsCfg.net.umts)
  const decs = useSelector(({ mspsCfg }) => mspsCfg.net.decs)

  useEffect(() => {
    dispatch({ type: '/msp/v2/net/umt/query' })
  }, [])

  useEffect(() => {
    setData(Object.values(umts).map((m, i) => ({ key: i, ...m })))
  }, [umts])

  const handleChange = (value, record) => {
    const { id, box, slot } = record;
    dispatch({ type: '/msp/v2/net/umtdec/add', payload: { id, box, slot, mode: value } })
  }

  const handleInOutChange = (record, checked) => {
    dispatch({ type: '/msp/v2/net/umtdev/module/config', payload: { ...record, module: checked ? 1 : 0 } })
  }

  const expandedRowRender = (record, index, indent, expanded) => {
    const ecolumns = [
      { title: '编号', dataIndex: 'key', key: 'key', width: '10%' },
      { title: '机箱号', dataIndex: 'box', key: 'box', width: '15%' },
      { title: '槽位号', dataIndex: 'slot', key: 'slot', width: '15%' },
      {
        title: '码流拉取方式', dataIndex: 'mode', key: 'mode', width: '20%',
        render: (text, r) => {
          return <Select value={r.mode} onChange={(value) => handleChange(value, r)} style={{ width: '100%' }} >
            <Option value={0}>WebRTC</Option>
            <Option value={1}>SDK</Option>
          </Select>
        }
        ,
      },
      {
        title: '内外置', dataIndex: 'module', key: 'module', width: '20%',
        render: (text, r) => {
          return <Switch checked={text} checkedChildren='外置' unCheckedChildren='内置' onChange={(c) => handleInOutChange(r, c)} />
        }
        ,
      },
      {
        title: '解码器编辑', key: 'action',
        render: (text, r) => <Button onClick={() => handleDel(r)}>删除</Button>
      },
    ];

    const handleDel = record => {
      dispatch({ type: '/msp/v2/net/umtdec/delete', payload: record })
    }

    return <Table size='middle' title={() => <Button type='primary'
      onClick={() => setUmtId(record.id)} >新建解码器</Button>}
      columns={ecolumns} dataSource={decs.filter(m => m.id == record.id).map((m, i) => ({ ...m, key: i + 1 }))}
      pagination={false} bordered={true} />
  };

  const type2str = [
    "流媒体",
    "新流媒体",
    "统一设备",
    "会议服务"
  ]

  const columns = [
    { title: '编号', dataIndex: 'key', key: 'key' },
    { title: 'UMT编号', dataIndex: 'id', key: 'id' },
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '服务地址', dataIndex: 'ip', key: 'ip' },
    { title: '码流地址', dataIndex: 'rtsp', key: 'rtsp' },
    { title: '端口', dataIndex: 'port', key: 'port' },
    { title: '用户', dataIndex: 'user', key: 'user' },
    { title: '密码', dataIndex: 'pass', key: 'pass', render: text => '***' },
    { title: '类型', dataIndex: 'type', key: 'type', render: text => type2str[text] },
  ];

  const rowSelection = {
    selections: false,
    selectedRowKeys,
    onChange: keys => setSelectedRowKeys(keys),
    hideDefaultSelections: true,
  }

  const handleNew = () => {
    setMod(false);
    setVisible(true)
  }

  const handleMod = () => {
    if (1 != selectedRowKeys.length) return;
    setMod(true);
    setVisible(true)
  }

  const handleDel = () => {
    if (1 != selectedRowKeys.length) return;
    CONFIG.delUmt(data[selectedRowKeys[0]].id)

    if (expandRowKeys.length &&
      (selectedRowKeys[0] == expandRowKeys[0]))
      setExpandRowKeys([])
    setSelectedRowKeys([])
  }

  const handleCancel = () => {
    setVisible(false)
    setUmtId(undefined)
  }

  const handleConfirm = () => {
    setVisible(false)
    setUmtId(undefined)
  }

  const handleExpand = (expand, record) => {
    if (!expand) {
      setExpandRowKeys([])
    } else {
      dispatch({ type: '/msp/v2/net/umtdec/query', payload: { id: record.id } })
      setExpandRowKeys([record.key])
    }
  }

  return <>
    <Space style={{ bottomMargin: 16 }}>

      <Button type='primary' onClick={handleNew}>新建</Button>
      <Button type="primary" disabled={op} onClick={handleMod}>修改</Button>
      <Popconfirm title="是否删除该接入服务?" disabled={op} okText='确定' cancelText='取消' onConfirm={handleDel}>
        <Button type="primary" disabled={op}>删除</Button>
      </Popconfirm>
      {/* <Search placeholder="搜索" onSearch={value => console.log(value)} style={{ width: 240 }} /> */}
    </Space>
    <Table
      columns={columns}
      expandable={{
        expandedRowRender: expandedRowRender,
        rowExpandable: record => record.type === 2
      }}
      expandedRowKeys={expandRowKeys}
      rowSelection={rowSelection}
      dataSource={data}
      onExpand={handleExpand}
      style={{ marginTop: 10 }}
    />
    {undefined != umtId && <DecForm id={umtId} onCancel={handleCancel} onConfirm={handleConfirm} />}
    {visible && <StreamForm data={mod && data[selectedRowKeys[0]]} visible={visible} onCancel={handleCancel} onConfirm={handleConfirm} />}
  </>
}

export default Access