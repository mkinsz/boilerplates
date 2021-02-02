import { MenuList } from './screenset';
import { ScreenWidget } from './screenset';

import React from "react";
import { Button, Menu, Modal } from 'antd';
import { Layout } from 'antd';
import { Radio } from 'antd';
import { Checkbox } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Label } from '../../public'
const { Header, Footer, Sider, Content } = Layout;

import { Space, Collapse, Card, Row, Col, Slider, Table, Input, List, InputNumber, Popconfirm, Form, Tabs, message } from "antd";
import { useState, useRef, useImperativeHandle, useEffect } from 'react';

import { Select } from 'antd';
import { TimePicker } from 'antd';
import moment from 'moment';
import { connect, useSelector } from 'react-redux';
import { SCREEN } from "../../../actions";
import { Prompt } from 'react-router-dom';

//import './index.css'

const { Panel } = Collapse;
const { Option } = Select;

const { TextArea } = Input;




String.prototype.padLeft =
    Number.prototype.padLeft = function (total, pad) {
        return (Array(total).join(pad || 0) + this).slice(-total);
    }

const span = document.createElement("span")
span.style.visibility = "hidden"
document.body.appendChild(span)
//根据宽高计算自适应字号
function textSize(info) {

    let result = {}


    console.log('{reuslt}', { ...result })

    span.style.fontSize = '20pt'
    span.style.fontFamily = info.fontname
    span.style.display = "inline-block"
    span.style.lineHeight = 'normal'
    span.style.fontWeight = (info.fontform == 2 || info.fontform == 4) ? 'bold' : 'normal'
    //斜体不起作用
    //span.style.fontStyle= (info.fontform == 1 || info.fontform == 4)?'italic':'normal'

    if (info.direction == 0) {
        // if (typeof span.textContent != "undefined") {
        //     span.textContent = text
        // } else {
        span.innerText = info.context
        // }
    } else {
        span.innerHTML = info.context.split('').join('<br/>')
    }

    result.width = span.offsetWidth
    result.height = span.offsetHeight
    //document.body.appendChild(span)
    // result.width = parseFloat(window.getComputedStyle(span).width) - result.width
    // result.height = parseFloat(window.getComputedStyle(span).height) - result.height
    console.log('{reuslt}', info.fontFamily)
    console.log('{reuslt}', { ...result })
    let scale = 0.0
    let ret = 20

    if (info.width * result.height > info.height * result.width) //高为基准
        scale = info.height / result.height
    else
        scale = info.width / result.width

    ret = 20 * scale + 0.5
    console.log('{}', { result, scale })
    console.log('{ret}', 20 * scale)
    console.log('ret', parseInt(ret))

    return parseInt(ret)

    console.log('resualt1', result)
    span.style.fontSize = '30px'
    span.style.fontFamily = fontFamily
    // document.body.removeChild(span)
    // document.body.appendChild(span)
    result1.width = parseFloat(window.getComputedStyle(span).width) - result1.width
    result1.height = parseFloat(window.getComputedStyle(span).height) - result1.height
    console.log('resualt2', result1)
    //document.body.removeChild(span)
    return result;
}

export const ScreenOsd = props => {


    const [form] = Form.useForm();

    const [adaption, setAdaption] = useState(false)

    const [curOsd, setCurOsd] = useState(
        {
            id: 0,
            visible: true,
            adaption: false,
            startx: 0,
            starty: 0,
            width: 0,
            height: 0,
            fontname: '黑体',
            fontstyle: 0,
            fontsize: 0,
            fontform: 0,
            direction: 0,
            fontclr: 0,
            context: ''
        }
    )

    const [wallwh, setWallwh] = useState([0, 0])
    const [osdLstData, setOsdLstData] = useState([])
    const [curwall, setCurwall] = useState(0)
    const [preview, setPreview] = useState(false)
    const [bmod, setBmod] = useState(false)
    const [buse, setBuse] = useState(false)

    const colorLabel = React.useRef();
    const osdLst = React.useRef();
    const fontsize = React.useRef();

    const walls = useSelector(({mspsScreenCfg}) => mspsScreenCfg.screen.walls)
    const wallCells = useSelector(({mspsScreenCfg}) => mspsScreenCfg.cells)
    const osd = useSelector(({mspsScreenOsd}) => mspsScreenOsd.osd.cur)
    const osdStatus = useSelector(({mspsScreenOsd}) => mspsScreenOsd.osd.status)

    React.useEffect(() => {
        SCREEN.getWalls()
    }, [])


    // useEffect(() => {
    //     console.log('osd used',osdstatus)
    // }, [osdstatus])

    React.useEffect(() => {

        console.log('walls effect 11111111111111')
    }, [walls])

    React.useEffect(() => {
        let w = 0
        let h = 0
        for (let j = 0, len = wallCells.length; j < len; j++) {
            let _w = wallCells[j].startx + wallCells[j].width
            let _h = wallCells[j].starty + wallCells[j].hight

            if (w < _w)
                w = _w

            if (h < _h)
                h = _h
        }

        setWallwh([w, h])
    }, [wallCells])

    React.useEffect(() => {

        console.log('osd used', osdStatus)
        //if(osdStatus.ack=='/msp/v2/tv/osd/cfg/add/ack')
        switch (osdStatus.ack) {
            case '/msp/v2/tv/osd/add/ack':
                {
                    if(buse)
                        message.success('停止使用成功')
                    else
                        message.success('使用成功')

                    setBuse(!buse)
                    break;
                }
            case '/msp/v2/tv/osd/query/ack':
                {
                    setBuse(osdStatus.buse)
                    console.log('osd used',osdStatus.buse)
                    break;
                }
        }

    }, [osdStatus])

    React.useEffect(() => {

        console.log('osd effect 11111111111111', osd)
        if (osd.osd.length > 0)
            form.resetFields()

        setOsdLstData(osd.osd)
    }, [osd])

    React.useEffect(() => {
        console.log('form.resetFields()')
        form.resetFields()
        colorLabel.current.style.background = '#' + curOsd.fontclr.toString(16).padLeft(6, '0')
    }, [curOsd, wallwh])





    function getname(e) {
        return '文字' + e.id
    }



    function handleChange(value) {
        console.log(`selected ${value}`);
    }

    function chooseColor(value) {
        console.log(`selected ${value}`);
        console.log(colorLabel)
        colorLabel.current.style.background = value

        console.log('num:', parseInt(value.replace(/#/, '0x')))
    }

    function handleAdd() {
        if (osdLstData.length == 3)
            return message.error('字幕最多添加3个')

        let allId = [0, 1, 2]
        let unUse = allId.filter((id) => {
            return osdLstData.findIndex((data) => { return data.id == id }) == -1
        })
        const tmp = {
            id: 0,
            visible: true,
            adaption: false,
            startx: 0,
            starty: 0,
            width: 0,
            height: 0,
            fontname: '黑体',
            fontstyle: 0,
            fontsize: 0,
            fontform: 0,
            direction: 0,
            fontclr: 0,
            context: ''
        }
        tmp.id = unUse[0]
        setOsdLstData([...osdLstData, tmp])
        osdLst.current.setcurKey(tmp.id.toString())
        setCurOsd(tmp)
        setBmod(true)
    }

    function handleDel() {



        const delfun = () => {
            let leftData = osdLstData.filter(data => { return data.id != curOsd.id })
            setOsdLstData(leftData)
            if (leftData.length > 0) {
                setCurOsd(leftData[leftData.length - 1])
                osdLst.current.setcurKey(leftData[leftData.length - 1].id.toString())
            }
            setBmod(true)

        }

        Modal.confirm({
            title: '删除',
            icon: <ExclamationCircleOutlined />,
            content: '是否删除字幕?',
            okText: '确认',
            cancelText: '取消',
            onOk: delfun
        });
    }

    const curOsdChange = id => {
        console.log('curOsdChange', parseInt(id))
        let info = osdLstData.find(e => { return e.id == parseInt(id) })
        console.log('osd info:', osdLstData)
        if (info) {
            setCurOsd(info)
        }
    }

    const curWallChange = id => {

        if (bmod) {

            const savefun = () => {
                SCREEN.delOsd(curwall)
                for (let osd of osdLstData) {
                    SCREEN.addOsd({ id: curwall, osd: [osd] })
                }
            }

            Modal.confirm({
                title: '保存',
                icon: <ExclamationCircleOutlined />,
                content: '有未保存字幕配置,是否保存?',
                okText: '确认',
                cancelText: '取消',
                onOk: savefun
            });
        }


        console.log('curWallChange', parseInt(id))
        SCREEN.getWallCells(parseInt(id))
        SCREEN.getOsds(parseInt(id))
        SCREEN.getOsdUse(parseInt(id))
        // osdLst.current.setcurKey('')
        setCurwall(parseInt(id))
        if (osdLst.current)
            osdLst.current.setcurKey('')

        setBmod(false)

        const tmp = {
            id: 0,
            visible: true,
            adaption: false,
            startx: 0,
            starty: 0,
            width: 0,
            height: 0,
            fontname: '黑体',
            fontstyle: 0,
            fontsize: 0,
            fontform: 0,
            direction: 0,
            fontclr: 0,
            context: ''
        }
        setCurOsd(tmp)
    }


    const onFinish = values => {
        console.log('Success:', osdLstData);
        SCREEN.delOsd(curwall)
        for (let osd of osdLstData) {
            SCREEN.addOsd({ id: curwall, osd: [osd] })
        }
        setTimeout(() => message.success('保存成功'), 200)
        setBmod(false)
    };

    const onFinishFailed = errorInfo => {
        console.log('Failed:', errorInfo);
    };

    const onValuesChange = (val, allVals) => {

        console.log('change', allVals)
        let info = osdLstData.find(e => { return e.id == curOsd.id })
        if (info) {
            Object.keys(val).forEach(function (key) {
                switch (key) {
                    case 'fontclr':
                        info[key] = parseInt(val[key].replace(/#/, '0x'))
                        break;
                    case 'startx':
                    case 'starty':
                    case 'fontsize':
                        info[key] = parseInt(val[key])
                        break;
                    case 'direction':
                    case 'width':
                    case 'height':
                        info[key] = parseInt(val[key])
                        if (info.adaption) {
                            const size = textSize(info)
                            info.fontsize = size
                            form.setFieldsValue({ fontsize: info.fontsize.toString() })
                            //fontsize.current.input.value = info.fontsize.toString()
                        }
                        break;
                    case 'fontname':
                    case 'context':
                        info[key] = val[key]
                        if (info.adaption) {
                            const size = textSize(info)
                            info.fontsize = size
                            form.setFieldsValue({ fontsize: info.fontsize.toString() })
                            //fontsize.current.input.value = info.fontsize.toString()
                        }
                        break;
                    case 'bold':
                    case 'italic':
                        {
                            const _val = (allVals.italic ? 1 : 0) + (allVals.bold ? 2 : 0)
                            console.log('_val', _val)
                            info.fontform = _val == 0 ? 0 : Math.pow(2, _val - 1)
                            if (info.adaption) {
                                const size = textSize(info)
                                info.fontsize = size
                                form.setFieldsValue({ fontsize: info.fontsize.toString() })
                            }
                        }
                        break;
                    case 'underline':
                    case 'strikethrough':
                        {
                            const _val = (allVals.strikethrough ? 1 : 0) + (allVals.underline ? 2 : 0)
                            console.log('_val', _val)
                            info.fontstyle = _val == 0 ? 0 : Math.pow(2, _val - 1)
                        }
                        break;
                    case 'adaption':
                        if (val[key]) {

                            //fontsize.current.input.disabled = true
                            console.log(info.fontname, info.context, info.width, info.height, info.direction)
                            const size = textSize(info)
                            info.fontsize = size
                            //fontsize.current.input.value = info.fontsize.toString()
                            form.setFieldsValue({ fontsize: info.fontsize.toString() })
                            form.setFieldsValue({ adaption: true })
                        } else {
                            form.setFieldsValue({ adaption: false })
                            //fontsize.current.input.disabled = false
                        }
                        setAdaption(val[key])
                        info[key] = val[key]
                        setCurOsd({ ...info })
                        return
                        break;
                    default:
                        info[key] = val[key]
                        break;
                }
            })
            setCurOsd(info)
            setBmod(true)
        }
    }

    const onUse = () => {
        console.log('send')
        SCREEN.useOsd(curwall, !buse)
    }

    const layout = {
        labelCol: {
            span: 5,
        },
        wrapperCol: { span: 12 },
    }

    const tailLayout = {
        wrapperCol: { offset: 30, span: 24 },
    };

    const commit = (id, rect) => {
        let info = osdLstData.find(e => { return e.id == id })
        info.startx = parseInt(rect[0] + 0.5)
        info.starty = parseInt(rect[1] + 0.5)
        info.width = parseInt(rect[2] + 0.5)
        info.height = parseInt(rect[3] + 0.5)
        if (info.adaption) {
            const size = textSize(info)
            info.fontsize = size
        }
        if (curOsd.id == info.id) {
            form.setFieldsValue({ startx: info.startx })
            form.setFieldsValue({ starty: info.starty })
            form.setFieldsValue({ width: info.width })
            form.setFieldsValue({ height: info.height })
            form.setFieldsValue({ fontsize: info.fontsize.toString() })
            setCurOsd(info)
        }
    }

    return (
        <>
            <Prompt message={location => "字幕修改未保存, 是否确认离开?"} when={bmod} />
            <Layout style={{ width: '100%', height: '100%', overflowY: 'hidden', paddingTop: '0px' }} >
                <Sider theme='light' style={{ border: '1px solid #d9d9d9', overflow: 'auto', background: '#fafafa' }}>
                    <div style={{ paddingLeft: '10px', alignSelf: 'center', border: '1px solid #d9d9d9', background: '#fafafa', height: '55px', display: 'flex', alignItems: 'center' }}>
                        大屏列表
                </div>
                    <MenuList arrData={walls} onItemChange={curWallChange} />
                </Sider>
                <Content style={{}} >
                    <Layout style={{ width: '100%', height: '100%', overflowY: 'hidden' }} >
                        <Sider width='200px' theme='light' style={{ border: '1px solid #d9d9d9' }}>
                            <div style={{ paddingLeft: '10px', background: '#fafafa', height: '55px', display: 'flex', alignItems: 'center' }}>
                                字幕列表
                        </div>
                            <div style={{ width: '100%', display: 'inline-flex', border: '1px solid #d9d9d9' }}>
                                <Select defaultValue="text" style={{ margin: '3px', width: 70 }} onChange={handleChange}>
                                    <Option value="text">文字</Option>
                                    {/* <Option value="icon">台标</Option>
                                <Option value="time">时间</Option> */}
                                </Select>
                                <Button disabled={buse} style={{ margin: '3px', padding: '5px', width: 60 }} onClick={handleAdd}>
                                    添加
                            </Button>
                                <Button disabled={buse} style={{ margin: '3px', padding: '5px', width: 60 }} onClick={handleDel}>
                                    删除
                            </Button>
                                {/* <Button style={{ margin: '3px', padding: '5px', width: 50 }}>
                                保存
                            </Button>
                            <Button style={{ margin: '3px', padding: '5px', width: 50 }}>
                                使用
                            </Button> */}
                            </div>
                            <MenuList arrData={osdLstData} ref={osdLst} onItemChange={curOsdChange} namefun={getname} />
                        </Sider>
                        <Content style={{ border: '0px solid #d9d9d9' }} >
                            <Form
                                form={form}
                                {...layout}
                                name="osdProperty"
                                initialValues={{
                                    wallWidth: wallwh[0],
                                    wallHeight: wallwh[1],
                                    startx: curOsd.startx,
                                    starty: curOsd.starty,
                                    width: curOsd.width,
                                    height: curOsd.height,
                                    bold: curOsd.fontform == 2 || curOsd.fontform == 4,
                                    italic: curOsd.fontform == 1 || curOsd.fontform == 4,
                                    underline: curOsd.fontstyle == 2 || curOsd.fontstyle == 4,
                                    strikethrough: curOsd.fontstyle == 1 || curOsd.fontstyle == 4,
                                    fontsize: curOsd.fontsize,
                                    fontclr: '#' + curOsd.fontclr.toString(16).padLeft(6, '0'),
                                    adaption: curOsd.adaption,
                                    fontname: curOsd.fontname,
                                    context: curOsd.context,
                                    direction: curOsd.direction.toString()
                                }}
                                onFinish={onFinish}
                                onFinishFailed={onFinishFailed}
                                onValuesChange={onValuesChange}
                            >
                                <Card style={{ width: '100%', height: '750px', overflowY: 'hidden', display: 'flex' }} bodyStyle={{ width: '100%', padding: '3px' }}>
                                    <div style={{ display: preview ? "" : "none", width: '100%', height: '100%' }}>
                                        <Button style={{ margin: '3px', padding: '5px', width: 100 }} htmlType="button" onClick={() => { setPreview(false) }}>
                                            返回
                                        </Button>
                                        <PreviewDiv preview={preview} commit={commit} cells={wallCells} osdLst={osdLstData}></PreviewDiv>
                                    </div>
                                    <Collapse style={{ display: preview ? "none" : "" }} bordered={false} defaultActiveKey={['1', '2', '3', '4', '5']}>
                                        <Panel header='背景' key='1' >
                                            <Row gutter={[30, 8]}>
                                                <Col span={8}>
                                                    <Form.Item label='宽度' name='wallWidth'>
                                                        <Input type='text' disabled={true} />
                                                    </Form.Item>
                                                    <Form.Item label='高度' name='wallHeight'>
                                                        <Input type='text' disabled={true} />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={8}>
                                                    <Button style={{ margin: '3px', padding: '5px', width: 100 }} htmlType="button" onClick={() => { setPreview(true) }}>
                                                        预览
                                                </Button>
                                                </Col>
                                                {/* <Col span={3}>
                                                    <Radio.Group style={{ height: '100%' }}>
                                                        <Radio style={{ height: '50%' }} value={1}>纯色</Radio>
                                                        <br />
                                                        <Radio style={{ height: '50%' }} value={2}>图片</Radio>
                                                    </Radio.Group>
                                                </Col>
                                                <Col span={5}>
                                                    <Select style={{ width: '100%' }} defaultValue="text" onChange={handleChange}>
                                                        <Option value="text">文字</Option>
                                                        <Option value="icon">台标</Option>
                                                        <Option value="time">时间</Option>
                                                    </Select>
                                                    <Input></Input>
                                                </Col>
                                                <Col span={3}>
                                                    <Label>透明度</Label>
                                                    <Label>填充模式</Label>
                                                </Col>
                                                <Col span={5}>
                                                    <Select style={{ width: '100%' }} defaultValue="1" onChange={handleChange}>
                                                        <Option value="0">0</Option>
                                                        <Option value="1">10%</Option>
                                                        <Option value="2">20%</Option>
                                                        <Option value="3">30%</Option>
                                                        <Option value="4">40%</Option>
                                                        <Option value="5">50%</Option>
                                                        <Option value="6">60%</Option>
                                                        <Option value="7">70%</Option>
                                                        <Option value="8">80%</Option>
                                                        <Option value="9">90%</Option>
                                                        <Option value="10">100%</Option>
                                                    </Select>
                                                    <Select style={{ width: '100%' }} defaultValue="1" onChange={handleChange}>
                                                        <Option value="1">拉升</Option>
                                                        <Option value="2">平铺</Option>
                                                        <Option value="3">填充</Option>
                                                    </Select>
                                                </Col> */}
                                            </Row>
                                        </Panel>
                                        <Panel header='字幕' key='2' >
                                            <Row gutter={[30, 8]}>
                                                <Col span={8} >
                                                    <Form.Item label='起始X' name='startx'>
                                                        <Input type='text' disabled={buse} onInput={(e) => { e.target.value = e.target.value.replace(/[^\-?\d.]/g, '') }} />
                                                    </Form.Item>
                                                    <Form.Item label='起始Y' name='starty'>
                                                        <Input type='text' disabled={buse} onInput={(e) => { e.target.value = e.target.value.replace(/[^\-?\d.]/g, '') }} />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={8}>
                                                    <Form.Item label='字幕宽度' name='width'>
                                                        <Input type='text' disabled={buse} onInput={(e) => { e.target.value = e.target.value.replace(/[^\-?\d.]/g, '') }} />
                                                    </Form.Item>
                                                    <Form.Item label='字幕高度' name='height'>
                                                        <Input type='text' disabled={buse} onInput={(e) => { e.target.value = e.target.value.replace(/[^\-?\d.]/g, '') }} />
                                                    </Form.Item>
                                                </Col>
                                            </Row>
                                        </Panel>
                                        <Panel header='属性' key='3'>
                                            <Row gutter={[30, 8]}>
                                                <Col span={8}>
                                                    <Form.Item label='文字属性' name='fontname'>
                                                        <Select disabled={buse} defaultValue="黑体" onChange={handleChange}>
                                                            <Option value="黑体">黑体</Option>
                                                            <Option value="宋体">宋体</Option>
                                                        </Select>
                                                    </Form.Item>
                                                    <Form.Item label='文字方向' name='direction'>
                                                        <Select disabled={buse} defaultValue="0" onChange={handleChange}>
                                                            <Option value="0">水平</Option>
                                                            <Option value="1">垂直</Option>
                                                        </Select>
                                                    </Form.Item>
                                                </Col>
                                                <Col span={8}>
                                                    <div style={{ width: '100%', height: '50%', display: 'inline-flex' }}>
                                                        <Form.Item {...tailLayout} name="bold" valuePropName="checked">
                                                            <Checkbox disabled={buse}>粗体</Checkbox>
                                                        </Form.Item>
                                                        <Form.Item {...tailLayout} name="italic" valuePropName="checked">
                                                            <Checkbox disabled={buse}>斜体</Checkbox>
                                                        </Form.Item>
                                                        <Form.Item {...tailLayout} name="underline" valuePropName="checked">
                                                            <Checkbox disabled={buse}>下划线</Checkbox>
                                                        </Form.Item>
                                                        <Form.Item {...tailLayout} name="strikethrough" valuePropName="checked">
                                                            <Checkbox disabled={buse}>删除线</Checkbox>
                                                        </Form.Item>
                                                    </div>
                                                    <div style={{ width: '100%', height: '50%', display: 'inline-flex' }}>
                                                        <Form.Item label='字号' name='fontsize' >

                                                            <Input ref={fontsize} disabled={!buse && curOsd.adaption} type='text' onInput={(e) => { e.target.value = e.target.value.replace(/[^\-?\d.]/g, '') }} />

                                                        </Form.Item>
                                                        <Form.Item wrapperCol={{ offset: 0, span: 24 }} name="adaption" valuePropName="checked">
                                                            <Checkbox disabled={buse}>自适应</Checkbox>
                                                        </Form.Item>
                                                    </div>

                                                </Col>
                                                <Col span={8}>

                                                    <Form.Item>
                                                        <div ref={colorLabel} style={{ position: 'absolute', pointerEvents: 'none', zIndex: 1, left: '3px', top: '2px', width: '80%', height: '28px' }}></div>
                                                        <Form.Item name='fontclr'>
                                                            <Select disabled={buse} onChange={chooseColor} className='colorselect' style={{ float: top, position: 'relative' }}>
                                                                <Option value='#ffffff' style={{ background: '#ffffff' }}> </Option>
                                                                <Option value='#010101' style={{ background: '#010101' }}> </Option>
                                                                <Option value='#ff0000' style={{ background: '#ff0000' }}> </Option>
                                                                <Option value='#800000' style={{ background: '#800000' }}> </Option>
                                                                <Option value='#00ff00' style={{ background: '#00ff00' }}> </Option>
                                                                <Option value='#008000' style={{ background: '#008000' }}> </Option>
                                                                <Option value='#0000ff' style={{ background: '#0000ff' }}> </Option>
                                                                <Option value='#000080' style={{ background: '#000080' }}> </Option>
                                                                <Option value='#00ffff' style={{ background: '#00ffff' }}> </Option>
                                                                <Option value='#008080' style={{ background: '#008080' }}> </Option>
                                                                <Option value='#ff00ff' style={{ background: '#ff00ff' }}> </Option>
                                                                <Option value='#800080' style={{ background: '#800080' }}> </Option>
                                                                <Option value='#ffff00' style={{ background: '#ffff00' }}> </Option>
                                                                <Option value='#808000' style={{ background: '#808000' }}> </Option>
                                                                <Option value='#a0a0a4' style={{ background: '#a0a0a4' }}> </Option>
                                                                <Option value='#808080' style={{ background: '#808080' }}> </Option>
                                                            </Select>
                                                        </Form.Item>
                                                    </Form.Item>
                                                </Col>
                                            </Row>
                                        </Panel>
                                        <Panel header='文字' key='4'>
                                            <Form.Item name='context'>
                                                <TextArea disabled={buse} style={{ width: '100%', marginBottom: '2px', height: '100%' }} rows={4} />
                                            </Form.Item>
                                        </Panel>
                                        {/* <Panel header='滚动' key='5'>
                                            <SetPage nPage={'3'}> </SetPage>
                                        </Panel> */}
                                    </Collapse>
                                </Card>
                                <div style={{ width: '100%', display: 'inline-flex' }}>
                                    <Form.Item {...tailLayout}>
                                        <Button disabled={buse} style={{ margin: '3px', padding: '5px', width: 100 }} htmlType="button" onClick={() => { form.submit() }}>
                                            保存
                            </Button>
                                    </Form.Item>
                                    <Form.Item {...tailLayout}>
                                        <Button style={{ margin: '3px', padding: '5px', width: 100 }} htmlType="button" onClick={() => { onUse() }}>
                                            {buse ? '停止使用' : '使用'}
                                        </Button>
                                    </Form.Item>
                                </div>
                            </Form>
                        </Content>

                    </Layout>
                </Content >
            </Layout >
        </>
    );

}

const SetPage = props => {

    function handleChange(value) {
        console.log(`selected ${value}`);
    }

    switch (props.nPage) {
        case '1':
            return (
                <Row gutter={[30, 8]}>
                    <Col span={3}>
                        <Label>滚动速度X</Label>
                        <Label>滚动方向</Label>
                    </Col>
                    <Col span={5}>
                        <Select style={{ width: '100%' }} defaultValue="1" onChange={handleChange}>
                            <Option value="1">1</Option>
                            <Option value="2">2</Option>
                            <Option value="3">3</Option>
                            <Option value="4">4</Option>
                            <Option value="5">5</Option>
                        </Select>
                        <Select style={{ width: '100%' }} defaultValue="1" onChange={handleChange}>
                            <Option value="1">水平</Option>
                            <Option value="2">垂直</Option>
                        </Select>
                    </Col>
                    <Col span={3}>
                        <Label>速度子</Label>
                        <Label>滚动时长</Label>
                    </Col>
                    <Col span={5}>
                        <InputNumber style={{ width: '100%' }} min={1} max={10} defaultValue={3}></InputNumber>
                        <TimePicker style={{ width: '100%' }} defaultValue={moment('12:08:23', 'HH:mm:ss')}></TimePicker>
                    </Col>
                </Row>
            );
            break;
        case '2':
            return (
                <Row gutter={[30, 8]}>
                    <Col span={3}>
                        <Label>图标</Label>
                    </Col>
                    <Col span={5}>
                        <div style={{ width: '100%', height: '100%', border: '1px solid red' }}>台标图片</div>
                    </Col>
                    <Col span={3}>
                        <Label>图标位置</Label>
                        <Label>图标占比</Label>
                    </Col>
                    <Col span={5}>
                        <Radio.Group >
                            <Radio value={1}>靠左</Radio>
                            <Radio value={2}>靠右</Radio>
                        </Radio.Group>
                        <Slider defaultValue={30} />
                    </Col>
                </Row>
            );
            break;
        case '3':
            return (
                <>
                    <Row gutter={[30, 8]}>
                        <Col span={3}>
                            <Label>时间格式</Label>
                            <Label>格式说明</Label>
                        </Col>
                        <Col span={5}>
                            <Select style={{ width: '100%' }} defaultValue="1" onChange={handleChange}>
                                <Option value="MM-dd-yyyy">1</Option>
                                <Option value="yyyy-MM-dd">2</Option>
                                <Option value="dd-MM-yyyy">3</Option>
                            </Select>
                        </Col>
                        <Col span={3}>
                            <Checkbox>自定义</Checkbox>
                        </Col>
                        <Col span={5}>
                            <Input></Input>
                        </Col>
                    </Row>
                    <Row gutter={[30, 8]}>
                        <Col span={24}>
                            <p>年:yy,yyyy     月:M,MM,MMM,MMMM   日:d,dd</p>
                            <p>星期:ddd,dddd  时:h,hh,H,HH       分:m,mm   秒:s,ss</p>
                        </Col>
                    </Row>
                </>
            );
            break;
    }

    return (<div></div>);
}

const OsdDiv = React.forwardRef((props, ref) => {


    const [press, setPress] = React.useState(false)
    const [rect, setRect] = React.useState([])

    const posInfo = React.useRef({})

    React.useEffect(() => {

        posInfo.current.setRect = setRect
        posInfo.current.rect = rect

        window.addEventListener('mouseup', onMouseUp)
        window.addEventListener('mousemove', onMouseMove)

        return () => {
            window.removeEventListener('mouseup', onMouseUp)
            window.removeEventListener('mousemove', onMouseMove)
        }
    },
        [ref])

    React.useEffect(() => {
        setRect([props.osdinfo.startx / props.scale, props.osdinfo.starty / props.scale, props.osdinfo.width / props.scale, props.osdinfo.height / props.scale])
    }
        , [props.osdinfo.startx, props.osdinfo.starty, props.osdinfo.width, props.osdinfo.height, props.scale])

    const getMoveType = (mouseX, mouseY, w, h) => {
        let ret
        if (mouseX <= 10 && mouseY <= 10)
            ret = 'left top'
        else if (mouseX >= 10 && mouseX <= (w - 10) && mouseY <= 10)
            ret = 'top'
        else if (mouseX >= (w - 10) && mouseY <= 10)
            ret = 'right top'
        else if (mouseX <= 10 && mouseY >= 10 && mouseY <= (h - 10))
            ret = 'left'
        else if (mouseX <= 10 && mouseY >= (h - 10))
            ret = 'left bottom'
        else if (mouseX >= 10 && mouseX <= (w - 10) && mouseY >= (h - 10))
            ret = 'bottom'
        else if (mouseX >= (w - 10) && mouseY >= (h - 10))
            ret = 'right bottom'
        else if (mouseX >= (w - 10) && mouseY >= 10 && mouseY <= (h - 10))
            ret = 'right'
        else
            ret = 'center'

        return ret
    }

    const onMouseDown = e => {

        posInfo.current.startPos = [e.nativeEvent.screenX, e.nativeEvent.screenY]
        posInfo.current.press = true
        setPress(true)
        e.stopPropagation()
        e.preventDefault()
    }

    const onMouseMove = e => {
        console.log('muse move', posInfo.current)
        if (posInfo.current.press) {

            let _e = e.nativeEvent ? e.nativeEvent : e

            let offx = _e.screenX - posInfo.current.startPos[0]
            let offy = _e.screenY - posInfo.current.startPos[1]

            let _rect = posInfo.current.rect
            _e.target.style.cur = posInfo.current.cur
            switch (posInfo.current.cur) {
                case 'default':
                    _rect = [_rect[0] + offx, _rect[1] + offy, _rect[2], _rect[3]]
                    break;
                case 'nw-resize':
                    _rect = [_rect[0] + offx, _rect[1] + offy, _rect[2] - offx, _rect[3] - offy]
                    break;
                case 'n-resize':
                    _rect = [_rect[0], _rect[1] + offy, _rect[2], _rect[3] - offy]
                    break;
                case 'ne-resize':
                    _rect = [_rect[0], _rect[1] + offy, _rect[2] + offx, _rect[3] - offy]
                    break;
                case 'e-resize':
                    _rect = [_rect[0] + offx, _rect[1], _rect[2] - offx, _rect[3]]
                    break;
                case 'w-resize':
                    _rect = [_rect[0], _rect[1], _rect[2] + offx, _rect[3]]
                    break;
                case 'sw-resize':
                    _rect = [_rect[0] + offx, _rect[1], _rect[2] - offx, _rect[3] + offy]
                    break;
                case 's-resize':
                    _rect = [_rect[0], _rect[1], _rect[2], _rect[3] + offy]
                    break;
                case 'se-resize':
                    _rect = [_rect[0], _rect[1], _rect[2] + offx, _rect[3] + offy]
                    break;
            }
            posInfo.current.rect = _rect
            posInfo.current.setRect(_rect)
            posInfo.current.startPos = [_e.screenX, _e.screenY]
        } else {
            if (!e.nativeEvent)
                return
            console.log('aaaa2222333')
            let mx = e.nativeEvent.layerX
            let my = e.nativeEvent.layerY

            let dw = e.nativeEvent.target.offsetWidth
            let dh = e.nativeEvent.target.offsetHeight

            const moveType = getMoveType(mx, my, dw, dh)

            let cur = 'default'
            switch (moveType) {
                case 'left top':
                    cur = 'nw-resize'
                    break;
                case 'top':
                    cur = 'n-resize'
                    break;
                case 'right top':
                    cur = 'ne-resize'
                    break;
                case 'left':
                    cur = 'e-resize'
                    break;
                case 'right':
                    cur = 'w-resize'
                    break;
                case 'left bottom':
                    cur = 'sw-resize'
                    break;
                case 'bottom':
                    cur = 's-resize'
                    break;
                case 'right bottom':
                    cur = 'se-resize'
                    break;

            }
            e.nativeEvent.target.style.cursor = cur
            posInfo.current.cur = cur
        }
        e.preventDefault();
        e.stopPropagation();
    }

    const onMouseUp = e => {

        if (press) {
            props.commit([rect[0] * props.scale, rect[1] * props.scale, rect[2] * props.scale, rect[3] * props.scale])
            console.log('onMouseUp')
        }
        setPress(false)
        posInfo.current.press = false


        let _e = e.nativeEvent ? e.nativeEvent : e
        _e.target.style.cur = posInfo.current.cur
        // e.preventDefault();
        // e.stopPropagation();

    }

    useImperativeHandle(ref, () => ({
        onMouseUp: onMouseUp,
        onMouseMove: onMouseMove
    }))

    const textDec = (val) => {
        console.log('fontStyle', val)
        switch (val) {
            case 1:
                return 'line-through'
            case 2:
                return 'underline'
            case 4:
                return 'underline line-through'
        }
        return ''
    }

    console.log('createOsdDiv')

    return (
        <div style={{
            position: 'absolute',
            border: press ? '1px solid red' : '0.2px solid blue',
            left: rect[0] + 'px',
            top: rect[1] + 'px',
            width: rect[2] + 'px',
            height: rect[3] + 'px',

            //lineHeight:props.osdinfo.height/props.scale + 'px',
            //backgroundColor:'#f6f7ff',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden'
        }}
            onMouseDown={onMouseDown}
            //onMouseUp={onMouseUp}
            onMouseMove={onMouseMove}
        // onMouseLeave={onMouseUp}
        >
            {/* width:props.osdinfo.direction==0?'100%':props.osdinfo.fontsize/props.scale + 'px',  */}
            <div
                dangerouslySetInnerHTML={{ __html: props.osdinfo.direction == 0 ? props.osdinfo.context : props.osdinfo.context.split('').join('<br/>') }}
                style={{
                    lineHeight: props.osdinfo.direction == 0 ? props.osdinfo.height / props.scale + 'px' : 'normal',
                    display: 'inline-block',
                    //border: '1px solid red',
                    alignSelf: 'center',
                    pointerEvents: 'none',
                    fontSize: props.osdinfo.fontsize + 'pt',
                    transform: `scale(${1 / props.scale})`,
                    transformOrigin: 'center',
                    fontFamily: props.osdinfo.fontname,
                    fontWeight: (props.osdinfo.fontform == 2 || props.osdinfo.fontform == 4) ? 'bold' : 'normal',
                    fontStyle: (props.osdinfo.fontform == 1 || props.osdinfo.fontform == 4) ? 'italic' : 'normal',
                    textDecoration: textDec(props.osdinfo.fontstyle),
                    textAlign: 'center',
                    verticalAlign: 'middle',
                    //width: '100%',
                    whiteSpace: 'nowrap',
                    color: '#' + props.osdinfo.fontclr.toString(16).padLeft(6, '0'),
                    //height: props.osdinfo.height / props.scale + 'px'
                }}
            >

            </div>
        </div>
    )
})


const PreviewDiv = props => {

    const [margin, setMargin] = useState({ width: '', height: '' })
    const [osddiv, setOsddiv] = useState([])

    const osdDivs = React.useRef([])
    const parm = React.useRef({})

    React.useEffect(() => {

        calMarin()

    }, [props.cells])

    React.useEffect(() => {

        createOsdDiv()
    }, [props.osdLst])

    React.useEffect(() => {
        if (!props.preview)
            return

        calMarin()
        createOsdDiv()
    }, [props.preview])

    React.useEffect(() => {
        createOsdDiv()
    }, [margin])


    const calMarin = () => {
        if (!props.preview)
            return

        if (props.cells.length == 0)
            return
        let _div = document.getElementById("resizediv")
        if (!_div)
            return
        const _pw = _div.offsetWidth
        const _ph = _div.offsetHeight

        let w = 0
        let h = 0

        for (let j = 0, len = props.cells.length; j < len; j++) {
            let _w = props.cells[j].startx + props.cells[j].width
            let _h = props.cells[j].starty + props.cells[j].hight
            if (w < _w)
                w = _w
            if (h < _h)
                h = _h
        }

        let scale = 1.0
        let _margin = {}
        if (h * _pw >= w * _ph)  //以高为基准
        {
            scale = h / _ph
            _margin.height = '100%'
            _margin.width = w / scale + 'px'
            parm.current.dir = 'h'
        }
        else							//以宽为基准
        {
            scale = w / _pw
            _margin.height = h / scale + 'px'
            _margin.width = '100%'
            parm.current.dir = 'w'
        }
        parm.current.scale = scale
        setMargin(_margin)
        draw(w, h, scale)
    }

    const createOsdDiv = () => {
        const _osdlst = []
        osdDivs.current = []

        for (let i = 0; i < props.osdLst.length; i++) {
            const r = React.createRef();

            _osdlst.push(<OsdDiv aref={r} ref={r} commit={(rect) => props.commit(props.osdLst[i].id, rect)} osdinfo={props.osdLst[i]} scale={parm.current.scale} ></OsdDiv>)
            osdDivs.current.push(r)
        }
        // setOsddiv([
        //     <OsdDiv height={margin.height} width={margin.width} ></OsdDiv>,
        //     <OsdDiv height={margin.height} width={margin.width} ></OsdDiv>])
        setOsddiv(_osdlst)
    }

    const draw = (w, h, scale) => {
        console.log('hline', scale)
        let c = document.getElementById("myCanvas")
        c.width = parseInt(w / scale) + 0.5
        c.height = parseInt(h / scale) + 0.5


        let ctx = c.getContext("2d")
        ctx.lineWidth = 1
        let hLine = []
        let vLine = []

        for (let j = 0, len = props.cells.length; j < len; j++) {
            if (props.cells[j].startx > 0 && props.cells[j].starty == 0)
                vLine.push({ p1: [parseInt(props.cells[j].startx / scale) + 0.5, 0], p2: [parseInt(props.cells[j].startx / scale) + 0.5, parseInt(h / scale) + 0.5] })

            if (props.cells[j].starty > 0 && props.cells[j].startx == 0)
                hLine.push({ p1: [0, parseInt(props.cells[j].starty / scale) + 0.5], p2: [parseInt(w / scale) + 0.5, parseInt(props.cells[j].starty / scale) + 0.5] })
        }
        console.log('hline', hLine)
        console.log('hline', vLine)
        ctx.strokeStyle = 'rgba(74, 154, 255, 1)';
        hLine.forEach((item, index, arr) => {
            ctx.moveTo(...item.p1)
            ctx.lineTo(...item.p2)
        })

        vLine.forEach((item, index, arr) => {
            ctx.moveTo(...item.p1)
            ctx.lineTo(...item.p2)
        })
        ctx.stroke()
    }

    const onMouseUp = (e) => {
        console.log('onMouseUp', osdDivs)
        for (let i = 0; i < osdDivs.current.length; i++) {
            osdDivs.current[i].current.onMouseUp(e)
        }
    }
    return (
        <div id='resizediv' style={{ width: '98%', height: '95%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ backgroundColor: '#e6f7ff', position: 'relative', boxShadow: '0px 0px 10px 5px rgba(0,0,0,0.7)', height: margin.height, width: margin.width, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                onMouseUp={onMouseUp}>
                <canvas style={{ width: '100%', height: '100%' }} id="myCanvas"></canvas>
                {osddiv}
            </div>
        </div>);
}

export default ScreenOsd