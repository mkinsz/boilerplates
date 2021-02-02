import React from 'react';
import { connect } from 'react-redux';
import { useState, useMemo } from 'react';
import { Modal, Select, Button, Input, Form, InputNumber, Space, Checkbox, Row, Col, Empty } from 'antd';
import { CONFIG, SCREEN } from '../../../actions';
import { Label } from '../../public';
import { useEffect } from 'react';

export const CustonRateModal = props => {
    const [form] = Form.useForm()
    const [ratedata, setRatedata] = useState()

    const layout = {
        labelCol: {
            span: 5,
        },
        wrapperCol: { span: 12 },
    }

    useEffect(() => {
        // if(!props.data) return;
        // if(!props.data.advhor || !props.data.advver) return;
    console.log('props.data',props.data)

        const a = {
            tvid: props.data.tvid||0,
            id: props.data.id||0,
            module: props.data.module||0,
            scantype: props.data.scantype||0,
            width:  props.data.width||0,
            height:  props.data.height||0,
            fresh:  props.data.fresh||0,
            hfront:  (props.data.advhor&&props.data.advhor.front)||0,
            hback:  (props.data.advhor&&props.data.advhor.back)||0,
            hsyncwidth:  (props.data.advhor&&props.data.advhor.syncwidth)||0,
            hsyncpolar:  (props.data.advhor&&props.data.advhor.syncpolar)||0,
            vfront:  (props.data.advver&&props.data.advver.front)||0,
            vback:  (props.data.advver&&props.data.advver.back)||0,
            vsyncwidth:  (props.data.advver&&props.data.advver.syncwidth)||0,
            vsyncpolar:  (props.data.advver&&props.data.advver.syncpolar)||0,
            flag:  props.data.flag||0,
        }
        setRatedata(a)

        form.setFieldsValue(a)
    }, [props.data])


    const onFinish = values => {
        console.log('all values',ratedata)
        props.onFinish(ratedata)
    };

    const onFinishFailed = errorInfo => {
        console.log('Failed:', errorInfo);
    };

    const onValuesChange = (val, allVals) => {
        switch(Object.keys(val)[0])
        {
            case 'module':
                console.log('modulechange',{...ratedata,module:Object.values(val)[0]?1:0})
                setRatedata({...ratedata,module:Object.values(val)[0]?1:0})
            break
            default:
                setRatedata({...ratedata,[Object.keys(val)[0]]:parseInt(Object.values(val)[0])})
        }
    }

    return <>
        {
            props.visible ? <Modal                
                title="自定义分辨率"
                okText='确认'
                cancelText='取消'
                visible={true}
                onOk={() => {form.submit();props.setVisible(false)}}
                onCancel={() => props.setVisible(false)}
            >
                <Form
                    form={form}
                    {...layout}
                    name="osdProperty"
                    // initialValues={}
                    onFinish={onFinish}
                    onFinishFailed={onFinishFailed}
                    onValuesChange={onValuesChange}
                >
                    <Form.Item label='宽度' name='width'>
                        <Input type='text' disabled={ratedata.tvid} />
                    </Form.Item>
                    <Form.Item label='高度' name='height'>
                        <Input type='text' disabled={ratedata.tvid} />
                    </Form.Item>
                    <Form.Item label='刷新率' name='fresh'>
                        <Input type='text' disabled={ratedata.tvid} />
                    </Form.Item>
                    <Form.Item label='扫描方式' name='scantype' style={{ marginBottom: 0 }}>
                        <Select disabled={ratedata.tvid}>
                            <Option value={0}> 隔行扫描</Option>
                            <Option value={1}> 逐行扫描</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="module" valuePropName="checked" style={{ marginBottom: 0 }}>
                        <Checkbox disabled={ratedata.tvid}>高级</Checkbox>
                    </Form.Item>
                    {ratedata.module == 0 ? <></> : <>
                        <Row gutter={[50, 8]} style={{ marginBottom: 0 }}>
                            <Col span={4}>
                            </Col>
                            <Col span={6}>
                                <Label>横向</Label>
                            </Col>
                            <Col span={8}>
                                <Label>纵向</Label>
                            </Col>
                        </Row>
                        <Form.Item label='前沿像素' style={{ marginBottom: 0 }}>
                            <Form.Item name='hfront' wrapperCol={{ span: 24 }} style={{ display: 'inline-block', width: 'calc(50% - 4px)' }}>
                                <Input type='text' disabled={ratedata.tvid} />
                            </Form.Item>
                            <Form.Item name='vfront' wrapperCol={{ span: 24 }} style={{ display: 'inline-block', width: 'calc(50% - 4px)', margin: '0 4px' }}>
                                <Input type='text' disabled={ratedata.tvid} />
                            </Form.Item>
                        </Form.Item>
                        <Form.Item label='后沿像素' style={{ marginBottom: 0 }}>
                            <Form.Item name='hback' wrapperCol={{ span: 24 }} style={{ display: 'inline-block', width: 'calc(50% - 4px)' }}>
                                <Input type='text' disabled={ratedata.tvid} />
                            </Form.Item>
                            <Form.Item name='vback' wrapperCol={{ span: 24 }} style={{ display: 'inline-block', width: 'calc(50% - 4px)', margin: '0 4px' }}>
                                <Input type='text' disabled={ratedata.tvid} />
                            </Form.Item>
                        </Form.Item>
                        <Form.Item label='同步宽度' style={{ marginBottom: 0 }}>
                            <Form.Item name='hsyncwidth' wrapperCol={{ span: 24 }} style={{ display: 'inline-block', width: 'calc(50% - 4px)' }}>
                                <Input type='text' disabled={ratedata.tvid} />
                            </Form.Item>
                            <Form.Item name='vsyncwidth' wrapperCol={{ span: 24 }} style={{ display: 'inline-block', width: 'calc(50% - 4px)', margin: '0 4px' }}>
                                <Input type='text' disabled={ratedata.tvid!=0} />
                            </Form.Item>
                        </Form.Item>
                        <Form.Item label='同步极性' style={{ marginBottom: 0 }}>
                            <Form.Item name='hsyncpolar' wrapperCol={{ span: 24 }} style={{ display: 'inline-block', width: 'calc(50% - 4px)' }}>
                                <Select  disabled={ratedata.tvid}>
                                    <Option value={0}> +</Option>
                                    <Option value={1}>-</Option>
                                </Select>
                            </Form.Item>
                            <Form.Item name='vsyncpolar' wrapperCol={{ span: 24 }} style={{ display: 'inline-block', width: 'calc(50% - 4px)', margin: '0 4px' }}>
                                <Select disabled={ratedata.tvid}>
                                    <Option value={0}> +</Option>
                                    <Option value={1}>-</Option>
                                </Select>
                            </Form.Item>
                        </Form.Item>
                        </>
                    }

                </Form>
            </Modal> : <></>
        }

    </>
}

