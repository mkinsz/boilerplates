import React from 'react'
import './index.less'
import ReactEcharts from 'echarts-for-react';
import { useSelector, useDispatch } from 'react-redux'


const RouteBodyLeft = () => {
    const scenes = Object.values(useSelector(state => state.routescene.scenes))

    const option = {
        tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
            orient: 'vertical',
            left: 10,
            data: ['已开启', '未开启'],
        },
        series: [
            {
                name: '访问来源',
                type: 'pie',
                radius: ['65%', '90%'],
                label: {
                    show: false,
                    position: 'center',
                },
            color:['rgb(54,184,217)','rgb(127,147,160)'],
                emphasis: {
                    label: {
                        show: true,
                        fontSize: '30',
                        fontWeight: 'bold'
                    }
                },
                labelLine: {
                    show: false
                },
                data: [
                    {value: scenes.filter(value=>value.state==1).length, name: '已开启'},
                    {value: scenes.filter(value=>value.state==0).length, name: '未开启'}
                ]
            }
        ]
    };
    
    


    return (
        <div className="route-body-left">
            预案汇总信息
            <ReactEcharts
          option={option}
          notMerge={true}
          lazyUpdate={true}
          theme={"theme_name"}
        />
        </div>
    )
}

export default RouteBodyLeft