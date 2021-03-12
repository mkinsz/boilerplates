import React, { useEffect, useMemo, useRef } from 'react';
import { Layout, message, Modal, Space, Button } from 'antd';
import { createUseStyles } from 'react-jss';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { AUTH } from '../actions'
import * as session from '../utils'
import { SYS_BITMAP } from './public'
import AuthRoutes from './navigation/routes';
import SiderMenu from './navigation/sidermenu';
import HeaderBar from './navigation/headerbar';
import MainRoute from './navigation/mainroute';

import * as ws from '../services'

const { Header, Sider, Content } = Layout;

const useStyles = createUseStyles({
	contain: {
		height: '100%'
	},
	header: {
		padding: 0,
		height: '60px',
		lineHeight: '50px',
		background: '#FFF',
	},
	content: {
		overflow: 'auto',
		background: 'white',
	},
	title: {
		display: 'flex',
		justifyContent: 'space-between',
		marginBottom: 10
	}
});

const Home = props => {
	const [collapsed, setCollapsed] = React.useState(true);
	const classes = useStyles();
	const history = useHistory()
	const ref = useRef();

	const auth = useSelector(state => state.mspsAuth)
	const licence = useSelector(({ mspsCfg }) => mspsCfg.system.licence)
	const authlic = useSelector(({ mspsCfg }) => mspsCfg.system.auth)

	const dispatch = useDispatch()

	useEffect(() => {
		setTimeout(() => {
			dispatch({ type: '/msp/v2/sys/licence/query' })
			dispatch({ type: '/msp/v2/sys/licence/detail/query' })
		}, 1000)
		
		return () => Modal.destroyAll();
	}, [])

	useEffect(() => {
		const license = Object.values(licence).reduce((t, m, i) => {
			if (m.effecdue < 16 && !m.value)
				t.push(
					<div key={i} style={{ display: 'flex' }}>
						<div style={{ width: 100 }}>{`${SYS_BITMAP[m.module]}:`}</div>
						<div>{`${m.effecdue} 天后过期`}</div>
					</div>
				)
			return t;
		}, [])

		if (license.length && !ref.current) {
			ref.current = Modal.warning({
				centered: true,
				closable: true,
				title: '许可证提醒',
				content: <div style={{ margin: '20px 0 0 0' }}>{license}</div>,
				onOk() { ref.current = undefined; dispatch({ type: '/msp/v2/sys/licence/expire/config' }); }
			})
		}
	}, [licence])

	useEffect(() => {
		const unlogin = !isNaN(Number(window.localStorage.getItem('_msp_nologin_flag_')))
		if(unlogin) return;

		if (auth.occupy) {
			message.warning('账号异地登录，即将退出...', 1, async () => {
				AUTH.remove()
				ws.release();
				history.push('/login')
			})
		}

		if (!session.isAuth() && !auth.manulogout) {
			message.warning('令牌或者链路失效，即将退出...', 1, async () => {
				ws.release();
				history.push('/login')
			})
		}
	}, [auth]);

	const handleCollapsed = (collapsed, type) => {
		if (type == 'responsive') return;
		setCollapsed(collapsed);
	}

	// Bit0=KVM
	// Bit1=大屏调度
	// Bit2=音频调度
	// Bit3=Rest
	// Bit4=中控
	// Bit5=可视化

	const menus = useMemo(() => {
		const now_date = new Date();	//获取Date对象
		now_date.setHours(0);	//设置小时
		now_date.setMinutes(0);	//设置分钟
		now_date.setSeconds(0);	//设置秒
		now_date.setMilliseconds(0);	//设置毫妙
		const timestamp = now_date.getTime();	//获取毫秒时间戳
		const unix_timestamp = Math.floor(timestamp / 1000);	//获取unix时间戳

		const uselic = authlic.expdataList ? authlic.expdataList.filter(m => m) : []
		const isNotExpire = (to, td) => to - td > 0 ? true : false

		const lic_menus = uselic.reduce((t, m, i, a) => {
			switch (i) {
				case 0: break;
				case 1: isNotExpire(a[i], unix_timestamp) && t.push(AuthRoutes.tv_menu); break;
				case 2: break;
				case 3: break;
				case 4: break;
				case 5: break;
			}
			return t;
		}, [])

		if (lic_menus.length == 0) {
			lic_menus.push(AuthRoutes.cfg_menu)
			return lic_menus;
		}

		const type = auth.type != undefined ? auth.type : parseInt(session.getAuthType())
		return type ? AuthRoutes.opmenus : AuthRoutes.menus
	}, [auth, authlic])

	return (
		<Layout className={classes.contain}>
			<Header className={classes.header} >
				<HeaderBar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
			</Header>
			<Layout style={{ overflow: 'hidden' }}>
				<Sider width={140} collapsible breakpoint="lg" collapsed={collapsed} onCollapse={handleCollapsed}>
					<SiderMenu collapsed={collapsed} menus={menus} theme='dark' />
				</Sider>
				<Content className={classes.content}>
					<MainRoute />
				</Content>
			</Layout>
		</Layout>
	);
};

export default Home;
