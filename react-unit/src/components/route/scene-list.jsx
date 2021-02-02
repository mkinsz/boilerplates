import React from 'react'
import { createUseStyles } from 'react-jss'
import { Button, Input, Tree, Icon, Popconfirm } from 'antd'
import FocusInput from './focus-input'
import EditDialog from './edit-dialog'
import { useSelector, useDispatch } from 'react-redux'
import { post, stringify } from '../../services/graphql'
import _ from 'lodash'
import { useParams, useHistory } from 'react-router-dom'
import * as theme from '../../styles/msp'
import { FolderOutlined, FolderOpenOutlined } from '@ant-design/icons'

const useStyles = createUseStyles({
	container: {
		flexGrow: 1,
		display: 'flex',
		flexDirection: 'column',
		
	},
	list: {
		flexGrow: 1,
		overflow: 'auto',
		
	},
	buttons: {
		display: 'flex',
		
	},
	button: {
		width: '25%',
	},
})

const getColor = state => {
	switch (state) {
	case -1: return theme.errorColor
	case 1: return theme.warningColor
	case 2: return theme.green6
	}		
}

const SceneList = () => {
	const scene = useSelector(state => state.MediaCenter.Route.Scene)
	const dispatch = useDispatch()

	const [filter, setFilter] = React.useState()
	const [loading, setLoading] = React.useState()
	const [selectedKeys, setSelectedKeys] = React.useState([])
	const [saving, setSaving] = React.useState()
	const [expandedKeys, setExpandedKeys] = React.useState([])

	const { id } = useParams()
	const history = useHistory()

	React.useEffect(() => {
		post(`{Route{Scene{ID,Name,Level,Parent,Pos,State}}}`).then(data =>{
			console.log(data)
			dispatch({type: 'MediaCenterRouteScene', data: data.data.Route.Scene})}
		)
	}, [])

	React.useEffect(() => {
		if (id) setSelectedKeys([id])
		else setSelectedKeys([])
	}, [id])

	React.useEffect(() => {
		const s = scene[id]
		if (s && s.Parent !== '0' && !expandedKeys.includes(s.Parent))
			setExpandedKeys([...expandedKeys, s.Parent])
	}, [scene, id])

	const [editInfo, setEditInfo] = React.useState({})

	const createTree = item => {
		const ret = []
		const children = [...item.children]
		if (!editInfo.ID && !editInfo.Level && item.ID === editInfo.Parent) {
			for (const index in children) {				
				if (editInfo.Pos < scene[children[index]].Pos) {
					children.splice(Number(index), 0, editInfo.ID)
					break
				}
			}
			if (children.length === item.children.length)
				children.push(editInfo.ID)
		}
		for (const id of children) {
			let input
			if (!editInfo.Level && id === editInfo.ID)
				input = <FocusInput onFinish={value => {
					if (value && value !== editInfo.Name) {
						let id = ''
						if (editInfo.ID && editInfo !== '+') id = `ID:"${editInfo.ID}",`
						let parent = ''
						console.log(id,value,parent,editInfo.Pos)
						if (editInfo.Parent) parent = `Parent:"${editInfo.Parent}",`
						post(`mutation{Route{Scene(${id}Name:"${value}",${parent}Pos:${editInfo.Pos})}}`).then(data =>
							dispatch({type: 'MediaCenterRouteScene', data: {
								ID: data.data.Route.Scene.ID,
								...editInfo,
								Name: value,
							}})
						)
					}
					setEditInfo({})}
				} style={{marginTop: -2}} />
			const i = scene[id]
			const cc = i && !i.Level ? createTree(i) : []
			if (filter && !filter[i.ID] && !cc.length) continue
			let title
			if (input) title = input
			else if (i && i.Level && i.State)
				title = <span style={{color: getColor(i.State)}}>{i.Name}</span>
			else title = i.Name
			ret.push(<Tree.TreeNode title={title} key={i ? i.ID : '+'}
				icon={i && i.Level ? undefined :
					({expanded}) => expanded ? <FolderOpenOutlined /> : <FolderOutlined />
			}>{cc}</Tree.TreeNode>)
		}
		return ret
	}

	const tree = createTree(scene['0'])

	const setPP = (info, target, pos = 0) => {
		if (pos === 1) {
			const item = scene[target]
			if (item.next) {
				target = item.next
				pos = -1
			}	else {
				target = item.Parent
				pos = 0
			}
		}
		const s = scene[target]
		let c
		if (s) {
			if (s.Level || pos) {
				info.Parent = s.Parent
				if (s.prev)	info.Pos = (s.Pos + scene[s.prev].Pos) / 2
				else info.Pos = s.Pos / 2 - Number.MAX_VALUE / 4
			} else {
				info.Parent = s.ID
				c = s.children
				if (!expandedKeys.includes(s.ID))
					setExpandedKeys([...expandedKeys, s.ID])
			}
		} else {
			info.Parent = '0'
			c = scene['0'].children
		}
		if (c) {
			if (c.length) info.Pos = scene[c[c.length - 1]].Pos / 2 + Number.MAX_VALUE / 4
			else info.Pos = 0
		}
	}

	const classes = useStyles()
	const disableEdit = !scene[selectedKeys[0]] || scene[selectedKeys[0]].State
	return <div className={classes.container}>
		<Input.Search allowClear placeholder='请输入搜索内容'
			onChange={e => {if (e.target.value === '') setFilter()}}
			onSearch={value => {
				if (value === '') {
					setFilter()
					setLoading(false)
					return
				}
				setLoading(true)
				post(`{Route{Scene(filter:{Name_contains:"${value}"}){ID}}}`).then(data => {
					const filter = {}
					const a = data.data.Route.Scene
					for (const item of a) filter[item.ID] = true
					setLoading(false)
					setFilter(filter)
				})
			}} loading={loading} />
		<div className={classes.list}>
			<Tree blockNode draggable showIcon expandedKeys={expandedKeys}
				onExpand={expandedKeys => setExpandedKeys(expandedKeys)}
				selectedKeys={selectedKeys}
				onSelect={selectedKeys => {
					const item = scene[selectedKeys[0]]
					if (item && item.Level) history.replace(item.ID)
					setSelectedKeys(selectedKeys)
				}}
				onDrop={info => {
					let dropKey = info.node.props.eventKey
					const dragKey = info.dragNode.props.eventKey
					const dropPos = info.node.props.pos.split('-')
					const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1])
					const data = scene[dragKey]
					const item = _.cloneDeep(data)
					setPP(item, dropKey, dropPosition)
					setSelectedKeys([])
					let parent = '', pos = ''
					if (item.Parent !== data.Parent)
						parent = `Parent:"${item.Parent}",`
					if (item.Pos !== data.Pos)
						pos = `Pos:${item.Pos},`
					if (!pos && !parent) return
					post(`mutation{Route{Scene(${parent}${pos}ID:"${item.ID}")}}`).then(data => {
						dispatch({type: 'MediaCenterRouteSceneMove', data: item})
					})
				}}
			>{tree}</Tree>
		</div>
		<div className={classes.buttons}>
			<Button className={classes.button} size='small' onClick={() => {
				const info = {Level: 0}
				setPP(info, selectedKeys[0])
				setEditInfo(info)
			}}>新增分组</Button>
			<Button className={classes.button} size='small' onClick={() => {
				const info = {ID: '+', Level: 2}
				setPP(info, selectedKeys[0])
				setEditInfo(info)
			}}>新建预案</Button>
			<EditDialog id={editInfo.Level ? editInfo.ID : undefined} confirmLoading={saving}
				onCancel={() => setEditInfo({})} onOk={value => {
					setSaving(true)
					let id = ''
					if (editInfo.ID && editInfo !== '+') id = `ID:"${editInfo.ID}",`
					let parent = ''
					if (editInfo.Parent) parent = `Parent:"${editInfo.Parent}",`
					let pos = ''
					if (editInfo.Pos) pos = `Pos:${editInfo.Pos},`
					console.log("---------------------", `mutation{Route{Scene(${id}Name:"${value.Name}",Level:${value.Level},${parent}${pos}Groups:${stringify(value.Groups)})}}`)
					post(`mutation{Route{Scene(${id}Name:"${value.Name}",Level:${value.Level},${parent}${pos}Groups:${stringify(value.Groups)})}}`).then(data => {
						dispatch({type: 'MediaCenterRouteScene', data: {
							...editInfo, ...value, Groups: null,
							ID: editInfo.ID === '+' ? data.data.Route.Scene.ID : editInfo.ID,
						}})
						setSaving(false)
						setEditInfo({})
					})
				}}
			/>
			<Button className={classes.button} disabled={!selectedKeys[0]} onClick={() =>
				setEditInfo({...scene[selectedKeys[0]], Parent: undefined, Pos: undefined})
			} disabled={disableEdit} size='small'>修改</Button>
			{disableEdit ? <Button className={classes.button} disabled={disableEdit} size='small'>删除</Button> :
				<Popconfirm title='确认删除？' onConfirm={() => {
					const id = selectedKeys[0]
					dispatch({type: 'MediaCenterRouteScene', del: id})
					post(`mutation{Route{Scene(ID:"${id}")}}`)
				}}>
					<Button className={classes.button} disabled={disableEdit} size='small'>删除</Button>
				</Popconfirm>
			}
		</div>
	</div>
}

export default SceneList
