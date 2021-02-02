import React, { useState, useEffect, useMemo } from 'react';
import { Table, Button, Space, InputNumber, Popconfirm } from 'antd';
import { useDispatch, useSelector } from 'react-redux'
import { TypeToString } from '../../public';

const columns = [
  {
    title: '序号',
    dataIndex: 'key',
  },
  {
    title: 'ip',
    dataIndex: 'ip',
  },
  {
    title: '设备名称',
    dataIndex: 'name',
  },
  {
    title: '设备型号',
    dataIndex: 'model',
  },
  {
    title: '设备类型',
    dataIndex: 'type2',
  },
  {
    title: '设备槽位号',
    dataIndex: 'slot',
  },
  {
    title: '机箱编号',
    dataIndex: 'box',
  },
  // {
  //   title: '重启状态',
  //   dataIndex: 'state',
  // },
];

const BoardBoxno = props => {
  const [selectedRows, setSelectedRows] = useState([])
  const [data, setData] = useState([])
  const [value, setValue] = useState()

  const dispatch = useDispatch()
  const eqps = useSelector(({ mspsDev }) => mspsDev.eqps)

  useEffect(() => {
    dispatch({ type: '/msp/v2/eqp/query', payload: { id: props.bdtype, offset: 0, size: 10 } });
  }, [props.bdtype])

  useEffect(() => {
    const devs = Object.values(eqps).filter(m => props.bdtype == 0 ? true : m.type == props.bdtype)
    setData(devs.map((m, i) => { return { key: i + 1, ip: m.ip, ...m, type2: TypeToString(m.type), ...m.base } }))
  }, [eqps])

  const handleBoxno = () => {
    const list = selectedRows.map(m => ({ sn: m.sn, ip: m.ip, type: props.bdtype }))

    dispatch({ type: '/msp/v2/eqp/batch/config', payload: { meth: 2, list } });
    dispatch({ type: '/msp/v2/eqp/batch/add', payload: { meth: 2, body: value.toString() } });
    dispatch({ type: '/msp/v2/eqp/batch/start/config', payload: { meth: 2 } });
  };

  const rowSelection = {
    onChange: (selectedRowKeys, selectedRows) => {
      setSelectedRows(selectedRows)
    }
  };

  return (
    <>
      <Space style={{ marginBottom: 10 }}>
        <div style={{ alignSelf: 'center' }}>机箱号:</div>
        <InputNumber value={value} min={1} max={32} onChange={v => setValue(v)}></InputNumber>

        <Popconfirm title="该操作会导致板卡重启，是否继续?" okText='确定' cancelText='取消' onConfirm={handleBoxno}>
          <Button disabled={!value || !selectedRows.length} type="primary">设置</Button>
        </Popconfirm>
      </Space>
      <Table rowSelection={rowSelection} columns={columns} 
      dataSource={data} bordered={true} size="small" pagination={{size: 'default', showSizeChanger:false}} />
    </>
  )
}

export default BoardBoxno