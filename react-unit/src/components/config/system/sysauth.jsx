import React, { useState, useEffect, useMemo } from 'react'
import { Button, Upload, Col, Row, message, Space } from 'antd'
import { useDispatch, useSelector } from 'react-redux';
import moment from 'moment';
import { TRANS, SYS_BITMAP, SYS_LTMAP, SYS_STATUSMAP } from '../../public'

const gutter = [10, 10]

const SystemAuth = () => {
  const [impot, setImpot] = useState()

  const dispatch = useDispatch();

  const auth = useSelector(({ mspsCfg }) => mspsCfg.system.auth)
  const msps = useSelector(state => state.msps)

  useEffect(() => {
    dispatch({ type: '/msp/v2/sys/licence/query' })
    dispatch({ type: '/msp/v2/transmission/config', payload: { type: TRANS.LICEN, opt: 1 } })
  }, [])

  const data = useMemo(() => {
    if (!auth.module) return [];
    const deadline = auth.module.toString(2)
    const rows = []
    for (let i = 0; i < deadline.length; ++i) {
      if (deadline[i]) {
        const t = new Date(auth.expdataList[i])
        rows.push(<Row key={i} gutter={0, 10}>
          <Col span={2}>{`${SYS_BITMAP[i]}:`}</Col>
          {/* <Col>{t.toLocaleDateString().replace(/\//g, "-") + " " + t.toTimeString().substr(0, 8)}</Col> */}
          <Col>{moment.unix(t).format('YYYY-MM-DD HH:mm:ss')}</Col>
        </Row>)
      }
    }
    return rows
  }, [auth.module])

  const handleCheck = () => {
    dispatch({ type: '/msp/v2/sys/licence/query' })
  }

  const o2a = o => o && 'http://' + o.ip + ':' + o.port

  const uploadLic = {
    showUploadList: false,
    action: `http://${msps.ulic.ip}:${msps.ulic.port}/upload`,
    data: {
      filepath: msps.ulic.path,
    },
    fileList: impot ? [impot] : [],
    // beforeUpload: () => dispatch({ type: '/msp/v2/sys/licence/config' }),
    onRemove: file => setImpot(),
    onChange({ file, fileList }) {
      if (file.status != 'removed') setImpot(file)
      if (file.status == 'done') {
        dispatch({
          type: '/msp/v2/transmission/end/config',
          payload: {
            name: file.name,
            size: file.size,
            type: TRANS.LICEN,
            opt: 1
          }
        })
        message.success(`${file.name} 上传成功`);
      } else if (file.status === 'error') {
        message.error(`${file.name} 上传失败`);
      }
    },
  };

  return <>
    <Row gutter={gutter}>
      <Col span={6}>机器码</Col>
      <Col>{auth.host}</Col>
    </Row>
    <Row gutter={gutter}>
      <Col span={6}>许可证编号</Col>
      <Col>{auth.no}</Col>
    </Row>
    <Row gutter={gutter}>
      <Col span={6}>许可证版本</Col>
      <Col>{auth.version}</Col>
    </Row>
    <Row gutter={gutter}>
      <Col span={6}>许可证类型</Col>
      <Col>{SYS_LTMAP[auth.type]}</Col>
    </Row>
    <Row gutter={gutter}>
      <Col span={6}>状态</Col>
      <Col>{SYS_STATUSMAP[auth.state]}</Col>
    </Row>
    <Row gutter={gutter}>
      <Col span={6}>最大编码通道数</Col>
      <Col>{auth.enccap}</Col>
    </Row>
    <Row gutter={gutter}>
      <Col span={6}>截止日期</Col>
      <Col span={18}>{data}</Col>
    </Row>
    <Space style={{ marginTop: 10 }}>
      <Button onClick={handleCheck}>查询许可证</Button>
      <Upload {...uploadLic}><Button>上传许可证</Button></Upload>
      <div>(上传许可证后需要重启主控才能生效)</div>
    </Space>
  </>
}

export default SystemAuth
