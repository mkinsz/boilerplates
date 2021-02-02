import React, { useState, useRef, useEffect } from 'react';
import { Card, Typography, Divider, Space } from 'antd';

var FileSaver = require('file-saver');

const About = () => {

  const { Title, Paragraph, Text, Link } = Typography;

  const txt = '科达科技'

  const handleClick = e => {
    let data = {
      name: "hanmeimei",
      age: 88
    }
    let content = JSON.stringify(data);
    let blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    FileSaver.saveAs(blob, "hello world.txt");
  }

  return <Card>
    {/* <button onClick={handleClick}>{'Download'}</button> */}
    <Typography>
      {/* <Title level={2}>介绍</Title>
      <Paragraph>
        <Text strong>科达</Text>的企业级产品是一个庞大且复杂的体系。这类产品不仅量级巨大且功能复杂，而且变动和并发频繁，常常需要设计与开发能够快速的做出响应。同时这类产品中有存在很多类似的页面以及组件，可以通过抽象得到一些稳定且高复用性的内容。
      </Paragraph>
      <Paragraph>
        随着商业化的趋势，越来越多的企业级产品对更好的用户体验有了进一步的要求。带着这样的一个终极目标，我们（科达MSPs技术部）经过大量的项目实践和总结，逐步打磨出一个服务于企业级产品的设计体系
        MSPs。基于<Text mark>『确定』和『自然』</Text>
        的设计价值观，通过模块化的解决方案，降低冗余的生产成本，让设计者专注于
        <Text strong>更好的用户体验</Text>。
      </Paragraph> */}
      <Title level={3}>版本</Title>
      <Paragraph>
        <blockquote>
          <Text strong>{`编译时间：${process.env.MSP_PROJ_BUILD_TIME}`}<br /></Text>
          <Text strong>{`提交时间：${process.env.MSP_PROJ_COMMIT_TIME}`}<br /></Text>
          {/* <Text strong>{`版本信息：${process.env.MSP_PROJ_COMMIT_SHA1} - ${process.env.MSP_PROJ_COMMIT_ID}`}<br /></Text> */}
        </blockquote>
      </Paragraph>
    </Typography>
  </Card>
}

export default About;