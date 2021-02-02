import React from 'react';
import { Table, Button, Space } from 'antd';
import { connect } from 'react-redux'
import { CONFIG } from "../../../actions";
import { DEVTYPE, TypeToString } from '../../public';

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
  {
    title: '恢复出厂状态',
    dataIndex: 'state',
  },
];

const RecoverTable = props => {
  const [selectedRowKeys, setSelectedRowKeys] = React.useState([])
  const [selectedRows, setSelectedRows] = React.useState([])
  const [data, setData] = React.useState([])

  React.useEffect(() => {
    console.log(props)
    CONFIG.dispatch('/msp/v2/eqp/query', { id: props.bdtype, offset: 0, size: 10 });
  }, [props.bdtype])

  React.useEffect(() => {
    const devs = Object.values(props.eqps).filter(m => props.bdtype == 0 ? true : m.type == props.bdtype)
    setData(devs.map((m, i) => { return { key: i + 1, ip: m.ip, ...m, type2: TypeToString(m.type), ...m.base } }))
  }, [props.eqps])

  const start = () => {
    const list = selectedRows.map(m => { return { sn: m.sn, ip: m.ip, type: props.bdtype } })

    CONFIG.dispatch('/msp/v2/eqp/batch/config', { meth: 1, list });
    // CONFIG.dispatch('/msp/v2/eqp/batch/start/config', { meth: 1, body: {} });
  };

  const rowSelection = {
    onChange: (selectedRowKeys, selectedRows) => {
      setSelectedRows(selectedRows)
    }
  };

  return (
    <>
      <Space style={{ marginBottom: 10 }}>
        <Button type="primary" onClick={start} disabled={!true} loading={false}>
          恢复
          </Button>
      </Space>
      <Table rowSelection={rowSelection} columns={columns}
        dataSource={data} bordered={true} size="small" pagination={{ size: 'default', showSizeChanger:false }} />
    </>
  )
}

const mapStateToProps = state => {
  return { eqps: state.mspsDev.eqps };
};

export default connect(mapStateToProps)(RecoverTable)