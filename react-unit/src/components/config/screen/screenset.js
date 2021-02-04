import React, { useEffect, useImperativeHandle, useCallback, useRef, useLayoutEffect } from "react";
import { Button, Menu, message, Switch, Modal, Space } from 'antd';
import { Layout } from 'antd';
import { ExclamationCircleOutlined, SettingOutlined } from '@ant-design/icons';
import { Label, CHNTYPE } from '../../public'
const { Header, Footer, Sider, Content } = Layout;

import { Collapse, Card, Row, Col, Slider, Table, Input, List, InputNumber, Popconfirm, Form, Tabs } from "antd";
import { Empty } from 'antd';
import { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { connect } from 'react-redux';
import { SCREEN } from "../../../actions";
import { eventProxy } from '../../../utils'
import './index.css'
import { limitInput } from './public'
import { CustonRateModal } from "./cratemodal";
import { Prompt } from 'react-router-dom';

import { store } from '../../../utils'

const { Panel } = Collapse;


export class MenuList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      key: '',
      listData: []
    }

    const a = Object.prototype.toString
    const arrData = a.call(this.props.arrData) == '[object Map]' ? [...this.props.arrData.values()] : this.props.arrData
    if (arrData.length > 0) {
      console.log('arrDataNext', arrData)
      this.state.key = arrData[0].id.toString()
      this.state.listData = [...arrData]
      console.log('arrDataNext', this.state)
      this.props.onItemChange(this.state.key)
    }

    //
  }

  componentDidUpdate(prevProps, prevState) {
    // 典型用法（不要忘记比较 props）：
    console.log('prevProps update')
    const a = Object.prototype.toString
    const arrData = a.call(this.props.arrData) == '[object Map]' ? [...this.props.arrData.values()] : this.props.arrData

    if (this.state.listData.length != arrData.length) {
      console.log('prevProps update11111', arrData);
      this.setState({ listData: arrData })
      if (arrData.length > 0 && this.state.key == '') {
        this.setState({ key: arrData[0].id.toString() })
        this.props.onItemChange(arrData[0].id)
        console.log('choose first', arrData);
      }
    } else if (prevProps.arrData != this.props.arrData) {
      console.log('prevProps update2222', arrData);
      if (arrData.length > 0 && this.state.key == '') {
        this.setState({ key: arrData[0].id.toString() })
        this.props.onItemChange(arrData[0].id)
        console.log('choose first', arrData);
      } else {
        this.setState({ listData: arrData })
      }
    }
  }

  updateLst = () => {
    const a = Object.prototype.toString
    const arrData = a.call(this.props.arrData) == '[object Map]' ? [...this.props.arrData.values()] : this.props.arrData
    this.setState({ key: this.state.key, listData: arrData })
  }

  setcurKey = cKey => {
    console.log('ckey', cKey)
    this.setState({ key: cKey })
  }

  choosefirst() {
    console.log('choosefirst', this.state.listData)
    if (this.state.listData.length > 0) {
      this.setState({ key: this.state.listData[0].id.toString() })
      this.props.onItemChange(this.state.listData[0].id)
    }
  }

  handleClick = e => {
    console.log('menuchange', this.state)
    this.setState({ key: e.key })

    this.props.onItemChange(e.key)
    return

    const change = async () => {
      //this.props.onItemChange(e.key)
      await this.props.onItemChange(e.key)
    }

    change()
  }
  render() {


    return (
      <Menu
        style={{ width: '100%', ...this.props.cstyle }}
        mode="inline"
        onClick={e => this.handleClick(e)}
        selectedKeys={[this.state.key]}
        defaultSelectedKeys={[this.state.key]}
      >
        {
          this.state.listData.map(obj => {
            return <Menu.Item style={{ height: 40 }} key={obj.id.toString()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div title={this.props.namefun ? this.props.namefun(obj) : obj.name} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{this.props.namefun ? this.props.namefun(obj) : obj.name}</div>
                {this.props.onSwitch && <Switch ></Switch>}
              </div>
            </Menu.Item>
          }
          )
        }
      </Menu>
    );
  }
}

export const ScreenSet = props => {
  const [modal, contextHolder] = Modal.useModal();
  const wallList = useRef();
  const wallWidget = useRef();

  const [curWall, setCurWall] = useState({
    name: '新建大屏',
    id: 0,
    kvm: true,
    rate: 60,
    row: 0,
    col: 0,
    width: 1920,
    height: 1080,
    cellnum: 0,
    backid: 0
  })

  const [curcell, setCurcell] = useState(-1)
  const [chns, setChns] = useState([])

  const [curCells, setCurCells] = useState([])
  const [bmod, setBmod] = useState(false)
  const customrate = useRef({})

  // let usedChn = useMemo(() => 
  // {
  //   return []
  // }, []);
  const usedChn = useRef([])
  const lastInfo = useRef({})



  React.useEffect(() => {
    SCREEN.getWalls()
    return function cleanup() {
      SCREEN.clearCache('mspsScreenCfg')
    };
  }, [])

  React.useEffect(() => {
    if (!lastInfo.current.wall || lastInfo.current.wall.id != curWall.id || curWall.id == 0)
      lastInfo.current.wall = { ...curWall }
  }, [curWall])

  React.useEffect(() => {

    lastInfo.current.wallCells = [...curCells]
  }, [curCells])

  React.useEffect(() => {
    console.log('cells:', props.wallCells)
    setCurCells(props.wallCells)
  }, [props.walls])

  React.useEffect(() => {
    console.log('cells:', props.wallCells)
    setCurCells(props.wallCells)
  }, [props.wallCells])

  React.useEffect(() => {
    // console.log('channels:',props.channels)
    if (Object.keys(props.channels).length > 0) {

      const chns = Object.values(props.channels).filter(m => { return m.signal == 0 && !usedChn.current.includes(m.id) })
      console.log("flush chns", props.channels)
      console.log("flush chns", usedChn.current)
      console.log("flush chns", chns)
      setChns(chns)
    }
  }, [props.channels])

  React.useEffect(() => {
    console.log('nnnnnnnnnnnneeeeeeeeeeeeww:', props.cfgID.backID)
    if (props.cfgID.backID == undefined)
      return
    if (curWall.id == 0) {
      wallList.current.setcurKey(props.cfgID.backID.toString())
      curWallChange(props.cfgID.backID)
      console.log('nnnnnnnnnnnneeeeeeeeeeeeww:', props.cfgID.backID, props.walls, customrate.current)
      if (customrate.current.tvid != undefined) {
        customrate.current.tvid = props.cfgID.backID
        SCREEN.setRate(customrate.current)
      }
    } else {
      if (props.cfgID.backID == 0) {
        props.walls.delete(0)
        wallList.current.updateLst()
        console.log('pppppppp', props.walls)
      } else {
        SCREEN.getChannels(CHNTYPE.VOUT)
      }
    }
  }, [props.cfgID])



  const setWallData = (obj, index) => {
    // console.log('index:',typeof(index),'obj:',typeof(obj))
    const wall = { ...curWall }
    switch (index) {
      case 'ratecustom':
        customrate.current = { ...obj }
        console.log('customrate.current', customrate.current)
      case 'rate':
        wall.width = obj.width, wall.height = obj.height
        console.log('ratechange', obj)
        break;
      default:
        wall[index] = obj
        break;
    }

    wall.cellnum = wall.row * wall.col
    //props.walls.get(curWall.id).name = wall.name

    let _wall = props.walls.get(curWall.id)
    for (let key in _wall) {
      _wall[key] = wall[key]
    }
    //props.walls.set(curWall.id,wall)
    console.log('name changed', wall)
    setCurWall(wall)
    if (index == 'name' || index == 'fresh')
      return;
    const wallCells = []
    for (let i = 0; i < wall.row; i++) {
      for (let j = 0; j < wall.col; j++) {
        wallCells.push(
          {
            id: i * wall.col + j + 1,
            chnid: 0,
            startx: j * wall.width,
            starty: i * wall.height,
            width: wall.width,
            hight: wall.height
          }
        )
      }
    }
    console.log('setcells', wallCells)
    setCurCells(wallCells)
  }

  const batchAdd = () => {

    let tmpChns = [...chns]
    let tmpCells = [...curCells]

    for (let cell of tmpCells) {
      if (cell.chnid == 0 && chns.length > 0) {
        var chn = tmpChns.shift()
        if(!chn)
          break
        if (!usedChn.current.includes(chn.id))
          usedChn.current.push(chn.id)
        cell.chnid = chn.id
      }
    }
    setChns(tmpChns)
    setCurCells(tmpCells)
  }

  const curWallChange = id => {
    if (curWall.id == parseInt(id))
      return

    const _last = { ...lastInfo.current }
    console.log('lastInfo', _last)
    if (bmod && _last.wall) {

      const onCancel = () => {
        props.walls.set(_last.wall.id, _last.wall)
        console.log('lastInfo', _last)
        if (_last.wall.id == 0) {
          props.walls.delete(0)
        }
        wallList.current.setcurKey(id)
        wallList.current.updateLst()
        //setCurWall({ ...curWall })
      }

      const savefun = () => {

        let wall = props.walls.get(_last.wall.id)
        let err = ''
        if (wall.name == '')
          err = '大屏名称为空!'
        else if (!(wall.row && wall.col))
          err = '未配置子屏!'

        if (err != '') {
          message.error(err)
          onCancel()
          return
        }
        SCREEN.addWall({ wall: wall, cells: _last.wallCells })
      }

      Modal.confirm({
        title: '保存',
        icon: <ExclamationCircleOutlined />,
        content: '大屏配置未保存,是否保存?',
        okText: '确认',
        cancelText: '取消',
        onOk: savefun,
        onCancel: onCancel
      });
    }

    usedChn.current = []
    let wall = props.walls.get(parseInt(id))
    if (wall)
      setCurWall(props.walls.get(parseInt(id)))
    else return

    SCREEN.getWallCells(parseInt(id))
    SCREEN.getChannels(CHNTYPE.VOUT)
    setCurcell(-1)
    setBmod(false)
  }

  const addWall = () => {
    props.walls.set(0, { name: '新建大屏', id: 0, kvm: true, rate: 60, row: 0, col: 0, width: 1920, height: 1080, cellnum: 9 })
    setCurWall(props.walls.get(0))
    wallList.current.setcurKey('0')
    SCREEN.getChannels(CHNTYPE.VOUT)
    setBmod(true)
  }

  const delWall = () => {

    const delfun = () => {
      lastInfo.current = {}
      if (curWall.id != 0) SCREEN.delWall(curWall.id)

      props.walls.delete(curWall.id)
      wallList.current.choosefirst()

    }

    Modal.confirm({
      title: '删除',
      icon: <ExclamationCircleOutlined />,
      content: '是否删除大屏?',
      okText: '确认',
      cancelText: '取消',
      onOk: delfun
    });
  }

  const saveWall = () => {
    let err = ''
    if (curWall.name == '')
      err = '大屏名称为空!'
    else if (!(curWall.row && curWall.col))
      err = '未配置子屏!'

    if (err != '') {
      message.error(err)
      return
    }
    const tip={
      success:()=>message.success('保存成功')
    }
    props.walls.set(curWall.id, curWall)
    SCREEN.addWall({ wall: curWall, cells: curCells },tip)
    console.log('save walls', curWall);
    console.log('save walls', curCells);
    usedChn.current = []
    setBmod(false)
    //SCREEN.getChannels(CHNTYPE.VOUT)
  }

  const reSet = () => {
    setCurWall({
      name: '新建大屏',
      id: 0,
      kvm: true,
      rate: 60,
      row: 0,
      col: 0,
      width: 1920,
      height: 1080,
      cellnum: 0,
      backid: 0
    })
    setCurCells([])
    setCurcell(-1)
  }

  const getChnName = (chnID) => {
    if (chnID == 0)
      return { name: '', find: false }

    const chn = props.channels[chnID]
    if (chn)
      return { name: chn.name, find: true }

    return { name: '', find: false }
  }

  const oncellchoose = (cellid) => {
    setCurcell(cellid)
  }

  const setCellHeight = (heigth) => {
    if (curcell < 0)
      return
    const wallCells = [...curCells]
    const _add = heigth - wallCells[curcell].hight
    wallCells[curcell].hight = heigth

    for (let i = 0; i < wallCells.length; i++) {
      if (i == curcell)
        continue
      if (wallCells[i].starty == wallCells[curcell].starty) {
        wallCells[i].hight = wallCells[curcell].hight
        continue
      }

      if (wallCells[i].starty > wallCells[curcell].starty) {
        wallCells[i].starty += _add
      }
    }
    setCurCells(wallCells)
  }

  const setCellWidth = (width) => {
    if (curcell < 0)
      return
    const wallCells = [...curCells]
    const _add = width - wallCells[curcell].width
    wallCells[curcell].width = width

    for (let i = 0; i < wallCells.length; i++) {
      if (i == curcell)
        continue
      if (wallCells[i].startx == wallCells[curcell].startx) {
        wallCells[i].width = wallCells[curcell].width
        console.log('i curcell', i, curcell)
        continue
      }

      if (wallCells[i].startx > wallCells[curcell].startx) {
        wallCells[i].startx += _add
      }
    }
    console.log("wall cells", wallCells)
    setCurCells(wallCells)
  }

  const useChn = (id) => {
    if (!usedChn.current.includes(id))
      usedChn.current.push(id)
  }

  const unUseChn = (id) => {
    let index = usedChn.current.indexOf(id)
    if (index > 0)
      usedChn.current.splice(index, 1)

  }

  console.log('//////////////////////', props.walls)
  console.log('//////////////////////', curWall)

  return (
    <>
      <Prompt message={location => "大屏修改未保存, 是否确认离开?"} when={bmod} />
      <Layout style={{ width: '100%', height: '100%', overflowY: 'hidden', paddingTop: '0px' }}>
        <Sider>
          <Layout style={{ paddingTop: '0px', background: '#fafafa', height: '100%' }}>
            <div style={{ paddingLeft: '10px', border: '1px solid #d9d9d9', background: '#fafafa', height: '55px', display: 'flex', alignItems: 'center' }}>
              <Label >大屏列表</Label>
            </div>
            <Header style={{ background: 'white', height: '40px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: 0, }}>
              <Button type='primary' style={{ width: 90 }} onClick={addWall}>
                添加
          </Button>
              <Button style={{ width: 90 }} onClick={delWall}>
                删除
          </Button>
            </Header>

            <Content
              style={{
                overflow: 'auto',
                height: '90vh',
                background: 'white'
              }}
            >
              {/* {props.walls.size == 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='没有大屏' />} */}
              <MenuList arrData={props.walls} onItemChange={curWallChange} ref={wallList} wall={curWall} />
            </Content>

          </Layout>
        </Sider>
        <Content>
          <Card
            style={{ width: "100%", height: '100%' }} bodyStyle={{ padding: '0px' }}>
            <Row gutter={[15, 0]} type="flex" style={{ height: '100%' }}>
              <Col span={4}><ScreenWidgetLeft setBmod={setBmod} widget={wallWidget} usedChn={{ useChn, unUseChn }} ondataChange={setWallData} batchAdd={batchAdd} wallCells={curCells} wall={curWall} chns={chns}> </ScreenWidgetLeft></Col>
              <Col span={19} style={{ height: '100%', paddingTop: '10px' }}>
                <Row gutter={[0, 20]} style={{ border: '1px solid #e7e7e7', }} >
                  <ScreenWidgetRight hChange={setCellHeight} wChange={setCellWidth} wall={curWall} wallCells={curCells} curid={curcell} > </ScreenWidgetRight>
                </Row>
                <Row gutter={[0, 10]} style={{ border: '1px solid #e7e7e7', height: '700px' }}>
                  <ScreenPreview ondataChange={setWallData}>
                    <ScreenWidget wallCells={curCells} wall={curWall} ref={wallWidget} getChnName={getChnName} oncellchoose={oncellchoose}></ScreenWidget>
                  </ScreenPreview>
                </Row>
                <Row gutter={[0, 20]}>
                  <Col span={2} ><Button type='primary' style={{ width: 90 }} onClick={saveWall}>保存大屏</Button></Col>
                  <Col span={2} ><Button disabled={curWall.id != 0} style={{ width: 90 }} onClick={reSet}>重置</Button></Col>
                </Row>
              </Col>
            </Row>

          </Card>
        </Content>
      </Layout>
    </>
  );
}

var backChn =  //用于拖拽事件返回
{
  Index: 0,
  Name: '',
  ID: 0
}

var allrate = [[1920, 1080], [3840, 2160], [0, 0]]

const ScreenWidgetLeft = props => {
  const { wall } = props

  const [lan, setLan] = React.useState()
  const [gw, setGw] = React.useState()
  const [chn, setChn] = React.useState([])
  const [cfgrate, setCfgrate] = React.useState(false)
  const [rateinfo, setRateinfo] = React.useState({ max: 1, cur: 0 })
  const [rateData, setRateData] = React.useState({ width: 1920, height: 1080, fresh: 60 })
  const [selectedKey, setSelectedKey] = useState()
  const { setBmod } = props

  const dispatch = useDispatch();
  const mapupdate = useSelector(({ mspsScreenRate }) => mspsScreenRate.rate)

  React.useEffect(() => {
    // if(wall.id==0)
    //   return
    const _rate = { ...rateinfo }
    if (wall.width == 1920 && wall.height == 1080)
      _rate.max = 1, _rate.cur = 0
    else if (wall.width == 3840 && wall.height == 2160)
      _rate.max = 1, _rate.cur = 1
    else {
      _rate.max = 2, _rate.cur = 2
      allrate[2] = [wall.width, wall.height]
    }

    if(rateinfo.max==2)
    _rate.max = 2
    setRateinfo(_rate)
    console.log('setRate', wall, _rate)
  }, [wall])

  React.useEffect(() => {
    let cc = props.chns.map(
      m => {
        return {
          Name: m.base.name,
          ID: m.base.id
        }
      }
    )

    setChn(cc)
  }, [props.chns])


  React.useEffect(() => {
    console.log('mapupdate状态改变了，新状态如下', mapupdate)
  }, [mapupdate])


  const handleRateChange = (value) => {
    setRateinfo({ ...rateinfo, cur: parseInt(value) })
    console.log('rateinfo', rateinfo)
    props.ondataChange({ width: allrate[parseInt(value)][0], height: allrate[parseInt(value)][1] }, 'rate');
    if(value<2)
      props.ondataChange({...rateData, width: allrate[parseInt(value)][0], height: allrate[parseInt(value)][1], fresh: 60,module:0 }, 'ratecustom')
    else
      props.ondataChange(rateData, 'ratecustom')   
  }

  const handleChange = (e) => {
    const { value } = e.target
    switch (e.target.id) {
      case 'inputName':
        let _value = value
        //_value=_value.replace(/[^\u4e00-\u9fa5\w_\-*]/g,'')
        _value = limitInput(_value, /[^\u4e00-\u9fa5\w_\-*]/g, 63)
        props.ondataChange(_value, 'name');
        setBmod(true)
        break;
      case 'inputRow':
        if (parseInt(value) > 8) {
          message.error('物理屏最大不超过8行!')
          return
        }
        props.ondataChange(parseInt(value) ? parseInt(value) : 0, 'row');
        break;
      case 'inputCol':
        if (parseInt(value) > 12) {
          message.error('物理屏最大不超过12列!')
          return
        }
        props.ondataChange(parseInt(value) ? parseInt(value) : 0, 'col');
        break;
      case 'fresh':
        props.ondataChange(parseInt(value) ? parseInt(value) : 0, 'fresh');
        break;
    }
  }

  const onDrag = (e, item) => {
    // console.log(e.nativeEvent.target.innerText,item)
    e.dataTransfer.setData('ID', item.ID)
    e.dataTransfer.setData('Name', item.Name)
  }

  const onDragEnd = (e, item) => {
    if (e.dataTransfer.dropEffect == 'none')
      return

    props.usedChn.useChn(item.ID)

    let tmp = [...chn]
    tmp = tmp.filter(function (node) {
      return node != item
    })

    if (backChn.ID != 0) {
      if (backChn.Name != backChn.ID.toString()) {

        tmp = [{ ...backChn }, ...tmp]
      }
      props.usedChn.unUseChn(backChn.ID)
      backChn.ID = 0
    }
    setChn(tmp)
    setBmod(true)
  }

  function formatter(value) {
    switch (value) {
      case 0:
        return `${allrate[0][0]}*${allrate[0][1]}`
      case 1:
        return `${allrate[1][0]}*${allrate[1][1]}`
      case 2:
        return `${allrate[2][0]}*${allrate[2][1]}`
    }
  }

  const batchAdd = () => {
    props.batchAdd()
    setBmod(true)
  }

  const giveBack = () => {
    console.log(props.widget)
    let backChn = props.widget.current.giveBack()
    props.usedChn.unUseChn(backChn.ID)
    setBmod(true)
    if (backChn.Name == backChn.ID.toString())
      return
    let cc = [...chn]
    cc.push(backChn)
    setChn(cc)
  }

  const getRateData = (index) => {
    switch (index) {
      case 0:
        return { width: allrate[0][0], height: allrate[0][1], fresh: 60 }
      case 1:
        return { width: allrate[1][0], height: allrate[1][1], fresh: 60 }
      case 2:
        return rateData;

    }
    return {}
  }
  const getRate = (timeout) => {

    console.log('kkkkkkkkkkkkkkk', mapupdate)
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => {
        if (mapupdate.id == 0)
          resolve('timeout')
        else
          resolve('ok')
      }, timeout)
    })
  }

  const cfgRate = async () => {
    if (wall.id == 0) {
      console.log('rateData', rateData)
      setCfgrate(true)
    } else {
      setCfgrate(true)
      SCREEN.getRate(wall.id)
      const ret = await getRate(5000)
    }
  }

  const rateVisible = () => {
    console.log('lllklkklkk', mapupdate)
    if (wall.id == 0)
      return crate
    else
      return crate && mapupdate.tvid

  }

  const onFinish = (data) => {
    if (wall.id != 0) return
    const _rate = [data.width, data.height]
    if (_rate.toString() != allrate[0].toString() && _rate.toString() != allrate[1].toString()) {
      allrate[2] = [data.width, data.height]
      setRateinfo({ max: 2, cur: 2 })
      data.module = 1
    }
    props.ondataChange(data, 'ratecustom')
    setRateData(data)
  }

  const handleSelect = (key) => {
    console.log('sfsdfsdfsfdsdf', key)
    if (selectedKey == key) return;
    setSelectedKey(key)
  }


  return (
    <>
      <Collapse bordered={true} defaultActiveKey={["1", "2", "3"]}>
        <Panel header="大屏属性" key="1">
          <Row gutter={[8, 8]}>
            <Col span={7}><Label>名称:</Label></Col>
            <Col span={16}><Input autoComplete='off' id='inputName' value={wall.name} onChange={v => handleChange(v)}></Input></Col>
          </Row>
          <Row gutter={[8, 8]}>
            <Col span={7}><Label>ID:</Label></Col>
            <Col span={16}><Label>{wall.id}</Label></Col>
          </Row>
          <Row gutter={[8, 8]}>
            <Col span={7}><Label>刷新率:</Label></Col>
            <Col span={16}><Input id='fresh' disabled={true} value={wall.rate} onChange={v => handleChange(v)}></Input></Col>
          </Row>
          <Row gutter={[8, 8]}>
            <Col span={6}><Label></Label></Col>
          </Row>
          <Space>
            <Label>分辨率:</Label>
            <Slider disabled={wall.id != 0} defaultValue={0} max={rateinfo.max} value={rateinfo.cur} tooltipVisible onChange={v => handleRateChange(v)} style={{ minWidth: 80 }} tipFormatter={formatter} />
            <Button title='自定义分辨率' icon={<SettingOutlined />} onClick={cfgRate}></Button>
            <CustonRateModal visible={cfgrate} setVisible={setCfgrate} onFinish={onFinish} data={wall.id == 0 ? getRateData(rateinfo.cur) : { ...mapupdate, tvid: wall.id }}></CustonRateModal>
          </Space>
        </Panel>
        <Panel header="物理屏配置" key="2">
          <Row gutter={[8, 8]}>
            <Col span={3}><Label>行:</Label></Col>
            <Col span={9}><Input disabled={wall.id != 0} min={0} max={8} id='inputRow' value={wall.row} onChange={v => handleChange(v)}></Input></Col>
            <Col span={3}><Label>列:</Label></Col>
            <Col span={9}><Input disabled={wall.id != 0} min={0} max={12} id='inputCol' value={wall.col} onChange={v => handleChange(v)}></Input></Col>
          </Row>
        </Panel>
        <Panel header="通道列表(拖拽上屏)" key="3">
          <Row gutter={[8, 8]}>
            <div style={{ height: '270px', width: '100%', overflow: 'auto' }}>
              <Col span={24} style={{ height: '100%' }}>
                <List
                  size="small"
                  bordered
                  dataSource={chn}
                  renderItem={item => <List.Item onMouseDown={() => handleSelect(item.ID)}
                    style={{
                      background: selectedKey == item.ID ? "#BAE7FF" : 'inherit',
                      userSelect: 'none', display: 'flex', justifyContent: 'space-bettwen'
                    }} draggable='true' onDragStart={e => onDrag(e, item)} onDragEnd={e => onDragEnd(e, item)}>{item['Name']}</List.Item>} />
              </Col>
            </div>
          </Row>

        </Panel>
      </Collapse>
      <Row gutter={[0, 8]} style={{ paddingTop: '5px' }}>
        <Col span={14}><Button style={{ width: '90px' }} onClick={batchAdd} >批量添加</Button></Col>
        {/* <Col span={14}><div></div></Col> */}
        <Col span={10}><Button style={{ width: '90px' }} onClick={giveBack} >&lt;&lt;</Button></Col>
      </Row>
    </>
  );
}

const ScreenPreview = props => {

  return (
    <div style={{ width: '100%', height: '100%' }}>
      {props.children}
    </div>
  );
}

const ScreenWidgetRight = props => {
  const [rect, setRect] = React.useState({ startx: 0, starty: 0, width: 0, hight: 0 })
  const { curid } = props
  console.log('curid', curid)

  React.useEffect(() => {
    if (curid >= 0) {
      let startx = props.wallCells[curid].startx;
      let starty = props.wallCells[curid].starty;
      let width = props.wallCells[curid].width;
      let hight = props.wallCells[curid].hight;
      setRect({ startx, starty, width, hight })
    }else setRect({ startx: 0, starty: 0, width: 0, hight: 0 })
  }, [curid])

  const onWchange = (w) => {
    setRect({ ...rect, width: w })
  }

  const onHchange = (h) => {
    setRect({ ...rect, hight: h })

  }

  const onApply = () => {
    if (props.wall.id != 0)
      return

    if (rect.width > props.wall.width) {
      message.error('宽度不能超过初始分辨率!')
      let startx = props.wallCells[curid].startx;
      let starty = props.wallCells[curid].starty;
      let width = props.wallCells[curid].width;
      let hight = props.wallCells[curid].hight;
      setRect({ startx, starty, width, hight })
      return
    }

    if (rect.hight > props.wall.height) {
      message.error('高不能超过初始分辨率!')
      let startx = props.wallCells[curid].startx;
      let starty = props.wallCells[curid].starty;
      let width = props.wallCells[curid].width;
      let hight = props.wallCells[curid].hight;
      setRect({ startx, starty, width, hight })
      return
    }

    props.wChange(rect.width)
    props.hChange(rect.hight)
  }

  return (
    <div>
      <Row gutter={[5, 0]} style={{ paddingTop: '6px', paddingBottom: '6px' }}>
        <Col span={2}><Label cstyle={{ textAlign: 'center' }}>水平起始:</Label></Col>
        <Col span={2}><Input disabled={true} value={rect.startx} onChange={v => setLan(v)}></Input></Col>
        <Col span={2}><Label cstyle={{ textAlign: 'center' }}>垂直起始:</Label></Col>
        <Col span={2}><Input disabled={true} value={rect.starty} onChange={v => setLan(v)}></Input></Col>
        <Col span={2}><Label cstyle={{ textAlign: 'center' }}>垂直宽度:</Label></Col>
        <Col span={2}><Input disabled={props.wall.id != 0} value={rect.width} onChange={v => onWchange(parseInt(v.target.value))}></Input></Col>
        <Col span={2}><Label cstyle={{ textAlign: 'center' }}>水平高度:</Label></Col>
        <Col span={2}><Input disabled={props.wall.id != 0} value={rect.hight} onChange={v => onHchange(parseInt(v.target.value))}></Input></Col>
        <Col span={2} offset={1}><Button type='primary' style={{ width: 90 }} onClick={onApply}>应用</Button></Col>
      </Row>
    </div>
  );
}

function detectResize(_element) {
  let promise = {};
  let _listener = [];

  promise.addResizeListener = function (listener) {
    if (typeof (listener) != "function") { return; }
    if (_listener.includes(listener)) { return; };

    _listener.push(listener);
  };

  promise.removeResizeListener = function (listener) {
    let index = _listener.indexOf(listener);
    if (index >= 0) { _listener.splice(index, 1); }
  };

  let _size = { width: _element.clientWidth, height: _element.clientHeight };

  function checkDimensionChanged() {
    let _currentSize = { width: _element.clientWidth, height: _element.clientHeight };
    if (_currentSize.width != _size.width || _currentSize.height != _size.height) {
      let previousSize = _size;
      _size = _currentSize;

      let diff = { width: _size.width - previousSize.width, height: _size.height - previousSize.height };

      fire({ width: _size.width, height: _size.height, previousWidth: previousSize.width, previousHeight: previousSize.height, _element: _element, diff: diff });
    }

    _size = _currentSize;
  }

  function fire(info) {
    if (!_element.parentNode) { return; }
    _listener.forEach(listener => { listener(info); });
  }

  window.addEventListener("resize", event => {
    checkDimensionChanged();
  });

  return promise;
}

export const ScreenWidget = React.forwardRef((props, ref) => {

  const { wall } = props
  const { wallCells } = props

  const [choose, setChoose] = useState(-1)

  let _rows = []

  const [rows, setRows] = useState([])
  const chose = React.useRef();

  const margin = useMemo(() => {
    console.log('1212312')
    return {
      width: '',
      height: ''
    }
  }, [])
  // const [margin, setMargin] = useState({
  //   width:'',
  //   height:''
  // })

  // const margin = {
  //   width:'',
  //   height:''
  // }
  React.useEffect(() => {
    setRows([])
    setChoose(-1)
  }, [wall])

  React.useEffect(() => {


    setRows([])
    console.log('celllllllllllllllllllllllllllllllllll', wallCells)

  }, [wallCells])

  const giveBack = () => {

    let target = document.getElementById(`chooseddiv${choose}`);
    console.log('tttttttttttttttttttttt', target);
    let back = JSON.parse(target.getAttribute('data-item'))

    let newData = { Index: choose, ID: 0, Name: '' }
    target.setAttribute('data-item', JSON.stringify(newData))
    wallCells[choose].chnid = 0
    target.innerHTML = ''

    return { Name: back.Name, ID: back.ID }
  }

  //ref.current = giveBack
  useImperativeHandle(ref, () => ({
    giveBack: giveBack
  }));

  const createRow = () => {
    if (wallCells.length == 0)
      return
    let _div = document.getElementById("resizediv")
    if (!_div)
      return
    const _pw = _div.offsetWidth
    const _ph = _div.offsetHeight
    console.log('createRow:wall:', wall)

    console.log('w:', _pw)
    console.log('h:', _ph)
    console.log('row:', wall.row)
    console.log('col:', wall.col)
    let w = 0
    let h = 0

    if (wallCells.length == wall.row * wall.col) //简单模式
    {
      for (let j = 0, len = wallCells.length; j < len; j++) {
        let _w = wallCells[j].startx + wallCells[j].width
        let _h = wallCells[j].starty + wallCells[j].hight

        if (w < _w)
          w = _w

        if (h < _h)
          h = _h
      }

      let scaleRow = []
      let scaleCol = []
      for (let i = 0; i < wall.row; i++) {
        scaleRow.push(wallCells[i * wall.col].hight / h)
      }

      for (let j = 0; j < wall.col; j++) {
        scaleCol.push(wallCells[j].width / w)
      }


      console.log('scalerow:', h, scaleRow)
      console.log('scalecol:', scaleCol)
      console.log('rows:', _rows)


      let scale = 1.0
      if (h * _pw >= w * _ph)  //以高为基准
      {
        scale = h / _ph
        margin.height = '100%'
        margin.width = w / scale + 'px'
      }
      else							//以宽为基准
      {
        scale = w / _pw
        margin.height = h / scale + 'px'
        margin.width = '100%'
      }

      console.log('margin:', margin)

      let chnID = 0
      let chnName = ''

      let index = 0
      for (let i = 0; i < wall.row; i++) {
        const _cols = []
        for (let j = 0; j < wall.col; j++) {
          index = i * wall.col + j
          chnID = wallCells[index].chnid
          if (props.getChnName)
            chnName = props.getChnName(chnID).name

          _cols.push(<div key={index} id={`chooseddiv${index}`} className='chooseddiv' data-item={`{"Index":${index},"Name":"${chnName}","ID":${chnID}}`}
            style={{ width: scaleCol[j] * 100 + '%', height: '100%', border: choose == (index) ? '2px solid #1890ff' : '1px solid #505050' }}
            draggable='true'
            onClick={e => cellClick(e)}
            onDragStart={e => { e.stopPropagation(); e.preventDefault() }}
            onDrop={e => drop(e)}
            onDragOver={e => allowDrop(e)}>{chnName}</div>)
        }
        _rows.push(<div key={i} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: scaleRow[i] * 100 + '%' }}>{_cols}</div>)
      }
      console.log('rows', _rows)
    }

  }

  createRow()


  React.useEffect(() => {
    chose.current = 0
    //不起作用

    // let MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver
    // // 选择目标节点
    // let target = document.getElementById('resizediv');
    // // 创建观察者对象
    // let observer = new MutationObserver((mutations)=>{
    //   console.log('resize')
    //   mutations.forEach((mutation)=>{
    //     console.log(mutation)
    //   });
    // });
    // // 配置观察选项:
    // let config = {
    //   attributes: true,//检测属性变动
    //   childList: true,//检测子节点变动
    //   characterData: true//节点内容或节点文本的变动。
    // }
    // // 传入目标节点和观察选项
    // observer.observe(target, config);
    // // /停止观察
    // //           observer.disconnect(); 







    // let _div = document.getElementById("resizediv");
    // let detector = detectResize(_div);

    // let listener = info => { console.log("new width: ", info.width, "  new height: ", info.height); };
    // detector.addResizeListener(listener);
  }, [])


  const handleResize = useCallback(() => {
    let size = {
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight,
    }
    console.log('ssssssssssssssssssssssssss', size)
    setRows([])
  }, [])

  useEffect(() => {
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [handleResize])


  const cellClick = (e) => {
    setChoose(JSON.parse(e.nativeEvent.target.getAttribute('data-item')).Index)
    props.oncellchoose(JSON.parse(e.nativeEvent.target.getAttribute('data-item')).Index)
    e.stopPropagation()
    e.preventDefault()
  }

  function drop(ev) {
    ev.preventDefault();

    backChn = JSON.parse(ev.nativeEvent.target.getAttribute('data-item'))
    let dropData = { Index: backChn.Index, ID: parseInt(ev.dataTransfer.getData('ID')), Name: ev.dataTransfer.getData('Name') }
    ev.nativeEvent.target.setAttribute('data-item', JSON.stringify(dropData))
    wallCells[backChn.Index].chnid = dropData.ID
    ev.nativeEvent.target.innerHTML = dropData.Name

  }

  function allowDrop(ev) {
    // console.log(ev.dataTransfer)
    ev.stopPropagation()
    ev.preventDefault()
  }


  // const rows = [];
  // const cols = [];
  // const handleChange = (e) => {
  //   for (let i = 0; i < e.col; i++) {
  //     cols.push(
  //       <Col key={i} style={{ height: '100%' }} span={Math.floor(24 / wall.col)} type="flex" justify="space-around" align="middle">
  //         <div className='chooseddiv' data-item='{"Name":"","ID":0}' style={{ height: '100%', border: '1px solid yellow' }} draggable='true' onDragStart={e => { e.stopPropagation(); e.preventDefault() }} onDrop={e => drop(e)} onDragOver={e => allowDrop(e)}>小屏</div>
  //       </Col>
  //     )
  //   }



  //   var hPercent = Math.floor(100 / e.row);

  //   for (let i = 0; i < e.row; i++) {
  //     rows.push(
  //       <Row key={i} style={{ width: '100%', height: (hPercent.toString() + '%') }}>
  //         {cols}
  //       </Row>
  //     )
  //   }
  // }

  // handleChange(wall)

  console.log('....', margin.height, margin.width)
  return (
    <div id='resizediv' style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }} onChange={(e) => { console.log('ffffffffffffffffffffffffffffffffffff') }}>
      <div style={{ boxShadow: '0px 0px 10px 5px rgba(0,0,0,0.7)', height: margin.height, width: margin.width }}>
        {_rows}
      </div>
    </div>
  );

})


const mapStateToProps = state => {
  return {
    walls: state.mspsScreenCfg.screen.walls,
    cfgID: state.mspsScreenCfg.screen.newID,
    wallCells: state.mspsScreenCfg.cells,
    channels: state.mspsDev.vouts,
  };
};

export default connect(mapStateToProps)(ScreenSet)