import React from 'react';

export interface TimelineEvent {
  time: string;
  station: string;
  label: string;
  kind: 'depart' | 'arrive' | 'handoff';
}

interface OrderTimelineProps {
  events: TimelineEvent[];
}

/**
 * 作业时间轴：把 trainPlan 的发车/到站时间按先后铺开。
 * 订单表回答"谁在哪个站干什么"，时间轴回答"什么时候发生"。
 */
export const OrderTimeline: React.FC<OrderTimelineProps> = ({ events }) => {
  if (events.length === 0) {
    return (
      <div className="order-timeline">
        <div className="order-timeline-head">
          <span className="order-timeline-title">
            <i className="fa fa-clock-o mr-2 text-cyan-400"></i>作业时间轴
          </span>
        </div>
        <div className="order-timeline-empty">
          <i className="fa fa-hourglass-half"></i>
          <span>仿真后显示各作业节点的时间分布</span>
        </div>
      </div>
    );
  }

  return (
    <div className="order-timeline">
      <div className="order-timeline-head">
        <span className="order-timeline-title">
          <i className="fa fa-clock-o mr-2 text-cyan-400"></i>作业时间轴
        </span>
        <span className="order-timeline-hint">共 {events.length} 个作业节点</span>
      </div>
      <div className="order-timeline-track">
        {events.map((event, index) => (
          <div
            key={`${event.time}-${event.station}-${index}`}
            className={`order-timeline-node order-timeline-${event.kind}`}
          >
            <div className="order-timeline-time">{event.time}</div>
            <div className="order-timeline-dot" />
            <div className="order-timeline-station" title={event.station}>
              {event.station}
            </div>
            <div className="order-timeline-label">{event.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
