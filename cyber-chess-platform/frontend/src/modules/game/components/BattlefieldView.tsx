/**
 * 战场视图组件
 * 可视化显示网络基础设施、漏洞、防御状态等
 */
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import * as d3 from 'd3';
import { Card, Tag, Badge } from 'antd';
import {
  BugOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import './BattlefieldView.css';

interface D3Node {
  id: string;
  status: string;
  type?: string;
  x?: number;
  y?: number;
}

interface D3Link {
  source: string;
  target: string;
  type: string;
}

interface Node {
  id: string;
  name: string;
  type: 'server' | 'database' | 'firewall' | 'api' | 'cdn' | 'user';
  status: 'normal' | 'vulnerable' | 'compromised' | 'protected' | 'degraded';
  x?: number;
  y?: number;
  vulnerabilities?: any[];
  defenses?: any[];
}

interface Link {
  source: string;
  target: string;
  type: 'normal' | 'attack' | 'defense';
}

interface BattlefieldViewProps {
  infrastructure: any;
  vulnerabilities: any[];
  defenses: any[];
  compromised: string[];
  onSelectTarget?: (target: any) => void;
  selectedTarget?: any;
}

const BattlefieldContainer = styled.div`
  width: 100%;
  height: 500px;
  position: relative;
  background: rgba(250, 250, 250, 0.5);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 8px;
  overflow: hidden;
  
  svg {
    width: 100%;
    height: 100%;
  }
`;

// 修复7：节点详情面板定位
const NodeDetails = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(26, 35, 50, 0.95);
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  max-width: 200px;
  z-index: 10;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 212, 255, 0.3);
  
  h4 {
    margin: 0 0 8px 0;
    font-size: 14px;
    color: #00d4ff;
  }
`;


const BattlefieldView: React.FC<BattlefieldViewProps> = ({
  infrastructure,
  vulnerabilities,
  defenses,
  compromised,
  onSelectTarget,
  selectedTarget
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  // 响应式尺寸调整
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: width || 800,
          height: 500  // 固定高度
        });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // 初始化节点和连接
  useEffect(() => {
    const newNodes: Node[] = [];
    const newLinks: Link[] = [];
    
    // 解析基础设施
    if (infrastructure) {
      Object.entries(infrastructure).forEach(([key, value]: [string, any]) => {
        const node: Node = {
          id: key,
          name: key.replace(/_/g, ' ').toUpperCase(),
          type: getNodeType(key),
          status: getNodeStatus(key, value, vulnerabilities, defenses, compromised),
          vulnerabilities: vulnerabilities.filter(v => v.target === key),
          defenses: defenses.filter(d => d.target === key)
        };
        newNodes.push(node);
      });

      // 创建默认连接
      if (newNodes.find(n => n.id === 'web_server') && newNodes.find(n => n.id === 'database')) {
        newLinks.push({ source: 'web_server', target: 'database', type: 'normal' });
      }
      if (newNodes.find(n => n.id === 'firewall') && newNodes.find(n => n.id === 'web_server')) {
        newLinks.push({ source: 'firewall', target: 'web_server', type: 'defense' });
      }
      if (newNodes.find(n => n.id === 'cdn') && newNodes.find(n => n.id === 'web_server')) {
        newLinks.push({ source: 'cdn', target: 'web_server', type: 'normal' });
      }
      if (newNodes.find(n => n.id === 'api_gateway') && newNodes.find(n => n.id === 'database')) {
        newLinks.push({ source: 'api_gateway', target: 'database', type: 'normal' });
      }
    }

    setNodes(newNodes);
    setLinks(newLinks);
  }, [infrastructure, vulnerabilities, defenses, compromised]);

  // 使用D3绘制网络拓扑
  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    const { width, height } = dimensions;

  // 只更新节点的边框样式，不重绘整个图
  svg.selectAll('.node circle')
    .attr('stroke', (d: any) => {
      if (selectedTarget?.id === d.id) return '#1890ff';
      if (hoveredNode === d.id) return '#40a9ff';
      return '#fff';
    })
    .attr('stroke-width', (d: any) => {
      if (selectedTarget?.id === d.id) return 3;
      if (hoveredNode === d.id) return 2;
      return 1;
    });


    // 设置视图
    svg.attr('viewBox', `0 0 ${width} ${height}`)
       .attr('preserveAspectRatio', 'xMidYMid meet');

    const g = svg.append('g');

    // 添加缩放功能
    const zoom = d3.zoom()
      .scaleExtent([0.5, 2])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    // 初始缩放以适应内容
    svg.call(
      zoom.transform as any,
      d3.zoomIdentity.translate(width / 2, height / 2).scale(0.8)
    );

    // 创建力导向布局
    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links)
        .id((d: any) => d.id)
        .distance(120))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(45))
      .force('x', d3.forceX(width / 2).strength(0.1))  // 添加 X 轴引力
      .force('y', d3.forceY(height / 2).strength(0.1)); // 添加 Y 轴引力

    // 绘制连接线
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('class', d => `link link-${d.type}`)
      .attr('stroke', d => {
        if (d.type === 'attack') return '#ff4d4f';
        if (d.type === 'defense') return '#52c41a';
        return '#d9d9d9';
      })
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.6);

    // 绘制节点
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .enter().append('g')
      .attr('class', 'node')
      .on('click', (event, d) => {
        if (onSelectTarget) {
          onSelectTarget({
            id: d.id,
            name: d.name,
            type: d.type,
            status: d.status
          });
        }
      })
      .on('mouseenter', (event, d) => setHoveredNode(d.id))
      .on('mouseleave', () => setHoveredNode(null))
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any);

    // 添加圆形背景
    node.append('circle')
      .attr('r', 35)
      .attr('fill', d => getNodeColor(d.status))
      .attr('stroke', d => {
        if (selectedTarget?.id === d.id) return '#1890ff';
        if (hoveredNode === d.id) return '#40a9ff';
        return '#fff';
      })
      .attr('stroke-width', d => {
        if (selectedTarget?.id === d.id) return 3;
        if (hoveredNode === d.id) return 2;
        return 1;
      })
      .attr('opacity', 0.9);

    // 添加图标
    node.append('text')
      .attr('font-family', 'anticon')
      .attr('font-size', '24px')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', '#fff')
      .text(d => getNodeIcon(d.type));

    // 添加标签
    node.append('text')
      .attr('dy', '55')
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', '#333')
      .text(d => d.name);

    // 添加状态指示器
    node.each(function(d) {
      const g = d3.select(this);
      
      // 漏洞指示器
      if (d.vulnerabilities && d.vulnerabilities.length > 0) {
        g.append('circle')
          .attr('cx', 25)
          .attr('cy', -25)
          .attr('r', 10)
          .attr('fill', '#ff4d4f');
        
        g.append('text')
          .attr('x', 25)
          .attr('y', -25)
          .attr('dy', '0.35em')
          .attr('text-anchor', 'middle')
          .attr('font-size', '12px')
          .attr('fill', '#fff')
          .text(d.vulnerabilities.length);
      }

      // 防御指示器
      if (d.defenses && d.defenses.length > 0) {
        g.append('circle')
          .attr('cx', -25)
          .attr('cy', -25)
          .attr('r', 10)
          .attr('fill', '#52c41a');
        
        g.append('text')
          .attr('x', -25)
          .attr('y', -25)
          .attr('dy', '0.35em')
          .attr('text-anchor', 'middle')
          .attr('font-size', '12px')
          .attr('fill', '#fff')
          .text(d.defenses.length);
      }
    });

    // 力导向模拟
    simulation.on('tick', () => {
      // 添加边界约束
      nodes.forEach((d: any) => {
        d.x = Math.max(40, Math.min(width - 40, d.x));
        d.y = Math.max(40, Math.min(height - 40, d.y));
      });

      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // 拖拽函数
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [nodes, links, selectedTarget, onSelectTarget]);

  // 获取节点类型
  const getNodeType = (id: string): Node['type'] => {
    if (id.includes('database')) return 'database';
    if (id.includes('firewall')) return 'firewall';
    if (id.includes('api')) return 'api';
    if (id.includes('cdn')) return 'cdn';
    if (id.includes('user')) return 'user';
    return 'server';
  };

  // 获取节点状态
  const getNodeStatus = (
    id: string, 
    value: any, 
    vulns: any[], 
    defs: any[], 
    comp: string[]
  ): Node['status'] => {
    if (comp.includes(id)) return 'compromised';
    if (value.status === 'degraded') return 'degraded';
    if (defs.some(d => d.target === id)) return 'protected';
    if (vulns.some(v => v.target === id)) return 'vulnerable';
    return 'normal';
  };

  // 获取节点颜色
  const getNodeColor = (status: Node['status']) => {
    switch (status) {
      case 'compromised': return '#ff4d4f';
      case 'degraded': return '#faad14';
      case 'protected': return '#52c41a';
      case 'vulnerable': return '#fa8c16';
      default: return '#1890ff';
    }
  };

  // 获取节点图标
  const getNodeIcon = (type: Node['type']) => {
    switch (type) {
      case 'database': return '💾';
      case 'firewall': return '🛡️';
      case 'api': return '🔌';
      case 'cdn': return '☁️';
      case 'user': return '👤';
      default: return '🖥️';
    }
  };

  return (
    <Card
      title="战场态势" 
      className="battlefield-card"
      style={{ flex: 1 }}
      extra={
        <div className="battlefield-legend">
          <Tag color="blue">正常</Tag>
          <Tag color="orange">存在漏洞</Tag>
          <Tag color="red">已被攻陷</Tag>
          <Tag color="green">已防护</Tag>
          <Tag color="gold">性能降级</Tag>
        </div>
      }
    >
      <div className="battlefield-container">
        <svg ref={svgRef} width="100%" height="500">
          {/* D3.js will render here */}
        </svg>
        
        {/* 节点详情面板 */}
        {hoveredNode && (
          <div className="node-details">
            {nodes.find(n => n.id === hoveredNode) && (
              <div>
                <h4>{nodes.find(n => n.id === hoveredNode)?.name}</h4>
                {nodes.find(n => n.id === hoveredNode)?.vulnerabilities?.map((v, i) => (
                  <Tag key={i} color="red" icon={<BugOutlined />}>
                    {v.type}
                  </Tag>
                ))}
                {nodes.find(n => n.id === hoveredNode)?.defenses?.map((d, i) => (
                  <Tag key={i} color="green" icon={<SafetyOutlined />}>
                    {d.type}
                  </Tag>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* 选中目标显示 */}
      {selectedTarget && (
        <div className="selected-target">
          <Badge status="processing" text={`已选择目标: ${selectedTarget.name}`} />
        </div>
      )}
    </Card>
  );
};

export default BattlefieldView;