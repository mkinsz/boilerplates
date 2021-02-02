import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react'
import { Input, List, Button, Tooltip, message } from 'antd'
import PropTypes from 'prop-types';
import { SearchOutlined } from '@ant-design/icons';
import { ReactComponent as Svg_Round } from '@/assets/public/round.svg'

const Item = props => {
    const handleDrag = e => {
        // e.preventDefault();
        // e.stopPropagation();
        // return true
    }

    const handleDragStart = e => {
        // e.preventDefault();
        // e.stopPropagation();


        const dt = e.dataTransfer;
        dt.setData('chnid', props.data.id);
        dt.setData('title', props.data.name);
        return true
    }

    const handleDragEnd = e => {
        // e.preventDefault();
        // e.stopPropagation();
        // return true;
    }

    return <div className='search_item' draggable
        onDrag={handleDrag}
        onDragStart={handleDragStart}
        // onDragEnd={handleDragEnd}
        style={{
            display: 'flex', alignItems: 'center', flexDirection: 'row',
            borderBottom: '1px solid #F0F0F0', fontSize: 14, overflow: 'hidden',
            width: '100%', minHeight: 32, textOverflow: 'ellipsis', padding: '5px 12px',
        }}>
        <Svg_Round style={{ minWidth: 14, maxWidth: 14, width: 14, marginRight: 5, fill: props.data.online ? '#53d81f' : '#999999' }} />
        <div style={{ userSelect: 'none', whiteSpace: 'nowrap', flex: 'auto', }} >{props.children}</div>
    </div>
}

const Search = props => {
    const [viewed, setViewed] = useState(false)
    const [focus, setFocus] = useState(false)
    const [value, setValue] = useState('')
    const [loading, setLoading] = useState(false)

    useLayoutEffect(() => {
        setViewed(focus ? props.data.length : focus)
    }, [props.data, focus])

    useLayoutEffect(()=> {
        setLoading(false)
    }, [props.data])

    useEffect(() => {
        if (value == '') props.onPressEnter()
    }, [value])

    const handleValueSearch = (value, e) => {
        if(value == '') {
            message.warn('请输入搜索内容...')
        }else {
            props.onPressEnter(value)
            setLoading(true)
        }
    }

    return <div tabIndex='0' onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{ height: 30, position: 'relative', zIndex: 999, outline: 'none' }}>
        <Input.Search placeholder="资源搜索" maxLength={20}
            onChange={({ target: { value } }) => setValue(value)}
            loading={loading} onSearch={handleValueSearch}
            style={{ borderRadius: 4 }} />
        <div style={{
            marginTop: 2, display: viewed ? 'block' : 'none', background: '#fff',
            boxShadow: '0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05)'
        }}>
            <div style={{ maxHeight: 264, overflowY: 'auto'}}>
                <List
                    dataSource={props.data}
                    renderItem={item => <Tooltip getPopupContainer={triggerNode => triggerNode.parentNode} title={item.name}> <Item data={item}
                        draggable={props.draggable} > {item.name} </Item> </Tooltip>
                    }>
                </List>
            </div>

            <div style={{
                display: props.data.length%16 ? 'none' : 'flex',
                margin: '0px 5px', height: 32, alignItems: 'center', justifyContent: 'center'
            }}>
                <a onClick={() => props.onLoadMore(value)}>加载更多...</a>
            </div>
        </div>
    </div>
}

Search.defaultProps = {
    data: [],
    checkable: false,
    draggable: false,
}

Search.propTypes = {
    data: PropTypes.array,
    onPressEnter: PropTypes.func
}

export default Search;