import React, { useEffect, useState } from 'react';
import { Table, Input, Button, Radio, DatePicker } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { createUseStyles } from 'react-jss';
import { useResize, useComponentResize } from '../public';
import moment from 'moment';
import _ from 'lodash'
import { getUrlLast } from '../../utils'

var FileSaver = require('file-saver');

const { Search } = Input;
const { RangePicker } = DatePicker;

const useStyles = createUseStyles({
	contain: {
		height: '100%',
		width: '100%',
		padding: 20
	},
	title: {
		display: 'flex',
		justifyContent: 'space-between',
		marginBottom: 10
	}
});

const columns = [
	{
		title: '类型',
		dataIndex: 'type',
		width: '10%',
		ellipsis: true
	},
	{
		title: '时间',
		dataIndex: 'time',
		width: '15%',
		render: m => moment.unix(m).format('YYYY-MM-DD HH:mm:ss')
	},
	{
		title: '来源',
		dataIndex: 'user',
		width: '10%',
		ellipsis: true
	},
	{
		title: '事件',
		dataIndex: 'event',
		width: '15%',
		ellipsis: true
	},
	{
		title: '详情',
		dataIndex: 'param',
		ellipsis: true
	}
];

const initialState = {
	results: [],
	offset: 0,
	size: 0,
	total: 0,
	waiting: false
};

let st, kt = null;
let token = null;
const url = (process.env.NODE_ENV == 'production' ? window.location.hostname : '10.67.24.94') + ':8080'

export const reducer = (state, action) => {
	switch (action.type) {
		case '/mpuapi/v1r2/author/keeplive': {
			send({ evt: action.type })
			return state;
		}
		case '/mpuapi/v1r2/log/query': {
			send({ evt: action.type, body: action.payload });
			return state;
		}
		case '/mpuapi/v1r2/log/export': {
			const nstate = { ...state };
			nstate.waiting = true;
			send({ evt: action.type, body: action.payload });
			return nstate;
		}
		case '/mpuapi/v1r2/log/export/ack': {
			const nstate = { ...state };
			nstate.waiting = false;

			const fileName = getUrlLast(action.body.filepath);
			const durl = `http://${url}/` + action.body.filepath
			fetch(durl).then(res => {
				res.ok && res.blob().then(blob => FileSaver.saveAs(blob, fileName))
			}).catch(err => {
				console.log('export log error: ', err)
			}).finally(() => {
				return true;
			})

			// fetch(action.body.filepath).then(res =>
			// 	res.blob().then(blob => {
			// 		const a = document.createElement('a');
			// 		a.href = URL.createObjectURL(blob);
			// 		a.download = fileName;
			// 		a.click();
			// 		URL.revokeObjectURL(a.herf);
			// 		a.remove();
			// 	})
			// ).catch(err => {
			// 	console.log("fetch err: ", err1)
			// })

			return nstate;
		}
		case '/mpuapi/v1r2/log/query/ack': {
			const nstate = { ...state };
			if (!action.body) return state;
			nstate.offset = action.body.offset;
			nstate.size = action.body.size
			nstate.total = action.body.totalsize
			delete nstate.results
			nstate.results = action.body.items;
			return nstate;
		}
		default:
			return state;
	}
};

const send = msg => {
	if (!st || WebSocket.OPEN != st.readyState) return;
	if (msg.evt != '/p1010/v1/pc/token')
		token && (msg.token = token)

	st.send(JSON.stringify(msg));

	switch (msg.evt) {
		case '/mpuapi/v1r2/author/keeplive': break
		default: console.log('send: ', msg);
	}
}

const Log = props => {
	const [pagination, setPagination] = React.useState({
		pageSize: 16,
		size: 'normal',
		showSizeChanger: false
	});

	const [loading, setLoading] = useState(false);
	const [period, setPeriod] = useState(1);
	const [search, setSearch] = useState('');
	const [custom, setCustom] = useState()

	const sref = React.useRef(16)

	const ref = React.useRef()
	const classes = useStyles();
	const resize = useComponentResize(ref)

	const [glog, dispatch] = React.useReducer(reducer, initialState)

	const init = (url, time = 0) => {
		const proto = window.location.protocol == 'http:' ? 'ws://' : 'wss://'
		window.WebSocket = window.WebSocket || window.MozWebSocket;
		if (!window.WebSocket) { // 检测浏览器支持  
			console.log('Error: WebSocket is not supported .');
			return;
		}
		st = new WebSocket(proto + url + '/schedule/ws')
		st.onmessage = e => recv(e.data)
		st.onclose = e => {
			st = null;
			clearInterval(kt)
		}
		st.onerror = e => st && console.log('ws err: ', e)
		return new Promise((resolve) => {
			st.onopen = () => {
				console.log('websocket open...')
				kt = setInterval(() => dispatch({ type: '/mpuapi/v1r2/author/keeplive' }), 5000);
				resolve();
			};

			!!time && setTimeout(() => {
				resolve('do not receive message')
			}, time);
		})
	}

	const recv = async blob => {
		let data = await (new Response(blob)).text()
		data = JSON.parse(data)
		const msg = { ...data, ...data.head, type: data.evt }

		// Silence
		switch (msg.type) {
			case '/mpuapi/v1r2/author/keeplive/ack': return;
			default: console.log('recv: ', msg);
		}

		// msg.err.length && console.log(`错误代码: ${msg.err}`)
		dispatch(msg)
	}

	const release = () => {
		if (!st) return;
		st.close()
		st = null;
		clearInterval(kt)
	}

	useEffect(() => {
		async function syncInit() {
			await init(url, 100).then(() => {
				console.log('ws init success...')
				query();
			}).catch(err => {
				console.log('ws init failed...', err)
			})
		}

		syncInit();

		return () => {
			release();
		};
	}, []);

	useEffect(() => {
		const { clientWidth: wr, clientHeight: hr } = ref.current;
		if (hr < 200) return;
		const nsize = Math.round((hr - 166) / 39);
		if (nsize !== sref.current) {
			sref.current = nsize;
			query();
		}
	}, [resize])

	useEffect(() => {
		-1 !== period && query();
	}, [search, period]);

	useEffect(() => {
		custom && query()
	}, [custom])

	React.useEffect(() => {
		setLoading(false);
		const paginate = { ...pagination };
		paginate.total = glog.total;
		paginate.pageSize = sref.current;
		setPagination(paginate);
	}, [glog]);

	const param_query = ({ offset, size, tstart, tend, type, condition, order = true, src = 'mpu', exp = false }) => {
		dispatch({
			type: exp ? '/mpuapi/v1r2/log/export' : '/mpuapi/v1r2/log/query',
			payload: { offset, size, tstart, tend, type, condition, order, src }
		});
	}

	const query = (params = {}) => {
		setLoading(true);
		const content = {
			offset: 0,
			...params
		};

		switch (period) {
			case 1:
				content.tstart = moment().subtract(1, 'days').unix();
				content.tend = moment().unix();
				break;
			case 7:
				content.tstart = moment().subtract(7, 'days').unix();
				content.tend = moment().unix();
				break;
			case 30:
				content.tstart = moment().subtract(30, 'days').unix();
				content.tend = moment().unix();
				break;
			case -1:
				custom && (content.tstart = custom[0].unix());
				custom && (content.tend = custom[1].unix());
			default:
		}

		search.length && (content.condition = search);
		!params.exp && (content.size = sref.current);

		param_query({ ...content })
	};

	const handleTableChange = (p, f, s) => {
		setPagination({ ...pagination, current: p.current });
		query({
			size: p.pageSize,
			offset: p.pageSize * (p.current - 1)
		});
	};

	const handlePeriodChange = ({ target: { value } }) => {
		setCustom()
		setPeriod(value);
		if (-1 === value) return;
		setPagination({ ...pagination, current: 1 });
	};

	const handlePickerOk = value => {
		if(!value[0] || !value[1]) return;
		setCustom(value)
	}

	return (
		<div className={classes.contain} ref={ref}>
			<div className={classes.title}>
				<div>
					<Radio.Group value={period} onChange={handlePeriodChange}>
						<Radio.Button value={0}>全部</Radio.Button>
						<Radio.Button value={1}>近一天</Radio.Button>
						<Radio.Button value={7}>近一周</Radio.Button>
						<Radio.Button value={30}>近一月</Radio.Button>
						<Radio.Button value={-1}>自定义</Radio.Button>
					</Radio.Group>
					{-1 === period && (
						<RangePicker
							showTime={{ format: 'HH:mm' }}
							format='YYYY-MM-DD HH:mm'
							style={{ marginLeft: 10, width: 300 }}
							onOk={handlePickerOk}
						/>
					)}
				</div>
				<div>
					<Search
						allowClear
						placeholder='搜索'
						onSearch={v => setSearch(v)}
						style={{ width: 260 }}
					/>
					<Button
						style={{ marginLeft: 10 }}
						icon={<DownloadOutlined />}
						size='default'
						loading={glog.waiting}
						onClick={() => query({ exp: true })}>
						导出
					</Button>
				</div>
			</div>
			<Table
				size='small'
				bordered
				columns={columns}
				dataSource={glog.results}
				rowKey={r => 'msp_log_' + r.id.toString()}
				pagination={pagination}
				loading={{ spinning: loading, size: 'large' }}
				onChange={handleTableChange}
			/>
		</div>
	);
};

export default Log
