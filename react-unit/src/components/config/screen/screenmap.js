

import './index.css';

import { MenuList } from './screenset';
import { ScreenWidget } from './screenset';

import React, { useEffect } from 'react';
import { Button, Space, Layout, Radio, message, Switch } from 'antd';

const { Header, Footer, Sider, Content } = Layout;

import { Collapse, Card, Row, Col, Slider, Table, Input, List, InputNumber, Popconfirm, Form, Tabs } from "antd";
import { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { connect } from 'react-redux';
import { Upload, Modal } from 'antd';
import { PlusOutlined,ExclamationCircleOutlined } from '@ant-design/icons';
import { createUseStyles, useTheme } from 'react-jss';
import { SCREEN } from "../../../actions";
import reqwest from 'reqwest';
import { UploadOutlined, CheckCircleTwoTone } from '@ant-design/icons';
import { TRANS } from '../../public'
import _ from 'lodash'


class Demo extends React.Component {
    state = {
        fileList: [],
        uploading: false,
    };

    handleUpload = () => {
        const { fileList } = this.state;
        const formData = new FormData();
        fileList.forEach(file => {
            formData.append('files[]', file);
        });

        this.setState({
            uploading: true,
        });

        // You can use any AJAX library you like
        reqwest({
            url: 'http://10.67.76.10:80/upload?filepath=pkg',
            method: 'post',
            processData: false,
            data: formData,
            success: () => {
                this.setState({
                    fileList: [],
                    uploading: false,
                });
                message.success('upload successfully.');
            },
            error: () => {
                this.setState({
                    uploading: false,
                });
                message.error('upload failed.');
            },
        });
    };

    render() {
        const { uploading, fileList } = this.state;
        const props = {
            onRemove: file => {
                this.setState(state => {
                    const index = state.fileList.indexOf(file);
                    const newFileList = state.fileList.slice();
                    newFileList.splice(index, 1);
                    return {
                        fileList: newFileList,
                    };
                });
            },
            beforeUpload: file => {
                this.setState(state => ({
                    fileList: [...state.fileList, file],
                }));
                return false;
            },
            fileList,
        };

        return (
            <div>
                <Upload {...props}>
                    <Button>
                        <UploadOutlined /> Select File
            </Button>
                </Upload>
                <Button
                    type="primary"
                    onClick={this.handleUpload}
                    disabled={fileList.length === 0}
                    loading={uploading}
                    style={{ marginTop: 16 }}
                >
                    {uploading ? 'Uploading' : 'Start Upload'}
                </Button>
            </div>
        );
    }
}

function absoluteRect(element) {
    var result = [element.offsetLeft, element.offsetTop, 0, 0]
    element = element.offsetParent
    while (element) {
        result[0] += element.offsetLeft
        result[1] += element.offsetTop
        element = element.offsetParent
    }
    result[2] = result[0] + element.offsetWidth
    result[3] = result[1] + element.offsetHeight
    return result;
}


export const NameForm = (props) => {
    const dvalue = (props.info[props.index] != undefined) ? props.info[props.index].name : ''
    console.log('info', dvalue)
    const [form] = Form.useForm();
    const [, forceUpdate] = useState();

    // To disable submit button at the beginning.
    useEffect(() => {

        form.resetFields()
    }, [props.info]);



    const onFinish = values => {
        console.log('Finish:', values);
        props.onSubmit(values['mapname'])
    };

    return (
        <Form form={form} name={'horizontal_login' + props.index} layout="inline" onFinish={onFinish}
            initialValues={{
                mapname: dvalue
            }}>
            <Form.Item
                name='mapname'
                rules={[{ required: true, message: '名称不能为空!' }]}
            >
                <Input style={{ width: '150px' }} placeholder='Mapname' onFocus={() => props.onFocus(props.index)} />
            </Form.Item>
            {/* <Form.Item shouldUpdate={true}>
            {() => (
              <Button
                type="primary"
                htmlType="submit"
              >
                x
              </Button>
            )}
          </Form.Item> */}
        </Form>
    );

}





const PicUpload = (props) => {

    const [uploadInfo, setUploadInfo] = useState({
        fileList: [
            // {
            //     uid: '-1',
            //     name: 'image.bmp',
            //     status: 'done',
            //     url: 'http://10.20.132.2:80/static/pic/bck2osd/11.png',
            // }
        ],
        previewVisible: false,
        previewImage: ''
    })

    React.useEffect(() => {
        let t = document.getElementsByClassName('ant-upload-list-item-info')
        if (t) {
            for (let i = 0; i < t.length; i++) {
                console.log('t', t[i])

                console.log(t[i].onclick)
                if (!t[i].onclick)
                    t[i].onclick = () => props.onChoose(i)
            }
        }
    }, [])
    function getBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    const handleChange = ({ fileList }) => {
        console.log(fileList);
        console.log('finish', props.map)
        if (fileList.length > 0 && fileList[0].status == 'done') {
            SCREEN.WallMapUpFinish(props.map)
            props.map.exist = true;

        } else if (fileList.length > 0 && fileList[0].status == 'error') {
            setUploadInfo({ ...uploadInfo, fileList: [] })
            message.error('上传失败!')
            return;
        }
        setUploadInfo({ ...uploadInfo, fileList })
    }
    const handleRemove = () => {

        const delfun = ()=>
        {
            props.onChoose(props.index)
            if (props.isUse) {
                message.error('使用中的底图不能删除!')
                return false
            } else {
                SCREEN.delWallMap(props.map)
                return true
            }
        }

        Modal.confirm({
            title: '删除',
            icon: <ExclamationCircleOutlined />,
            content: '是否该底图?',
            okText: '确认',
            cancelText: '取消',
            onOk:delfun
          });
    }
    const handleCancel = () => { setUploadInfo({ ...uploadInfo, previewVisible: false }) };
    const handlePreview = async file => {
        props.onChoose(props.index)
        console.log(file.url)
        if (!file.url && !file.preview) {
            file.preview = await getBase64(file.originFileObj);
        }

        setUploadInfo({
            ...uploadInfo, previewImage: file.url || file.preview,
            previewVisible: true
        })
    };

    const uploadButton = (

        <div /*onClick={() => props.onChoose(props.index)}*/ style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', border: '1px solid #e0e2e5' }}>
            <div style={{ display: 'block' }}>
                <PlusOutlined style={{ display: 'block' }} />
            </div>

            <div className="ant-upload-text" style={{ display: 'block' }}>上传</div>
        </div>
    );
    return (
        <>
            <Upload
                action="http://10.20.132.2:80/upload"

                method='post'
                fileList={uploadInfo.fileList}
                onChange={handleChange}
                headers={{
                    authorization: 'authorization-text',
                    filepath: 'pic/bck2osd'
                }}
                showUploadList={{ showPreviewIcon: false, showRemoveIcon: false }}
                onRemove={handleRemove}
                onPreview={handlePreview}
                className="avatar-uploader"
            >
                {uploadInfo.fileList.length >= 1 ? null : uploadButton}
            </Upload>
            <Modal width='800px' visible={uploadInfo.previewVisible} footer={null} onCancel={handleCancel}>
                <img alt="example" style={{ width: '100%', height: '100%' }} src={uploadInfo.previewImage} />
            </Modal>
        </>
    )
}


const PicMap = props => {
    // 'http://10.20.132.2:80/static/pic/bck2osd/0010_1.bmp'
    const [imgsrc, setImgsrc] = useState('')

    const [btnShow, setBtnShow] = useState(false)

    // React.useEffect(() => {

    //     console.log('exist changed')
    //     console.log('ssssssssssssssssssssssssssssssssssssssssssssssssssssss', props.url+'/'+props.map.tvid + '_' + props.map.id + '.bmp')

    //     //setImgsrc('http://10.20.132.2:80/static/pic/bck2osd/0010_1.bmp')
    //     setImgsrc(props.url+'/'+props.map.tvid + '_' + props.map.id + '.bmp')
    // }, [props.url])

    React.useEffect(() => {

        console.log('exist changed', props.map)
        if (props.map) {
            console.log('ssssssssssssssssssssssssssssssssssssssssssssssssssssss', props.url + '/' + props.map.tvid + '_' + props.map.id + '/' + props.map.tvid + '_' + props.map.id + '.bmp')
            setImgsrc(props.url + '/' + props.map.tvid + '_' + props.map.id + '/' + props.map.tvid + '_' + props.map.id + '.bmp')
        }
    }, [props.map])

    const handleEnter = (e) => {

        setBtnShow(true)
        //console.log(props.map.exist)
    }

    const handleLeave = (e) => {
        setBtnShow(false)

    }

    const handleRemove = () => {
        const delfun = ()=>{
            console.log(props.isUse)
            if (props.isUse) {
                message.error('使用中的底图不能删除!')
            } else {
                SCREEN.delWallMap(props.map)
                props.map.exist = false
            }
        } 

        Modal.confirm({
            title: '删除',
            icon: <ExclamationCircleOutlined />,
            content: '是否删除底图?',
            okText: '确认',
            cancelText: '取消',
            onOk:delfun
          });
    }

    const handleUse = () => {
        if (props.isUse) {
            const _map = { ...props.map }
            _map.id = 0;
            SCREEN.useWallMap(_map)
        } else {
            SCREEN.useWallMap(props.map)
        }
    }

    return (
        <div
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
            onClick={() => props.onChoose(props.index)}
            style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3px', border: props.chooseIndex == props.index ? '2px solid #1890ff' : '1px solid #f0f2f5' }}>
            {props.map && (props.map.exist ?
                <img
                    align='center' width='100%' height='100' src={imgsrc} alt='下载失败' style={{ background: '#f0f2f5', display: 'flex', textAlign: 'center' }} >
                </img> : props.upload)}
            {props.map && props.map.exist && props.isUse ? <div div style={{ marginLeft: '-100%', width: '100%', height: '100%' }}>
                <div style={{ float: 'left', height: '100%' }}>
                    <CheckCircleTwoTone />
                </div>
            </div> : null}
            {props.map && props.map.exist && btnShow && <div style={{ marginLeft: '-100%', width: '100%', height: '100%' }}>
                <div style={{ marginLeft: '55%', display: 'flex', border: '0px solid red', height: '100%', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <Button size='small' style={{ width: '50px', height: '25px', lineHeight: '25px' }} onClick={handleRemove}>
                        清除
                </Button>
                    <br></br>
                    <Button size='small' style={{ width: '50px', height: '25px', lineHeight: '25px' }} onClick={handleUse}>
                        {props.isUse ? '停止' : '使用'}
                    </Button>
                </div>

            </div>}
        </div>
    )
}


export const ScreenMap = props => {


    const dispatch = useDispatch();
    const mapupdate = useSelector(({ mspsScreenUpdate }) => mspsScreenUpdate.map)

    let dragWidget = React.createRef();
    const [curWall, setCurWall] = useState({
        name: '大屏1',
        id: 0,
        kvm: true,
        rate: 60,
        row: 2,
        col: 2,
        width: 1920,
        height: 1080,
        cellnum: 4,
        backid: 0
    })

    const [curMapIndex, setCurMapIndex] = useState(-1)

    const [curMap, setCurMap] = useState(
        {
            id: 0,
            exist: false,
            state: 0,
            tvid: 0,
            name: '',
            startx: 0,
            starty: 0,
            width: 0,
            height: 0
        }
    )
    const [info, setInfo] = useState(
        {
            name: '',
            startx: 0,
            starty: 0,
            width: 0,
            height: 0
        }
    )
    const [curCells, setCurCells] = useState([])

    const mapUrl = useMemo(() => {
        return { url: '' }
    }, [])

    React.useEffect(() => {
        console.log('effect maps 11111111111111111', props.maps)
        console.log('effect maps 11111111111111111', props.wallCells)

    }, [props.maps])

    React.useEffect(() => {
        console.log('effect walls 11111111111111111')

    }, [props.walls])

    React.useEffect(() => {
        console.log('effect cells .....', props.wallCells)
        setCurCells(props.wallCells)
        if ((props.maps.length > 0) && (props.wallCells.length > 0))
            setCurMapIndex(0)
    }, [props.wallCells])

    const msps = useSelector(state => state.msps)

    React.useEffect(() => {
        console.log('mapsssssssssssssssssssssssssssssssssss', msps)
        if (msps.map)
            mapUrl.url = 'http://' + msps.map.ip + ':' + msps.map.port + '/static/' + msps.map.path
        console.log('mapsssssssssssssssssssssssssssssssssss', mapUrl)
    }, [msps])


    React.useEffect(() => {
        SCREEN.getWalls()
        dispatch({ type: '/msp/v2/transmission/config', payload: { type: TRANS.BACK, opt: 0 } })


    }, [])

    React.useEffect(() => {
        document.body.onmouseup = (e) => {
            console.log('mmmmmmmmmmmmmmmmmmmmmmmmmmmmmm', dragWidget)
            if (dragWidget.current&& dragWidget.current.state.ispress)
                dragWidget.current.onMouseUp(e)
        }

        return () => {
            document.body.onmouseup = (e) => {

            }
        }

    }, [dragWidget])

    React.useEffect(() => {
        if (props.maps.length == 0 || curMapIndex == -1)
            return

        const _map = props.maps[curMapIndex]
        setCurMap(_map)
        const _info = { name: _map.name, startx: _map.startx, starty: _map.starty, width: _map.width, height: _map.height }
        console.log('_info', _info)
        setInfo(_info)
    }, [curMapIndex])

    React.useEffect(() => {
        props.maps.length = 0
        props.wallCells.length = 0
        props.walls.length = 0

    }, [])
    React.useEffect(() => {
        console.log('mapupdate', mapupdate)
        if (!mapupdate.state)
            return
    }, [mapupdate])

    const onMouseMove = e => {
        console.log(dragWidget.current.state.ispress)
        if (dragWidget.current.state.ispress) {
            console.log(22222)
            dragWidget.current.onMouseMove(e)
        }

    }

    const onMouseUp = e => {
        if (dragWidget.current.state.ispress)
            dragWidget.current.onMouseUp(e)
    }

    const onMouseLeave = e => {
        // if(dragWidget.current.state.ispress)
        //     dragWidget.current.onMouseLeave(e)
    }

    const alignStyle = {
        textAlign: 'center'
    }

    const radioStyle = {
        width: '150px',
        height: '30px',
        lineHeight: '30px',
        border: '1px solid green',
        ...alignStyle
    }

    function onChange(e) {
        console.log(`radio checked:${e.target.value}`, props.maps[parseInt(e.target.value)])
        setCurMapIndex(parseInt(e.target.value))
    }

    function setMapName(str) {
        props.maps[curMapIndex] = { ...curMap, name: str }
        console.log('cur mapppppppppp', props.maps[curMapIndex])
        SCREEN.addWallMap(props.maps[curMapIndex])
    }

    function handleDel() {
        SCREEN.delWallMap(props.maps[curMapIndex])
        props.maps[curMapIndex].exist = false
        setCurMap(props.maps[curMapIndex])
    }


    const mapRatio = (key) => {
        return {
            key: key,
            value: key,
            style: radioStyle
        }
    }
    const mapSwitch = (index) => {
        return {
            disabled: props.maps[index] ? (props.maps[index].exist) : false,
            checked: curWall.backid == (index + 1),
            onFocus: () => setCurMapIndex(index)
        }
    }
    const mapUpload = (index) => {
        return {
            chooseIndex: curMapIndex,
            index: index,
            map: props.maps[index],
            onChoose: setCurMapIndex,
            isUse: curWall.backid == (index + 1),
            upload: <PicUpload map={props.maps[index]}></PicUpload>,
            url: mapUrl.url
        }
    }
    const mapName = (index) => {
        return {
            index: index,
            info: props.maps,
            onSubmit: setMapName,
            onFocus: setCurMapIndex
        }
    }
    const previewVisible = false
    const previewImage = ''
    const arr1 = (
        <Radio.Group defaultValue='' value={curMapIndex.toString()} size="large" style={{ display: 'inline-flex', width: '100%', height: '100%' }} onChange={onChange}>
            <Col span={3}>
                <div style={{ width: '100%', height: '100%' }}>
                    {/* <Radio {...mapRatio('0')}>
                        <Switch {...mapSwitch(0)}></Switch>
                    </Radio> */}
                    {/* <PicUpload {...mapUpload(0)}></PicUpload> */}
                    {/* <NameForm {...mapName(0)}></NameForm> */}
                    <PicMap {...mapUpload(0)}></PicMap>
                </div>
            </Col>
            <Col span={3}>
                <div style={{ width: '100%', height: '100%' }}>
                    <PicMap {...mapUpload(1)}></PicMap>
                </div>
            </Col>
            <Col span={3}>
                <div style={{ width: '100%', height: '100%' }}>
                    <PicMap {...mapUpload(2)}></PicMap>
                </div>
            </Col>
            <Col span={3}>
                <div style={{ width: '100%', height: '100%' }}>
                    <PicMap {...mapUpload(3)}></PicMap>
                </div>
            </Col>
            <Col span={3}>
                <div style={{ width: '100%', height: '100%' }}>
                    <PicMap {...mapUpload(4)}></PicMap>
                </div>
            </Col>
            <Col span={3}>
                <div style={{ width: '100%', height: '100%' }}>
                    <PicMap {...mapUpload(5)}></PicMap>
                </div>
            </Col>
            <Col span={3}>
                <div style={{ width: '100%', height: '100%' }}>
                    <PicMap {...mapUpload(6)}></PicMap>
                </div>
            </Col>
            <Col span={3}>
                <div style={{ width: '100%', height: '100%' }}>
                    <PicMap {...mapUpload(7)}></PicMap>
                </div>
            </Col>
        </Radio.Group>
    )

    const curWallChange = id => {
        if (parseInt(id) == curWall.id)
            return
        console.log('curWallChange')
        setCurMapIndex(-1)
        setCurWall(props.walls.get(parseInt(id)))
        setCurMap({
            id: 0,
            exist: false,
            state: 0,
            tvid: 0,
            name: '',
            startx: 0,
            starty: 0,
            width: 0,
            height: 0
        })

        SCREEN.getWallMaps(parseInt(id))
        SCREEN.getWallCells(parseInt(id))
    }


    const onPosChange = (e, mark) => {
        console.log(mark, e.target.value)
        if (mark == 'name')
            setInfo({ ...info, [mark]: e.target.value })
        else
        {
            let pos = 0
            if(e.target.value=='')
                pos = 0
            else
                pos = parseInt(e.target.value)

            setInfo({ ...info, [mark]: pos })

        }

        // setCurMap({ ...curMap, [mark]: parseInt(e.target.value) })
        // props.maps[curMapIndex] = { ...curMap, [mark]: parseInt(e.target.value) }
        // SCREEN.addWallMap(props.maps[curMapIndex])
    }
    const handleSave = () => {
        if (curMap.id == 0)
            return
        if(info.name=='')
        {

            return Modal.info({
                title: '提示',
                content:'底图名称不能为空',
                onOk() {},
              });
        }
        setCurMap({ ...curMap, ...info })
        props.maps[curMapIndex] = { ...curMap, ...info }
        SCREEN.addWallMap(props.maps[curMapIndex])
    }
    const onRectChange = (rect) => {
        if (curMap.startx == rect.x && curMap.starty == rect.y && curMap.width == rect.w && curMap.height == rect.h)
            return;
        if (props.maps.length == 0)
            return
        setCurMap({ ...curMap, startx: rect.x, starty: rect.y, width: rect.w, height: rect.h })
        setInfo({ name: info.name, startx: rect.x, starty: rect.y, width: rect.w, height: rect.h })
        props.maps[curMapIndex] = { ...curMap, startx: rect.x, starty: rect.y, width: rect.w, height: rect.h }
        SCREEN.addWallMap(props.maps[curMapIndex])
        console.log('set map:', props.maps[curMapIndex])
    }
    const walls = _.cloneDeep(props.wallCells)

    console.log(walls)

    return (
        <Layout style={{ width: '100%', height: '100%', overflowY: 'hidden', paddingTop: '0px' }} >
            <Sider theme='light' style={{ border: '1px solid #d9d9d9', overflow: 'auto', background: '#fafafa' }}>
                <div style={{ paddingLeft: '10px', border: '0px solid #d9d9d9', height: '55px', display: 'flex', alignItems: 'center' }}>
                    大屏列表
                </div>
                <MenuList arrData={props.walls} cstyle={{}} onItemChange={curWallChange} />
            </Sider>
            <Content style={{ border: '1px solid #f0f0f0' }} >
                <Card style={{ width: '100%', height: '100%', overflowY: 'hidden' }} bodyStyle={{ padding: '0px', height: '100%' }}>
                    <div style={{ height: 215, float: 'top' }}>
                        <div style={{ paddingLeft: '10px', border: '0px solid #d9d9d9', height: '55px', display: 'flex', alignItems: 'center', alignSelf: 'center' }}>
                            底图列表
                        </div>
                        <Row gutter={[20, 8]} style={{ height: '118px', width: '100%', paddingLeft: '10px', paddingRight: '10px', paddingTop: '0px' }} >
                            {arr1}
                        </Row>
                        <Space style={{ width: '100%', background: '#f0f0f0', paddingLeft: '10px', paddingRight: '10px', paddingTop: '10px' }} >
                            <Space>
                                <div style={{ width: 40, alignSelf: 'center' }}>名称:</div>
                                <Input id='inputName' defaultValue={'0'} value={info.name} onChange={e => onPosChange(e, 'name')}></Input>
                            </Space>
                            <Space>
                                X:
                                <Input id='inputx' defaultValue={'0'} value={info.startx} onChange={e => onPosChange(e, 'startx')}></Input>
                            </Space>
                            <Space>
                                Y:
                                <Input id='inputy' defaultValue={'0'} value={info.starty} onChange={e => onPosChange(e, 'starty')}></Input>
                            </Space>
                            <Space>
                                W:
                                <Input id='inputw' defaultValue={'0'} value={info.width} onChange={e => onPosChange(e, 'width')}></Input>
                            </Space>
                            <Space>
                                H:
                                <Input id='inputh' defaultValue={'0'} value={info.height} onChange={e => onPosChange(e, 'height')}></Input>
                            </Space>
                            <Button type='primary' onClick={handleSave}>保存</Button>
                        </Space>
                    </div>
                    <div style={{ height: 'calc(100% - 215px)', paddingBottom: '10px' }}>
                        <Row gutter={[0, 0]} style={{ background: '#f0f0f0', width: '100%', height: '100%', paddingLeft: '10px', paddingRight: '10px', paddingTop: '15px' }}>
                            <Col span={24}>
                                {curWall.id != 0 && <div id='screenbase' style={{ width: '100%', height: '100%' }}>
                                    <ScreenWidget style={{ width: '100%', height: '100%' }} wallCells={curCells} wall={curWall}></ScreenWidget>

                                    <DragWidget ref={dragWidget} url={mapUrl.url} map={curMap} wallCells={curCells} wall={curWall} rect={{ x: curMap.startx, y: curMap.starty, w: curMap.width, h: curMap.height }} onRectChange={e => onRectChange(e)} ></DragWidget>
                                    <div draggable='false' style={{ position: 'absolute', top: '0px', zIndex: '2', background: '#00FF0000', /*border: '1px solid red',*/ width: '100%', height: '100%' }}
                                        onMouseMove={e => onMouseMove(e)}
                                        onMouseUp={e => onMouseUp(e)}
                                        onMouseLeave={e => onMouseLeave(e)}
                                    ></div>
                                </div>
                                }
                            </Col>
                        </Row>
                    </div>
                </Card>
            </Content>
        </Layout>
    );
}




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




class DragWidget extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            soursepos: [0.0, 0.0, 0.0, 0.0],
            movepos: [0.0, 0.0, 0.0, 0.0],
            ispress: false
        }

        this.moveType = 'no move'
        this.startPos = [0, 0];
        this.scale = 1.0
        this.margin = [0.0, 0.0]
        this.w = 0
        this.h = 0
        this.xLst = []
        this.yLst = []
        this.loadok = true

        window.addEventListener('resize', this.handleResize)
    }

    componentWillUnmount()
    {
        window.removeEventListener('resize', this.handleResize)
    }

    componentDidUpdate(prevProps, prevState) {

        if (prevState.soursepos.toString() == this.state.soursepos.toString())

            return
        console.log('0000000', this.state.soursepos)
        this.props.onRectChange(this.getActualpos(this.state.soursepos))
    }
    componentWillReceiveProps(props) {

        console.log('uipos cur:', this.props.rect)
        console.log('uipos next:', props.rect)
        console.log('uipos cell:', props.wallCells)

        if (props.wallCells != this.props.wallCells) {
            const { wallCells } = props
            const { wall } = this.props
            this.w = this.h = 0
            for (let j = 0, len = wallCells.length; j < len; j++) {
                if (!this.xLst.includes(wallCells[j].startx))
                    this.xLst.push(wallCells[j].startx)
                if (!this.xLst.includes(wallCells[j].startx + wallCells[j].width))
                    this.xLst.push(wallCells[j].startx + wallCells[j].width)

                if (!this.yLst.includes(wallCells[j].starty))
                    this.yLst.push(wallCells[j].starty)
                if (!this.yLst.includes(wallCells[j].starty + wallCells[j].hight))
                    this.yLst.push(wallCells[j].starty + wallCells[j].hight)

                let _w = wallCells[j].startx + wallCells[j].width
                let _h = wallCells[j].starty + wallCells[j].hight

                if (this.w < _w)
                    this.w = _w

                if (this.h < _h)
                    this.h = _h
            }
            console.log('xlist', this.xLst)
            console.log('ylist', this.yLst)
        }

        if (props.rect.x == this.props.rect.x && props.rect.y == this.props.rect.y && props.rect.w == this.props.rect.w && props.rect.h == this.props.rect.h)
            return

        const uirect = this.getUipos(props.rect)
        console.log('uipos', Object.values(uirect))
        this.setState({
            soursepos: Object.values(uirect),
            movepos: Object.values(uirect)
        });

    }

    handleResize = ()=>{
        const uirect = this.getUipos(this.props.rect)
        this.setState({
            soursepos: Object.values(uirect),
            movepos: Object.values(uirect)
        });

    } 

    getUipos = (rect) => {
        const { wallCells } = this.props
        const { wall } = this.props

        let ret = { ...rect }
        const margin = { width: 0, height: 0 }

        if (wallCells.length == 0)
            return ret
        let _div = document.getElementById("screenbase")
        const _pw = _div.offsetWidth
        const _ph = _div.offsetHeight

        if (wallCells.length == wall.row * wall.col) //简单模式
        {

            if (this.h * _pw >= this.w * _ph)  //以高为基准
            {
                this.scale = this.h / _ph
                this.margin[0] = (_pw - this.w / this.scale) / 2
                this.margin[1] = 0.0
                ret.x = this.margin[0] + ret.x / this.scale
                ret.y = ret.y / this.scale
                ret.w = ret.w / this.scale
                ret.h = ret.h / this.scale
            }
            else							//以宽为基准
            {
                this.scale = this.w / _pw
                this.margin[0] = 0.0
                this.margin[1] = (_ph - this.h / this.scale) / 2
                ret.x = ret.x / this.scale
                ret.y = this.margin[1] + ret.y / this.scale
                ret.w = ret.w / this.scale
                ret.h = ret.h / this.scale
            }
        }
        return ret
    }

    getActualpos = (rect) => {

        const _toint = (i) => {
            if (i >= 0)
                i += 0.5
            else
                i -= 0.5

            return parseInt(i)
        }
        let ret = {}
        ret.x = _toint(this.scale * (rect[0] - this.margin[0]))
        ret.y = _toint(this.scale * (rect[1] - this.margin[1]))
        ret.w = _toint(this.scale * rect[2])
        ret.h = _toint(this.scale * rect[3])
        return ret
    }

    onMouseDown = e => {

        //this.setState({pos:[e.nativeEvent.layerX,e.nativeEvent.layerY]})
        this.startPos = [e.nativeEvent.screenX, e.nativeEvent.screenY];

        this.setState({ ispress: true })
        e.stopPropagation()
        e.preventDefault()
    }

    onMouseMove = e => {
        if (this.state.ispress) {
            let offx = e.nativeEvent.screenX - this.startPos[0]
            let offy = e.nativeEvent.screenY - this.startPos[1]

            let esourse = { offsetLeft: this.state.soursepos[0], offsetTop: this.state.soursepos[1], offsetWidth: this.state.soursepos[2], offsetHeight: this.state.soursepos[3] }
            let newPos = {}
            let newAcutualPos = {}
            switch (this.moveType) {
                case 'left top':
                    newPos = ({ movepos: [esourse.offsetLeft + offx, esourse.offsetTop + offy, esourse.offsetWidth - offx, esourse.offsetHeight - offy] })
                    newAcutualPos = this.getActualpos(newPos.movepos)
                    if (newAcutualPos.x < 0)
                        newAcutualPos.x = 0
                    if (newAcutualPos.y < 0)
                        newAcutualPos.y = 0
                    break;
                case 'top':
                    newPos = ({ movepos: [esourse.offsetLeft, esourse.offsetTop + offy, esourse.offsetWidth, esourse.offsetHeight - offy] })
                    newAcutualPos = this.getActualpos(newPos.movepos)
                    if (newAcutualPos.y < 0)
                        newAcutualPos.y = 0
                    break;
                case 'right top':
                    newPos = ({ movepos: [esourse.offsetLeft, esourse.offsetTop + offy, esourse.offsetWidth + offx, esourse.offsetHeight - offy] })
                    newAcutualPos = this.getActualpos(newPos.movepos)
                    if (newAcutualPos.y < 0)
                        newAcutualPosx.y = 0
                    if (newAcutualPos.x + newAcutualPos.w > this.w)
                        newAcutualPos.w = this.w - newAcutualPos.x
                    break;
                case 'left':
                    newPos = ({ movepos: [esourse.offsetLeft + offx, esourse.offsetTop, esourse.offsetWidth - offx, esourse.offsetHeight] })
                    newAcutualPos = this.getActualpos(newPos.movepos)
                    if (newAcutualPos.x < 0)
                        newAcutualPos.x = 0
                    break;
                case 'right':
                    newPos = ({ movepos: [esourse.offsetLeft, esourse.offsetTop, esourse.offsetWidth + offx, esourse.offsetHeight] })
                    newAcutualPos = this.getActualpos(newPos.movepos)
                    if (newAcutualPos.x + newAcutualPos.w > this.w)
                        newAcutualPos.w = this.w - newAcutualPos.x
                    break;
                case 'left bottom':
                    newPos = ({ movepos: [esourse.offsetLeft + offx, esourse.offsetTop, esourse.offsetWidth - offx, esourse.offsetHeight + offy] })
                    newAcutualPos = this.getActualpos(newPos.movepos)
                    if (newAcutualPos.x < 0)
                        newAcutualPos.x = 0
                    if (newAcutualPos.y + newAcutualPos.h > this.h)
                        newAcutualPos.h = this.h - newAcutualPos.y
                    break;
                case 'bottom':
                    newPos = ({ movepos: [esourse.offsetLeft, esourse.offsetTop, esourse.offsetWidth, esourse.offsetHeight + offy] })
                    newAcutualPos = this.getActualpos(newPos.movepos)
                    if (newAcutualPos.y + newAcutualPos.h > this.h)
                        newAcutualPos.h = this.h - newAcutualPos.y
                    break;
                case 'right bottom':
                    newPos = ({ movepos: [esourse.offsetLeft, esourse.offsetTop, esourse.offsetWidth + offx, esourse.offsetHeight + offy] })
                    newAcutualPos = this.getActualpos(newPos.movepos)
                    if (newAcutualPos.x + newAcutualPos.w > this.w)
                        newAcutualPos.w = this.w - newAcutualPos.x
                    if (newAcutualPos.y + newAcutualPos.h > this.h)
                        newAcutualPos.h = this.h - newAcutualPos.y
                    break;
                case 'center':
                    newPos = ({ movepos: [esourse.offsetLeft + offx, esourse.offsetTop + offy, esourse.offsetWidth, esourse.offsetHeight] })
                    newAcutualPos = this.getActualpos(newPos.movepos)
                    if (newAcutualPos.x < 0)
                        newAcutualPos.x = 0
                    if (newAcutualPos.y < 0)
                        newAcutualPos.y = 0
                    if (newAcutualPos.x + newAcutualPos.w > this.w)
                        newAcutualPos.x = this.w - newAcutualPos.w
                    if (newAcutualPos.y + newAcutualPos.h > this.h)
                        newAcutualPos.y = this.h - newAcutualPos.h
                    break;
            }
            //吸附

            const space = parseInt(8 * this.scale)
            if (this.moveType == 'center') {
                for (let i = 0, len = this.xLst.length; i < len; i++) {
                    if (Math.abs(newAcutualPos.x - this.xLst[i]) <= space) {
                        newAcutualPos.x = this.xLst[i]
                        break
                    }

                    if (Math.abs(newAcutualPos.x + newAcutualPos.w - this.xLst[i]) <= space) {
                        newAcutualPos.x += (this.xLst[i] - (newAcutualPos.x + newAcutualPos.w))
                        break
                    }
                }

                for (let i = 0, len = this.yLst.length; i < len; i++) {
                    if (Math.abs(newAcutualPos.y - this.yLst[i]) <= space) {
                        newAcutualPos.y = this.yLst[i]
                        break
                    }

                    if (Math.abs(newAcutualPos.y + newAcutualPos.h - this.yLst[i]) <= space) {
                        newAcutualPos.y += (this.yLst[i] - (newAcutualPos.y + newAcutualPos.h))
                        break
                    }
                }
            } else {
                for (let i = 0, len = this.xLst.length; i < len; i++) {
                    if (Math.abs(newAcutualPos.x - this.xLst[i]) <= space) {
                        newAcutualPos.x = this.xLst[i]
                        newAcutualPos.w += (newAcutualPos.x - this.xLst[i])
                    }

                    if (Math.abs(newAcutualPos.x + newAcutualPos.w - this.xLst[i]) <= space) {
                        newAcutualPos.w -= (newAcutualPos.x + newAcutualPos.w - this.xLst[i])
                    }
                }

                for (let i = 0, len = this.yLst.length; i < len; i++) {
                    if (Math.abs(newAcutualPos.y - this.yLst[i]) <= space) {
                        newAcutualPos.y = this.yLst[i]
                        newAcutualPos.h += (newAcutualPos.y - this.yLst[i])
                    }

                    if (Math.abs(newAcutualPos.y + newAcutualPos.h - this.yLst[i]) <= space) {
                        newAcutualPos.h -= (newAcutualPos.y + newAcutualPos.h - this.yLst[i])
                    }
                }
            }


            this.setState({
                movepos: Object.values(this.getUipos(newAcutualPos))
            });
            return
        }

        let mx = e.nativeEvent.layerX
        let my = e.nativeEvent.layerY

        let dw = e.nativeEvent.target.offsetWidth
        let dh = e.nativeEvent.target.offsetHeight

        this.moveType = getMoveType(mx, my, dw, dh)
        // console.log(moveType)

        let cur = 'default'
        switch (this.moveType) {
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
                cur = 'ne-resize'
                break;
            case 'bottom':
                cur = 's-resize'
                break;
            case 'right bottom':
                cur = 'se-resize'
                break;

        }
        e.nativeEvent.target.style.cursor = cur

    }

    onMouseUp = e => {

        this.setState({ ispress: false })
        this.setState({ soursepos: this.state.movepos })

    }

    onMouseLeave = e => {

        this.setState({ ispress: false })
        this.setState({ soursepos: this.state.movepos })

    }

    render() {
        this.sourseStyle = {
            position: 'absolute',
            left: this.state.soursepos[0],
            top: this.state.soursepos[1],
            zIndex: '1',
            background: '#1890ff17',
            width: this.state.soursepos[2],
            height: this.state.soursepos[3],
            opacity: this.state.ispress ? 0.3 : 1,  /*支持 Chrome, Opera, Safari 等浏览器*/
            border: '3px solid #1890ff'
        }

        this.moveStyle = {
            position: 'absolute',
            left: this.state.movepos[0],
            top: this.state.movepos[1],
            zIndex: '3',
            background: '#00000000',
            width: this.state.movepos[2],
            height: this.state.movepos[3],
            border: this.state.ispress ? '3px solid grey' : '0px'
        }
        return (
            //http://10.20.132.2:80/static/pic/bck2osd/0010_1.bmp
            // this.setState({ loadok: false })
            //     {this.props.map.exist && this.state.loadok && <img onerror={this.setState({ loadok: false })}
            //     align='center' width='100%' height='100%' src='http://10.20.132.2:80/static/pic/bck2osd/0010_1.bmp' alt='下载失败' style={{ background: '#f0f2f5', display: 'flex', textAlign: 'center' }} >
            // </img>}
            <>
                <div id='DragWidget-sourse' draggable='false' style={this.sourseStyle}>
                    {this.props.map.exist && <img onError={console.log('loadErr')} onLoad={console.log('loadOK')}
                        align='center' width='100%' height='100%' src={this.props.url + '/' + this.props.map.tvid + '_' + this.props.map.id + '/' + this.props.map.tvid + '_' + this.props.map.id + '.bmp'} alt='下载失败' style={{ background: '#f0f2f5', display: 'flex', textAlign: 'center' }} >
                    </img>}
                </div>
                <div id='DragWidget-move' draggable='false' style={this.moveStyle}
                    onMouseDown={e => this.onMouseDown(e)}
                    onMouseUp={e => this.onMouseUp(e)}
                    onMouseMove={e => this.onMouseMove(e)}
                >
                </div>
            </>

        );
    }

}

const MapWidget = props => {
    return (
        <div style={{ height: '150px'/*, border: '1px solid blue' */ }} >
            <div style={{ height: '110px', width: '100%' }}></div>
            <Input style={{ width: '100%' }} defaultValue={'100'} ></Input>
        </div>
    );
}

const mapStateToProps = state => {
    return {
        walls: state.mspsScreenCfg.screen.walls,
        wallCells: state.mspsScreenCfg.cells,
        maps: state.mspsScreenMap.map.wallMaps
    };
};

export default connect(mapStateToProps)(ScreenMap)
