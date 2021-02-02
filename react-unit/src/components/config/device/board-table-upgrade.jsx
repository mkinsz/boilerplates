import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Table, Button, Space, Input, Upload, message, Modal, Checkbox, Select, Card } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux'
import { TypeToString, TRANS } from '../../public';

import './index.less'

const UpgradeModal = props => {
  const { visible, onCancel, onConfirm } = props
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const ref = useRef(false);

  const [file, setFile] = useState()

  const dispatch = useDispatch();

  const ueqp = useSelector(({ msps }) => msps.eqp)
  const upgrade = useSelector(({ mspsCfg }) => mspsCfg.eqp.upgrade)
  const batched = useSelector(({ mspsCfg }) => mspsCfg.eqp.batched)

  const data = useMemo(() => {
    if (upgrade.detail) {
      const files = []
      try {
        console.log('------> upgrade detail: ', upgrade.detail)
        const detls = JSON.parse(upgrade.detail)
        for (let a in detls.files) {
          files.push({ key: a, title: detls.files[a] })
        }
      } catch (error) {
        console.log(error)
      }

      return files;
    }
    return []
  }, [upgrade])

  useEffect(() => {
    dispatch({ type: '/msp/v2/eqp/batch/detail/query' })

    const list = props.list.map(m => ({ sn: m.sn, ip: m.ip, type: props.bdtype }))
    dispatch({ type: '/msp/v2/eqp/batch/config', payload: { meth: 3, list } })
    return () => !ref.current && dispatch({ type: '/msp/v2/eqp/batch/stop/config' })
  }, [])

  const handleUpgradeCancel = () => {
    // dispatch({ type: '/msp/v2/eqp/batch/stop/config' })
    onCancel();
  }

  const handleUpgradeStart = () => {
    ref.current = true;
    let body = ""
    selectedRowKeys.map(m => body += `${m},`)
    dispatch({ type: '/msp/v2/eqp/batch/add', payload: { meth: 3, body } });
    const list = props.list.map(m => ({ sn: m.sn, ip: m.ip, type: props.bdtype }))
    dispatch({ type: '/msp/v2/eqp/batch/start/config', payload: { meth: 3, list } });

    setConfirmLoading(true);
    message.info('5秒后自动退出...')
    setTimeout(() => {
      setConfirmLoading(false);
      onConfirm();
    }, 5000);
  }

  const columns = [
    {
      title: '编号',
      dataIndex: 'key',
      render: (text) => <a>{text}</a>,
    },
    {
      title: '固件名称',
      dataIndex: 'title',
    },
  ];

  const rowSelection = {
    columnWidth: 40,
    selectedRowKeys,
    onChange: (selectedRowKeys, selectedRows) => {
      setSelectedRowKeys(selectedRowKeys)
    },
  };

  const uploadProps = {
    showUploadList: false,
    action: `http://${ueqp.ip}:${ueqp.port}/upload`,
    method: 'post',
    data: {
      filepath: '/msp/tftpd/pkg'
    },
    fileList: file ? [file] : [],
    beforeUpload: file => { setFile(file); return },
    onRemove: file => setFile(),
    onChange(info) {
      if (info.file.status == 'done') {
        message.success(`${file.name} 上传成功`);

        dispatch({ type: '/msp/v2/eqp/batch/detail/query', payload: { name: file.name, path: '/msp/tftpd/pkg' } })
      } else if (info.file.status === 'error') {
        message.error(`${file.name}上传失败...`);
      }
    },
  };

  return (
    <Modal visible={visible} title={"固件升级"} centered closable={false} footer={[
      <Button key="cancel" type='primary' disabled={confirmLoading} onClick={handleUpgradeCancel}>取消</Button>,
      <Button key="upgrade" type='primary' loading={confirmLoading} onClick={handleUpgradeStart}
        disabled={!batched || !file || !selectedRowKeys.length} >升级</Button>
    ]}>
      <Space style={{ marginBottom: 10 }}>
        <Upload disabled={!batched} {...uploadProps}>
          <Button disabled={!batched}> <UploadOutlined /> 选择文件 </Button>
        </Upload>
        {file && <div style={{ alignSelf: 'center' }}>{file.name}</div>}
      </Space>
      <div style={{ minWidth: 350, minHeight: 300, maxHeight: 450, overflowY: 'auto' }}>
        <Table bordered size='small'
          dataSource={data}
          columns={columns}
          pagination={false}
          rowSelection={rowSelection}
          loading={upgrade && upgrade.loading}
        />
      </div>
    </Modal>
  );
};

const BoardUpgrade = props => {
  const [selectedRows, setSelectedRows] = useState([])
  const [visible, setVisible] = useState(false)

  const dispatch = useDispatch();

  const fws = useSelector(({ mspsDev }) => mspsDev.fws)
  const eqps = useSelector(({ mspsDev }) => mspsDev.eqps)
  const batchs = useSelector(({ mspsDev }) => mspsDev.batchs)

  const data = useMemo(() => {
    const starts = selectedRows.map(m => m.sn)
    const devs = Object.values(eqps).filter(m => props.bdtype == 0 ? true : m.type == props.bdtype)
    const ordevs = devs.map((m, i) => ({
      key: i + 1, type2: TypeToString(m.type), ip: m.ip,
      ...m, ...m.base, state: batchs[m.sn] ? '升级完成' : visible ? starts.find(n => n == m.sn) && '开始升级' : ''
    }))
    return ordevs;
  }, [eqps, props.bdtype, selectedRows, batchs, visible])

  const columns = [
    { title: '序号', dataIndex: 'key' },
    { title: 'ip', dataIndex: 'ip' },
    { title: '设备名称', dataIndex: 'name' },
    { title: '设备型号', dataIndex: 'model' },
    { title: '设备类型', dataIndex: 'type2' },
    { title: '设备槽位号', dataIndex: 'slot' },
    { title: '机箱编号', dataIndex: 'box' },
    {
      title: '管理单元版本号', dataIndex: 'fws', width: 160,
      render: (t, r) => {
        const list = fws[r.sn] || []
        return list.length ? <Select defaultValue={1} style={{ display: 'block' }}>
          {list.map(m => <Select.Option key={m.no} value={m.no} >{`${m.name}(${m.softver})`}</Select.Option>)}
        </Select> : <></>
      }
    },
    // {
    //   title: '进度', dataIndex: 'process', width: 150,
    //   render: text => <Progress percent={text} />,
    // },
    { title: '升级状态', dataIndex: 'state', },
  ];

  useEffect(() => {
    dispatch({ type: '/msp/v2/transmission/config', payload: { type: TRANS.EQP, opt: 1 } })
  }, [])

  useEffect(() => {
    const devs = Object.values(eqps).filter(m => props.bdtype == 0 ? true : m.type == props.bdtype)
    devs.map(m => dispatch({ type: '/msp/v2/eqp/fw/query', payload: { sn: m.sn } }));
  }, [eqps, props.bdtype])

  const rowSelection = {
    selectedRowKeys: selectedRows ? selectedRows.map(m => m.key) : [],
    onChange: (selectedRowKeys, selectedRows) => {
      setSelectedRows(selectedRows)
    }
  };

  const handleCancel = () => {
    setVisible(false)
  };

  const handleConfirm = () => {
    setSelectedRows([])
    setVisible(false)
  };

  return (
    <>
      { visible && <UpgradeModal visible={visible} type={props.bdtype}
        list={selectedRows} onCancel={handleCancel} onConfirm={handleConfirm} />}
      <Button type='primary' disabled={!selectedRows.length} onClick={() => setVisible(true)}>升级</Button>
      <Table
        columns={columns} dataSource={data}
        size="small" rowSelection={rowSelection} style={{ marginTop: 10 }}
        bordered={true} pagination={{ size: 'default', showSizeChanger: false }} />
    </>
  )
}

export default BoardUpgrade