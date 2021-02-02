import React, { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { Card, Table, Button, Modal, Col, Row, Empty, Select, Checkbox, Space, Tooltip } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { DEVTYPE, CHNTYPE, GSN } from '../../public';
import './index.less'
import _ from 'lodash'

const { Option } = Select;

const CardOut = props => {
  const { data, onCheck, onSelect } = props;

  const selectOptions = useCallback(id => {
    const opts = []
    const pricks = data.reduce((t, m) => { m.on && t.push(m.id); return t }, [])
    const ndata = data.filter(m => m.id != id).filter(m => !pricks.find(n => n == m.id));
    opts.push(<Option key={props.index} value={0}>空</Option>)
    ndata.map(m => opts.push(<Option key={m.name + props.index} value={m.id}>{m.name}</Option>))
    return opts
  }, [data])

  return (
    <Card>
      <Space style={{ marginBottom: 5 }}>
        <div style={{ width: 160 }}>镜像端口</div>
        <div style={{ width: 140 }}>源端口</div>
      </Space>
      {data.map(m => {
        const index = data.findIndex(n => n.on && n.sid == m.id && n.did != m.id)
        return <Space key={m.id}>
          <Tooltip title={m.name} >
            <Checkbox style={{
              width: 158, textOverflow: 'ellipsis',
              whiteSpace: 'nowrap', overflow: 'hidden'
            }} disabled={index > -1} checked={m.on}
              onChange={({ target: { checked } }) => onCheck(checked, m.id)}>
              {m.name}
            </Checkbox>
          </Tooltip>
          <Select value={m.sid || 0}
            disabled={index > -1} style={{ width: 155 }}
            onChange={value => onSelect(value, m.id)}>
            {selectOptions(m.id)}
          </Select>
        </Space>
      })}
    </Card>
  )
}

const OutFormModal = props => {
  const [outs, setOuts] = useState([])
  const { visible, record, onCancel, onConfirm } = props

  const dispatch = useDispatch()

  const vouts = useSelector(({ mspsDev }) => mspsDev.vouts)
  const outputs = useSelector(({ mspsCfg: { ext } }) => ext.outputs) || []

  useEffect(() => {
    setOuts(Object.values(vouts).filter(m =>
      (record.box == m.id >> 24 >>> 0) && (record.slot == m.id << 8 >>> 24)
    ).map(m => {
      const ot = outputs.find(n => n.did == m.id)
      return ot ? { key: m.id, ...m, ...ot } : { key: m.id, ...m }
    }))
  }, [vouts, outputs])

  const handleCheck = (checked, id) => {
    console.log('-------->', outs)
    const index = outs.findIndex(m => m.id == id)
    if (index > -1) {
      const newData = [...outs]
      const cur = { ...newData[index], on: checked }
      newData.splice(index, 1, cur)
      setOuts(newData)
    }
  }

  const handleSelect = (value, id) => {
    const index = outs.findIndex(m => m.id == id)
    if (index > -1) {
      const newData = [...outs]
      newData.splice(index, 1, { ...newData[index], did: id, sid: value })
      setOuts(newData)
    }
  }

  const cards = useMemo(() => {
    if (!visible) return [];

    const coms = []
    for (let i = 0; i < outs.length; i += 4) {
      coms.push(
        <Col key={i} span={12}>
          <CardOut index={i} data={outs.slice(i, i + 4)}
            onCheck={handleCheck} onSelect={handleSelect} />
        </Col>)
    }
    return coms
  }, [outs])

  

  const handleOk = () => {
    const payload = outs.map(m => ({ sid: m.sid, did: m.did, on: m.on }))
    dispatch({ type: '/msp/v2/devex/output/redundancy/config', payload });

    onConfirm()
  }

  return (
    <Modal visible={visible} title={'配置'} width={800}
      okText="确认" cancelText="取消" onCancel={onCancel} onOk={handleOk}>
      { cards.length ?
        <Row gutter={[8, 8]}>
          {cards}
        </Row>
        : <Empty />
      }
    </Modal>
  );
};

const OutIdle = props => {
  const [data, setData] = useState([])
  const [visible, setVisible] = useState(false)
  const [record, setRecord] = useState({})

  const dispatch = useDispatch();

  const ext = useSelector(({ mspsCfg }) => mspsCfg.ext)
  const eqps = useSelector(({ mspsDev }) => mspsDev.eqps)

  useEffect(() => {
    // dispatch({ type: '/msp/v2/chn/query', payload: { type: CHNTYPE.VOUT } })

    const devs = Object.values(eqps).filter(m => m.type == DEVTYPE.OUT)
    if (devs.length) {
      setData(devs.map((m, i) => ({ key: i, ...m, ...m.base })));
    } else {
      const payload = { id: DEVTYPE.OUT, offset: 0, size: 16 }
      dispatch({ type: '/msp/v2/eqp/query', payload })
    }
  }, [])

  useEffect(() => {
    const devs = Object.values(eqps).filter(m => m.type == DEVTYPE.OUT)
    setData(devs.map((m, i) => ({ key: i, ...m, ...m.base })));
  }, [eqps])

  const handleCancel = () => {
    setVisible(false)
  }

  const handleConfirm = () => {
    setVisible(false)
  }

  const handleOp = record => {
    const { box, slot } = record;
    dispatch({ type: '/msp/v2/devex/output/redundancy/query', payload: { box, slot } })
    setRecord({ box, slot })
    setVisible(true)
  }

  const columns = [
    { title: "编号", dataIndex: "key", width: 40 },
    { title: "名称", dataIndex: "name", width: 80 },
    { title: "型号", dataIndex: "model", width: 80 },
    { title: "机箱号", dataIndex: "box", width: 40 },
    { title: "槽位号", dataIndex: "slot", width: 80 },
    { title: "端口数", dataIndex: "portcap", width: 80 },
    {
      title: '镜像配置',
      key: 'operation',
      width: 100,
      render: (text, record) => <Button type='primary' onClick={() => handleOp(record)}>配置</Button>,
    },
  ];

  return <>
    <Table bordered columns={columns} size='small'
      dataSource={data} pagination={{ size: 'default', showSizeChanger: false }} />
    {visible && <OutFormModal visible={visible} record={record} onCancel={handleCancel} onConfirm={handleConfirm} />}
  </>
}

export default OutIdle;