import React, { useEffect, useState } from 'react';
import { Table, Button, Space, message } from 'antd';
import { useSelector, useDispatch } from 'react-redux'
import { CONFIG } from "../../../actions";
import { DEVTYPE, TypeToString } from '../../public';


const columns = [
  {
    title: '序号',
    dataIndex: 'key',
  },
  {
    title: '设备名称',
    dataIndex: 'name',
  },
  {
    title: '设备类型',
    dataIndex: 'model',
  },
  {
    title: 'MAC',
    dataIndex: 'mac',
  },
  {
    title: '设备IP',
    dataIndex: 'ip',
  },
  {
    title: '掩码地址',
    dataIndex: 'mask',
  },
  {
    title: '网关地址',
    dataIndex: 'gw',
  },
  {
    title: '运行时间',
    dataIndex: 'runtime',
  },
  {
    title: '注册平台端口',
    dataIndex: 'regport',
  },
  {
    title: '注册平台ip',
    dataIndex: 'regip',
  },
];

const RegistTable = props => {
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [selectedRows, setSelectedRows] = useState([])
  const [data, setData] = useState([])

  const dispatch = useDispatch();

  const eqps = useSelector(({ mspsCfg }) => mspsCfg.eqp.searchdev)

  useEffect(() => {
    dispatch({ type: '/msp/v2/eqp/search/config', payload: { timeout: 10000 } });
  }, [])

  useEffect(() => {
    const devs = Object.values(eqps)
    setData(devs.map((m, i) => ({ key: i + 1, ip: m.ip, ...m })))
  }, [eqps])

  const handleRegist = () => {
    if (!selectedRows.length) {
      message.warn('请先选择需要注册的设备...')
      return;
    }
    const payload = selectedRows.map(m => ({ mac: m.mac }))
    dispatch({ type: '/msp/v2/eqp/search/register/config', payload });
  };

  const rowSelection = {
    onChange: (selectedRowKeys, selectedRows) => {
      setSelectedRows(selectedRows)
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Space style={{ marginBottom: 10 }}>
        <Button disabled={!true} loading={false}
          type="primary" onClick={handleRegist}
        >注册</Button>
      </Space>
      <div style={{ height: 'calc(100%-42px)', overflowY: 'auto' }}>
        <Table
          columns={columns}
          dataSource={data}
          rowSelection={rowSelection}
          bordered={true} size="small" pagination={{ size: 'default', showSizeChanger: false }} />
      </div>
    </div>
  )
}


export default RegistTable
