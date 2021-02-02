import React, { useState, useEffect } from 'react'
import { Space, Button, Input, Tooltip } from 'antd'
import {
    PlusOutlined,
    MinusOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    FullscreenOutlined,
    FullscreenExitOutlined
} from '@ant-design/icons'

import screenfull from 'screenfull';

const ToolBar = React.forwardRef((props, ref) => {
    const [fold, setFold] = useState(false)
    const [full, setFull] = useState(false)

    // React.useImperativeHandle(ref, () => ({

    // }));

    useEffect(() => {
        setFold(props.fold)
    }, [props])

    const handleFoldChange = () => {
        setFold(!fold)
        props.onFoldChange(!fold)
    }

    const handleScreenfull = () => {
        setFull(!full)
        screenfull.toggle(props.parentRef.current)
    }

    const isDisable = full ^ screenfull.isFullscreen

    return (
        <div style={{ width: '100%', height: 40, display: 'flex', backgroundColor: 'white', padding: '0 10px' }}>
            <div style={{ flexGrow: 1 }} />
            <Space size={20}>
                {/* <Input suffix="%" size='small' maxLength={20} value={75} style={{ width: 84 }} />
                <Tooltip title='放大'><Button type='ghost' size='small' icon={<PlusOutlined />} /></Tooltip>
                <Tooltip title='缩小'><Button type='ghost' size='small' icon={<MinusOutlined />} /></Tooltip> */}
                {
                    isDisable ? <Button disabled={isDisable} type='ghost' size='small' icon={<FullscreenOutlined />} /> :
                        <Tooltip title={screenfull.isFullscreen ? '最小化' : '最大化'} getPopupContainer={triggerNode => triggerNode.parentNode}>
                            <Button disabled={isDisable} type='ghost' size='small' onClick={handleScreenfull}
                                icon={!screenfull.isFullscreen ? <FullscreenOutlined /> : <FullscreenExitOutlined />} />
                        </Tooltip>
                }

                <Tooltip title={fold ? '展开' : '关闭'} getPopupContainer={triggerNode => triggerNode}>
                    <Button type='ghost' size='small' icon={fold ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />} onClick={handleFoldChange}></Button>
                </Tooltip>
            </Space>
        </div>
    )
})

export default ToolBar;