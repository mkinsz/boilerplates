import React from 'react'
import { useParams } from 'react-router-dom'
import { Redirect } from 'react-router'
import { useSelector, useDispatch } from 'react-redux'
import { createUseStyles } from 'react-jss'
import { Button, Collapse, Switch, Popconfirm, Icon, Input, message } from 'antd'
import { post, stringify } from '../../services/graphql'
import * as theme from '../../styles/msp'
import _ from 'lodash'
import Label from '../public/label.jsx'
import ConflictResolver from './conflict-resolver'

import 视频 from '@/assets/route/视频.svg'
import 音频 from '@/assets/route/音频.svg'
import 视频播放 from '@/assets/route/视频播放.svg'
import 视频暂停 from '@/assets/route/视频暂停.svg'
import 音量 from '@/assets/route/音量.svg'
import 静音 from '@/assets/route/静音.svg'
import 重置 from '@/assets/route/重置.svg'
import 删除 from '@/assets/route/删除.svg'

const useStyles = createUseStyles({
	container: {
		height: '100%',
	},
	header: {
		height: 44,
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		
	},
	headerLeft: {
		width: 1,
		flexGrow: 1,
		fontSize: '32px',
		
	},
	headerMid: {
		width: 1,
		flexGrow: 1,
		display: 'flex',
		justifyContent: 'center',
		
	},
	headerRight: {
		width: 1, height: '100%', flexGrow: 1,
		display: 'flex',
		justifyContent: 'flex-end',
		alignItems: 'flex-end',
		
	},
	largeButton: {
		width: 160,
		margin: '5px 20px',
		
	},
	smallButton: {
		width: 80,
	},
	content: {
		height: 'calc(100% - 60px)',
		overflow: 'auto',
	},
	panelHeader: {
		display: 'flex',
		alignItems: 'center',
		
	},
	panelHeaderSwitch: {
		marginLeft: 10,
		
	},
	panel: {
		display: 'flex',
		flexWrap: 'wrap',
		
	},
	port: {
		width: 300, height: 100, margin: 5, padding: 10,
		border: '1px solid',
		borderColor: theme.componentBackground,
		display: 'flex', flexDirection: 'column',
		position: 'relative',
		
	},
	portEdge: {
		flexGrow: 1,
		display: 'flex',
		alignItems: 'center',
	},
	portTools: {
		position: 'absolute', top: 0, right: 5,
	},
	portIcon: {
		marginRight: 10,
		fontSize: 30,
		lineHeight: '30px',
	},
})

const Port = props => {
	const classes = useStyles()

	const [hover, setHover] = React.useState()
	const [resetLoading, setResetLoading] = React.useState()
	const [clearLoading, setClearLoading] = React.useState()
	const [changeLoading, setChangeLoading] = React.useState()

	const port = props.data
	const input = port.Input
	const edge = port.Edge

	const video = port.Output.Type === 'voutput'

	return <div className={classes.port}
		style={port.State < 0 ? {border: '1px solid red'} : undefined}
		onMouseEnter={() => setHover(true)}
		onMouseLeave={() => setHover(false)}
		onDragOver={e => {
			if (e.dataTransfer.types.includes('application/msp-resource-' + (port.Output.Type === 'voutput' ? 'vinput' : 'ainput'))) {
				e.preventDefault()
				e.stopPropagation()
			}
		}} onDrop={e => props.onDrop(e)}>
		{props.data.Output.Name}
		<div className={classes.portEdge}>
			<div className={classes.portIcon}>
				{video ? <视频 /> : <音频 />}
			</div>
			{edge ? edge.Name : '无信号'}
		</div>
		{hover && <div className={classes.portTools}>
			{(input && !edge || !input && edge || (input && edge && input.ID !== edge.ID)) &&
				<Button type='link' icon={<重置 />} size='small' loading={resetLoading}
					onClick={() => {
						setResetLoading(true)
						props.onReset(setResetLoading)
					}}
				/>
			}
			{edge && <Button type='link' icon={<删除 />} size='small' loading={clearLoading}
				onClick={() => {
					setClearLoading(true)
					props.onClear(setClearLoading)
				}}
			/>}
			<Button type='link' icon={port.State ?
				(video ? <视频暂停 /> : <静音 />) :
				(video ? <视频播放 /> : <音量 />)
			} size='small'
				loading={changeLoading} onClick={() => {
					setChangeLoading(true)
					props.onChange(setChangeLoading)
				}}
			/>
		</div>}
	</div>
}

const GroupSwitch = props => {
	const [loading, setLoading] = React.useState()
	return <div className={props.className}><Switch checked={props.checked}
		loading={loading} onChange={(checked, e) => {
			e.stopPropagation()
			setLoading(true)
			props.onChange(checked, setLoading)
		}}
	/></div>
}

const SceneControl = () => {
	const set = useSelector(state => state.MediaCenter.Route.Scene)
	const { id } = useParams()
	const scene = useSelector(state => state.MediaCenter.Route.Scene[id])
	const dispatch = useDispatch()
	const classes = useStyles()
	const [activeKey, setActiveKey] = React.useState()

	React.useEffect(() => {
		if (scene && !scene.Groups)
			post(`{Route{Scene(ID:"${id}"){Groups}}}`).then(data =>
				dispatch({type: 'MediaCenterRouteScene', data: {...scene, ...data.data.Route.Scene[0]}})
			)
	}, [scene])

	React.useEffect(() => {setActiveKey(['0', '1', '2', '3', '4'])}, [id])

	const [stateLoading, setStateLoading] = React.useState()
	const [conflicts, setConflicts] = React.useState()
	const [conflictsLoading, setConflictsLoading] = React.useState()
	const [name, setName] = React.useState()
	const [saveLoading, setSaveLoading] = React.useState()
	const [saveAsLoading, setSaveAsLoading] = React.useState()

	if (!id) {
		const last = localStorage.getItem('route-last-id')
		if (last) return <Redirect to={last} />
		else {
			const keys = Object.keys(set)
			if (keys.length) return <Redirect to={keys[0]} />
		}
	} else localStorage.setItem('route-last-id', id)
	if (!scene) return null

	const update = (data, request) => {
		if (data.errors) {
			if (data.errors[0])
				message.error(data.errors[0].message)
			if (request && data.errors[1])
				setConflicts({data: JSON.parse(data.errors[1].message), request: request})
		}
		if (data.data)
			dispatch({type: 'MediaCenterRouteSceneUpdate', data: data.data.Route.Scene})
	}

	const panels = []
	if (scene.Groups) {
		for (const index in scene.Groups) {
			const group = scene.Groups[index]
			const ports = []
			for (const i in group.Ports) {
				const port = group.Ports[i]
				ports.push(<Port key={i} data={port} onDrop={e => {
					const data = e.dataTransfer.getData('application/msp-resource')
					if (data)
						post(`mutation{Route{Scene(ID:"${id}",Groups:{Index:${index},Ports:{Index:${i},Edge:"${data}"}})}}`).then(data =>
							update(data)
						)
				}} onReset={setLoading => {
					post(`mutation{Route{Scene(ID:"${id}",Groups:{Index:${index},Ports:{Index:${i},Edge:"${port.Input ? port.Input.ID : ""}"}})}}`).then(data => {
						update(data)
						setLoading()
					})
				}} onClear={setLoading => {
					post(`mutation{Route{Scene(ID:"${id}",Groups:{Index:${index},Ports:{Index:${i},Edge:""}})}}`).then(data => {
						update(data)
						setLoading()
					})
				}} onChange={setLoading => {
					const request = `ID:"${id}",Groups:{Index:${index},Ports:{Index:${i},State:${port.State ? 0 : 2}}}`
					post(`mutation{Route{Scene(${request})}}`).then(data => {
						update(data, request)
						setLoading()
					})
				}} />)
			}
			panels.push(<Collapse.Panel header={
				<div className={classes.panelHeader}>
					{group.Name}
					<GroupSwitch className={classes.panelHeaderSwitch}
						checked={!!group.State}
						onChange={(checked, setLoading) => {
							const request = `ID:"${id}",Groups:{Index:${index},State:${checked ? 2 : 0}}`
							post(`mutation{Route{Scene(${request})}}`).then(data => {
								update(data, request)
								setLoading()
							})
						}}
					/>
				</div>
			} key={index}>
				<div className={classes.panel}>{ports}</div>
			</Collapse.Panel>)
		}
	}

	return <div className={classes.container}>
		<div className={classes.header}>
			<div className={classes.headerLeft}><Label text={scene.Name} /></div>
			<div className={classes.headerMid}>
				<Button type='primary' className={classes.largeButton} loading={stateLoading}
					onClick={() => {
						setStateLoading(true)
						const request = `ID:"${id}",State:${scene.State ? 0 : 2}`
						post(`mutation{Route{Scene(${request})}}`).then(data => {
							update(data, request)
							setStateLoading()
						})
					}}
				>{scene.State ? '停止' : '开始'}</Button>
				<Button className={classes.largeButton} loading={stateLoading}
					onClick={() => {
						setStateLoading(true)
						post(`mutation{Route{Scene(ID:"${id}",Reset:1)}}`).then(data => {
							update(data)
							setStateLoading()
						})
					}}
				>重置</Button>
			</div>
			<div className={classes.headerRight}>
				<Button size='small' className={classes.smallButton}
					loading={saveLoading}
					onClick={() => {
						setSaveLoading(true)
						const groups = []
						for (const g of scene.Groups) {
							const ports = []
							for (const p of g.Ports) {
								const port = {Output: {ID: p.Output.ID}}
								if (p.Edge) port['Input'] = {ID: p.Edge.ID}
								ports.push(port)
							}
							groups.push({Name: g.Name, Ports: ports})
						}
						post(`mutation{Route{Scene(ID:"${id}",Groups:${stringify(groups)})}}`).then(data => {
							const d = _.cloneDeep(scene)
							for (const g of d.Groups) {
								for (const p of g.Ports) {
									p.Input = p.Edge
									if (p.State) p.State = 2
								}
								if (g.State) g.State = 2
							}
							if (d.State) d.State = 2
							dispatch({type: 'MediaCenterRouteScene', data: d})
							setSaveLoading()
						})
					}}
				>保存</Button>
				<Popconfirm icon={<Icon type='copy' style={{color: 'unset'}} />}
					title={<Input value={name} onChange={e => setName(e.target.value)} size='small' />}
					onConfirm={() => {
						setSaveAsLoading(true)
						const groups = []
						for (const g of scene.Groups) {
							const ports = []
							for (const p of g.Ports) {
								const port = {Output: {ID: p.Output.ID}}
								if (p.Edge) port['Input'] = {ID: p.Edge.ID}
								ports.push(port)
							}
							groups.push({Name: g.Name, Ports: ports})
						}
						const next = scene.next ? set[scene.next].Pos : Number.MAX_VALUE / 2
						const pos = (scene.Pos + next) / 2
						post(`mutation{Route{Scene(Name:"${name}",Level:${scene.Level},Parent:"${scene.Parent}",Pos:${pos},Groups:${stringify(groups)})}}`).then(data => {
							const d = _.cloneDeep(scene)
							d.ID = data.data.Route.Scene.ID
							d.Name = name
							for (const g of d.Groups)
								for (const p of g.Ports) {
									p.Input = p.Edge
									p.Edge = null
								}
							dispatch({type: 'MediaCenterRouteScene', data: d})
							setSaveAsLoading()
						})
					}}
				>
					<Button size='small' loading={saveAsLoading} className={classes.smallButton}>
						另存为
					</Button>
				</Popconfirm>
			</div>
		</div>
		<div className={classes.content}>
			<Collapse activeKey={activeKey} onChange={key => setActiveKey(key)}>
				{panels}
			</Collapse>
			<ConflictResolver data={conflicts && conflicts.data}
				confirmLoading={conflictsLoading}
				onCancel={() => setConflicts()}
				onOk={() => {
					setConflictsLoading(true)
					post(`mutation{Route{Scene(${conflicts.request},Force:1)}}`).then(data => {
						update(data)
						setConflictsLoading(false)
						setConflicts()
					})
				}} />
		</div>
	</div>
}

export default SceneControl
