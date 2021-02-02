import React, {useEffect, useState } from 'react'
import { Button, Modal, Form, Input, Select, Card, Tree, message } from 'antd';
import { RouteBodyRightPartBlock, RouteBodyRightPartBlockAdd } from './route-body-right-part-block'
import './index.less'
import { Switch, Route, Redirect, Link, useHistory } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux'
import { post, stringify } from '../../services/graphql'
import { useForceUpdate } from '../public';
import { CONFIG } from "../../actions";
import { CHNTYPE } from '../public';
import FocusInput from './focus-input'
import { eventProxy } from '../../utils'

let treeDataA = [

];

const DlgAdd = props => {
    const dispatch = useDispatch()
    const data = props.data;
    const [dataA, setDataA] = React.useState([...treeDataA])
    const [selectedKeys, setSelectedKeys] = React.useState([])
    const [checkedKeysA, setCheckedKeysA] = React.useState([])
    const [checkedKeysB, setCheckedKeysB] = React.useState([])
    const [value, setValue] = React.useState()
    const { visible, onCancel, onConfirm } = props
    const [form] = Form.useForm();
    const outV = useSelector(state => state.mspsDev.vouts)
    const outA = useSelector(state => state.mspsDev.aouts)
    const dataV = Object.values(outV).map(value => {
        return {
            title: value.name,
            key: value.id,
            type: value.chntype,
            disabled: false,
        }
    })
    const _dataA = Object.values(outA).map(value => {
        return {
            title: value.name,
            key: value.id,
            type: value.chntype,
            disabled: false,
        }
    })
    const treeDataB = [
        {
            title: '视频',
            key: '0-0',
            children: dataV,
        },
        {
            title: '音频',
            key: '0-1',
            children: _dataA,
        },
    ];


    const updataTreeB = () => {
        treeDataA = dataA
        for (let index = 0; index < treeDataA.length; index++) {
            const element = treeDataA[index];
            if (!element || !element.children) continue;
            for (let i = 0; i < element.children.length; i++) {
                const _element = element.children[i];
                for (let m = 0; m < dataV.length; m++) {
                    const element2 = dataV[m];
                    if (element2.key == _element.key) {
                        element2.disabled = true;
                        break;
                    }
                }
                for (let m = 0; m < dataA.length; m++) {
                    const element2 = dataA[m];
                    if (element2.key == _element.key) {
                        element2.disabled = true;
                        break;
                    }
                }
            }
        }
    }

    useEffect(() => {
        dispatch({type: '/msp/v2/chn/query', payload: {type: CHNTYPE.AOUT}})
        dispatch({type: '/msp/v2/chn/query', payload: {type: CHNTYPE.VOUT}})
    }, [])

    React.useEffect(() => {
        if (props.visible == "hide") {
            return;
        }

        form.setFieldsValue({ name: data.name, level: data.level })
        post(`{RouteGroups(parent:${data.id}){id,name,parent,pos,chnnls{id,outname,outid,inname,inid,curinname,curinid,state}}}`).then(_data => {
            console.log(_data)
            let groups = _data.data.RouteGroups
            let t = []

            for (let i = 0; i < groups.length; i++) {
                const element = groups[i];
                console.log(element)
                let child = []
                element.chnnls.map(value => {
                    child.push({
                        title: value.outname,
                        key: value.outid,
                        id:value.id,
                    })
                })
                t.push({ key: element.id, title: element.name, children: child })
            }
            setDataA(t.slice(0))
        })
    }, [props.show])

    const onSelect = (selectedKey, info) => {
        if (selectedKey.length == 0) {
            setSelectedKeys([])
        }
        else {
            setSelectedKeys(info.node)
        }
        console.log(selectedKey, selectedKeys)
    };

    const onCheck = (checkedKeys, info) => {
        console.log('onCheck', checkedKeys, info);
    };

    const onBtnNewClick = () => {
        treeDataA = dataA
        const data = {
            key: '0',
            title: <FocusInput onFinish={value => {
                if (!value) {
                    treeDataA.splice(treeDataA.length - 1, 1)
                    treeDataA = treeDataA.slice(0)
                    setValue([])
                    return;
                }

                post(`mutation{AddRouteGroup(name:"${value}", parent:${props.data.id}){id,name,parent,pos}}`).then(_data => {
                    let group = _data.data.AddRouteGroup
                    treeDataA[treeDataA.length - 1].key = group.id
                    treeDataA[treeDataA.length - 1].title = group.name
                    treeDataA = treeDataA.slice(0)
                    setDataA(treeDataA)
                })
            }}></FocusInput>,
            children: [
            ]
        }
        treeDataA.push(data)
        treeDataA = treeDataA.slice(0)
        setDataA(treeDataA)
    }
    const onBtnDelClick = () => {
        if (!selectedKeys.children) {
            message.success({
                content: '请先选择一个分组',
                className: 'custom-class',
                style: {
                    marginTop: '20vh',
                },
            });
            return
        }

        treeDataA = dataA
        for (let i = 0; i < treeDataA.length; i++) {
            const element = treeDataA[i];
            if (element.title == selectedKeys.title) {
                post(`mutation{DelRouteGroup(id:${element.key}){id}}`)
                treeDataA.splice(i, 1)
                break;
            }

        }
        treeDataA = treeDataA.slice(0)
        setDataA(treeDataA)
    }

    const onClickToLeft = () => {
        treeDataA = dataA
        const check = checkedKeysB.filter(value => !value.disabled && !value.children)
        console.log(check)
        if (!selectedKeys.children) return
        for (let index = 0; index < treeDataA.length; index++) {
            const element = treeDataA[index];
            if (element.key == selectedKeys.key) {
                check.map(value => {
                    post(`mutation{AddRouteChnnl(type:${value.type}, parent:${element.key},scene:${props.data.id},outname:"${value.title}",outid:"${value.key}"){id}}`)
                    element.children.push({
                        title: value.title,
                        key: value.key,
                    })
                })
                break;
            }
        }
        treeDataA = treeDataA.slice(0)
        setDataA(treeDataA)
    }
    const onClickToRight = () => {
        console.log(checkedKeysA)
        for (let x = 0; x < checkedKeysA.length; x++) {
            if (checkedKeysA[x].children) continue;

            for (let index = 0; index < treeDataA.length; index++) {
                const element = treeDataA[index];
                for (let i = 0; i < element.children.length; i++) {
                    const _element = element.children[i];

                    if (_element.title == checkedKeysA[x].title) {
                        console.log(checkedKeysA[x])
                        post(`mutation{DelRouteChnnl(id:${checkedKeysA[x].id}){id}}`)
                        element.children.splice(i, 1);
                        break;
                    }
                }
            }
        }
        treeDataA = treeDataA.slice(0)
        setDataA(treeDataA)
    }

    const onBtnOk = () => {
        const value = form.getFieldsValue()

        if (visible == "add") {
            post(`mutation{Addroutescene(name:"${value.name}",parent:${props.parent}){id,name,level,pos,groups}}`).then(data => { props.reset() })
        }
        else if (visible == "modify") {
            post(`mutation{UpdateRouteScene(id:${data.id}, name:"${value.name}",level:${value.level}){id,name,level,groups}}`).then(data => {
                props.reset()
                props.show("hide")
            })
        }
    }

    updataTreeB()
    return (
        <Modal visible={props.visible != "hide"} title="新建"
            okText="确认" cancelText="取消" onCancel={() => { setDataA([]); onCancel() }} onOk={onBtnOk}
            okButtonProps={{ disabled: true }}
            cancelButtonProps={{ disabled: true }}
        >
            <div className="dlg-add">
                <div className="top">
                    <Form form={form} name="horizontal_login" layout="inline" initialValues={{ level: 1 }}>
                        <Form.Item name="name" label="名称" initialValue={"新预案"} rules={[{ required: true, message: '预案名不能为空!' }]}>
                            <Input placeholder="预案名称" value={"新预案"} size="small" style={{ width: 210 }} />
                        </Form.Item>
                        <Form.Item name="level" label="等级" style={{ marginLeft: 35 }}>
                            <Select style={{ width: 120 }} size="small">
                                <Select.Option value={0}>低</Select.Option>
                                <Select.Option value={1}>中</Select.Option>
                                <Select.Option value={2}>高</Select.Option>
                            </Select>
                        </Form.Item>
                        <Form.Item>
                            <Button onClick={onBtnOk} type="primary" size="small" style={{ width: 60 }}>确定</Button>
                        </Form.Item>
                    </Form>
                </div>
                <div className="middle">
                    <Card size="small" title="已选" extra={<div><Button type="primary" size="small" onClick={() => onBtnNewClick()} style={{ marginRight: 5 }}>新建组</Button><Button type="primary" disabled={selectedKeys.length == 0 || !selectedKeys.children} size="small" onClick={() => onBtnDelClick()}>删除组</Button></div>} style={{ width: 250 }}>
                        <div className="scrollarea">
                            <Tree
                                defaultExpandAll
                                checkable
                                onCheck={(checkedKeys, info) => { setCheckedKeysA(info.checkedNodes) }}
                                treeData={dataA}
                                onSelect={onSelect}
                            />
                        </div>
                    </Card>
                    <div className="buttonarea">
                        <Button size="small" disabled={selectedKeys.length == 0 || !selectedKeys.children} onClick={() => onClickToLeft()} >{"<<"}</Button>
                        <Button size="small" disabled={!checkedKeysA.length} onClick={() => onClickToRight()}>{">>"}</Button>
                    </div>
                    <Card size="small" title="资源列表" style={{ width: 250 }}>
                        <div className="scrollarea">
                            <Tree
                                checkable
                                defaultExpandAll={true}
                                defaultExpandedKeys={['0-0-0', '0-0-1']}
                                defaultSelectedKeys={['0-0-0', '0-0-1']}
                                defaultCheckedKeys={['0-1-0-0', '0-1-0-1']}
                                onSelect={onSelect}
                                onCheck={(checkedKeys, info) => {console.log(info.checkedNodes);  setCheckedKeysB(info.checkedNodes) }}
                                treeData={treeDataB}
                            />
                        </div>
                    </Card>
                </div>
                <div className="bottom">
                    <Button size="small">置顶</Button>
                    <Button size="small">置低</Button>
                    <Button size="small">上移</Button>
                    <Button size="small">下移</Button>
                </div>
            </div>
        </Modal>
    );
}

const RouteBodyRightPart = (props) => {
    const dispatch = useDispatch()
    const search = useSelector(state => state.routescene.search)

    const data = props.data;
    const history = useHistory()
    const [scenes, setScenes] = React.useState([])
    const [dlgMode, setDlgMode] = React.useState("hide") // none add modify
    const [modify, setModify] = React.useState()
    React.useEffect(() => {
        LoadData()
    }, [data])


    const handeItemClick = (value) => {
        history.push(`/route/id?${value.id}`, { data:value})
    }

    const handleDelClick = (id) => {
        post(`mutation{DelRouteScene(id:${data.id}){id,name,level,groups}}`).then(data => eventProxy.trigger('/msp/custom/route/addgroup'))
    }

    let _scenes = scenes.filter(value=>value.name.indexOf(search) != -1)
    if (props.type == "open") {
        _scenes = scenes.filter(value=>value.name.indexOf(search) != -1).filter(value => value.state == 1)
    }
    else if (props.type == "close") {
        _scenes = scenes.filter(value=>value.name.indexOf(search) != -1).filter(value => value.state == 0)
    }

    const LoadData = () => {
        post(`{RoutescenesByparent(parent:${data.id}){id,name,state,level,groups,parent,pos}}`)
        .then(_data => {dispatch({type:'/routescene/scenes/get', data:_data});  return setScenes(_data.data.RoutescenesByparent)})
        .catch(err => console.error(err))
    }

    return (
        <div className="route-body-right-part">
            <DlgAdd visible={dlgMode} reset={LoadData} show={value => { setDlgMode(value) }} parent={data.id} data={modify} onCancel={() => { setDlgMode("hide") }} />
            <div className="grouptitle"><div>{data.name}</div><Button type="primary" size="small" onClick={() => handleDelClick(data.id)}>删除</Button></div>
            <div className="line" />
            <div className="grid">
                {
                    _scenes.map(value => <RouteBodyRightPartBlock data={value} reset={LoadData} onModify={(e) => { e.stopPropagation(); setModify(value); setDlgMode("modify") }} onClick={() => handeItemClick(value)} playing={value.state != 0 ? true : false}></RouteBodyRightPartBlock>)
                }
                <RouteBodyRightPartBlockAdd onClick={() => {
                    post(`mutation{Addroutescene(name:"新预案",parent:${data.id}){id}}`).then(data => { LoadData() })
                }} />
            </div>
        </div>
    )
}

export default RouteBodyRightPart


