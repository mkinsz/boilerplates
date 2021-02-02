import React, { useEffect, useState, useMemo } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, Checkbox, Tooltip, message, InputNumber } from 'antd';
import { useDispatch, useSelector } from 'react-redux'
import { saveAs } from 'file-saver'

function ArrayBufferToString(buffer) {
  return BinaryToString(String.fromCharCode.apply(null, Array.prototype.slice.apply(new Uint8Array(buffer))));
}

function StringToArrayBuffer(string) {
  return StringToUint8Array(string).buffer;
}

function BinaryToString(binary) {
  var error;

  try {
    return decodeURIComponent(escape(binary));
  } catch (_error) {
    error = _error;
    if (error instanceof URIError) {
      return binary;
    } else {
      throw error;
    }
  }
}

function StringToBinary(string) {
  var chars, code, i, isUCS2, len, _i;

  len = string.length;
  chars = [];
  isUCS2 = false;
  for (i = _i = 0; 0 <= len ? _i < len : _i > len; i = 0 <= len ? ++_i : --_i) {
    code = String.prototype.charCodeAt.call(string, i);
    if (code > 255) {
      isUCS2 = true;
      chars = null;
      break;
    } else {
      chars.push(code);
    }
  }
  if (isUCS2 === true) {
    return unescape(encodeURIComponent(string));
  } else {
    return String.fromCharCode.apply(null, Array.prototype.slice.apply(chars));
  }
}

function StringToUint8Array(string) {
  var binary, binLen, buffer, chars, i, _i;
  binary = StringToBinary(string);
  binLen = binary.length;
  buffer = new ArrayBuffer(binLen);
  chars = new Uint8Array(buffer);
  for (i = _i = 0; 0 <= binLen ? _i < binLen : _i > binLen; i = 0 <= binLen ? ++_i : --_i) {
    chars[i] = String.prototype.charCodeAt.call(binary, i);
  }
  return chars;
}

// ArrayBuffer转为字符串，参数为ArrayBuffer对象
function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint16Array(buf));
}

// 字符串转为ArrayBuffer对象，参数为字符串
function str2ab(str) {
  var buf = new ArrayBuffer(str.length * 2); // 每个字符占用2个字节
  var bufView = new Uint16Array(buf);
  for (var i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

const ConfigModal = props => {
  const [form] = Form.useForm()
  const { visible, record, onCancel, onConfirm } = props

  const dispatch = useDispatch();

  const ain = useSelector(({ mspsDev }) => mspsDev.ains)
  const chnnets = useSelector(({ mspsCfg }) => mspsCfg.eqp.chnnets)

  useEffect(() => {
    // form.setFieldsValue({ netenable: msg.enable })
    // const chn = ain[record.aid]
    form.setFieldsValue({
      name: record.name,
      slotbd: record.slot,
      slotport: record.port,
      // audio: chn ? chn.id : undefined,
      sync: false,
      // avsync: record.sync,
    });
  }, [record])

  useEffect(() => {
    const net = chnnets[record.id]
    net && form.setFieldsValue({ netenable: net.enable })
  }, [chnnets, record])

  const formItemLayout = {
    labelCol: {
      span: 5
    },
    wrapperCol: {
      span: 18
    },
  };

  const handleOK = async () => {
    const { id, chntype } = record;
    try {
      const values = await form.validateFields();
      dispatch({ type: '/msp/v2/chn/rename/config', payload: { id, chntype, name: values.name } });
      dispatch({ type: '/msp/v2/chn/cfg/net/config', payload: { list: [{ id, enable: values.netenable }] } })
      values.sync && dispatch({ type: '/msp/v2/chn/cfg/net/sync/config', payload: { id, enable: values.netenable } })
      // dispatch({ type: '/msp/v2/chn/cfg/vedio/audio/config', payload: { id } });
      onConfirm();
    } catch (error) {
      console.log('Failed:', error);
    }
  }

  return (
    <Modal visible={visible} title={"配置"}
      okText="确认" cancelText="取消" onCancel={onCancel} onOk={handleOK}>
      <Form {...formItemLayout} form={form}>
        <Form.Item label="通道名称" name="name" rules={[{ required: true, message: '请输入通道名称' }]}>
          <Input maxLength={20} />
        </Form.Item>
        <Form.Item label="网络使能" name="netenable" rules={[{ required: true, message: '请选择网络使能' }]}>
          <Select>
            <Select.Option value={true}>开</Select.Option>
            <Select.Option value={false}>关</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label="单板槽位号" name="slotbd" rules={[{ required: true, message: '请输入槽位号' }]}>
          <Input disabled maxLength={20} />
        </Form.Item>
        <Form.Item label="端口编号" name="slotport" rules={[{ required: true, message: '请输入端口编号' }]}>
          <Input disabled maxLength={20} />
        </Form.Item>
        {/* <Form.Item label="关联音频" name="audio" rules={[{ required: true, message: props.record.type }]}>
          <Select style={{ width: 350 }}>
            {
              props.ainchnls.map((value, key) => <Option value={value.id}>{value.name}</Option>)
            }
          </Select>
        </Form.Item> */}
        <Form.Item label="板卡同步" name="sync" valuePropName="checked">
          <Checkbox></Checkbox>
        </Form.Item>
        {/* <Form.Item label="音视频同步" valuePropName="checked" name="avsync">
          <Checkbox></Checkbox>
        </Form.Item> */}
      </Form>
    </Modal>
  );
};

const EdidModal = props => {
  // const [form] = Form.useForm()
  const { visible, modify, onCancel, onConfirm } = props

  const [desc, setDesc] = useState()
  const [file, setFile] = useState()
  const [selectedRows, setSelectedRows] = useState([])

  const dispatch = useDispatch();

  const edids = useSelector(({ mspsCfg: { eqp } }) => eqp.edids)
  const defedid = useSelector(({ mspsCfg: { eqp } }) => eqp.defedid)
  const curedid = useSelector(({ mspsCfg: { eqp } }) => eqp.curedid)

  const dataEdid = useMemo(() => Object.values(edids).map(m => ({ ...m, key: m.id })), [edids])

  const column = [
    {
      title: 'edid',
      dataIndex: 'key',
    },
    {
      title: '使用状态',
      dataIndex: 'key',
      render: (text, record) => text == curedid ? '使用中' : ''
    },
    {
      title: '描述',
      dataIndex: 'desc',
    },
  ];

  useEffect(() => {
    setDesc()
  }, [visible])

  useEffect(() => {
    if (!props.record) return

    dispatch({ type: '/msp/v2/chn/cfg/vedio/edid/query', payload: { key: props.record.id } })
  }, [props.record])

  const handleQuery = () => {
    dispatch({ type: '/msp/v2/chn/cfg/vedio/edid/plan/query' })
  }

  const handleClickAdd = () => {
    if (file == undefined) {
      message.error('文件不能为空')
      return
    }
    dispatch({ type: '/msp/v2/chn/cfg/vedio/edid/plan/add', payload: { cfg: new Uint8Array(file), desc } })
  }

  const handleDel = () => {
    const list = selectedRows.map(m => ({ key: m.key }))
    if (list.find(m => m.key == curedid)) {
      message.warn('使用中的EDID不能删除...')
      return;
    }
    dispatch({ type: '/msp/v2/chn/cfg/vedio/edid/plan/delete', payload: { list } })
    setSelectedRows([])
  }

  const handleUse = () => {
    if (selectedRows.length != 1) {
      message.error("请选择一个edid")
      return
    }

    const { cfg: edid, id: no } = selectedRows[0]

    dispatch({ type: '/msp/v2/chn/cfg/vedio/edid/config', payload: { id: props.record.id, edid, no } })
  }

  const handleUseCancel = () => {
    if (selectedRows.length != 1) {
      message.error("请选择一个edid")
      return
    }

    const { id } = selectedRows[0]
    if (curedid != id) {
      message.warn('该EDID未使用...')
      return;
    }

    dispatch({ type: '/msp/v2/chn/cfg/vedio/edid/delete', payload: { id: props.record.id } })
  }

  const handleExport = () => {
    if (selectedRows.length != 1) {
      message.error("请选择一个edid")
      return
    }

    function base64ToUint8Array(base64String) {
      const padding = '='.repeat((4 - base64String.length % 4) % 4);
      const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);

      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    }

    const { cfg: edid, id, desc } = selectedRows[0]
    const blob = new Blob([base64ToUint8Array(edid)])
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = desc + '.bin';
    a.click();
    URL.revokeObjectURL(a.herf);
    a.remove();
  }

  const rowSelection = {
    selectedRowKeys: selectedRows.map(m => m.key),
    onChange: (selectedRowKeys, selectedRows) => {
      setSelectedRows(selectedRows)
      //dispatch({ type: '/msp/v2/chn/cfg/vedio/edid/query', payload:{key:selectedRowKeys} })
    }
  };

  const handleUpload = (e) => {
    // setFileName(file)
    var reader = new FileReader();
    reader.readAsArrayBuffer(e.target.files[0]);
    reader.onload = (e) => {
      const res = e.target.result;
      // setFile(ab2str(res));
      setFile(res)

      // console.log('----->', res, typeof res, res.byteLength)
      // const eres = ab2str(res);
      // console.log('------>', eres, str2ab(eres))

      // const blob = new Blob([res])
      // const a = document.createElement('a');
      // a.href = URL.createObjectURL(blob);
      // a.download = '1.bin';
      // a.click();
      // URL.revokeObjectURL(a.herf);
      // a.remove();
    }
  }

  const handleChange = ({ target: { value } }) => {
    setDesc(value)
  };

  const handleOK = () => {
    onConfirm()
  }

  return (
    <Modal centered visible={visible} title={"EDID配置"} onCancel={handleOK} footer={[
      <Button key="close" type='primary' onClick={handleOK}> 关闭 </Button>]}>
      <div style={{ height: 240, overflowY: 'auto', marginBottom: 10 }} >
        <Table size='small' rowSelection={rowSelection} columns={column}
          dataSource={dataEdid} bordered={true} height={240} pagination={false} />
      </div>
      <Space>
        路径:
          {visible && <Input type="file" size='small' maxLength={30} onChange={handleUpload} style={{ width: 350 }} />}
        <Button onClick={handleClickAdd}>添加</Button>
      </Space>
      <Space style={{ marginTop: 8 }}>描述:<Input size='small' maxLength={30}
        value={desc} onChange={handleChange} style={{ width: 350 }} /></Space>
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'flex-end', marginTop: 10 }}>
        <Space>
          <Button size='middle' onClick={handleQuery}>重新查询</Button>
          <Button size='middle' disabled={!selectedRows.length} onClick={handleDel}>删除</Button>
          <Button size='middle' disabled={1 != selectedRows.length} onClick={handleUse}>使用</Button>
          <Button size='middle' disabled={1 != selectedRows.length} onClick={handleUseCancel}>取消使用</Button>
          <Button size='middle' disabled={1 != selectedRows.length} onClick={handleExport}>导出</Button>
        </Space>
      </div>

      {/* <TabPane tab="手动" key="2">
          <Form {...formItemLayout} form={form}>
            <Form.Item label="模式" rules={[{ required: true, message: props.record.port }]} >
              <Radio.Group>
                <Radio value={1}>从文件</Radio>
                <Radio value={2}>手动填写</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item label="显示" rules={[{ required: true, message: props.record.port }]}>
              <Radio.Group>
                <Radio value={1}>普通</Radio>
                <Radio value={2}>16进制</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item label="EDID内容" rules={[{ required: true, message: props.record.port }]}>
              <TextArea rows={4} />
            </Form.Item>
          </Form>
        </TabPane> */}
    </Modal>
  );
};

const ChnCfgVins = props => {
  const [cfgVisible, setCfgVisible] = useState(false)
  const [edidVisible, setEdidVisible] = useState(false)

  const [cfgData, setCfgData] = useState({})
  const [edidData, setEdidData] = useState({})

  const ext = useSelector(({ mspsDev }) => mspsDev.vins)
  const ain = useSelector(({ mspsDev }) => mspsDev.ains)

  const dispatch = useDispatch()

  useEffect(() => {
    dispatch({ type: '/msp/v2/chn/cfg/vedio/edid/plan/query' })
  }, [])

  const handleCfg = (record) => {
    dispatch({ type: '/msp/v2/chn/cfg/net/query', payload: { id: record.id } });

    setCfgVisible(true)
    setCfgData(record)
  };

  const handleCancel = () => {
    setCfgVisible(false)
    setEdidVisible(false)
  };

  const handleConfirm = () => {
    setCfgVisible(false)
    setEdidVisible(false)
  };

  const handleEdid = (record) => {
    dispatch({ type: '/msp/v2/chn/cfg/vedio/edid/plan/query' })
    dispatch({ type: '/msp/v2/chn/cfg/vedio/edid/cur/query', payload: { id: record.id } })

    setEdidVisible(true)
    setEdidData(record)
  };

  const handleCancelEdid = () => {
    setEdidVisible(false)
  };

  const handleConfirmEdid = () => {
    setEdidVisible(false)
  };

  const columns = [
    { title: '序号', dataIndex: 'key', width: 50 },
    {
      title: '通道名称', dataIndex: 'name', width: 200, ellipsis: { showTitle: false, },
      render: text => <Tooltip placement="topLeft" title={text}> {text} </Tooltip>,
    },
    { title: '音视频同步切换', dataIndex: 'avsync', width: 120, render: t => t ? '是' : '否' },
    { title: '分辨率', dataIndex: 'wh', },
    { title: '机箱号', dataIndex: 'boxno', },
    { title: '单板槽位号', dataIndex: 'slot', },
    { title: '端口编号', dataIndex: 'port', },
    { title: '逻辑地址', dataIndex: 'hid', },
    {
      title: '详细配置', dataIndex: 'detail', width: 120,
      render: (text, record, index) => <Space>
        <Button size="small" onClick={() => handleCfg(record)}>配置</Button>
        <Button size="small" onClick={() => handleEdid(record)}>EDID</Button>
      </Space>
    },
  ];


  const ain_chnls = useMemo(() => {
    const ain_devs = Object.values(ain) || []
    return ain_devs.map((m, i) => { return { key: i + 1, ...m.base } })
  }, [ain])

  const chnls = useMemo(() => {
    const devs = Object.values(ext) || []
    return devs.map((m, i) => ({
      key: i + 1, wh: `${m.resw}*${m.resh}`,
      audiochnnl: ain[m.aid] && ain[m.aid].base.name,
      boxno: m.base.id >> 24, slot: m.base.id << 8 >> 24,
      port: m.base.id << 16 >> 24, ...m, ...m.base
    }))
  }, [ext, ain])

  return (
    <div>
      <Table columns={columns} dataSource={chnls} bordered={true} size="small" scroll={{ y: '67vh' }} pagination={{size: 'default', showSizeChanger:false}} />
      {cfgVisible && <ConfigModal ainchnls={ain_chnls} visible={cfgVisible} record={cfgData} onCancel={handleCancel} onConfirm={handleConfirm} />}
      {edidVisible && <EdidModal visible={edidVisible} record={edidData} onCancel={handleCancelEdid} onConfirm={handleConfirm} />}
    </div>
  )
}
export default ChnCfgVins