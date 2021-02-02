import React from 'react'
import Dialog from '../public/dialog'
import { Input, Select, Tree, Button, Icon } from 'antd'
import { createUseStyles } from 'react-jss'
import FocusInput from './focus-input'
import _ from 'lodash'
import { useSelector } from 'react-redux'
import { PlusOutlined } from '@ant-design/icons'
import Label from '../public/label.jsx'

const useStyles = createUseStyles({
	row: {
		display: 'flex',
		alignItems: 'center',
	},
	column: {
		display: 'flex',
		flexDirection: 'column',
	},
	tree: {
		width: 220, height: 500,
		overflow: 'auto',
	},
	treeNodeTitle: {
		width: 120,
	},
})

const EditDialog = props => {
	const device = useSelector(state => state.mspsDev)
	const scene = useSelector(state => state.MediaCenter.Route.Scene[props.id])

	const [name, setName] = React.useState()
	const [level, setLevel] = React.useState(2)
	const [edit, setEdit] = React.useState()
	const [selectedKeys, setSelectedKeys] = React.useState([])
	const [checkedKeys, setCheckedKeys] = React.useState([])
	const [expandedKeys, setExpandedKeys] = React.useState([])

	const [state, dispatch] = React.useReducer((state, action) => {
		console.log(JSON.stringify(state), JSON.stringify(action))
		const newState = _.cloneDeep(state)
		switch (action.type) {
		case 'SET': return {channels: action.channels, groups: action.data}
		case 'ADD': {
			const t = action.target
			if (t) {
				const a = t.split('-')
				const p = newState.groups[a[0]].Ports
				let index = a[1]
				for (const key of action.data) {
					const use = newState.channels[key]
					if (!use) {
						newState.channels[key] = true
						if (index) p.splice(index++, 0, {Output: {ID: key}})
						else p.push({Output: {ID: key}})
					}
				}
			} else if (!Array.isArray(action.data)) {
				setExpandedKeys([...expandedKeys, newState.groups.length.toString()])
				setSelectedKeys([newState.groups.length.toString()])
				newState.groups.push(action.data)
			}
			break
		}
		case 'DEL': {
			const a = action.data.split('-')
			if (a.length > 1) {
				const key = newState.groups[a[0]].Ports[a[1]].Output.ID
				delete newState.channels[key]
				newState.groups[a[0]].Ports.splice(a[1], 1)
				setCheckedKeys(checkedKeys.filter(v => v !== key))
			} else {
				const key = a[0]
				setExpandedKeys(expandedKeys.filter(v => v !== key))
				let newCheckedKeys = [...checkedKeys]
				for (const p of newState.groups[key].Ports) {
					delete newState.channels[p.Output.ID]
					newCheckedKeys = newCheckedKeys.filter(v => v !== p.Output.ID)
				}
				newState.groups.splice(key, 1)
				setCheckedKeys(newCheckedKeys)
			}
			setSelectedKeys([])
			break
		}
		case 'MOV': {
			const from = action.dragKey.split('-')
			const to = action.dropKey.split('-')
			const fromGI = Number(from[0])
			let toGI = Number(to[0])
			const fromG = newState.groups[fromGI]
			if (from.length === 1) {
				toGI += action.dropPosition > 0 ? 1 : 0
				newState.groups.splice(toGI, 0, fromG)
				newState.groups.splice(fromGI + (fromGI > toGI ? 1 : 0), 1)
			} else {
				const toG = newState.groups[toGI]
				const fromPI = Number(from[1])
				const fromP = fromG.Ports[fromPI]
				if (to.length === 1) {
					fromG.Ports.splice(fromPI, 1)
					toG.Ports.push(fromP)
				} else {
					const toPI = Number(to[1]) + (action.dropPosition > 0 ? 1 : 0)
					fromG.Ports.splice(toPI, 0, fromP)
					toG.Ports.splice(fromPI + (fromGI === toGI && fromPI > toPI ? 1 : 0), 1)
				}
			}
			// TODO: fix selected keys here
			setSelectedKeys([])
			break
		}
		}
		console.log(JSON.stringify(newState))
		return newState
	}, {channels: {}, groups: []})

	React.useEffect(() => {
		if (props.id === '+') {
			setName('')
			setLevel(2)
			dispatch({type: 'SET', data: [], channels: {}})
		} else if (scene) {
			setName(scene.Name)
			setLevel(scene.Level)
			const channels = {}
			for (const g of scene.Groups) for (const p of g.Ports) channels[p.Output.ID] = true
			dispatch({type: 'SET', data: scene.Groups, channels: channels})
		}
		setSelectedKeys([])
		setCheckedKeys([])
	}, [props.id])

	const classes = useStyles()

	const getDeviceName = id => {
		let d = device.vouts[id]
		if (d) return d.name
		d = device.aouts[id]
		if (d) return d.name
		return id
	}

	const g = []
	for (const i in state.groups) {
		const item = state.groups[i]
		const c = []
		for (const j in item.Ports)
			c.push(<Tree.TreeNode
				title={<Label className={classes.treeNodeTitle} text={getDeviceName(item.Ports[j].Output.ID)} />}
				key={i + '-' + j} isLeaf />)
		g.push(<Tree.TreeNode icon={({expanded}) => <Icon type={expanded ? 'folder-open' : 'folder'} />}
			title={item.Name} key={i}>{c}</Tree.TreeNode>)
	}
	if (edit)
		g.push(<Tree.TreeNode icon={<Icon type='folder' />} selectable={false}
			title={<FocusInput style={{width: 100}} onFinish={value => {
				setEdit(false)
				if (value) dispatch({type: 'ADD', data: {Name: value, Ports: []}})
			}}
		/>} key='+' />)

	const v = [], a = []
	for (const key in device.vouts) {
		const item = device.vouts[key]
		v.push(<Tree.TreeNode title={<Label className={classes.treeNodeTitle} text={item.name} />} key={key} disabled={state.channels[key]} isLeaf />)
	}
	for (const key in device.aouts) {
		const item = device.aouts[key]
		a.push(<Tree.TreeNode title={<Label className={classes.treeNodeTitle} text={item.name} />} key={key} disabled={state.channels[key]} isLeaf />)
	}

	return <Dialog visible={props.id} onCancel={props.onCancel}
		title={props.id === '+' ? '新建预案' : '修改预案'}
		confirmLoading={props.confirmLoading}
		onOk={() => props.onOk({Name: name, Level: level, Groups: state.groups})}>
		<div className={classes.row}>
			预案名称：
			<Input style={{width: 250, marginRight: 20}} value={name} size='small'
				onChange={e => setName(e.target.value)} />
			预案等级：
			<Select style={{width: 60}} value={level} size='small'
				onChange={value => setLevel(value)}>
				<Select.Option value={3}>高</Select.Option>
				<Select.Option value={2}>中</Select.Option>
				<Select.Option value={1}>低</Select.Option>
			</Select>
		</div>
		<div className={classes.row}>
			<div className={classes.tree}>
				<Button onClick={() => setEdit(true)} size='small' type='link' icon={<PlusOutlined />}
					style={{marginLeft: 20}}>新建组</Button>
				<Tree showIcon draggable defaultExpandAll selectedKeys={selectedKeys}
					onSelect={selectedKeys => setSelectedKeys(selectedKeys)}
					expandedKeys={expandedKeys} onExpand={expandedKeys => setExpandedKeys(expandedKeys)}
					onDrop={info => {
						const dropKey = info.node.props.eventKey
						const dragKey = info.dragNode.props.eventKey
						const dropPos = info.node.props.pos.split('-')
						const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1])
						dispatch({type: 'MOV', dragKey: dragKey, dropKey: dropKey, dropPosition: dropPosition})
					}}
				>{g}</Tree>
			</div>
			<div className={classes.column}>
				<Button size='small'
					disabled={!selectedKeys.length}
					onClick={() => {
						console.log(JSON.stringify(selectedKeys))
						dispatch({type: 'ADD', target: selectedKeys[0],
							data: checkedKeys.filter(v => v !== 'v' && v !== 'a')})
					}}>{'<<'}</Button>
				<Button size='small'
					disabled={!selectedKeys.length}
					onClick={() => dispatch({type: 'DEL', data: selectedKeys[0]})}
				>{'>>'}</Button>
			</div>
			<div className={classes.tree}>
				<Tree checkable selectable={false} checkedKeys={checkedKeys}
					onCheck={checkedKeys => setCheckedKeys(checkedKeys)}>
					<Tree.TreeNode title='视频输出端口' key='v'>{v}</Tree.TreeNode>
					<Tree.TreeNode title='音频输出端口' key='a'>{a}</Tree.TreeNode>
				</Tree>
			</div>
		</div>
	</Dialog>
}

export default EditDialog
