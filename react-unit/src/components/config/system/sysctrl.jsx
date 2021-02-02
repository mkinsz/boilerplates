import React, { useState, useEffect } from 'react'
import { Button, Upload, Input, Collapse, Col, Row, message, Space, Popconfirm } from 'antd'
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { TRANS } from '../../public'

const { Panel } = Collapse;

const SystemCtrl = () => {
  const [data, setData] = useState()
  const [impot, setImpot] = useState()
  const [upgrade, setUpgrade] = useState();

  const dispatch = useDispatch();

  const msps = useSelector(state => state.msps)
  const system = useSelector(({ mspsCfg }) => mspsCfg.system)

  useEffect(() => {
    // 0=下载，1=上传
    dispatch({ type: '/msp/v2/transmission/config', payload: { type: TRANS.MPUCFG, opt: 0 } })
    dispatch({ type: '/msp/v2/transmission/config', payload: { type: TRANS.MPUCFG, opt: 1 } })
    dispatch({ type: '/msp/v2/transmission/config', payload: { type: TRANS.MPUUP, opt: 1 } })
    dispatch({ type: '/msp/v2/transmission/config', payload: { type: TRANS.CASCCHN, opt: 0 } })
    dispatch({ type: '/msp/v2/sys/access/query' })
  }, [])

  useEffect(() => {
    data != system.access.code && setData(system.access.code)
  }, [system])

  const handleRecover = () => {
    dispatch({ type: '/msp/v2/sys/restore/config', payload: { type: 0 } })
  }

  const handleSyncTime = () => {
    const prefix = (n, l) => (Array(l).join('0') + n).slice(-l)
    const time = {}
    const now = new Date
    time.zone = 'UTC' + prefix(now.getTimezoneOffset() / -60, 3)
    time.year = now.getFullYear()
    time.month = now.getMonth()
    time.day = now.getDay()
    time.hour = now.getHours()
    time.minute = now.getMinutes()
    time.second = now.getSeconds()
    dispatch({ type: '/msp/v2/sys/time/config', payload: { ...time } })
  }

  const handleUpdate = () => {

  }

  const o2a = o => o && 'http://' + o.ip + ':' + o.port

  const handleDownloadDb = () => {
    dispatch({type: '/msp/v2/sys/filetrans/config', payload: { opt: 2 }})
  }

  const handleDownloadChn = () => {
    fetch(`http://${state.casc.ip}:${state.casc.port}/download`, {
      method: 'post',
      body: JSON.stringify({
        filepath: msps.casc.path,
        filename: msps.casc.filename
      })
    }).then(res => {
      if (res.ok) {
        res.blob().then(blob => {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = msps.casc.filename;
          a.click();
          URL.revokeObjectURL(a.herf);
          a.remove();
        })
      }
    }).then(() =>
      console.log('download successfully')
    )
  }

  const opAuth = opt => {
    dispatch({ type: '/msp/v2/sys/access/config', payload: { code: data, opt } })
  }

  const uploadDb = {
    showUploadList: false,
    action: `http://${msps.ucfg.ip}:${msps.ucfg.port}/upload`,
    data: {
      filepath: msps.ucfg.path,
      filename: impot && impot.name
    },
    fileList: impot ? [impot] : [],
    onRemove: file => setImpot(),
    onChange({ file, fileList }) {
      if (file.status != 'removed') setImpot(file)
      if (file.status == 'done') {
        dispatch({
          type: '/msp/v2/transmission/end/config',
          payload: {
            name: file.name,
            size: file.size,
            type: TRANS.MPUCFG,
            opt: 1
          }
        })
        message.success(`${file.name} 上传成功`);
      } else if (file.status === 'error') {
        message.error(`${file.name}上传失败...`);
      }
    },
  };

  const uploadMPU = {
    showUploadList: false,
    action: `http://${msps.umpu.ip}:${msps.umpu.port}/upload`,
    data: {
      filepath: '/msp/tftpd/pkg',
      filename: upgrade && upgrade.name
    },
    fileList: upgrade ? [upgrade] : [],
    onChange(info) {
      if (info.file.status != 'removed') setUpgrade(info.file)
      if (info.file.status == 'done') {
        dispatch({
          type: '/msp/v2/transmission/end/config',
          payload: {
            size: info.file.size,
            name: info.file.name,
            type: TRANS.MPUUP,
            opt: 1
          }
        })
        message.success(`${info.file.name} 上传成功`)
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} 上传失败`);
      }
    },
  };

  return (
    <Collapse defaultActiveKey={[1, 2, 3, 4]}>
      <Panel header="系统控制" key={1}>
        <Row gutter={[10, 4]}>
          <Col span={6}>重启</Col>
          <Col span={6}>
            <Popconfirm title="是否确定重启?" okText='确定' cancelText='取消'
              onConfirm={() => dispatch({ type: '/msp/v2/sys/reboot/config' })}>
              <Button>重启</Button>
            </Popconfirm>
          </Col>
        </Row>
        <Row gutter={[10, 4]}>
          <Col span={6}>恢复出厂</Col>
          <Col span={6}><Button onClick={handleRecover}>恢复</Button></Col>
        </Row>
        <Row gutter={[10, 4]}>
          <Col span={6}>同步系统时间</Col>
          <Col span={6}><Button onClick={handleSyncTime}>同步</Button></Col>
        </Row>
      </Panel>
      <Panel header="导入导出" key={2}>
        <Row gutter={[10, 4]}>
          <Col span={6}>导入</Col>
          <Col span={6}><Upload {...uploadDb}>
            <Button icon={<UploadOutlined />}>上传</Button>
          </Upload></Col>
        </Row>
        <Row gutter={[10, 4]}>
          <Col span={6}>导出</Col>
          <Col span={6}>
            <Button loading={msps.dcfg.loading} onClick={handleDownloadDb}><DownloadOutlined />下载</Button>
          </Col>
        </Row>
      </Panel>
      <Panel header="级联通道导出" key={3}>
        <Row gutter={[10, 4]}>
          <Col span={6}>导出</Col>
          <Col span={6}>
            <Button onClick={handleDownloadChn}><DownloadOutlined />下载</Button>
          </Col>
        </Row>
      </Panel>
      <Panel header="主控升级" key={4}>
        <Row gutter={[10, 4]}>
          <Col span={6}>升级</Col>
          <Col span={6}><Upload {...uploadMPU}>
            <Button onClick={handleUpdate} icon={<UploadOutlined />}>上传</Button>
          </Upload></Col>
        </Row>
        <Row gutter={[10, 4]}>
          <Col span={6}>升级状态</Col>
          <Col span={6}></Col>
        </Row>
      </Panel>
      <Panel header="远程控制" key={5}>
        <Row gutter={[10, 4]}>
          <Col span={6}>授权状态</Col>
          <Col span={6}>{system.access.status ? '已开启' : '未开启'}</Col>
        </Row>
        <Row gutter={[10, 4]}>
          <Col span={6}>授权开启</Col>
          <Col span={16}>
            <Space>
              <Input value={data} maxLength={20} style={{ width: 300 }} onChange={({ target: { value } }) => setData(value)} />
              <Button onClick={() => opAuth(true)}>开启</Button>
            </Space></Col>
        </Row>
        <Row gutter={[10, 4]}>
          <Col span={6}>授权关闭</Col>
          <Col span={6}><Button onClick={() => opAuth(false)}>关闭</Button></Col>
        </Row>
        <Row gutter={[10, 4]}>
          <Col span={6}>授权码</Col>
          <Col span={6}><Button onClick={() => dispatch({ type: '/msp/v2/sys/accesscode/query' })}>获取</Button></Col>
        </Row>
      </Panel>
    </Collapse>
  )
}

export default SystemCtrl
