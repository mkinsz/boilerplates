export default {
    menus: [
        {
            title: '网络配置', icon: 'contacts', key: '/config/net',
            subs: [
                { key: '/config/net/tcpip', title: 'IP', icon: '' },
                { key: '/config/net/access', title: '接入', icon: '' },
                { key: '/config/net/preset', title: '预调', icon: '' },
            ]
        },
        {
            title: '设备扩展', icon: 'inbox', key: '/config/exp',
            subs: [
                { key: '/config/exp/case', title: '机箱冗余', icon: '', },
                { key: '/config/exp/port', title: '端口冗余', icon: '' },
                { key: '/config/exp/out', title: '输出冗余', icon: '' },
                { key: '/config/exp/heap', title: '堆叠', icon: '', },
            ]
        },
        {
            title: '设备管理', icon: 'bank', key: '/config/res',
            subs: [
                { key: '/config/res/board', title: '板卡管理', icon: '' },
                { key: '/config/res/chnnl', title: '通道配置', icon: '' },
                { key: '/config/res/devgrp', title: '通道分组', icon: '' },
                { key: '/config/res/serial', title: '串口配置', icon: '' },
                //  { key: '/config/res/test', title: '测试', icon: '' },
            ]
        },
        {
            title: '大屏管理', icon: 'setting', key: '/config/screen',
            subs: [
                { key: '/config/screen/screenset', title: '大屏配置', icon: '', },
                { key: '/config/screen/screenmap', title: '底图配置', icon: '' },
                { key: '/config/screen/screenosd', title: '字幕配置', icon: '', }
            ]
        },
        {
            title: '坐席管理', icon: 'laptop', key: '/config/attend',
            subs: [
                // { key: '/config/attend/status', title: '坐席状态' },
                { key: '/config/attend/config', title: '坐席配置' },
                { key: '/config/attend/kvmgrp', title: '坐席分组' },
                { key: '/config/attend/remote', title: '远程控制' }
            ]
        },
        // { title: '集群配置', icon: 'cloud', key: '/config/mass' },
        { title: '级联', icon: 'unite', key: '/config/unite' },
        { title: '安全', icon: 'safety', key: '/config/safe' },
        { title: '用户', icon: 'user', key: '/config/user' },
        {
            title: '系统', icon: 'bulb', key: '/config/sys',
            subs: [
                { key: '/config/sys/info', title: '设备信息', icon: '', },
                { key: '/config/sys/ctrl', title: '系统控制', icon: '' },
                { key: '/config/sys/auth', title: '鉴权管理', icon: '', },
                { key: '/config/sys/other', title: '其他', icon: '', }
            ]
        }
    ]
}