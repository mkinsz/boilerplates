import React, { useState, useEffect, useMemo } from 'react';
import { connect, useDispatch } from 'react-redux'
import { Table } from 'antd';
import { DEVTYPE, TypeToString } from '../../public';

const columns = [
  {
    title: '序号',
    dataIndex: 'key',
    width: 50,
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
  //   title: '运行时间',
  //   dataIndex: 'runtime',
  // },
  // {
  //   title: '运行状态',
  //   dataIndex: 'state',
  // },
];

const rowSelection = {
  onChange: (selectedRowKeys, selectedRows) => {
    console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
  }
};

const DetailTable = props => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch({ type: '/msp/v2/eqp/query', payload: { id: props.bdtype, offset: 0, size: 10 } });
  }, [props.bdtype])

  const data = useMemo(() => {
    const tdevs = Object.values(props.eqps)
    if (props.bdtype === 0) {
      return tdevs.map((m, i) => ({ key: i + 1, ip: m.ip, ...m, type2: TypeToString(m.type), ...m.base }))
    }

    return tdevs.filter(m => m.type == props.bdtype).map((m, i) =>
      ({ key: i + 1, ip: m.ip, ...m, type2: TypeToString(m.type), ...m.base }))
  }, [props.eqps, props.bdtype])

  return <Table columns={columns} dataSource={data}
    bordered={true} size="small" pagination={{size: 'default', showSizeChanger:false}} />
}

const mapStateToProps = state => {
  return { eqps: state.mspsDev.eqps };
};

export default connect(mapStateToProps)(DetailTable)