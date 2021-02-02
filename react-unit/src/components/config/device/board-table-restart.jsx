import React, { useState, useEffect, useMemo } from 'react';
import { Table, Button, Popconfirm } from 'antd';
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
    dataIndex: 'type',
  },
  {
    title: '设备槽位号',
    dataIndex: 'slot',
  },
  {
    title: '机箱编号',
    dataIndex: 'box',
  },
  {
    title: '重启状态',
    dataIndex: 'state',
  },
];

const BoardRestart = props => {
  const [selectedRows, setSelectedRows] = useState([])

  const dispatch = useDispatch();

  const eqps = useSelector(({ mspsDev }) => mspsDev.eqps)
  const batchs = useSelector(({ mspsCfg }) => mspsCfg.eqp.batchs)

  useEffect(() => {
    dispatch({ type: '/msp/v2/eqp/query', payload: { id: props.bdtype, offset: 0, size: 10 } });
  }, [props.bdtype])

  const data = useMemo(() => {
    const devs = Object.values(eqps).filter(m => m.online && (props.bdtype == 0 ? true : m.type == props.bdtype))
    return devs.map((m, i) => { return { key: i + 1, type2: TypeToString(m.type), ip: m.ip, ...m, ...m.base } })
  }, [eqps])

  const handleRestart = () => {
    const list = selectedRows.map(m => ({ sn: m.sn, ip: m.ip, type: props.bdtype }))
    dispatch({ type: '/msp/v2/eqp/batch/config', payload: { meth: 0, list } });
    // dispatch({ type: '/msp/v2/eqp/batch/add', payload: { meth: 0 } });
    // dispatch({ type: '/msp/v2/eqp/batch/start/config', payload: { meth: 0 } });
  };

  const rowSelection = {
    onChange: (selectedRowKeys, selectedRows) => {
      setSelectedRows(selectedRows)
    }
  };

  return (
    <>
      <Popconfirm title="是否确定重启?" okText='确定' cancelText='取消' onConfirm={handleRestart}>
        <Button disabled={!selectedRows.length} type="primary" style={{ marginBottom: 10 }}>重启</Button>
      </Popconfirm>
      <Table rowSelection={rowSelection} columns={columns} 
      dataSource={data} bordered={true} size="small" pagination={{size: 'default', showSizeChanger:false}}/>
    </>
  )
}

export default BoardRestart