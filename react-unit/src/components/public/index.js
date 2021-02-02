export * from './custommenu';
export * from './authroute';
export * from './label';
export * from './usehook';

export const reg_ip = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/

export const DEVTYPE = {
    ALL: 0,
    ASVR: 1,   // 音频处理器
    IN: 3,     // 输入板
    OUT: 4,    // 输出板
    BOX: 6,    // 机箱管理单元
    TX: 7,     // 发送器
    RX: 8,     // 接收器
    DEC: 9,    // 解码板
    VSVR: 15,  // 视频处理器
    NMC: 16,   // 网管处理器
    S1837: 17, // 1837
    MPU: 18,    //主控
    DANTE: 19,  //Dante板
}

export const TypeToString = (type) => {
    switch (type) {
        case DEVTYPE.ASVR: return "音频处理器"
        case DEVTYPE.IN: return "输入板"
        case DEVTYPE.OUT: return "输出板"
        case DEVTYPE.BOX: return "机箱管理单元"
        case DEVTYPE.TX: return "发送器"
        case DEVTYPE.RX: return "接收器"
        case DEVTYPE.DEC: return "解码板"
        case DEVTYPE.VSVR: return "视频处理器"
        case DEVTYPE.NMC: return "网管处理器"
        case DEVTYPE.S1837: return "1837"
        case DEVTYPE.MPU: return "主控"
        case DEVTYPE.DANTE: return "Dante板"

        default: return type;
    }
}

export const CHNTYPE = {
    ALL: 0,
    AIN: 1,
    VIN: 2,
    AOUT: 4,
    VOUT: 8,
    ENC: 16,
    VIR: 32
}

export const CLRSPACE = {
    YUV422: 0,
    RGB888: 1,
    RGB444: 2,
    RAW16BIT: 3,
    RGB565: 4,
    YUV4221_YUYV: 5,
    YUV422SP_UV: 6,
    YUV420SP_UV: 7,
    YUV444: 8,
    YUV420P: 9
}

export const LICENCEBIT = {
    KVM: 0,
    VIDEO: 1,
    AUDIO: 2,
    REST: 3,
    ZK: 4,
    VS: 5
}

export const TRANS = {
    NONE: 0,
    BACK: 1,    // 大屏底图
    OSD: 2,     // 大屏字幕
    LICEN: 3,   // 许可证
    MPUUP: 4,   // 主控升级文件
    MPUCFG: 5,  // 主控配置文件(导入、导出)
    BDUP: 6,    // 单板升级文件
    CASCCHN: 7, // 级联通道(导入、导出)
    ALLDEV: 8,  // 
    EQP: 9, // 单板升级
}

export const GSN = {
    IDLE: 0,
    HEAPUP: 1,
    SCREENCFG: 2,
    SCREENMAP: 3,
    SCREENOSD: 4,
    OUTPUT_RD: 5,
    SCHEDULE: 6,
}

export const PTZCODE = {
    ZOOMLARGER: 11,
    ZOOMSMALL: 12,
    FOCUSNEAR: 13,
    FOCUSFAR: 14,
    LIGHTLARGER: 15,
    LIGHTSMALL: 16,
    MOVEUP: 21,
    MOVEDOWN: 22,
    MOVELEFT: 23,
    MOVERIGHT: 24,
    MOVELUP: 25,
    MOVERUP: 26,
    MOVELDOWN: 27,
    MOVERDOWN: 28,
    MOVEAUTO: 29,
    GOTOPRESET: 39,
    SETPRESET: 40
}

export const SYS_BITMAP = {
    0: 'KVM',
    1: '视频',
    2: '音频',
    3: 'Rest',
    4: '中控',
    5: '可视化'
}

export const SYS_LTMAP = {
    0: '未知',
    1: 'USB',
    3: '文件'
}

export const SYS_STATUSMAP = {
    0: '正常',
    20093: '许可证不存在',
    20094: '许可证已过期',
    20095: '许可证设备型号错误',
    20096: '许可证机器码错误',
    20097: '许可证格式错误'
}