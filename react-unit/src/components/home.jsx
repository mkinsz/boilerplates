import React, { useEffect, useMemo } from 'react';
import { Layout, message } from 'antd';
import { createUseStyles } from 'react-jss';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { AUTH } from '../actions'
import * as session from '../utils'
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

	const auth = useSelector(state => state.mspsAuth)

	const dispatch = useDispatch()

	// useEffect(() => {
    //     // 监听用户长时间不操作后自动退出登录
    //     let currTime = new Date().getTime(),
    //         lastTime = new Date().getTime()
    //     // 设置自动失效时长
    //     const diff = 1000 * 60 * 20;
    //     const handleTimeout = () => {
	// 		lastTime = new Date().getTime();
	// 		// console.log("HandleTimeout: ", currTime - lastTime)
    //     }
    //     $(document).on('mouseover', handleTimeout);
    //     const timer = setInterval(async () => {
	// 		currTime = new Date().getTime();
	// 		// console.log('Timeout Interval: ', currTime - lastTime, diff)
    //         if (currTime - lastTime > diff) {
	// 			//  清除登录状态操作
	// 			AUTH.logout()
	// 			AUTH.remove()
	// 			AUTH.release()
	// 			history.push("/login")
    //             clearInterval(timer);
    //         }
    //     }, 1000);

    //     return () => {
	// 		clearInterval(timer);
    //         $(document).off('mouseover', handleTimeout);
    //     }
	// })

	useEffect(() => {
		dispatch({type:'/msp/v2/sys/licence/query'})
	}, [])

	useEffect(() => {
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
		if(type == 'responsive') return;
		setCollapsed(collapsed);
	}

	const menus = useMemo(()=> {
		const type = auth.type != undefined ? auth.type : parseInt(session.getAuthType())
		return type ? AuthRoutes.opmenus : AuthRoutes.menus
	}, [auth])

	return (
		<Layout className={classes.contain}>
			<Header className={classes.header} >
				<HeaderBar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
			</Header>
			<Layout style={{overflow: 'hidden'}}>
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
